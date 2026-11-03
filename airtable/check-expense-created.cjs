// Native Airtable mocks only. No live webhook or Airtable write methods are available.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "expense-created.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const select = name => ({ name });
const link = id => ({ id, name: id });

async function harness(config = {}, response = {}) {
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
                return value == null ? "" : typeof value === "object" ? value.name : String(value);
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
        assert.equal(body.eventType, "created");
        for (const category of body.categories) {
            assert.equal("notes" in category, false);
            for (const posting of category.postings) assert.equal("notes" in posting, false);
        }
        calls.push(body);
        return { ok: response.ok !== false, status: 400, text: async () => "test failure", json: async () => ({ results: body.categories.map(c => ({ ruleCode: c.ruleCode, status: c.postings.length ? "posted" : "noop" })) }) };
    };
    const console = { log: text => logs.push(text) };
    const api = await new AsyncFunction("base", "input", "console", "fetch", source.replace("await main(invoiceRecordId);", "return { TABLES, INVOICE_FIELDS, main };"))(base, input, console, fetch);
    const { TABLES: T, INVOICE_FIELDS: I } = api;
    const add = (table, id, fields, name = id) => {
        if (!stores.has(table)) stores.set(table, new Map());
        stores.get(table).set(id, { fields, name });
    };
    const invoice = (type = "AP", vendor = "AP - Product", fields = {}) => add(T.invoices, "invoice", {
        [I.type]: select(type), [I.vendorTypeAP]: select(vendor), [I.vendorTypeAR]: select(vendor),
        [I.amount]: 125.555, [I.date]: "2026-10-31", ...fields,
    }, "INV - Native primary name");
    return { ...api, T, I, calls, reads, logs, stores, add, invoice,
        native: () => new AsyncFunction("base", "input", "console", "fetch", source)(base, input, console, fetch) };
}

(async () => {
    let count = 0;
    const check = async (name, run) => { try { await run(); count++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } };
    const prepaid = h => h.invoice("AP", "AP - Expenses (Non-Sales Tax)", { [h.I.prepaid]: true });
    await check("Prepaid creation sends the full amount and fixed accounts", async () => {
        const h = await harness(); prepaid(h); await h.native();
        assert.equal(h.reads.length, 1); assert.equal(h.calls.length, 1);
        const b = h.calls[0], c = b.categories[0], p = c.postings[0];
        assert.equal(b.categories.length, 1); assert.equal(c.ruleCode, "EXP-03");
        assert.equal(b.entryDate, "2026-10-31"); assert.equal(b.invoiceRecordId, "invoice");
        assert.deepEqual(b.source, { tableId: h.T.invoices, recordId: "invoice", recordName: "INV - Native primary name" });
        assert.equal(p.debitAccount.number, "135.000"); assert.equal(p.creditAccount.number, "211.100");
        assert.equal(p.amount, "125.56"); assert.equal(p.invoiceRecordId, "invoice");
    });
    await check("All three filters must qualify before reading financial values", async () => {
        for (const [type, vendor, checked] of [["AR","AP - Expenses (Non-Sales Tax)",true],["AP","AP - Product",true],["AP","AP - Expenses (Non-Sales Tax)",false],["","",true]]) {
            const h = await harness(); h.invoice(type,vendor,{[h.I.prepaid]:checked,[h.I.amount]:null,[h.I.date]:null});
            assert.deepEqual(await h.main("invoice"), []); assert.equal(h.calls.length,0);
        }
    });
    await check("Zero amount is an explicit no-op", async () => {
        const h = await harness(); h.invoice("AP","AP - Expenses (Non-Sales Tax)",{[h.I.prepaid]:true,[h.I.amount]:0});
        await h.main("invoice"); assert.deepEqual(h.calls[0].categories[0].postings,[]);
    });
    await check("Missing, negative and unsafe amounts fail before POST", async () => {
        for (const amount of [null,NaN,Infinity,-1,Number.MAX_SAFE_INTEGER]) {
            const h = await harness(); h.invoice("AP","AP - Expenses (Non-Sales Tax)",{[h.I.prepaid]:true,[h.I.amount]:amount});
            await assert.rejects(h.main("invoice")); assert.equal(h.calls.length,0);
        }
    });
    await check("Identity, date, URL and HTTP failures remain errors", async () => {
        let h = await harness(); await assert.rejects(h.main(""),/Map invoiceRecordId/); await assert.rejects(h.main("missing"),/Invoice not found/);
        h = await harness(); h.invoice("AP","AP - Expenses (Non-Sales Tax)",{[h.I.prepaid]:true,[h.I.date]:null}); await assert.rejects(h.main("invoice"),/Invoice Date/); assert.equal(h.calls.length,0);
        h = await harness({ledgerWebhookUrl:""}); prepaid(h); await assert.rejects(h.main("invoice"),/ledgerWebhookUrl/); assert.equal(h.calls.length,0);
        h = await harness({}, {ok:false}); prepaid(h); await assert.rejects(h.main("invoice"),/Ledger webhook failed/);
    });
    await check("Refs and Chicago invoice date travel without notes", async () => {
        const h=await harness(); h.invoice("AP","AP - Expenses (Non-Sales Tax)",{
            [h.I.prepaid]:true,[h.I.date]:"2026-11-04T02:00:00Z",[h.I.vendors]:[link("vendor")],
            [h.I.transactions]:[link("t1"),link("t2")],[h.I.branch]:select("Chicago"),[h.I.states]:[{id:"state",name:"IL"}],
        }); await h.main("invoice");
        const b=h.calls[0],p=b.categories[0].postings[0]; assert.equal(b.entryDate,"2026-11-03");
        assert.equal(p.vendorRecordId,"vendor"); assert.deepEqual(p.transactionRecordIds,["t1","t2"]); assert.deepEqual(p.branch,["Chicago"]); assert.equal(p.stateCode,"IL");
    });
    console.log(`PASS: ${count} expense-created behavior checks; all fetches mocked.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
