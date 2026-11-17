// Native Airtable mocks only. No live webhook or Airtable write methods are available.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "depreciation-created.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

async function harness(overrides = {}, config = {}, response = {}) {
    const calls = [], reads = [], logs = [];
    const fields = {
        fldQ299tE4wJB4SmH: "2026-11-30", fld58fd0YHB0YRxC1: 125.555,
        fldLXqVZ4TUaxq8kF: [{ id: "recExampleAsset", name: "Example equipment" }], ...overrides,
    };
    const base = { getTable(table) {
        assert.equal(table, "tblC0dbO5UMXzHma9");
        return { async selectRecordAsync(id, options) {
            reads.push(id);
            if (id !== "recExampleDepreciation") return null;
            assert.ok(options.fields.includes("fld9isGL0VoPVdkeU"));
            return { id, name: "Example depreciation", getCellValue(field) {
                assert.ok(options.fields.includes(field), `Unselected field ${field}`);
                return fields[field] ?? null;
            } };
        } };
    } };
    const input = {
        config: () => ({ depreciationRecordId: "recExampleDepreciation", ledgerWebhookUrl: "https://example.test/ledger-payment", ...config }),
        secret(name) { assert.equal(name, "Dual Ledger Webhook Secret"); return "test-secret"; },
    };
    const fetch = async (url, options) => {
        assert.equal(new URL(url).hostname, "example.test");
        assert.equal(options.method, "POST");
        assert.equal(options.headers["x-ledger-secret"], "test-secret");
        calls.push(JSON.parse(options.body));
        return { ok: response.ok !== false, status: 400, text: async () => "test failure", json: async () => ({ results: [{ ruleCode: "EXP-10", status: "posted", journalEntryId: "test-journal" }] }) };
    };
    const run = () => new AsyncFunction("base", "input", "console", "fetch", source)(base, input, { log: text => logs.push(text) }, fetch);
    return { calls, reads, logs, run };
}

(async () => {
    let count = 0;
    const check = async (name, run) => { try { await run(); count++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } };
    await check("Native source, amount, date, accounts and asset note", async () => {
        const h = await harness(); await h.run();
        assert.deepEqual(h.reads, ["recExampleDepreciation"]); assert.equal(h.calls.length, 1);
        const body = h.calls[0], category = body.categories[0];
        assert.equal(body.depreciationRecordId, "recExampleDepreciation");
        assert.equal("paymentRecordId" in body, false); assert.equal("invoiceRecordId" in body, false);
        assert.equal(body.eventType, "created"); assert.equal(body.entryDate, "2026-11-30");
        assert.deepEqual(body.source, { tableId: "tblC0dbO5UMXzHma9", recordId: body.depreciationRecordId, recordName: "Example depreciation" });
        assert.equal(body.categories.length, 1); assert.equal(category.ruleCode, "EXP-10");
        assert.equal(category.notes, "Associated asset: Example equipment (recExampleAsset)");
        assert.deepEqual(category.postings, [{ debitAccount: { number: "009.101" }, creditAccount: { number: "161.000" }, amount: "125.56", sourceRecordId: body.depreciationRecordId }]);
        assert.match(h.logs.join("\n"), /Journal ID: test-journal/);
    });
    await check("Future dates remain unchanged and an asset is optional", async () => {
        const h = await harness({ fldQ299tE4wJB4SmH: "2037-08-15", fldLXqVZ4TUaxq8kF: null }); await h.run();
        assert.equal(h.calls[0].entryDate, "2037-08-15"); assert.equal("notes" in h.calls[0].categories[0], false);
    });
    await check("Zero is an explicit no-op", async () => {
        const h = await harness({ fld58fd0YHB0YRxC1: 0 }); await h.run();
        assert.deepEqual(h.calls[0].categories[0].postings, []);
    });
    await check("Signed amounts retain the supplied account sides", async () => {
        const h = await harness({ fld58fd0YHB0YRxC1: -1.005 }); await h.run();
        assert.equal(h.calls[0].categories[0].postings[0].amount, "-1.01");
    });
    await check("Invalid amounts fail before POST", async () => {
        for (const amount of [null, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
            const h = await harness({ fld58fd0YHB0YRxC1: amount }); await assert.rejects(h.run()); assert.equal(h.calls.length, 0);
        }
    });
    await check("Missing input, record, date and URL fail before POST", async () => {
        for (const [fields, config, message] of [
            [{}, { depreciationRecordId: "" }, /Map depreciationRecordId/],
            [{}, { depreciationRecordId: "missing" }, /record not found/],
            [{ fldQ299tE4wJB4SmH: null }, {}, /Date is required/],
            [{}, { ledgerWebhookUrl: "" }, /ledgerWebhookUrl/],
        ]) {
            const h = await harness(fields, config); await assert.rejects(h.run(), message); assert.equal(h.calls.length, 0);
        }
    });
    await check("HTTP failures are reported without retrying the create", async () => {
        const h = await harness({}, {}, { ok: false }); await assert.rejects(h.run(), /Ledger webhook failed/); assert.equal(h.calls.length, 1);
    });
    console.log(`${count} depreciation native checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
