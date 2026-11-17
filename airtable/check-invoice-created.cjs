// Native Airtable mocks only. No live webhook or Airtable write methods are available.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const select = name => ({ name });
const link = id => ({ id, name: id });

async function harness(config = {}, response = {}, file = "invoice-entry.js") {
    const source = fs.readFileSync(path.join(__dirname, file), "utf8");
    const stores = new Map(), calls = [], reads = [], logs = [];
    const base = { getTable(table) { return {
        async selectRecordAsync(id, { fields }) {
            reads.push({ table, ids: [id], fields });
            return record(table, id, fields);
        },
        async selectRecordsAsync({ recordIds, fields }) {
            assert.ok(recordIds.length && recordIds.length <= 100);
            reads.push({ table, ids: recordIds, fields });
            return { records: recordIds.map(id => record(table, id, fields)).filter(Boolean) };
        },
    }; } };
    function record(table, id, fields) {
        const stored = stores.get(table)?.get(id);
        if (!stored) return null;
        const getCellValue = field => {
            assert.ok(fields.includes(field), `Unselected field ${field}`);
            return stored.fields[field] ?? null;
        };
        return {
            id, name: fields.includes("fldMZyzqDidRujeZS") ? stored.name : "Unnamed record",
            getCellValue,
            getCellValueAsString(field) {
                const value = getCellValue(field);
                return value == null ? "" : Array.isArray(value) ? value.map(item => typeof item === "object" ? item.name : item).join(", ") : typeof value === "object" ? value.name : String(value);
            },
        };
    }
    const input = {
        config() { return { invoiceRecordId: "invoice", ledgerWebhookUrl: "https://example.test/ledger-payment", ...config }; },
        secret(name) { assert.equal(name, "Dual Ledger Webhook Secret"); return "test-secret"; },
    };
    const fetch = async (url, options) => {
        assert.equal(new URL(url).hostname, "example.test");
        assert.equal(options.headers["x-ledger-secret"], "test-secret");
        const body = JSON.parse(options.body);
        assert.equal("paymentRecordId" in body, false);
        assert.equal(body.eventType, file === "invoice-entry.js" ? "entry_requested" : "created");
        for (const category of body.categories) {
            assert.equal("notes" in category, false);
            for (const posting of category.postings) assert.equal("notes" in posting, false);
        }
        calls.push(body);
        return { ok: response.ok !== false, status: 400, text: async () => "test failure", json: async () => ({ results: body.categories.map(c => ({ ruleCode: c.ruleCode, status: c.postings.length ? "posted" : "noop" })) }) };
    };
    const console = { log: text => logs.push(text) };
    const api = await new AsyncFunction("base", "input", "console", "fetch", source.replace("await main(invoiceRecordId);", "return { TABLES, INVOICE_FIELDS, ACCOUNT_FIELDS: typeof ACCOUNT_FIELDS === 'undefined' ? {} : ACCOUNT_FIELDS, main };"))(base, input, console, fetch);
    const { TABLES: T, INVOICE_FIELDS: I, ACCOUNT_FIELDS: A } = api;
    const add = (table, id, fields, name = id) => {
        if (!stores.has(table)) stores.set(table, new Map());
        stores.get(table).set(id, { fields, name });
    };
    const invoice = (type = "AP", vendor = "AP - Product", fields = {}) => add(T.invoices, "invoice", {
        [I.type]: select(type), [I.vendorTypeAP]: select(vendor), [I.vendorTypeAR]: select(vendor),
        [I.amount]: 125.555, ...(I.freight ? { [I.freight]: 12.34 } : {}), [I.date]: "2026-10-31", ...(I.createEntry ? { [I.createEntry]: true } : {}), ...fields,
    }, "INV - Native primary name");
    return { ...api, T, I, A, calls, reads, logs, stores, add, invoice,
        native: () => new AsyncFunction("base", "input", "console", "fetch", source)(base, input, console, fetch) };
}

(async () => {
    let count = 0;
    const check = async (name, run) => { try { await run(); count++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } };
    for (const [type, vendor, row, debit, credit] of [
        ["AP", "AP - Product", 5, "131.100", "211.100"],
        ["AP", "AP - Expenses (Sales Tax)", 7, "212.100", "211.100"],
        ["AP", "AP - Assets", 8, "143.300", "211.100"],
        ["AP", "AP - Credit", 9, "211.100", "131.400"],
        ["AP", "AP - Credit", 10, "211.100", "004.010"],
        ["AR", "AR - Non-Product", 11, "121.100", "010.001"],
    ]) await check(`Row ${row} matches its exact filter and posting`, async () => {
        const h = await harness();
        h.invoice(type, vendor, {
            [h.I.amount]: 125.555,
            [h.I.freight]: 125.555,
            [h.I.purchaseOrders]: row === 9 ? [link("po")] : [],
            [h.I.accounts]: row === 11 ? [link("misc")] : [],
        });
        h.add(h.T.accounts, "misc", { [h.A.number]: "010.001" });
        await h.native();
        assert.equal(h.calls.length, 1);
        const body = h.calls[0], c = body.categories[0], p = c.postings[0];
        assert.equal(body.categories.length, 1); assert.equal(c.ruleCode, `INV-${String(row - 1).padStart(2, "0")}`);
        assert.deepEqual(body.source, { tableId: h.T.invoices, recordId: "invoice", recordName: "INV - Native primary name" });
        assert.equal(body.invoiceRecordId, "invoice"); assert.equal(body.entryDate, "2026-10-31");
        assert.equal(p.debitAccount.number, debit); assert.equal(p.creditAccount.number, credit); assert.equal(p.amount, "125.56");
        assert.equal(p.invoiceRecordId, "invoice"); assert.equal(p.sourceRecordId, "invoice");
        assert.equal(h.reads.length, row === 11 ? 2 : 1, "Only AR non-product needs linked account reads");
        assert.ok(h.logs.some(log => log.includes(`T-Chart row: ${row}`)));
    });
    await check("Missing/nonqualifying filters do not post or require irrelevant values", async () => {
        for (const [type, vendor] of [["", ""], ["AR", "AR - Product"], ["AP", "AP - Staff"], ["AR", "AP - Assets"]]) {
            const h = await harness(); h.invoice(type, vendor, { [h.I.amount]: null, [h.I.date]: null });
            assert.deepEqual(await h.main("invoice"), []); assert.equal(h.calls.length, 0); assert.equal(h.reads.length, 1);
        }
    });
    await check("AR non-product must include the exact miscellaneous account number", async () => {
        for (const number of ["", "010.003", "010.0010"]) {
            const h = await harness(); h.invoice("AR", "AR - Non-Product", { [h.I.accounts]: [link("other")] });
            h.add(h.T.accounts, "other", { [h.A.number]: number }); await h.main("invoice"); assert.equal(h.calls.length, 0);
        }
    });
    await check("Row 6 posts with only AP expense type and freight account 004.013", async () => {
        for (const amount of [125.555,-1.005,0]) {
            const h = await harness({}, {}, "invoice-created.js");
            h.invoice("AP","AP - Expenses (Non-Sales Tax)",{[h.I.accounts]:[link("freight")],[h.I.amount]:amount,[h.I.date]:"2026-11-04T02:30:00.000Z"});
            h.add(h.T.accounts,"freight",{[h.A.number]:"004.013"});
            await h.native();
            const category=h.calls[0].categories[0];assert.equal(category.ruleCode,"INV-05");
            assert.equal(h.calls[0].entryDate,"2026-11-03");
            if(amount) { const p=category.postings[0];assert.equal(p.debitAccount.number,"004.013");assert.equal(p.creditAccount.number,"211.100");assert.equal(p.amount,amount>0?"125.56":"-1.01"); }
            else assert.deepEqual(category.postings,[]);
        }
        const other=await harness({}, {}, "invoice-created.js");
        other.invoice("AP","AP - Expenses (Non-Sales Tax)",{[other.I.accounts]:[link("other")]});
        other.add(other.T.accounts,"other",{[other.A.number]:"004.003"});
        assert.deepEqual(await other.main("invoice"),[]);assert.equal(other.calls.length,0);
    });
    await check("Zero amount produces an explicit no-op; it is not missing", async () => {
        const h = await harness(); h.invoice("AP", "AP - Assets", { [h.I.amount]: 0 }); await h.main("invoice");
        assert.deepEqual(h.calls[0].categories[0].postings, []);
    });
    await check("Money rounds correctly and invalid/missing amounts never post", async () => {
        for (const amount of [null, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
            const h = await harness(); h.invoice("AP", "AP - Assets", { [h.I.amount]: amount });
            await assert.rejects(h.main("invoice")); assert.equal(h.calls.length, 0);
        }
        const h = await harness(); h.invoice("AP", "AP - Assets", { [h.I.amount]: 1.005 }); await h.main("invoice");
        assert.equal(h.calls[0].categories[0].postings[0].amount, "1.01");
    });
    await check("Required identity, date and HTTP failures remain errors", async () => {
        let h = await harness(); await assert.rejects(h.main(""), /Map invoiceRecordId/); await assert.rejects(h.main("missing"), /Invoice not found/);
        h = await harness(); h.invoice("AP", "AP - Assets", { [h.I.date]: null }); await assert.rejects(h.main("invoice"), /Invoice Date/); assert.equal(h.calls.length, 0);
        h = await harness({}, { ok: false }); h.invoice("AP","AP - Assets"); await assert.rejects(h.main("invoice"), /Ledger webhook failed \(400\): test failure/); assert.equal(h.calls.length, 1);
    });
    await check("Plural refs, state and branch travel without generated notes", async () => {
        const h = await harness(); h.invoice("AP", "AP - Expenses (Sales Tax)", {
            [h.I.vendors]: [link("vendorA"), link("vendorB")], [h.I.clients]: [link("client")],
            [h.I.transactions]: [link("transaction")], [h.I.purchaseOrders]: [link("po")],
            [h.I.states]: [{ id: "state", name: "IL" }], [h.I.branch]: select("Chicago"),
        });
        await h.main("invoice"); const p = h.calls[0].categories[0].postings[0];
        assert.deepEqual(p.vendorRecordIds, ["vendorA", "vendorB"]); assert.equal(p.vendorRecordId, undefined);
        assert.equal(p.clientRecordId, "client"); assert.equal(p.transactionRecordId, "transaction"); assert.equal(p.poRecordId, "po");
        assert.equal(p.stateCode, "IL"); assert.deepEqual(p.branch, ["Chicago"]);
    });
    await check("A missing linked account fails instead of silently missing a category", async () => {
        const h = await harness(); h.invoice("AR", "AR - Non-Product", { [h.I.accounts]: [link("missing")] });
        await assert.rejects(h.main("invoice"), /Linked accounts not found/); assert.equal(h.calls.length, 0);
    });
    await check("Row 2 uses the received rollup; row 4 uses confirmed PO status and an empty latest receipt date", async () => {
        for (const [received,status,date,expected] of [[75,"",null,["INV-01","INV-04"]],[0,"Confirmed",null,["INV-03","INV-04"]],[75,"Confirmed",null,["INV-01","INV-03","INV-04"]],[0,"Confirmed","2026-10-01",["INV-04"]],[0,"Sent, Not Confirmed",null,["INV-04"]],[0,"",null,["INV-04"]],[null,"Confirmed",null,["INV-03","INV-04"]]]) {
            const h = await harness();
            h.invoice("AP","AP - Product",{[h.I.receivedNotInvoiced]:received,[h.I.poStatus]:status?[status]:[],[h.I.poReceivedDate]:date});
            await h.main("invoice");
            assert.deepEqual(h.calls[0].categories.map(c=>c.ruleCode),expected);
            const deposit = h.calls[0].categories.find(c=>c.ruleCode==="INV-03");
            if (deposit) assert.equal(deposit.postings[0].amount,"125.56");
        }
    });
    await check("Unchecked Create Entry never posts", async () => {
        const h = await harness(); h.invoice("AP", "AP - Product", { [h.I.createEntry]: false, [h.I.receivedNotInvoiced]: 100 });
        assert.deepEqual(await h.main("invoice"), []); assert.equal(h.calls.length, 0);
    });
    await check("Migrated categories no longer run on Invoice Created", async () => {
        for (const [type, vendor] of [["AP", "AP - Product"], ["AP", "AP - Expenses (Sales Tax)"], ["AP", "AP - Assets"], ["AP", "AP - Credit"], ["AR", "AR - Non-Product"]]) {
            const h = await harness({}, {}, "invoice-created.js"); h.invoice(type, vendor);
            assert.deepEqual(await h.main("invoice"), []); assert.equal(h.calls.length, 0);
        }
    });
    await check("Outbound shipping remains on creation only", async () => {
        const h = await harness(); h.invoice("AP", "AP - Expenses (Non-Sales Tax)");
        assert.deepEqual(await h.main("invoice"), []); assert.equal(h.calls.length, 0);
    });
    await check("Invoice amounts retain their sign without ABS, including credit invoices", async () => {
        for (const [vendor,po] of [["AP - Assets",false],["AP - Credit",true],["AP - Credit",false]]) {
            const h = await harness();
            h.invoice("AP",vendor,{[h.I.amount]:-1.005,[h.I.purchaseOrders]:po?[link("po")]:[]});
            await h.main("invoice");
            assert.equal(h.calls[0].categories[0].postings[0].amount,"-1.01");
        }
    });
    await check("Row 5 uses Freight instead of the total invoice amount", async () => {
        const h = await harness();h.invoice("AP","AP - Product",{[h.I.amount]:999,[h.I.freight]:-12.34});
        await h.main("invoice");assert.equal(h.calls[0].categories[0].postings[0].amount,"-12.34");
    });
    await check("Timestamp Invoice Date becomes the invoice calendar date", async () => {
        const h = await harness(); h.invoice("AP", "AP - Assets", { [h.I.date]: "2026-11-04T02:30:00.000Z" });
        await h.main("invoice"); assert.equal(h.calls[0].entryDate, "2026-11-03");
    });
    console.log(`PASS: ${count} invoice creation/migration behavior checks; all fetches mocked.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
