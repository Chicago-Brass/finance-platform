// Native mocks only. All dates, webhook responses and Airtable writes stay inside this process.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "ledger-reversal.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const tableId = "tblR61NG9i0giid28", recordId = "rec00000000000001";
const original = "11111111-1111-4111-8111-111111111111", reversal = "22222222-2222-4222-8222-222222222222";
const fieldIds = {
    tblR61NG9i0giid28: { reverse: "fldNtEQiswXd8mODj", reverseDate: "fldXItbQ15eokPT0P", journalIds: "fldUTQWnsCYxYZ8wa", reversalIds: "fld7j7LKJNbgfyFhk" },
    tbldQXuqNEp8G5pfs: { reverse: "fldOZh1NZmJi9tqkb", reverseDate: "fld1SzFreZ84owLgq", journalIds: "fldLqYrXCySCoZRQT", reversalIds: "fldKWzgJ7ypvfn6Jw" },
};

function harness({ fields = {}, config = {}, ok = true, result, missing = false, failWrite = 0, failFetch = false } = {}) {
    const state = { reverse: true, reverseDate: null, journalIds: "[]", reversalIds: null, ...fields };
    const settings = { sourceTableId: tableId, sourceRecordId: recordId, ledgerReversalUrl: "https://example.test/ledger-reversal", ...config };
    const selectedFields = fieldIds[settings.sourceTableId];
    const aliases = Object.fromEntries(Object.entries(selectedFields || {}).map(([name, id]) => [id, name]));
    const reads = [], writes = [], calls = [], logs = [];
    const response = result || { source: { tableId: settings.sourceTableId, recordId }, journalEntryIds: [original], reversalJournalEntryIds: [reversal], reversedCount: 1, duplicateCount: 0, results: [{ journalEntryId: original, reversalJournalEntryId: reversal, status: "reversed" }] };
    const base = { getTable(id) {
        assert.equal(id, settings.sourceTableId);
        return {
            async selectRecordAsync(id, options) {
                reads.push(id); assert.deepEqual(options.fields, [selectedFields.reverse, selectedFields.reverseDate, selectedFields.journalIds]);
                return missing ? null : { id, getCellValue: field => state[aliases[field]], getCellValueAsString: field => state[aliases[field]] || "" };
            },
            async updateRecordAsync(id, changes) {
                assert.equal(id, recordId); changes = Object.fromEntries(Object.entries(changes).map(([field, value]) => [aliases[field], value])); writes.push(changes);
                if (writes.length === failWrite) throw new Error("Mock write failed");
                Object.assign(state, changes);
            },
        };
    } };
    const input = { config: () => settings, secret: name => { assert.equal(name, "Dual Ledger Webhook Secret"); return "test-secret"; } };
    const fetch = async (url, options) => {
        assert.equal(url, settings.ledgerReversalUrl); assert.equal(options.method, "POST");
        assert.equal(options.headers["x-ledger-secret"], "test-secret");
        assert.ok(state.reverseDate, "date is persisted before any request");
        calls.push(JSON.parse(options.body));
        if (failFetch) throw new Error("Mock network failure");
        return { ok, status: 503, text: async () => "mock receiver error", json: async () => response };
    };
    class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : ["2026-11-09T05:30:00Z"])); } }
    const run = () => new AsyncFunction("base", "input", "fetch", "console", "Date", source)(base, input, fetch, { log: text => logs.push(text) }, FixedDate);
    return { state, reads, writes, calls, logs, response, run };
}

(async () => {
    let count = 0;
    const check = async (name, fn) => { try { await fn(); count++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } };
    await check("stamps the Chicago date once and writes all returned IDs", async () => {
        const h = harness(); await h.run();
        assert.equal(h.state.reverseDate, "2026-11-08", "Chicago date differs from UTC at this time");
        assert.deepEqual(h.calls, [{ source: { tableId, recordId }, journalEntryIds: [], reversalDate: "2026-11-08" }]);
        assert.equal(h.writes.length, 2); assert.equal(h.state.journalIds, JSON.stringify([original]));
        assert.equal(h.state.reversalIds, JSON.stringify([reversal])); assert.equal(h.state.reverse, true);
        assert.match(h.logs.join("\n"), /Journals reversed: 1/);
    });
    await check("invoice setup uses its own source and preserves an existing manual date", async () => {
        const h = harness({ config: { sourceTableId: "tbldQXuqNEp8G5pfs" }, fields: { reverseDate: "2026-10-15", journalIds: JSON.stringify([original]) } });
        await h.run(); assert.equal(h.writes.length, 1); assert.equal(h.calls[0].reversalDate, "2026-10-15");
        assert.equal(h.calls[0].source.tableId, "tbldQXuqNEp8G5pfs"); assert.deepEqual(h.calls[0].journalEntryIds, [original]);
    });
    await check("unchecking does not reverse, restore, clear IDs or clear a date", async () => {
        const h = harness({ fields: { reverse: false, reverseDate: "2026-10-15", reversalIds: JSON.stringify([reversal]) } });
        await h.run(); assert.equal(h.calls.length, 0); assert.equal(h.writes.length, 0);
        assert.equal(h.state.reverseDate, "2026-10-15"); assert.equal(h.state.reversalIds, JSON.stringify([reversal]));
    });
    await check("HTTP and network failures preserve the stamped date and earlier links", async () => {
        for (const options of [{ ok: false }, { failFetch: true }]) {
            const h = harness({ ...options, fields: { journalIds: JSON.stringify([original]), reversalIds: "unchanged" } });
            await assert.rejects(h.run()); assert.equal(h.calls.length, 1); assert.equal(h.writes.length, 1);
            assert.equal(h.state.reverseDate, "2026-11-08"); assert.equal(h.state.reversalIds, "unchanged");
        }
    });
    await check("date write failure prevents the webhook; response write failure never clears the date", async () => {
        const before = harness({ failWrite: 1 }); await assert.rejects(before.run(), /Mock write/); assert.equal(before.calls.length, 0);
        const after = harness({ failWrite: 2 }); await assert.rejects(after.run(), /Mock write/);
        assert.equal(after.calls.length, 1); assert.equal(after.state.reverseDate, "2026-11-08"); assert.equal(after.state.reversalIds, null);
    });
    await check("an exact retry preserves the original date and accepts the existing reversals", async () => {
        const h = harness({ fields: { reverseDate: "2026-10-15" } });
        h.response.reversedCount = 0; h.response.duplicateCount = 1; h.response.results[0].status = "already_reversed";
        await h.run(); await h.run(); assert.equal(h.state.reverseDate, "2026-10-15");
        assert.ok(h.writes.every(write => !("reverseDate" in write))); assert.equal(h.state.reversalIds, JSON.stringify([reversal]));
    });
    await check("pending and rejected responses preserve existing journal links", async () => {
        for (const status of ["pending_review", "rejected"]) {
            const h = harness({ fields: { reverseDate: "2026-10-15", journalIds: JSON.stringify([original]), reversalIds: JSON.stringify([reversal]) }, result: { status, requestId: "review-request" } });
            await h.run(); assert.equal(h.writes.length, 0);
            assert.equal(h.state.journalIds, JSON.stringify([original])); assert.equal(h.state.reversalIds, JSON.stringify([reversal]));
            assert.match(h.logs.join("\n"), /review-request/);
        }
    });
    await check("mismatched or malformed successful responses cannot overwrite ID fields", async () => {
        for (const mutation of [r => { r.source.recordId = "wrong"; }, r => { delete r.journalEntryIds; }, r => { delete r.reversalJournalEntryIds; }]) {
            const h = harness(); mutation(h.response); await assert.rejects(h.run(), /Unexpected reversal response/);
            assert.equal(h.state.journalIds, "[]"); assert.equal(h.state.reversalIds, null);
        }
    });
    await check("missing records, malformed stored JSON and deferred tables fail without requests", async () => {
        for (const options of [{ missing: true }, { fields: { journalIds: "not JSON" } }, { config: { sourceTableId: "tblC0dbO5UMXzHma9" } }, { config: { sourceRecordId: "" } }]) {
            const h = harness(options); await assert.rejects(h.run()); assert.equal(h.calls.length, 0); assert.equal(h.writes.length, 0);
        }
    });
    console.log(`${count} reversal native checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
