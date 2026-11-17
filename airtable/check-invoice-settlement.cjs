const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const source = fs.readFileSync(path.join(__dirname, "payment-sent.js"), "utf8");
const entry = /^await main\([^\n]*\);/m;
const link = id => ({ id, name: id });
const select = name => ({ name });

async function harness(config = {}, response = {}) {
    assert.match(source, entry);
    const stores = new Map(), reads = [], calls = [], logs = [];
    const base = { getTable(table) {
        if (!stores.has(table)) stores.set(table, new Map());
        const load = (id, fields) => {
            const row = stores.get(table).get(id);
            if (!row) return null;
            const value = field => { assert.ok(fields.includes(field), `Read unselected field ${field}`); return row.fields[field] ?? null; };
            const name = table === "tbldQXuqNEp8G5pfs" && !fields.includes("fldMZyzqDidRujeZS") ? "Unnamed record" : row.name;
            return { id, name, getCellValue: value, getCellValueAsString(field) {
                const cell = value(field);
                return cell == null ? "" : Array.isArray(cell) ? cell.map(v => v?.name ?? v ?? "").join(", ") : typeof cell === "object" ? cell.name : String(cell);
            } };
        };
        return {
            getField: field => ({ name: field }),
            async selectRecordAsync(id, { fields }) { reads.push({ table, ids: [id], fields }); return load(id, fields); },
            async selectRecordsAsync({ recordIds, fields }) {
                assert.ok(recordIds.length && recordIds.length <= 100);
                assert.equal(new Set(recordIds).size, recordIds.length);
                reads.push({ table, ids: recordIds, fields });
                return { records: recordIds.map(id => load(id, fields)).filter(Boolean) };
            },
        }; // No Airtable write methods are available to the script.
    } };
    let configCalls = 0;
    const input = {
        config() { assert.equal(++configCalls, 1); return { paymentRecordId: "payment", ledgerWebhookUrl: "https://example.test/ledger-payment", ...config }; },
        secret(name) { assert.equal(name, "Dual Ledger Webhook Secret"); return "test-secret"; },
    };
    const fetch = async (url, options) => {
        assert.equal(new URL(url).hostname, "example.test", "Checks must never post to a live webhook");
        const body = JSON.parse(options.body);
        for (const category of body.categories) {
            assert.equal("notes" in category, false);
            for (const posting of category.postings) assert.equal("notes" in posting, false);
        }
        calls.push({ url, options, body });
        if (response.throw && (!response.failAt || calls.length === response.failAt)) throw new Error(response.throw);
        return { ok: response.ok !== false, status: response.status || 200, text: async () => "test rejection",
            json: async () => ({ results: body.categories.map(category => ({ ruleCode: category.ruleCode, status: category.postings.length ? "posted" : "noop", journalEntryId: category.postings.length ? "mock-journal" : undefined })) }) };
    };
    const api = await new AsyncFunction("base", "input", "console", "fetch", source.replace(entry, "return { TABLES, PAYMENT_FIELDS, INVOICE_FIELDS, CREDIT_FIELDS, main, moneyUnits };"))(base, input, { log: text => logs.push(text) }, fetch);
    const { TABLES: T, PAYMENT_FIELDS: P, INVOICE_FIELDS: I, CREDIT_FIELDS: C } = api;
    const add = (table, id, fields, name = id) => {
        if (!stores.has(table)) stores.set(table, new Map());
        stores.get(table).set(id, { fields, name });
    };
    const payment = (fields = {}, id = "payment") => add(T.payments, id, {
        [P.sent]: true, [P.amount]: 0, [P.type]: select("AP"), [P.vendorType]: select("AP - Product"), [P.vendorTypesAP]: ["AP - Product"],
        [P.vendorTypesAR]: [], [P.date]: "2026-10-30", [P.invoices]: [link("invoice")], ...fields,
    }, "Test payment");
    const invoice = (fields = {}, id = "invoice") => add(T.invoices, id, { [I.paymentStatus]: select("Fully Paid"), [I.discountTotal]: 0, ...fields }, `Invoice ${id}`);
    const credit = (fields = {}, id = "credit") => add(T.invoices, id, {
        [C.type]: select("AP"), [C.vendorTypeAP]: select("AP - Credit"), [C.available]: -30, [C.recipientInvoices]: [link("invoice")], ...fields,
    }, `Credit ${id}`);
    const ready = () => { payment(); invoice({ [I.creditsApplied]: -20, [I.sourceCredits]: [link("credit")] }); credit(); };
    const runNative = async () => {
        configCalls = 0;
        await new AsyncFunction("base", "input", "console", "fetch", source)(base, input, { log: text => logs.push(text) }, fetch);
        assert.equal(configCalls, 1);
    };
    return { ...api, T, P, I, C, stores, reads, calls, logs, add, payment, invoice, credit, ready, runNative };
}

async function checkBehavior() {
    let count = 0;
    const check = async (name, run) => { try { await run(); count++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } };
    await check("Cash acknowledgement survives a later invoice request failure", async () => {
        const h = await harness({}, { throw: "Second request failed", failAt: 2 }); h.ready();
        h.payment({ [h.P.amount]: 100, [h.P.recordType]: select("Regular Payment"), [h.P.method]: select("Our ACH / Wire"), [h.P.accounts]: [link("bank")] });
        h.invoice({ [h.I.creditsApplied]: -20, [h.I.sourceCredits]: [link("credit")], [h.I.vendors]: [link("vendor")] });
        h.add(h.T.accounts, "bank", { fldTjgAITNrJVCCWq: "112.100" });
        await assert.rejects(h.main("payment"), /Second request failed/);
        assert.equal(h.calls.length, 2);
        assert.ok(h.logs[0]?.includes("PAYMENT SUMMARY"));
        assert.equal(h.logs.filter(log => log.includes("LEDGER RESULT")).length, 1);
        assert.ok(h.logs.some(log => log.includes("Rule: PAY-07") && log.includes("Journal ID: mock-journal")));
    });
    await check("Invoice acknowledgement survives a later invoice request failure", async () => {
        const h = await harness({}, { throw: "Second invoice failed", failAt: 2 }); h.ready();
        h.payment({ [h.P.invoices]: [link("invoice"), link("invoiceB")] });
        h.invoice({ [h.I.creditsApplied]: -10, [h.I.sourceCredits]: [link("creditB")] }, "invoiceB");
        h.credit({ [h.C.recipientInvoices]: [link("invoiceB")] }, "creditB");
        await assert.rejects(h.main("payment"), /Second invoice failed/);
        assert.equal(h.calls.length, 2);
        assert.equal(h.logs.filter(log => log.includes("LEDGER RESULT")).length, 1);
        assert.ok(h.logs.some(log => log.includes("Rule: PAY-11") && log.includes("Journal ID: mock-journal")));
    });
    await check("Consolidated native entry and invoice source identity", async () => {
        const h = await harness(); h.ready(); await h.runNative();
        const body = h.calls[0].body, category = body.categories[0];
        assert.equal(h.calls.length, 1); assert.equal(body.paymentRecordId, "payment");
        assert.deepEqual(body.source, { tableId: h.T.invoices, recordId: "invoice", recordName: "Invoice invoice" });
        assert.equal(body.eventType, "sent"); assert.equal(body.entryDate, "2026-10-30");
        assert.equal(category.ruleCode, "PAY-11"); assert.equal(category.postings[0].amount, "-20.00");
        assert.equal(category.postings[0].debitAccount.number, "211.100"); assert.equal(category.postings[0].creditAccount.number, "211.100");
        assert.equal(h.reads.length, 3, "The credit packet reads only payment, bill and source credit");
        assert.equal(h.calls[0].options.headers["x-ledger-secret"], "test-secret");
    });
    await check("Invoice and source-credit names select the primary field", async () => {
        const h = await harness(); h.ready();
        h.add(h.T.invoices, "invoice", { [h.I.paymentStatus]: select("Fully Paid"), [h.I.creditsApplied]: -20, [h.I.sourceCredits]: [link("credit")] }, "INV - 1000001 - Invoice from Sample Vendor");
        await h.main("payment");
        assert.equal(h.calls[0].body.source.recordName, "INV - 1000001 - Invoice from Sample Vendor");
        assert.ok(h.reads.filter(read => read.table === h.T.invoices).every(read => read.fields.includes("fldMZyzqDidRujeZS")));
        assert.ok(h.logs.some(log => log.includes("Source credit name: Credit credit")));
    });
    await check("One Sent script posts cash and vendor credits with separate durable owners", async () => {
        const h = await harness(); h.ready();
        h.payment({ [h.P.amount]: 100, [h.P.recordType]: select("Regular Payment"), [h.P.method]: select("Our ACH / Wire"), [h.P.accounts]: [link("bank")] });
        h.invoice({ [h.I.creditsApplied]: -20, [h.I.sourceCredits]: [link("credit")], [h.I.vendors]: [link("vendor")] });
        h.add(h.T.accounts, "bank", { fldTjgAITNrJVCCWq: "112.100" });
        await h.main("payment");
        assert.equal(h.calls.length, 2);
        assert.equal(h.calls[0].body.source, undefined);
        assert.equal(h.calls[0].body.categories[0].ruleCode, "PAY-07");
        assert.equal(h.calls[0].body.categories[0].postings[0].amount, "100.00");
        assert.equal(h.calls[1].body.source.recordId, "invoice");
        assert.equal(h.calls[1].body.categories[0].ruleCode, "PAY-11");
        assert.equal(h.calls[1].body.categories[0].postings[0].amount, "-20.00");
        assert.equal(h.reads.filter(read => read.table === h.T.invoices && read.ids.includes("invoice")).length, 1);
    });
    await check("Sent remains the only primary event guard", async () => {
        const h = await harness(); h.ready(); h.payment({ [h.P.sent]: false });
        assert.deepEqual(await h.main("payment"), []); assert.equal(h.calls.length, 0);
    });
    for (const field of ["fldpmVZHFDVYEhUvo", "fldRvZLik2A6g0KVd"]) await check("Unstated cancellation/return exclusions are absent", async () => {
        const h = await harness(); h.ready(); h.payment({ [field]: true });
        const matches = await h.main("payment"); assert.ok(matches.some(match => match.ruleCode === "PAY-11"));
        assert.ok(h.calls.some(call => call.body.source?.tableId === h.T.invoices));
        if (field === "fldpmVZHFDVYEhUvo") assert.ok(h.reads.every(read => !read.fields.includes(field)));
    });
    for (const status of [null, "Fully Unpaid", "Partially Paid", "Voided"]) await check(`Computed status ${status}`, async () => {
        const h = await harness(); h.ready(); h.invoice({ [h.I.paymentStatus]: status && select(status), fld2YNpvvqweloE6S: select("Fully Paid") });
        assert.deepEqual(await h.main("payment"), []); assert.equal(h.calls.length, 0);
    });
    await check("Computed Fully Paid does not require manual paid or Applied lines", async () => {
        const h = await harness(); h.ready(); h.invoice({ fld2YNpvvqweloE6S: select("Fully Unpaid"), fldUvNmlHhsvyoiGu: ["Open"], [h.I.discountTotal]: -1.005 });
        await assert.rejects(h.main("payment"), /Not yet implemented.*row 11/); assert.equal(h.calls.length, 0);
    });
    await check("Blocked discount prevents a partial invoice packet", async () => {
        const h = await harness(); h.ready();
        h.invoice({ [h.I.discountTotal]: -20, [h.I.creditsApplied]: -20, [h.I.sourceCredits]: [link("credit")] });
        await assert.rejects(h.main("payment"), /Not yet implemented.*row 11/); assert.equal(h.calls.length, 0);
    });
    await check("Zero cash payment still applies full vendor credit", async () => {
        const h = await harness(); h.ready(); h.credit();
        h.payment({ fldhP2S68pT3XkZmX: 0 });
        h.invoice({ [h.I.discountTotal]: 0, [h.I.creditsApplied]: -30, [h.I.sourceCredits]: [link("credit")] });
        await h.main("payment"); assert.equal(h.calls[0].body.categories[0].postings[0].amount, "-30.00");
    });
    await check("One source credit can apply to several fully paid bills", async () => {
        const h = await harness(); h.ready();
        h.payment({ [h.P.invoices]: [link("invoice"), link("invoice2")] });
        h.invoice({ [h.I.discountTotal]: 0, [h.I.creditsApplied]: -12, [h.I.sourceCredits]: [link("credit")] });
        h.invoice({ [h.I.discountTotal]: 0, [h.I.creditsApplied]: -18, [h.I.sourceCredits]: [link("credit")] }, "invoice2");
        h.credit({ [h.C.recipientInvoices]: [link("invoice"), link("invoice2")] });
        await h.main("payment"); assert.equal(h.calls.length, 2);
        assert.deepEqual(h.calls.map(call => call.body.categories[0].postings[0].amount), ["-12.00", "-18.00"]);
        assert.deepEqual(h.calls.map(call => call.body.source.recordId), ["invoice", "invoice2"]);
    });
    await check("Missing source credit link fails", async () => {
        const h = await harness(); h.ready(); h.credit();
        h.invoice({ [h.I.creditsApplied]: -20, [h.I.sourceCredits]: [] });
        await assert.rejects(h.main("payment"), /no source credit invoice/); assert.equal(h.calls.length, 0);
    });
    await check("Several source credits use the verified common bill factor", async () => {
        const h = await harness(); h.ready();
        h.invoice({ [h.I.discountTotal]: 0, [h.I.creditsApplied]: -15, [h.I.sourceCredits]: [link("credit1"), link("credit2")] });
        h.credit({ [h.C.available]: -10 }, "credit1"); h.credit({ [h.C.available]: -20 }, "credit2");
        await h.main("payment");
        const postings = h.calls[0].body.categories[0].postings;
        assert.deepEqual(postings.map(posting => [posting.creditInvoiceRecordId, posting.amount]), [["credit1", "-5.00"], ["credit2", "-10.00"]]);
        assert.ok(postings.every(posting => posting.debitInvoiceRecordId === "invoice"));
        assert.match(h.logs[0], /Source credit ID: credit1/); assert.match(h.logs[0], /Source credit ID: credit2/);
    });
    await check("Largest remainder conserves cents and uses stable source ID ties", async () => {
        const h = await harness(); h.ready();
        h.invoice({ [h.I.discountTotal]: 0, [h.I.creditsApplied]: -0.02, [h.I.sourceCredits]: [link("creditC"), link("creditA"), link("creditB")] });
        for (const id of ["creditA", "creditB", "creditC"]) h.credit({ [h.C.available]: -0.01 }, id);
        await h.main("payment");
        assert.deepEqual(h.calls[0].body.categories[0].postings.map(posting => [posting.creditInvoiceRecordId, posting.amount]), [["creditA", "-0.01"], ["creditB", "-0.01"]]);
    });
    await check("Allocation retains four-decimal source proportions before cent rounding", async () => {
        const h = await harness(); h.ready();
        h.invoice({ [h.I.discountTotal]: 0, [h.I.creditsApplied]: -1.01, [h.I.sourceCredits]: [link("creditA"), link("creditZ")] });
        h.credit({ [h.C.available]: -1.0001 }, "creditA"); h.credit({ [h.C.available]: -1.0049 }, "creditZ");
        await h.main("payment");
        assert.deepEqual(h.calls[0].body.categories[0].postings.map(posting => [posting.creditInvoiceRecordId, posting.amount]), [["creditA", "-0.50"], ["creditZ", "-0.51"]]);
    });
    await check("Zero source credit has zero allocation", async () => {
        const h = await harness(); h.ready();
        h.invoice({ [h.I.discountTotal]: 0, [h.I.creditsApplied]: -10, [h.I.sourceCredits]: [link("credit"), link("zero")] });
        h.credit(); h.credit({ [h.C.available]: 0 }, "zero");
        await h.main("payment");
        assert.deepEqual(h.calls[0].body.categories[0].postings.map(posting => [posting.creditInvoiceRecordId, posting.amount]), [["credit", "-10.00"]]);
    });
    for (const available of [null, NaN, Infinity, "-30", 30]) await check(`Invalid source credit weight ${available}`, async () => {
        const h = await harness(); h.ready();
        h.invoice({ [h.I.discountTotal]: 0, [h.I.creditsApplied]: -10, [h.I.sourceCredits]: [link("credit"), link("other")] });
        h.credit(); h.credit({ [h.C.available]: available }, "other");
        await assert.rejects(h.main("payment"), /finite|positive/); assert.equal(h.calls.length, 0);
    });
    await check("Positive applied credits and over-applied totals fail", async () => {
        for (const applied of [10, -31]) {
            const h = await harness(); h.ready(); h.credit();
            h.invoice({ [h.I.discountTotal]: 0, [h.I.creditsApplied]: applied, [h.I.sourceCredits]: [link("credit")] });
            await assert.rejects(h.main("payment"), /invalid applied-credit amount/); assert.equal(h.calls.length, 0);
        }
    });
    for (const [name, override] of [["not AP", { type: select("AR") }], ["not credit", { vendorTypeAP: select("AP - Product") }], ["not reciprocal", { recipientInvoices: [] }], ["unfunded", { available: 0 }]]) await check(`Invalid source credit ${name}`, async () => {
        const h = await harness(); h.ready();
        h.invoice({ [h.I.creditsApplied]: -20, [h.I.sourceCredits]: [link("credit")] });
        h.credit(Object.fromEntries(Object.entries(override).map(([field, value]) => [h.C[field], value])));
        await assert.rejects(h.main("payment"), /credit|link back/i); assert.equal(h.calls.length, 0);
    });
    await check("Full card rebate is independent of final payment fraction", async () => {
        const h = await harness(); h.ready();
        h.payment({ [h.P.type]: select("AR"), [h.P.vendorType]: select("AR - Non-Product"), [h.P.vendorTypesAP]: [], [h.P.vendorTypesAR]: ["AR - Non-Product"], fldhP2S68pT3XkZmX: 100 });
        h.add(h.T.accounts, "rebateAccount", { fldTjgAITNrJVCCWq: "004.011" });
        h.invoice({ [h.I.accounts]: [link("rebateAccount")], [h.I.discountTotal]: 0, [h.I.rebateTotal]: 20, fldNqZMZsZfRPiRFp: 200 });
        await h.main("payment"); const category = h.calls[0].body.categories[0];
        assert.equal(category.ruleCode, "PAY-27"); assert.equal(category.postings[0].amount, "20.00");
        assert.equal(category.postings[0].debitAccount.number, "231.100"); assert.equal(category.postings[0].creditAccount.number, "004.011");
    });
    await check("AR product cannot use non-product rebate", async () => {
        const h = await harness(); h.ready(); h.payment({ [h.P.type]: select("AR"), [h.P.vendorType]: select("AR - Product"), [h.P.vendorTypesAP]: [], [h.P.vendorTypesAR]: ["AR - Product"] });
        h.invoice({ [h.I.rebateTotal]: 20 }); const matches = await h.main("payment");
        assert.ok(!matches.some(match => match.ruleCode === "PAY-27"));
    });
    await check("Empty and zero totals do not call webhook", async () => {
        const h = await harness(); h.ready(); h.invoice({ [h.I.discountTotal]: 0, [h.I.creditsApplied]: 0 });
        assert.deepEqual(await h.main("payment"), []); assert.equal(h.calls.length, 0);
    });
    await check("Sub-cent explicit amount becomes no-op category", async () => {
        const h = await harness(); h.ready(); h.invoice({ [h.I.discountTotal]: -0.004 });
        await assert.rejects(h.main("payment"), /Not yet implemented.*row 11/); assert.equal(h.calls.length, 0);
    });
    for (const amount of [NaN, Infinity, "-2", 5]) await check(`Invalid discount total ${amount}`, async () => {
        const h = await harness(); h.ready(); h.invoice({ [h.I.discountTotal]: amount });
        await assert.rejects(h.main("payment"), /Not yet implemented.*row 11/); assert.equal(h.calls.length, 0);
    });
    await check("All invoices prepared before the first request", async () => {
        const h = await harness(); h.ready(); h.payment({ [h.P.invoices]: [link("invoice"), link("invoice2")] });
        h.invoice({ [h.I.discountTotal]: Infinity }, "invoice2");
        await assert.rejects(h.main("payment"), /Not yet implemented.*row 11/); assert.equal(h.calls.length, 0);
    });
    await check("Missing linked invoice fails without posting", async () => {
        const h = await harness(); h.ready(); h.stores.get(h.T.invoices).clear();
        await assert.rejects(h.main("payment"), /Missing linked records/); assert.equal(h.calls.length, 0);
    });
    await check("Missing source credit fails without posting", async () => {
        const h = await harness(); h.ready(); h.invoice({ [h.I.creditsApplied]: -10, [h.I.sourceCredits]: [link("missing")] });
        await assert.rejects(h.main("payment"), /Missing linked records/); assert.equal(h.calls.length, 0);
    });
    await check("Multiple raw vendor types fail before classification", async () => {
        const h = await harness(); h.ready(); h.payment({ [h.P.vendorTypesAP]: ["AP - Product", "AP - Credit"] });
        await assert.rejects(h.main("payment"), /multiple Vendor Types/); assert.equal(h.calls.length, 0);
    });
    await check("References preserve single and multiple native links", async () => {
        const h = await harness(); h.ready(); h.invoice({ [h.I.creditsApplied]: -20, [h.I.sourceCredits]: [link("credit")], [h.I.vendors]: [link("vendor")], [h.I.purchaseOrders]: [link("po2"), link("po1")], [h.I.branch]: select("Chicago") });
        await h.main("payment"); const posting = h.calls[0].body.categories[0].postings[0];
        assert.equal(posting.vendorRecordId, "vendor"); assert.deepEqual(posting.poRecordIds, ["po2", "po1"]); assert.equal(posting.poRecordId, undefined);
        assert.equal("notes" in posting, false); assert.deepEqual(posting.branch, ["Chicago"]);
    });
    await check("Different triggering payments keep invoice source identity", async () => {
        const h = await harness(); h.ready(); h.payment({}, "payment2");
        await h.main("payment"); await h.main("payment2");
        assert.deepEqual(h.calls[0].body.source, h.calls[1].body.source); assert.deepEqual(h.calls[0].body.categories, h.calls[1].body.categories);
        assert.notEqual(h.calls[0].body.paymentRecordId, h.calls[1].body.paymentRecordId);
    });
    await check("Missing input/payment and date fail", async () => {
        const h = await harness(); h.ready();
        await assert.rejects(h.main(""), /Map paymentRecordId/); await assert.rejects(h.main("missing"), /Payment not found/);
        h.payment({ [h.P.date]: null }); await assert.rejects(h.main("payment"), /Payment Date is required/); assert.equal(h.calls.length, 0);
    });
    await check("Missing URL fails before posting", async () => {
        const h = await harness({ ledgerWebhookUrl: "" }); h.ready(); await assert.rejects(h.main("payment"), /ledgerWebhookUrl/); assert.equal(h.calls.length, 0);
    });
    await check("HTTP failure and transport failure are not retried", async () => {
        for (const response of [{ ok: false, status: 409 }, { throw: "connection lost" }]) {
            const h = await harness({}, response); h.ready(); await assert.rejects(h.main("payment"), /409|connection lost/); assert.equal(h.calls.length, 1);
        }
    });
    return count;
}

async function replayFixtures() {
    const root = path.resolve(__dirname, "../../scripts/outputs");
    const schema = JSON.parse(fs.readFileSync(path.join(root, "ledger-tchart-refresh-2026-10-30/schema-current.json"), "utf8"));
    const tableMap = new Map(schema.tables.map(table => [table.id, table]));
    let paymentsChecked = 0, mockRequests = 0, creditApplications = 0, blockedPayments = 0, incompleteFixtures = 0;
    for (const fixture of [
        { folder: "ledger-payment-discount-2026-10-30", payments: ["sample-payments.json"], invoices: ["sample-invoices.json"] },
        { folder: "ledger-invoice-settlement-local-check-2026-10-30", payments: ["payments.json"], invoices: ["invoices.json"] },
    ]) {
        const load = names => names.flatMap(name => JSON.parse(fs.readFileSync(path.join(root, fixture.folder, name), "utf8")).records);
        const payments = load(fixture.payments), invoices = load(fixture.invoices);
        for (const payment of payments) {
            const h = await harness();
            for (const [tableId, fields] of [[h.T.payments, h.P], [h.T.invoices, h.I], [h.T.invoices, h.C]]) {
                const existing = new Set(tableMap.get(tableId).fields.map(field => field.id));
                for (const id of Object.values(fields)) assert.ok(existing.has(id), `Unknown field ID ${id} in ${tableId}`);
            }
            for (const [kind, records] of [["payments", payments], ["invoices", invoices]]) {
                const table = tableMap.get(h.T[kind]); const fields = new Map(table.fields.map(field => [field.id, field]));
                for (const row of records) h.add(table.id, row.id, Object.fromEntries(Object.entries(row.fields).map(([id, value]) => [id,
                    fields.get(id)?.type === "multipleRecordLinks" ? value.map(link) : fields.get(id)?.type === "singleSelect" ? select(value) : value,
                ])), row.fields[table.primaryFieldId] || row.id);
            }
            const accountFixture = JSON.parse(fs.readFileSync(path.join(root, "ledger-fixes-2026-10-30/accounts-readonly.json"), "utf8"));
            for (const account of accountFixture.records) h.add(h.T.accounts, account.id, account.fields, account.id);
            try { await h.main(payment.id); }
            catch (error) { if (/Missing linked records in tblV26TC0f6CKDneL/.test(error.message)) incompleteFixtures++; else { assert.match(error.message, /Not yet implemented/); blockedPayments++; } assert.equal(h.calls.length, 0); }
            paymentsChecked++; mockRequests += h.calls.length;
            for (const call of h.calls) for (const category of call.body.categories) {
                if (!call.body.source) continue; // Payment-owned packets are covered by check.cjs.
                const bill = invoices.find(row => row.id === call.body.source.recordId);
                const amountField = category.ruleCode === "PAY-10" ? h.I.discountTotal : category.ruleCode === "PAY-11" ? h.I.creditsApplied : h.I.rebateTotal;
                const expected = h.moneyUnits(bill.fields[amountField], 2, "expected");
                assert.equal(category.postings.reduce((total, posting) => total + h.moneyUnits(Number(posting.amount), 2, "posted"), 0), expected);
                if (category.ruleCode === "PAY-11") {
                    creditApplications++;
                    assert.equal(category.postings[0].debitInvoiceRecordId, bill.id);
                    assert.equal(category.postings[0].creditInvoiceRecordId, bill.fields[h.I.sourceCredits][0]);
                }
            }
        }
    }
    return { paymentsChecked, mockRequests, creditApplications, blockedPayments, incompleteFixtures, network: "mock only" };
}

(async () => console.log(JSON.stringify({ checksPassed: await checkBehavior(), fixtureReplay: await replayFixtures() }, null, 2)))().catch(error => { console.error(error); process.exitCode = 1; });
