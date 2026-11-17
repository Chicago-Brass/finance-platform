// Native Airtable mocks only. No live webhook or Airtable write methods are available.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "expense-fully-paid.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const link = id => ({ id, name: id });
const select = name => ({ name });

async function harness(config = {}, response = {}) {
    const stores = new Map(), calls = [], reads = [], logs = [];
    function record(table, id, fields) {
        const stored = stores.get(table)?.get(id);
        if (!stored) return null;
        const getCellValue = field => {
            assert.ok(fields.includes(field), `Unselected field ${field}`);
            return stored.fields[field] ?? null;
        };
        return { id, name: fields.includes("fldMZyzqDidRujeZS") ? stored.name : "Unnamed record", getCellValue,
            getCellValueAsString(field) { const value = getCellValue(field); return value == null ? "" : typeof value === "object" ? value.name : String(value); } };
    }
    const base = { getTable(table) { return {
        async selectRecordAsync(id, { fields }) { reads.push({ table, ids: [id] }); return record(table, id, fields); },
        async selectRecordsAsync({ recordIds, fields }) {
            assert.ok(recordIds.length && recordIds.length <= 100); reads.push({ table, ids: recordIds });
            return { records: recordIds.map(id => record(table, id, fields)).filter(Boolean) };
        },
    }; } };
    const input = {
        config: () => ({ invoiceRecordId: "invoice", ledgerWebhookUrl: "https://example.test/ledger-payment", ...config }),
        secret(name) { assert.equal(name, "Dual Ledger Webhook Secret"); return "test-secret"; },
    };
    const fetch = async (url, options) => {
        assert.equal(new URL(url).hostname, "example.test"); assert.equal(options.method, "POST");
        assert.equal(options.headers["x-ledger-secret"], "test-secret");
        const body = JSON.parse(options.body); assert.equal(body.eventType, "paid"); assert.equal("paymentRecordId" in body, false);
        for (const category of body.categories) {
            assert.equal("notes" in category, false);
            for (const posting of category.postings) assert.equal("notes" in posting, false);
        }
        calls.push(body);
        return { ok: response.ok !== false, status: 400, text: async () => "test failure", json: async () => ({ results: body.categories.map(c => ({ ruleCode: c.ruleCode, entryKey: c.entryKey, status: c.postings.length ? "posted" : "noop" })) }) };
    };
    const console = { log: text => logs.push(text) };
    const api = await new AsyncFunction("base", "input", "console", "fetch", source.replace("await main(invoiceRecordId);", "return { TABLES, INVOICE_FIELDS, PAYMENT_FIELDS, ACCOUNT_FIELDS, main };"))(base, input, console, fetch);
    const { TABLES: T, INVOICE_FIELDS: I, PAYMENT_FIELDS: P, ACCOUNT_FIELDS: A } = api;
    const add = (table, id, fields, name = id) => {
        if (!stores.has(table)) stores.set(table, new Map());
        stores.get(table).set(id, { fields, name });
    };
    const account = number => { add(T.accounts, number, { [A.number]: number }); return link(number); };
    const invoice = (number = "009.002", fields = {}) => add(T.invoices, "invoice", {
        [I.type]: select("AP"), [I.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [I.status]: select("Fully Paid"),
        [I.amount]: 125.555, [I.date]: "2026-11-03", [I.accounts]: number ? [account(number)] : [], ...fields,
    }, "INV - Fully paid test");
    const payment = (id = "payment", numbers = ["231.100"]) => {
        add(T.payments, id, { [P.accounts]: numbers.map(account) });
        const fields = stores.get(T.invoices).get("invoice").fields;
        fields[I.payments] = [...(fields[I.payments] || []), link(id)];
    };
    return { ...api, T, I, P, A, add, account, invoice, payment, calls, reads, logs,
        native: () => new AsyncFunction("base", "input", "console", "fetch", source)(base, input, console, fetch) };
}

(async () => {
    let count = 0;
    const check = async (name, run) => { try { await run(); count++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } };
    await check("Card expense uses the native invoice, full amount, account filter and refs", async () => {
        const h = await harness(); h.invoice("009.002", { [h.I.branch]: select("Chicago"), [h.I.vendors]: [link("vendor")] }); h.payment();
        await h.native(); assert.equal(h.calls.length, 1);
        const b = h.calls[0], c = b.categories[0], p = c.postings[0];
        assert.equal(b.invoiceRecordId, "invoice"); assert.equal(b.entryDate, "2026-11-03");
        assert.deepEqual(b.source, { tableId: h.T.invoices, recordId: "invoice", recordName: "INV - Fully paid test" });
        assert.equal(b.categories.length, 1); assert.equal(c.ruleCode, "EXP-02"); assert.equal(c.entryKey, "009.002");
        assert.deepEqual([p.debitAccount.number, p.creditAccount.number, p.amount], ["009.002", "231.100", "125.56"]);
        assert.deepEqual(p.branch, ["Chicago"]); assert.equal(p.vendorRecordId, "vendor"); assert.equal(p.invoiceRecordId, "invoice"); assert.deepEqual(p.paymentRecordIds, ["payment"]);
        assert.equal(h.reads.filter(r => r.table === h.T.payments).length, 1); assert.match(h.logs.join("\n"), /Status: posted/);
    });
    await check("Status and invoice type/vendor filters prevent additional reads and POSTs", async () => {
        for (const [field, value] of [["status", select("Partially Paid")], ["type", select("AR")], ["vendorType", select("AP - Product")], ["vendorType", select("AP - Staff")], ["vendorType", select("AP - Credit")]]) {
            const h = await harness(); h.invoice("009.002", { [h.I[field]]: value, [h.I.amount]: null, [h.I.date]: null });
            assert.deepEqual(await h.main("invoice"), []); assert.equal(h.calls.length, 0); assert.equal(h.reads.length, 1);
        }
    });
    await check("Signed invoice amounts preserve the chart account sides", async () => {
        const h = await harness(); h.invoice("009.002", { [h.I.amount]: -1.005 }); h.payment(); await h.main("invoice");
        const posting = h.calls[0].categories[0].postings[0];
        assert.deepEqual([posting.debitAccount.number, posting.creditAccount.number, posting.amount], ["009.002", "231.100", "-1.01"]);
    });
    await check("Card filter requires invoice accounts and actual FIN clearing account 231.100", async () => {
        for (const [invoiceAccount, paymentAccounts] of [[null, ["231.100"]], ["009.002", []], ["009.002", ["231.000"]], ["009.002", ["112.100"]]]) {
            const h = await harness(); h.invoice(invoiceAccount); if (paymentAccounts.length) h.payment("p", paymentAccounts);
            assert.deepEqual(await h.main("invoice"), []); assert.equal(h.calls.length, 0);
        }
    });
    await check("Multiple card expense accounts fail instead of duplicating the invoice amount", async () => {
        const h = await harness(); h.invoice("009.002", { [h.I.accounts]: [h.account("009.002"), h.account("009.006")] }); h.payment();
        await assert.rejects(h.main("invoice"), /multiple invoice accounts/); assert.equal(h.calls.length, 0);
    });
    await check("Bank fees use Invoice Amount once and map Fifth Third and Nickel", async () => {
        for (const bank of ["112.100", "0747"]) {
            const h = await harness(); h.invoice("007.002", { [h.I.amount]: 25 }); h.payment("a", [bank]); h.payment("b", [bank]);
            await h.main("invoice"); const c = h.calls[0].categories[0];
            assert.equal(h.calls[0].categories.length, 1); assert.equal(c.ruleCode, "EXP-11"); assert.equal(c.entryKey, "007.002");
            assert.deepEqual(c.postings.map(p => [p.debitAccount.number, p.creditAccount.number, p.amount]), [["007.002", bank, "25.00"]]);
            assert.deepEqual(c.postings[0].paymentRecordIds, ["a", "b"]); assert.deepEqual(c.postings[0].branch, []);
            assert.equal(h.reads.filter(r => r.table === h.T.payments).length, 1, "handlers share the payment read");
        }
    });
    await check("Missing, unsupported and mixed bank mappings fail before POST", async () => {
        for (const banks of [[], [[]], [["112.200"]], [["112.100", "0747"]], [["112.100"], ["0747"]]]) {
            const h = await harness(); h.invoice("007.002"); banks.forEach((numbers, i) => h.payment(`p${i}`, numbers));
            await assert.rejects(h.main("invoice"), /bank|banks|Fifth Third/); assert.equal(h.calls.length, 0);
        }
    });
    await check("All handlers finish before POST, so a later bank mapping error blocks a prepared card entry", async () => {
        const h = await harness(); h.invoice("007.002"); h.payment();
        await assert.rejects(h.main("invoice"), /Fifth Third/); assert.equal(h.calls.length, 0);
    });
    await check("Zero is a keyed no-op and invalid amounts fail", async () => {
        const h = await harness(); h.invoice("009.002", { [h.I.amount]: 0 }); h.payment(); await h.main("invoice");
        assert.deepEqual(h.calls[0].categories[0].postings, []); assert.equal(h.calls[0].categories[0].entryKey, "009.002");
        for (const amount of [null, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
            const bad = await harness(); bad.invoice("009.002", { [bad.I.amount]: amount }); bad.payment();
            await assert.rejects(bad.main("invoice")); assert.equal(bad.calls.length, 0);
        }
    });
    await check("Missing record, input, linked record, date and URL fail before POST", async () => {
        let h = await harness(); await assert.rejects(h.main(""), /Map invoiceRecordId/); await assert.rejects(h.main("missing"), /Invoice not found/);
        h = await harness(); h.invoice("009.002", { [h.I.payments]: [link("missing")] }); await assert.rejects(h.main("invoice"), /Missing linked records/); assert.equal(h.calls.length, 0);
        h = await harness(); h.invoice("009.002", { [h.I.date]: null }); h.payment(); await assert.rejects(h.main("invoice"), /Invoice Date/); assert.equal(h.calls.length, 0);
        h = await harness({ ledgerWebhookUrl: "" }); h.invoice(); h.payment(); await assert.rejects(h.main("invoice"), /ledgerWebhookUrl/); assert.equal(h.calls.length, 0);
    });
    await check("Datetime invoice dates retain the established Chicago calendar conversion", async () => {
        const h = await harness(); h.invoice("009.002", { [h.I.date]: "2026-11-04T04:00:00.000Z" }); h.payment(); await h.main("invoice");
        assert.equal(h.calls[0].entryDate, "2026-11-03");
    });
    await check("HTTP failures remain errors and are not retried", async () => {
        const h = await harness({}, { ok: false }); h.invoice(); h.payment(); await assert.rejects(h.main("invoice"), /Ledger webhook failed/); assert.equal(h.calls.length, 1);
    });
    console.log(`PASS: ${count} expense-fully-paid behavior checks; all fetches mocked.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
