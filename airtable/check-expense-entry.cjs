// Native Airtable mocks only. All webhook requests stay inside this harness.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "expense-entry.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const link = id => ({ id, name: id });
const select = name => ({ name });

async function harness(config = {}, response = {}) {
    const stores = new Map(), calls = [], reads = [], logs = [];
    function record(table, id, fields) {
        const value = stores.get(table)?.get(id);
        if (!value) return null;
        const getCellValue = field => {
            assert.ok(fields.includes(field), `Unselected field ${field}`);
            return value.fields[field] ?? null;
        };
        return {
            id, name: fields.includes("fldMZyzqDidRujeZS") ? value.name : "Unnamed record",
            getCellValue,
            getCellValueAsString(field) {
                const cell = getCellValue(field);
                return cell == null ? "" : typeof cell === "object" ? cell.name : String(cell);
            },
        };
    }
    const base = { getTable(table) { return {
        async selectRecordAsync(id, { fields }) { reads.push({ table, ids: [id], fields }); return record(table, id, fields); },
        async selectRecordsAsync({ recordIds, fields }) {
            assert.ok(recordIds.length > 0 && recordIds.length <= 100);
            reads.push({ table, ids: recordIds, fields });
            return { records: recordIds.map(id => record(table, id, fields)).filter(Boolean) };
        },
    }; } };
    const input = {
        config: () => ({ invoiceRecordId: "invoice", ledgerWebhookUrl: "https://example.test/ledger-payment", ...config }),
        secret(name) { assert.equal(name, "Dual Ledger Webhook Secret"); return "test-secret"; },
    };
    const fetch = async (url, options) => {
        assert.equal(new URL(url).hostname, "example.test");
        assert.equal(options.headers["x-ledger-secret"], "test-secret");
        const payload = JSON.parse(options.body);
        assert.equal(payload.eventType, "entry_requested");
        assert.equal("paymentRecordId" in payload, false);
        for (const category of payload.categories) {
            assert.equal("notes" in category, false);
            for (const posting of category.postings) assert.equal("notes" in posting, false);
        }
        calls.push(payload);
        return { ok: response.ok !== false, status: 400, text: async () => "test failure", json: async () => ({ results: payload.categories.map(category => ({ ruleCode: category.ruleCode, status: category.postings.length ? "posted" : "noop" })) }) };
    };
    const console = { log: value => logs.push(value) };
    const api = await new AsyncFunction("base", "input", "console", "fetch", source.replace("await main(invoiceRecordId);", "return { TABLES, INVOICE_FIELDS, LINE_FIELDS, ACCOUNT_FIELDS, main };"))(base, input, console, fetch);
    const { TABLES: T, INVOICE_FIELDS: I, LINE_FIELDS: L, ACCOUNT_FIELDS: A } = api;
    const add = (table, id, fields, name = id) => {
        if (!stores.has(table)) stores.set(table, new Map());
        stores.get(table).set(id, { fields, name });
    };
    const invoice = (fields = {}) => add(T.invoices, "invoice", {
        [I.type]: select("AP"), [I.vendorType]: select("AP - Staff"), [I.createEntry]: true,
        [I.amount]: 9999, [I.date]: "2026-11-03", ...fields,
    }, "INV - Expense test");
    const account = (number, id = number) => { add(T.accounts, id, { [A.number]: number }); return link(id); };
    const line = (id, number, amount, fields = {}) => {
        add(T.lines, id, { [L.accounts]: [account(number)], [L.amount]: amount, [L.invoices]: [link("invoice")], ...fields });
        const current = stores.get(T.invoices).get("invoice").fields;
        current[I.lines] = [...(current[I.lines] || []), link(id)];
    };
    return { ...api, T, I, L, A, calls, reads, logs, stores, add, invoice, account, line,
        native: () => new AsyncFunction("base", "input", "console", "fetch", source)(base, input, console, fetch) };
}

(async () => {
    let count = 0;
    const check = async (name, run) => { try { await run(); count++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } };
    await check("Payroll and bonuses use their own line amounts and post together in one packet", async () => {
        const h = await harness(); h.invoice({ [h.I.staff]: [link("staff")], [h.I.branch]: select("Chicago") });
        h.line("offshore", "005.101", 100.005); h.line("owner", "005.001", 20); h.line("1099", "005.003", 30.994);
        h.line("bonus", "005.201", 7.5); h.line("unrelated", "007.011", 10000);
        await h.native(); assert.equal(h.calls.length, 1);
        const payload = h.calls[0]; assert.equal(payload.entryDate, "2026-11-03"); assert.equal(payload.invoiceRecordId, "invoice");
        assert.deepEqual(payload.source, { tableId: h.T.invoices, recordId: "invoice", recordName: "INV - Expense test" });
        assert.deepEqual(payload.categories.map(category => [category.ruleCode, category.entryKey]), [["EXP-07", "005.003"], ["EXP-07", "005.101"], ["EXP-07", "005.001"], ["EXP-09", "005.201"]]);
        assert.deepEqual(payload.categories.slice(0, 3).flatMap(c => c.postings).map(p => [p.debitAccount.number, p.creditAccount.number, p.amount, p.sourceRecordId]), [
            ["005.003", "241.100", "30.99", "1099"], ["005.101", "241.100", "100.01", "offshore"], ["005.001", "241.100", "20.00", "owner"],
        ]);
        assert.deepEqual(payload.categories[3].postings.map(p => [p.debitAccount.number, p.creditAccount.number, p.amount]), [["005.201", "241.300", "7.50"]]);
        assert.ok(payload.categories.flatMap(c => c.postings).every(p => p.invoiceRecordId === "invoice" && p.staffRecordId === "staff"));
        assert.ok(payload.categories[0].postings.every(p => p.branch[0] === "Chicago"));
        assert.equal(h.reads.filter(read => read.table === h.T.lines).length, 1, "Category handlers share the line read");
        assert.equal(h.reads.filter(read => read.table === h.T.accounts).length, 1, "Category handlers share account reads");
    });
    await check("W2 salary, payroll tax and 401k post as separate account journals; benefits are excluded", async () => {
        const h=await harness();h.invoice();
        h.line("salaryA","005.002",30);h.line("salaryB","005.002",20);
        h.line("tax","005.006",10);h.line("401k","005.005",5);h.line("benefits","241.600",999);
        await h.main("invoice");
        const entries=h.calls[0].categories;
        assert.equal(entries.length,3);
        assert.deepEqual(entries.map(c=>[c.ruleCode,c.entryKey,c.postings[0].creditAccount.number,c.postings[0].amount]).sort(),[
            ["EXP-06","005.002","241.100","50.00"],["EXP-06","005.005","241.400","5.00"],["EXP-06","005.006","241.200","10.00"]]);
        assert.deepEqual(entries.find(c=>c.entryKey==="005.002").postings[0].sourceRecordIds,["salaryA","salaryB"]);
    });
    await check("Utilities uses one Invoice Amount and unrelated operating accounts do not qualify", async () => {
        const h = await harness(); h.invoice({ [h.I.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [h.I.accounts]: [h.account("006.002")], [h.I.amount]: 78.25 });
        await h.main("invoice"); const entry = h.calls[0].categories[0]; assert.equal(entry.ruleCode, "EXP-01");
        assert.deepEqual(entry.postings.map(p => [p.debitAccount.number, p.creditAccount.number, p.amount]), [["006.002", "211.100", "78.25"]]);
        const k = await harness(); k.invoice({ [k.I.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [k.I.accounts]: [k.account("007.011")] });
        assert.deepEqual(await k.main("invoice"), []); assert.equal(k.calls.length, 0);
        const mixed = await harness(); mixed.invoice({ [mixed.I.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [mixed.I.accounts]: [mixed.account("006.002"), mixed.account("007.011")] });
        await assert.rejects(mixed.main("invoice"), /full Invoice Amount/); assert.equal(mixed.calls.length, 0);
    });
    await check("An invalid matched line prevents every prepared category from posting",async()=>{
        const h=await harness();h.invoice();h.line("salary","005.101",50);h.line("w2","005.002",NaN);
        await assert.rejects(h.main("invoice"),/finite number/);assert.equal(h.calls.length,0);
    });
    await check("Same-account payroll lines sum into one pair and retain every source reference", async () => {
        const h = await harness(); h.invoice(); h.line("salaryA", "005.101", 30); h.line("salaryB", "005.101", 20);
        await h.main("invoice"); const entries = h.calls[0].categories;
        assert.equal(entries.length, 1); assert.equal(entries[0].entryKey, "005.101");
        assert.equal(entries[0].postings.length, 1); assert.equal(entries[0].postings[0].amount, "50.00");
        assert.equal(entries[0].postings[0].sourceRecordId, "invoice");
        assert.deepEqual(entries[0].postings[0].sourceRecordIds, ["salaryA", "salaryB"]);
        assert.ok(entries[0].postings.every(p => p.branch.length === 0));
    });
    await check("Signed line totals round after same-account aggregation", async () => {
        for (const amount of [10.005, -10.005]) {
            const h = await harness(); h.invoice(); h.line("salaryA", "005.101", amount); h.line("salaryB", "005.101", amount);
            await h.main("invoice");
            assert.equal(h.calls[0].categories[0].postings[0].amount, amount > 0 ? "20.01" : "-20.01");
        }
    });
    await check("An unsafe combined account total fails before POST", async () => {
        const h = await harness(); h.invoice();
        for (let i = 0; i < 3; i++) h.line(`large${i}`, "005.101", 400000000000);
        await assert.rejects(h.main("invoice"), /total exceeds safe money precision/); assert.equal(h.calls.length, 0);
    });
    await check("Tech allowance posts the matching line amount to AP", async () => {
        const h = await harness(); h.invoice({ [h.I.branch]: select("Chicago"), [h.I.employeeBranch]: ["Corporate"] }); h.line("allowance", "005.102", 25.25); await h.main("invoice");
        const entry = h.calls[0].categories[0]; assert.equal(entry.ruleCode, "EXP-05"); assert.equal(entry.entryKey, "005.102");
        assert.deepEqual(entry.postings[0].branch, ["Corporate"]);
        assert.deepEqual(entry.postings.map(p => [p.debitAccount.number, p.creditAccount.number, p.amount]), [["005.102", "211.100", "25.25"]]);
    });
    await check("Resolved reserve and federal/state tax mappings skip the generic pending placeholder", async () => {
        for (const [account, rule, debit, credit] of [["007.005", "EXP-12", "007.005", "121.900"], ["242.100", "EXP-13", "011.001", "242.100"], ["242.200", "EXP-13", "011.002", "242.200"]]) {
            const h = await harness(); h.invoice({ [h.I.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [h.I.accounts]: [h.account(account)], [h.I.amount]: 25 });
            await h.main("invoice"); const entry = h.calls[0].categories[0]; assert.equal(entry.ruleCode, rule);
            assert.deepEqual(entry.postings.map(p => [p.debitAccount.number, p.creditAccount.number, p.amount]), [[debit, credit, "25.00"]]);
        }
        const h = await harness(); h.invoice({ [h.I.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [h.I.accounts]: [h.account("242.100"), h.account("242.200")] });
        await assert.rejects(h.main("invoice"), /exactly one tax account/); assert.equal(h.calls.length, 0);
    });
    await check("Unchecked Create Entry reads only the invoice and does not post", async () => {
        const h = await harness(); h.invoice({ [h.I.createEntry]: false, [h.I.lines]: [link("missing")] });
        assert.deepEqual(await h.main("invoice"), []); assert.equal(h.calls.length, 0); assert.equal(h.reads.length, 1);
    });
    await check("Other invoice types and unrelated line accounts do not qualify", async () => {
        const h = await harness(); h.invoice({ [h.I.type]: select("AR"), [h.I.date]: null, [h.I.lines]: [link("missing")] });
        assert.deepEqual(await h.main("invoice"), []); assert.equal(h.reads.length, 1); assert.equal(h.calls.length, 0);
        const k = await harness(); k.invoice(); k.line("unrelated", "005.0030", 12); assert.deepEqual(await k.main("invoice"), []); assert.equal(k.calls.length, 0);
    });
    await check("Zero lines are explicit category no-ops", async () => {
        const h = await harness(); h.invoice(); h.line("zero", "005.101", 0); await h.main("invoice");
        assert.deepEqual(h.calls[0].categories[0].postings, []);
    });
    await check("Missing and nonfinite line amounts fail", async () => {
        for (const amount of [null, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
            const h = await harness(); h.invoice(); h.line("salary", "005.101", amount);
            await assert.rejects(h.main("invoice")); assert.equal(h.calls.length, 0);
        }
    });
    await check("Multiple accounts on one line never duplicate its amount", async () => {
        const h = await harness(); h.invoice(); h.line("split", "005.101", 30, { [h.L.accounts]: [h.account("005.101"), h.account("005.003")] });
        await assert.rejects(h.main("invoice"), /multiple accounts/); assert.equal(h.calls.length, 0);
    });
    await check("Shared or incorrectly linked invoice lines are rejected", async () => {
        for (const invoices of [[], [link("other")], [link("invoice"), link("other")]]) {
            const h = await harness(); h.invoice(); h.line("salary", "005.101", 30, { [h.L.invoices]: invoices });
            await assert.rejects(h.main("invoice"), /must belong only/); assert.equal(h.calls.length, 0);
        }
    });
    await check("Missing linked lines and accounts fail explicitly", async () => {
        const h = await harness(); h.invoice({ [h.I.lines]: [link("missing")] }); await assert.rejects(h.main("invoice"), /Missing linked records/);
        const k = await harness(); k.invoice(); k.line("salary", "005.101", 30, { [k.L.accounts]: [link("missing")] });
        await assert.rejects(k.main("invoice"), /Missing linked records/); assert.equal(k.calls.length, 0);
    });
    await check("Invoice dates use the invoice calendar day and handle timestamp dates", async () => {
        const h = await harness(); h.invoice({ [h.I.date]: "2026-11-04T02:00:00.000Z" }); h.line("salary", "005.101", 30);
        await h.main("invoice"); assert.equal(h.calls[0].entryDate, "2026-11-03");
        for (const date of [null, "invalid"]) {
            const k = await harness(); k.invoice({ [k.I.date]: date }); k.line("salary", "005.101", 30);
            await assert.rejects(k.main("invoice"), /Invoice Date/); assert.equal(k.calls.length, 0);
        }
    });
    await check("Required identities, webhook config and HTTP failures remain errors", async () => {
        const h = await harness(); await assert.rejects(h.main(""), /Map invoiceRecordId/); await assert.rejects(h.main("missing"), /Invoice not found/);
        const k = await harness({ ledgerWebhookUrl: "" }); k.invoice(); k.line("salary", "005.101", 30);
        await assert.rejects(k.main("invoice"), /Map ledgerWebhookUrl/); assert.equal(k.calls.length, 0);
        const m = await harness({}, { ok: false }); m.invoice(); m.line("salary", "005.101", 30);
        await assert.rejects(m.main("invoice"), /Ledger webhook failed \(400\): test failure/);
    });
    await check("Native read batching supports more than 100 linked lines", async () => {
        const h = await harness(); h.invoice();
        for (let i = 0; i < 101; i++) h.line(`line${String(i).padStart(3, "0")}`, "005.101", 1);
        await h.main("invoice"); assert.equal(h.calls[0].categories[0].postings.length, 1);
        assert.equal(h.calls[0].categories[0].postings[0].amount, "101.00");
        assert.equal(h.calls[0].categories[0].postings[0].sourceRecordIds.length, 101);
        assert.equal(h.reads.filter(read => read.table === h.T.lines).length, 2);
    });
    await check("Bank fees no longer run from Create Entry", async () => {
        const h = await harness(); h.invoice({ [h.I.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [h.I.accounts]: [h.account("007.002")], [h.I.payments]: [link("missing")] });
        assert.deepEqual(await h.main("invoice"), []); assert.equal(h.calls.length, 0);
    });
    await check("Prepaid invoice now posts from Create Entry", async () => {
        const h = await harness(); h.invoice({ [h.I.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [h.I.prepaid]: true, [h.I.amount]: 125 });
        await h.main("invoice"); const c = h.calls[0].categories[0]; assert.equal(c.ruleCode, "EXP-03");
        assert.deepEqual(c.postings.map(p => [p.debitAccount.number, p.creditAccount.number, p.amount]), [["135.000", "211.100", "125.00"]]);
    });
    await check("Employee benefits alone do not qualify or block other payroll",async()=>{
        const h=await harness();h.invoice();h.line("deduction","241.600",12);
        assert.deepEqual(await h.main("invoice"),[]);assert.equal(h.calls.length,0);
    });
    await check("Reserve excludes other vendor types", async () => {
        const h = await harness(); h.invoice({ [h.I.accounts]: [h.account("007.005")] });
        assert.deepEqual(await h.main("invoice"), []); assert.equal(h.calls.length, 0);
    });
    console.log(`PASS: ${count} expense-entry behavior checks; all fetches mocked.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
