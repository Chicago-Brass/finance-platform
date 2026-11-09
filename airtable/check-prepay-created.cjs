// Native Airtable mocks only. No live webhook or Airtable write methods are available.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "prepay-created.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

async function harness(overrides = {}, config = {}, response = {}, invoiceBranches = { recInvoice: "Chicago" }) {
    const calls = [], reads = [], logs = [], invoiceReads = [];
    const fields = {
        fldXoWjXIrS76p84x: "2026-11-30", fld5NmFxp9Dhza6BK: 125.555,
        fldBuTnJqQ5ymPhRt: "Example prepaid insurance", fldg3040Hc1Z6AQoe: [{ id: "recInvoice" }], ...overrides,
    };
    const base = { getTable(table) {
        if (table === "tbldQXuqNEp8G5pfs") return { async selectRecordsAsync(options) {
            assert.deepEqual(options.fields, ["fldt5PjqGDrINUYT5"]);
            assert.ok(options.recordIds.length <= 100);
            invoiceReads.push(options.recordIds);
            return { records: options.recordIds.filter(id => id in invoiceBranches).map(id => ({ id, getCellValue: () => invoiceBranches[id] ? { name: invoiceBranches[id] } : null })) };
        } };
        assert.equal(table, "tbl1LgiUYt7Gc492d");
        return { async selectRecordAsync(id, options) {
            reads.push(id);
            if (id !== "recExamplePrepay") return null;
            assert.ok(options.fields.includes("fldBuTnJqQ5ymPhRt"));
            return { id, name: "Example prepay", getCellValueAsString: field => fields[field] || "", getCellValue(field) {
                assert.ok(options.fields.includes(field), `Unselected field ${field}`);
                return fields[field] ?? null;
            } };
        } };
    } };
    const input = {
        config: () => ({ prepayLogRecordId: "recExamplePrepay", ledgerWebhookUrl: "https://example.test/ledger-payment", ...config }),
        secret(name) { assert.equal(name, "Dual Ledger Webhook Secret"); return "test-secret"; },
    };
    const fetch = async (url, options) => {
        assert.equal(new URL(url).hostname, "example.test");
        assert.equal(options.method, "POST");
        assert.equal(options.headers["x-ledger-secret"], "test-secret");
        calls.push(JSON.parse(options.body));
        return { ok: response.ok !== false, status: 400, text: async () => "test failure", json: async () => ({ results: [{ ruleCode: "EXP-04", status: "posted", journalEntryId: "test-journal" }] }) };
    };
    const run = () => new AsyncFunction("base", "input", "console", "fetch", source)(base, input, { log: text => logs.push(text) }, fetch);
    return { calls, reads, logs, invoiceReads, run };
}

(async () => {
    let count = 0;
    const check = async (name, run) => { try { await run(); count++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } };
    await check("Native log source, amount, date, accounts, branch and note", async () => {
        const h = await harness(); await h.run();
        assert.deepEqual(h.reads, ["recExamplePrepay"]); assert.equal(h.calls.length, 1);
        const body = h.calls[0], category = body.categories[0];
        assert.equal(body.prepayLogRecordId, "recExamplePrepay");
        assert.equal("paymentRecordId" in body, false); assert.equal("invoiceRecordId" in body, false);
        assert.equal(body.eventType, "created"); assert.equal(body.entryDate, "2026-11-30");
        assert.deepEqual(body.source, { tableId: "tbl1LgiUYt7Gc492d", recordId: body.prepayLogRecordId, recordName: "Example prepay" });
        assert.equal(body.categories.length, 1); assert.equal(category.ruleCode, "EXP-04");
        assert.equal(category.notes, "Example prepaid insurance");
        assert.deepEqual(category.postings, [{ debitAccount: { number: "007.011" }, creditAccount: { number: "135.000" }, amount: "125.56", sourceRecordId: body.prepayLogRecordId, invoiceRecordIds: ["recInvoice"], invoiceRecordId: "recInvoice", branch: ["Chicago"] }]);
        assert.match(h.logs.join("\n"), /Journal ID: test-journal/);
    });
    await check("Future dates remain unchanged and note/invoice links are optional", async () => {
        const h = await harness({ fldXoWjXIrS76p84x: "2037-08-15", fldBuTnJqQ5ymPhRt: null, fldg3040Hc1Z6AQoe: null }); await h.run();
        assert.equal(h.calls[0].entryDate, "2037-08-15"); assert.equal("notes" in h.calls[0].categories[0], false);
    });
    await check("Zero is an explicit no-op", async () => {
        const h = await harness({ fld5NmFxp9Dhza6BK: 0 }); await h.run();
        assert.deepEqual(h.calls[0].categories[0].postings, []);
    });
    await check("Signed amounts retain the supplied account sides", async () => {
        const h = await harness({ fld5NmFxp9Dhza6BK: -1.005 }); await h.run();
        assert.equal(h.calls[0].categories[0].postings[0].amount, "-1.01");
    });
    await check("Invoice branches use bounded reads and preserve an unknown branch", async () => {
        const ids = Array.from({ length: 101 }, (_, i) => "invoice" + i);
        const branches = Object.fromEntries(ids.map((id, i) => [id, i === 0 ? null : "Chicago"]));
        const h = await harness({ fldg3040Hc1Z6AQoe: ids.map(id => ({ id })) }, {}, {}, branches); await h.run();
        assert.deepEqual(h.invoiceReads.map(ids => ids.length), [100, 1]);
        assert.deepEqual(h.calls[0].categories[0].postings[0].branch, ["", "Chicago"]);
    });
    await check("Invalid amounts fail before POST", async () => {
        for (const amount of [null, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
            const h = await harness({ fld5NmFxp9Dhza6BK: amount }); await assert.rejects(h.run()); assert.equal(h.calls.length, 0);
        }
    });
    await check("Missing input, record, date and URL fail before POST", async () => {
        for (const [fields, config, message] of [
            [{}, { prepayLogRecordId: "" }, /Map prepayLogRecordId/],
            [{}, { prepayLogRecordId: "missing" }, /record not found/],
            [{ fldXoWjXIrS76p84x: null }, {}, /Date is required/],
            [{}, { ledgerWebhookUrl: "" }, /ledgerWebhookUrl/],
        ]) {
            const h = await harness(fields, config); await assert.rejects(h.run(), message); assert.equal(h.calls.length, 0);
        }
    });
    await check("HTTP failures are reported without retrying the create", async () => {
        const h = await harness({}, {}, { ok: false }); await assert.rejects(h.run(), /Ledger webhook failed/); assert.equal(h.calls.length, 1);
    });
    console.log(`${count} prepay native checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
