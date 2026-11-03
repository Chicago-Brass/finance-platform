const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const link = id => ({ id, name: id });
const select = name => ({ name });

// Approved T-Chart column A labels, trimmed and using plain hyphens for repository style.
const EXPECTED_TRANSACTION_TYPES = {
    "PAY-01": "CUSTOMER DEPOSIT RECEIVED (before the order is processed)",
    "PAY-02": "Customer payment AFTER the order shipped (credit-terms clients)",
    "PAY-03": "Client OVERPAYS or pays with no invoice to apply it to",
    "PAY-04": "Small short-pay / rounding difference written off",
    "PAY-05": "Refund to a client - by bank / check",
    "PAY-06": "Client payment voided / bounced",
    "PAY-07": "Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise)",
    "PAY-08": "Pay a vendor with the company credit card",
    "PAY-09": "Pay the credit-card statement",
    "PAY-12": "Vendor payment cancelled / returned",
    "PAY-13": "Vendor sends us a refund",
    "PAY-15": "Pay offshore / 1099 / owner staff (Wise, ACH)",
    "PAY-16": "Loan payment (principal + interest)",
    "PAY-17": "Line of credit - borrow (draw)",
    "PAY-18": "Line of credit - repay",
    "PAY-19": "Move money between our own bank accounts",
    "PAY-20": "Owner distribution paid",
    "PAY-21": "Owner puts money into the company",
    "PAY-22": "Income tax payment",
    "PAY-23": "Insurance claim payout received",
    "PAY-24": "Security deposit paid (lease)",
    "PAY-11": "Bill paid using vendor credits (no cash)",
    "PAY-27": "Credit-card rebate earned (cash back)",
    "PAY-26": "Bank reconciliation rounding difference"
};

function record(id, fields, name = id) {
    return {
        id, name,
        getCellValue: field => fields[field] ?? null,
        getCellValueAsString: field => {
            const value = fields[field];
            if (value == null) return "";
            if (Array.isArray(value)) return value.map(item => item?.name ?? item ?? "").join(", ");
            return typeof value === "object" ? value.name : String(value);
        },
    };
}

async function harness(kind, config = {}, fetchResponse = {}) {
    const source = fs.readFileSync(path.join(__dirname, `payment-${kind}.js`), "utf8");
    const entry = /^await main\([^\n]*\);/m;
    assert.match(source, entry, "The native entry point must remain present");
    const exportSource = source.replace(entry, `return { TABLES, PAYMENT_FIELDS,
        INVOICE_FIELDS: typeof INVOICE_FIELDS === "undefined" ? {} : INVOICE_FIELDS,
        ACCOUNT_FIELDS: typeof ACCOUNT_FIELDS === "undefined" ? {} : ACCOUNT_FIELDS,
        main,
        moneyCents: typeof moneyCents === "undefined" ? null : moneyCents,
        moneyString: typeof moneyString === "undefined" ? null : moneyString,
        allocateCents: typeof allocateCents === "undefined" ? null : allocateCents };`);
    const stores = new Map(), reads = [], logs = [], calls = [];
    const base = {
        getTable(id) {
            if (!stores.has(id)) stores.set(id, new Map());
            return {
                getField: field => ({ name: field }),
                async selectRecordAsync(recordId, options) {
                    reads.push({ table: id, ids: [recordId], fields: options.fields });
                    return stores.get(id).get(recordId) || null;
                },
                async selectRecordsAsync(options) {
                    assert.ok(options.recordIds.length > 0 && options.recordIds.length <= 100);
                    reads.push({ table: id, ids: options.recordIds, fields: options.fields });
                    return { records: options.recordIds.map(recordId => stores.get(id).get(recordId)).filter(Boolean) };
                },
            };
        },
    };
    let configCalls = 0;
    const input = {
        config: () => {
            configCalls++;
            assert.equal(configCalls, 1, "input.config may only be called once");
            return { paymentRecordId: "payment", ledgerWebhookUrl: "https://example.test/ledger-payment", ...config };
        },
        secret: name => { assert.equal(name, "Dual Ledger Webhook Secret"); return "local-test-secret"; },
    };
    const fetch = async (url, options) => {
        calls.push({ url, options, body: JSON.parse(options.body) });
        if (fetchResponse.throw) throw new Error(fetchResponse.throw);
        const body = fetchResponse.body || { results: [{ ruleCode: "PAY-07", status: "posted", journalId: "local-journal" }] };
        return {
            ok: fetchResponse.ok !== false,
            status: fetchResponse.status || 200,
            json: async () => body,
            text: async () => JSON.stringify(body),
        };
    };
    const api = await new AsyncFunction("base", "input", "console", "fetch", exportSource)(base, input, { log: message => logs.push(message) }, fetch);
    const { TABLES: T, PAYMENT_FIELDS: P, INVOICE_FIELDS: I, ACCOUNT_FIELDS: A } = api;
    const add = (table, id, fields, name) => {
        if (!stores.has(table)) stores.set(table, new Map());
        stores.get(table).set(id, record(id, fields, name));
    };
    const payment = fields => add(T.payments, "payment", {
        [P.sent]: true,
        [P.amount]: 100,
        [P.date]: "2026-10-29",
        [P.reference]: "REF-TEST",
        [P.type]: select("AP"),
        [P.vendorType]: select("AP - Product"),
        [P.vendorTypesAP]: ["AP - Product"],
        [P.vendorTypesAR]: [],
        [P.recordType]: select("Regular Payment"),
        [P.method]: select("Our ACH / Wire"),
        [P.accounts]: [link("bank")],
        [P.invoices]: [link("invoice")],
        ...fields,
    }, "Local payment");
    const invoice = (id = "invoice", fields = {}) => add(T.invoices, id, {
        [I.amountToPay]: 100,
        [I.vendors]: [link("vendor")],
        [I.purchaseOrders]: [link("po")],
        [I.branch]: select("Chicago"),
        ...fields,
    });
    const bank = (id = "bank", number = "112.100") => add(T.accounts, id, { [A.number]: number });
    const main = async (...args) => {
        const matches = await api.main(...args);
        for (const call of calls) {
            for (const category of call.body.categories) {
                const match = matches.find(result => category.ruleCode === `PAY-${String(result.tChartRow - 1).padStart(2, "0")}`);
                assert.ok(match, "Every posted category came from a qualifying handler");
                assert.equal(category.transactionType, match.category, "Airtable supplies the selected transaction type");
                assert.equal(category.transactionType, EXPECTED_TRANSACTION_TYPES[category.ruleCode], "Transaction types retain the approved T-Chart wording with normalized whitespace and hyphens");
                assert.equal("components" in category, false);
                assert.equal("notes" in category, false, "Category notes are not sent");
                for (const posting of category.postings) {
                    assert.equal("kind" in posting, false, "No component routing is delegated to Supabase");
                    assert.equal("notes" in posting, false, "Audit context uses structured references only");
                    assert.ok(posting.debitAccount && posting.creditAccount);
                    assert.equal(typeof posting.debitAccount.number, "string");
                    assert.equal(typeof posting.creditAccount.number, "string");
                    assert.match(posting.amount, /^\d+\.\d{2}$/);
                }
            }
        }
        return matches;
    };
    const runNative = async () => {
        configCalls = 0;
        await new AsyncFunction("base", "input", "console", "fetch", source)(base, input, { log: message => logs.push(message) }, fetch);
        assert.equal(configCalls, 1, "The actual Airtable entry point reads input.config once");
    };
    return { ...api, main, source, stores, add, payment, invoice, bank, reads, logs, calls, runNative };
}

const postings = h => h.calls[0].body.categories.flatMap(category => category.postings);
const pairs = h => postings(h).map(part => [part.debitAccount.number, part.creditAccount.number, part.amount]);
const coveredRows = new Set();
const rows = matches => matches.map(match => { coveredRows.add(match.tChartRow); return match.tChartRow; });

async function main() {
    let h = await harness("sent");
    const { PAYMENT_FIELDS: P, ACCOUNT_FIELDS: A } = h;
    // Old invoice-line inputs are negative fixtures: production must not use them to invent splits.
    const T = { ...h.TABLES, lines: "tblV26TC0f6CKDneL" };
    const I = { ...h.INVOICE_FIELDS, lines: "fldF0uqCMkPgwuIes" };
    const L = { amount: "fldkhhHCD2qKD71rI", type: "fldchdpL3w2aXfm4P", accounts: "fldwr0Pfp8OHsNj5N" };
    assert.equal(h.moneyCents(0.005, "test"), 1);
    assert.equal(h.moneyCents(-0.005, "test"), -1);
    assert.equal(h.moneyCents(10.075, "test"), 1008);
    assert.equal(h.moneyCents(-10.075, "test"), -1008);
    assert.equal(h.moneyCents(1e-7, "test"), 0);
    assert.equal(h.moneyCents(1e6, "test"), 100000000);
    assert.equal(h.moneyString(-1), "-0.01");
    assert.equal(h.moneyString(h.moneyCents(-0.004, "test")), "0.00");
    assert.throws(() => h.moneyCents(null, "test"), /missing|number|amount/i);
    assert.throws(() => h.moneyCents(Infinity, "test"), /finite|number|amount/i);
    assert.deepEqual([...h.allocateCents(1, [{ id: "b", cents: 100 }, { id: "a", cents: 100 }])], [["a", 1], ["b", 0]]);
    h.payment(); h.invoice(); h.bank();
    let matches = await h.main("payment");
    assert.deepEqual(rows(matches), [8]);
    assert.equal(h.calls.length, 1, "All categories use one webhook request");
    let packet = h.calls[0].body;
    assert.equal(packet.paymentRecordId, "payment");
    assert.equal(packet.entryDate, "2026-10-29");
    assert.equal(packet.paymentAmount, "100.00");
    assert.equal(packet.categories[0].ruleCode, "PAY-07");
    assert.equal(postings(h)[0].amount, "100.00");
    assert.deepEqual(pairs(h), [["211.100", "112.100", "100.00"]]);
    assert.equal(postings(h)[0].invoiceRecordId, "invoice");
    assert.equal(postings(h)[0].vendorRecordId, "vendor");
    assert.equal(postings(h)[0].poRecordId, "po");
    assert.deepEqual(postings(h)[0].branch, ["Chicago"]);
    assert.equal(h.calls[0].options.headers["x-ledger-secret"], "local-test-secret");
    assert.ok(h.logs.some(message => message.includes("PAYMENT SUMMARY")));

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Non-Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Non-Product"], [P.amount]: 50 }); h.bank();
    h.invoice("invoice", { [I.accounts]: [link("loc"), link("capital")], [I.lines]: [link("locLine"), link("capitalLine")] });
    h.add(T.accounts, "loc", { [A.number]: "231.200" }); h.add(T.accounts, "capital", { [A.number]: "311.200" });
    h.add(T.lines, "locLine", { [L.type]: select("Non-Discount"), [L.amount]: 60, [L.accounts]: [link("loc")] });
    h.add(T.lines, "capitalLine", { [L.type]: select("Non-Discount"), [L.amount]: 40, [L.accounts]: [link("capital")] });
    await assert.rejects(h.main("payment"), /does not define a payment split/);
    assert.equal(h.calls.length, 0, "No invoice-line allocation formula is invented outside the chart");

    h = await harness("sent");
    h.payment({ [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"] }); h.bank();
    h.invoice("invoice", { [I.accounts]: [link("distribution"), link("transferBank")], [I.lines]: [link("distributionLine"), link("transferLine")] });
    h.add(T.accounts, "distribution", { [A.number]: "316.100" }); h.add(T.accounts, "transferBank", { [A.number]: "0747" });
    h.add(T.lines, "distributionLine", { [L.type]: select("Non-Discount"), [L.amount]: 60, [L.accounts]: [link("distribution")] });
    h.add(T.lines, "transferLine", { [L.type]: select("Non-Discount"), [L.amount]: 40, [L.accounts]: [link("transferBank")] });
    await assert.rejects(h.main("payment"), /does not define a payment split/);
    assert.equal(h.calls.length, 0, "No invoice-line allocation formula is invented outside the chart");

    h = await harness("sent");
    h.payment({ [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"] }); h.bank();
    h.invoice("invoice", { [I.accounts]: [link("distribution"), link("transferBank")], [I.lines]: [link("ambiguousLine")] });
    h.add(T.accounts, "distribution", { [A.number]: "316.100" }); h.add(T.accounts, "transferBank", { [A.number]: "0747" });
    h.add(T.lines, "ambiguousLine", { [L.type]: select("Non-Discount"), [L.amount]: 100, [L.accounts]: [link("distribution"), link("transferBank")] });
    await assert.rejects(h.main("payment"), /does not define a payment split/);
    assert.equal(h.calls.length, 0, "One amount linked to two GL accounts cannot be posted twice");

    h = await harness("sent");
    h.payment({ [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"] }); h.bank();
    h.invoice("invoice", { [I.accounts]: [link("distribution"), link("federal")], [I.lines]: [link("distributionLine"), link("taxLine")] });
    h.add(T.accounts, "distribution", { [A.number]: "316.100" }); h.add(T.accounts, "federal", { [A.number]: "242.100" });
    h.add(T.lines, "distributionLine", { [L.type]: select("Non-Discount"), [L.amount]: 60, [L.accounts]: [link("distribution")] });
    h.add(T.lines, "taxLine", { [L.type]: select("Non-Discount"), [L.amount]: 40, [L.accounts]: [link("federal")] });
    await assert.rejects(h.main("payment"), /does not define a payment split/);
    assert.equal(h.calls.length, 0, "No invoice-line allocation formula is invented outside the chart");

    h = await harness("sent");
    h.payment({ [P.vendorType]: select("AP - Staff"), [P.vendorTypesAP]: ["AP - Staff"], [P.amount]: 50 }); h.bank();
    h.invoice("invoice", { [I.accounts]: [link("salary")], fld2YNpvvqweloE6S: select("Fully Unpaid"), [I.lines]: [link("feeLine")] });
    h.add(T.accounts, "salary", { [A.number]: "005.101" }); h.add(T.accounts, "fee", { [A.number]: "007.002" });
    h.add(T.lines, "feeLine", { [L.type]: select("Non-Discount"), [L.amount]: 10, [L.accounts]: [link("fee")] });
    await assert.rejects(h.main("payment"), /row 16 is blocked/);
    assert.equal(h.calls.length, 0, "Staff split cannot be invented from invoice lines");
    assert.ok(h.reads.filter(read => read.table === T.invoices).every(read => !read.fields.includes("fld2YNpvvqweloE6S")), "Staff routing no longer reads the removed manual-status filter");

    h = await harness("sent");
    h.payment({ [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"] }); h.bank();
    h.invoice("invoice", { [I.accounts]: [link("loan")] }); h.add(T.accounts, "loan", { [A.number]: "232.100" });
    assert.deepEqual(rows(await h.main("payment")), [17]);
    assert.deepEqual(pairs(h), [["232.100", "112.100", "100.00"]], "One principal account receives its invoice payment share");

    for (const [principalNumber, expectedRow] of [["232.100", 17], ["231.200", 19]]) {
        h = await harness("sent");
        h.payment({ [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"], [P.amount]: 379.68, [P.invoices]: [link("principal"), link("interest")] }); h.bank();
        h.invoice("principal", { [I.amountToPay]: 716.92, [I.accounts]: [link("principalAccount")] });
        h.invoice("interest", { [I.amountToPay]: 42.44, [I.accounts]: [link("interestAccount")] });
        h.add(T.accounts, "principalAccount", { [A.number]: principalNumber }); h.add(T.accounts, "interestAccount", { [A.number]: "007.003" });
        assert.deepEqual(rows(await h.main("payment")), [expectedRow], "Shared interest does not trigger both debt categories");
        assert.deepEqual(pairs(h), [[principalNumber, "112.100", "358.46"], ["007.003", "112.100", "21.22"]], "A partial payment uses separate invoice weights and preserves the payment total");
        assert.equal(h.reads.filter(read => read.table === T.lines).length, 0, "No invoice-line split is inferred");

        h = await harness("sent");
        h.payment({ [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"], [P.amount]: 0 }); h.bank();
        h.invoice("invoice", { [I.accounts]: [link("principalAccount"), link("interestAccount")] });
        h.add(T.accounts, "principalAccount", { [A.number]: principalNumber }); h.add(T.accounts, "interestAccount", { [A.number]: "007.003" });
        await assert.rejects(h.main("payment"), /must link exactly one chart of account/);
        assert.equal(h.calls.length, 0, "Multiple invoice accounts fail even for a zero payment");
    }

    h = await harness("sent");
    h.payment({ [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"], [P.invoices]: [link("loan"), link("loc"), link("interest")] }); h.bank();
    for (const [id, number] of [["loan", "232.100"], ["loc", "231.200"], ["interest", "007.003"]]) {
        h.invoice(id, { [I.accounts]: [link(id + "Account")] }); h.add(T.accounts, id + "Account", { [A.number]: number });
    }
    await assert.rejects(h.main("payment"), /explicit interest allocation/);
    assert.equal(h.calls.length, 0, "Ambiguous interest is never posted twice");

    h = await harness("sent");
    h.payment({ [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"] }); h.bank();
    h.invoice("invoice", { [I.accounts]: [link("interestAccount")] }); h.add(T.accounts, "interestAccount", { [A.number]: "007.003" });
    assert.deepEqual(await h.main("payment"), [], "An interest-only account cannot establish loan versus LOC ownership");
    assert.equal(h.calls.length, 0);

    h = await harness("sent");
    h.payment({ [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"], [P.amount]: 10 }); h.bank();
    h.invoice("invoice", { [I.accounts]: [link("federal"), link("state")], [I.lines]: [link("federalLine"), link("stateLine")] });
    h.add(T.accounts, "federal", { [A.number]: "242.100" }); h.add(T.accounts, "state", { [A.number]: "242.200" });
    h.add(T.lines, "federalLine", { [L.type]: select("Non-Discount"), [L.amount]: 60, [L.accounts]: [link("federal")] });
    h.add(T.lines, "stateLine", { [L.type]: select("Non-Discount"), [L.amount]: 40, [L.accounts]: [link("state")] });
    await assert.rejects(h.main("payment"), /does not define a payment split/);
    assert.equal(h.calls.length, 0, "No invoice-line allocation formula is invented outside the chart");

    for (const amount of [0, 100]) {
        h = await harness("sent");
        h.payment({ [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"], [P.amount]: amount, [P.invoices]: [link("federalBill"), link("stateBill")] }); h.bank();
        h.invoice("federalBill", { [I.amountToPay]: 60, [I.accounts]: [link("federal")] }); h.invoice("stateBill", { [I.amountToPay]: 40, [I.accounts]: [link("state")] });
        h.add(T.accounts, "federal", { [A.number]: "242.100" }); h.add(T.accounts, "state", { [A.number]: "242.200" });
        assert.deepEqual(rows(await h.main("payment")), [23]);
        assert.deepEqual(pairs(h), amount ? [["242.100", "112.100", "60.00"], ["242.200", "112.100", "40.00"]] : [], "Separate tax invoices use their own account shares; zero stays a no-op");
    }

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Non-Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Non-Product"], [P.amount]: 50 }); h.bank();
    h.invoice("invoice", { [I.amountToPay]: 150, [I.accounts]: [link("insurance")], [I.lines]: [link("receiptLine"), link("recoveryLine")] });
    h.add(T.accounts, "insurance", { [A.number]: "122.100" }); h.add(T.accounts, "recovery", { [A.number]: "004.004" });
    h.add(T.lines, "receiptLine", { [L.type]: select("Non-Discount"), [L.amount]: 100, [L.accounts]: [link("bank")] });
    h.add(T.lines, "recoveryLine", { [L.type]: select("Non-Discount"), [L.amount]: 50, [L.accounts]: [link("recovery")] });
    await assert.rejects(h.main("payment"), /row 24 is blocked/);
    assert.equal(h.calls.length, 0, "Insurance cannot invent a recovery formula");

    h = await harness("sent"); h.payment({ [P.sent]: false });
    assert.deepEqual(await h.main("payment"), []);
    assert.equal(h.calls.length, 0);
    assert.equal(h.reads.length, 1, "Unchecked Sent does not read invoice data");

    for (const amount of [0, 100, -100]) {
        h = await harness("sent");
        h.payment({ [P.returned]: true, [P.amount]: amount, [P.date]: "2026-10-01", [P.invoices]: [], [P.accounts]: [] }); h.bank();
        matches = await h.main("payment");
        assert.deepEqual(rows(matches), [13], "A return with no other matching invoices posts its return category");
        assert.equal(h.calls.length, 1);
        assert.equal(h.calls[0].body.eventType, "sent");
        assert.equal(h.calls[0].body.entryDate, "2026-10-01", "AP returns use Payment Date");
        assert.equal(h.calls[0].body.paymentAmount, amount.toFixed(2));
        assert.deepEqual(pairs(h), amount ? [["112.100", "211.100", "100.00"]] : [], "AP returns post the current amount to the chart's Fifth Third account without looking up an original journal");
        assert.deepEqual(h.reads.map(read => read.table), [T.payments], "An unlinked AP return needs no invoice/account records");
    }

    for (const amount of [null, undefined]) {
        h = await harness("sent"); h.payment({ [P.returned]: true, [P.amount]: amount });
        await assert.rejects(h.main("payment"), /Payment Amount.*missing/);
        assert.equal(h.calls.length, 0, "A returned entry cannot invent a missing current amount");
    }

    h = await harness("sent"); h.payment({ [P.returned]: true, [P.invoices]: [], [P.accounts]: [link("a"), link("b")] });
    h.bank("a"); h.bank("b");
    await assert.rejects(h.main("payment"), /one payment account/);
    assert.equal(h.calls.length, 0);

    h = await harness("sent"); h.payment({ [P.sent]: false, [P.returned]: true });
    assert.deepEqual(await h.main("payment"), [], "AP returns still require Sent checked");
    assert.equal(h.calls.length, 0);
    assert.deepEqual(h.reads.map(read => read.table), [T.payments]);

    h = await harness("sent"); h.payment({ [P.returned]: true, [P.date]: null, [P.invoices]: [], [P.accounts]: [] });
    await assert.rejects(h.main("payment"), /Payment Date is required/);
    assert.equal(h.calls.length, 0, "An AP return needs Payment Date before posting");
    assert.deepEqual(h.reads.map(read => read.table), [T.payments]);

    h = await harness("sent"); h.payment({ [P.returned]: false }); h.invoice(); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [8]);
    assert.equal(h.calls[0].body.eventType, "sent", "An ordinary AP payment keeps the Sent route");

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Refund/Credit"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Refund/Credit"], [P.returned]: true, [P.amount]: -25 });
    h.invoice("invoice", { [I.amountToPay]: -25, [I.application]: select("Cash Refund") }); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [6]);
    assert.equal(h.calls[0].body.eventType, "sent", "The AP return checkbox never overrides AR routing");
    assert.deepEqual(pairs(h), [["221.100", "112.100", "25.00"]]);

    h = await harness("sent"); h.payment({ [P.vendorType]: null, [P.invoices]: [] }); h.bank();
    assert.deepEqual(await h.main("payment"), []);
    assert.equal(h.calls.length, 0, "An unmatched record makes no financial request");

    h = await harness("sent"); h.payment({ [P.vendorTypesAP]: ["AP - Product", "AP - Credit"] });
    await assert.rejects(h.main("payment"), /multiple Vendor Types/);
    assert.equal(h.calls.length, 0);

    h = await harness("sent"); h.payment({ [P.amount]: null }); h.invoice(); h.bank();
    await assert.rejects(h.main("payment"), /Amount|amount/);
    assert.equal(h.calls.length, 0);

    h = await harness("sent"); h.payment({ [P.amount]: 0 }); h.invoice(); h.bank();
    matches = await h.main("payment");
    assert.deepEqual(rows(matches), [8]);
    assert.ok(h.calls.length === 0 || postings(h).every(component => component.amount === "0.00"), "A zero value is never inflated into a journal amount");

    h = await harness("sent"); h.payment({ [P.amount]: 25 }); h.invoice("invoice", { [I.amountToPay]: 0 }); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [8]);
    assert.equal(postings(h)[0].amount, "25.00", "One zero-value invoice needs no proportional denominator");

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Refund/Credit"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Refund/Credit"], [P.amount]: 50, [P.overpaid]: null });
    h.invoice("invoice", { [I.amountToPay]: 0, [I.application]: select("Credit to Another Order") }); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [4]);
    assert.equal(postings(h)[0].amount, "50.00", "The new credit payment Amount is the excess, even when Overpaid Amount is blank");

    h = await harness("sent"); h.payment({ [P.amount]: 25, [P.invoices]: [link("zeroA"), link("zeroB")] }); h.bank();
    h.invoice("zeroA", { [I.amountToPay]: 0 }); h.invoice("zeroB", { [I.amountToPay]: 0 });
    await assert.rejects(h.main("payment"), /zero invoice amounts/);
    assert.equal(h.calls.length, 0, "Several zero weights cannot invent a proportional split");

    h = await harness("sent");
    h.payment({ [P.amount]: 10, [P.invoices]: [link("c"), link("b"), link("a")] }); h.bank();
    for (const id of ["a", "b", "c"]) h.invoice(id, { [I.amountToPay]: 1 });
    await h.main("payment");
    const allocated = postings(h);
    assert.equal(allocated.reduce((sum, part) => sum + Math.round(Number(part.amount) * 100), 0), 1000);
    assert.deepEqual(Object.fromEntries(allocated.map(part => [part.invoiceRecordId, part.amount])), { a: "3.34", b: "3.33", c: "3.33" }, "Remainder ties use stable invoice IDs");

    h = await harness("sent");
    h.payment({ [P.invoices]: [link("debit"), link("credit")] }); h.bank();
    h.invoice("debit", { [I.amountToPay]: 120 }); h.invoice("credit", { [I.amountToPay]: -20 });
    await assert.rejects(h.main("payment"), /mixed|sign/i);
    assert.equal(h.calls.length, 0);

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Refund/Credit"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Refund/Credit"], [P.amount]: -25 });
    h.invoice("invoice", { [I.amountToPay]: -25, [I.application]: select("Cash Refund"), [I.clients]: [link("client")] }); h.bank();
    matches = await h.main("payment");
    assert.deepEqual(rows(matches), [6]);
    assert.equal(h.calls[0].body.paymentAmount, "-25.00");
    assert.equal(postings(h)[0].amount, "25.00");
    assert.deepEqual(pairs(h), [["221.100", "112.100", "25.00"]]);
    assert.equal(postings(h)[0].clientRecordId, "client");

    // One payment may be a deposit for one invoice and a shipped receipt for another.
    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Product"], [P.amount]: 100, [P.invoices]: [link("deposit"), link("shipped")] }); h.bank();
    h.invoice("deposit", { [I.amountToPay]: 60, [I.firstShipDate]: ["10/30/2026"], [I.transactions]: [link("transaction")] });
    h.invoice("shipped", { [I.amountToPay]: 40, [I.firstShipDate]: ["10/28/2026"], [I.transactions]: [link("transaction")] });
    matches = await h.main("payment");
    assert.deepEqual(rows(matches), [2, 3]);
    assert.equal(h.calls.length, 1);
    assert.deepEqual(h.calls[0].body.categories.map(category => category.postings.reduce((sum, part) => sum + Number(part.amount), 0)), [60, 40]);
    assert.deepEqual(pairs(h), [["112.100", "221.100", "60.00"], ["112.100", "121.100", "40.00"]]);
    assert.equal(h.reads.filter(read => read.table === "tblKAChQnBIblK2gS").length, 0, "Shipment classification does not query Transactions");
    assert.deepEqual(postings(h).map(posting => posting.transactionRecordIds), [["transaction"], ["transaction"]], "Invoice-linked transaction IDs remain posting metadata");

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Product"], [P.date]: "2026-10-29" }); h.bank();
    h.invoice("invoice", { [I.firstShipDate]: ["10/29/2026"], [I.transactions]: [link("transaction")] });
    assert.deepEqual(rows(await h.main("payment")), [2], "A payment on the first shipment date is a deposit");
    assert.deepEqual(pairs(h), [["112.100", "221.100", "100.00"]]);

    for (const [clearToPurchase, shipment, expectedRow] of [["NO", "10/30/2026", 2], [null, "10/28/2026", 3]]) {
        h = await harness("sent");
        h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Product"], [P.date]: "2026-10-29" }); h.bank();
        h.invoice("invoice", { [I.firstShipDate]: shipment, [I.transactions]: [link("transaction")] });
        h.add("tblKAChQnBIblK2gS", "transaction", { fldjOZT9rf3LKcNg8: clearToPurchase });
        assert.deepEqual(rows(await h.main("payment")), [expectedRow], "Clear to Purchase NO or blank does not block date-based shipment classification");
        assert.equal(h.reads.filter(read => read.table === "tblKAChQnBIblK2gS").length, 0);
        assert.equal(postings(h)[0].transactionRecordId, "transaction");
        assert.ok(h.logs.every(log => !log.includes("Clear to Purchase")), "Shipment reports omit the removed transaction filter");
    }

    h = await harness("sent");
    h.payment({ [P.method]: select("CC - Visa"), [P.invoices]: Array.from({ length: 101 }, (_, i) => link(`i${String(i).padStart(3, "0")}`)) }); h.bank();
    for (let i = 0; i < 101; i++) h.invoice(`i${String(i).padStart(3, "0")}`, { [I.amountToPay]: 1 });
    assert.deepEqual(rows(await h.main("payment")), [9]);
    assert.equal(h.reads.filter(read => read.table === T.invoices).length, 2);
    assert.equal(postings(h).reduce((sum, part) => sum + Math.round(Number(part.amount) * 100), 0), 10000);

    h = await harness("sent"); h.payment(); h.bank();
    h.invoice("invoice", { [I.purchaseOrders]: [link("po1"), link("po2")], [I.transactions]: [link("t1"), link("t2")] });
    await h.main("payment");
    assert.equal(postings(h)[0].poRecordId, undefined);
    assert.deepEqual(postings(h)[0].poRecordIds, ["po1", "po2"]);
    assert.deepEqual(postings(h)[0].transactionRecordIds, ["t1", "t2"]);
    assert.equal("notes" in postings(h)[0], false);

    // Every account-routed category keeps its original classification and computes its own component.
    for (const [vendorType, accountNumber, expectedRow] of [
        ["AP - Staff", "005.101", 16],
        ["AP - Expenses (Non-Sales Tax)", "232.100", 17],
        ["AR - Non-Product", "231.200", 18],
        ["AP - Expenses (Non-Sales Tax)", "231.200", 19],
        ["AP - Expenses (Non-Sales Tax)", "316.100", 21],
        ["AR - Non-Product", "311.200", 22],
        ["AP - Expenses (Non-Sales Tax)", "242.100", 23],
        ["AR - Non-Product", "122.100", 24],
        ["AP - Expenses (Non-Sales Tax)", "143.200", 25],
    ]) {
        h = await harness("sent");
        const isAR = vendorType.startsWith("AR");
        h.payment({ [P.type]: select(isAR ? "AR" : "AP"), [P.vendorType]: select(vendorType), [P.vendorTypesAP]: isAR ? [] : [vendorType], [P.vendorTypesAR]: isAR ? [vendorType] : [] });
        h.invoice("invoice", { [I.accounts]: [link("purpose")] }); h.bank();
        h.add(T.accounts, "purpose", { [A.number]: accountNumber });
        if ([17, 19].includes(expectedRow)) {
            h.payment({ [P.vendorType]: select(vendorType), [P.vendorTypesAP]: [vendorType], [P.invoices]: [link("invoice"), link("interest")] });
            h.invoice("invoice", { [I.amountToPay]: 90, [I.accounts]: [link("purpose")] });
            h.invoice("interest", { [I.amountToPay]: 10, [I.accounts]: [link("interestAccount")] });
            h.add(T.accounts, "interestAccount", { [A.number]: "007.003" });
        }
        if (expectedRow === 24) {
            h.invoice("invoice", { [I.accounts]: [link("purpose")], [I.lines]: [link("insuranceBank"), link("insuranceRecovery")] });
            h.add(T.accounts, "recoveryAccount", { [A.number]: "004.004" });
            h.add(T.lines, "insuranceBank", { [L.type]: select("Non-Discount"), [L.amount]: 100, [L.accounts]: [link("bank")] });
            h.add(T.lines, "insuranceRecovery", { [L.type]: select("Non-Discount"), [L.amount]: 0, [L.accounts]: [link("recoveryAccount")] });
        }
        if ([16, 24].includes(expectedRow)) {
            await assert.rejects(h.main("payment"), new RegExp(`row ${expectedRow} is blocked`));
            assert.equal(h.calls.length, 0); coveredRows.add(expectedRow); continue;
        }
        matches = await h.main("payment");
        assert.deepEqual(rows(matches), [expectedRow]);
        assert.equal(h.calls.length, 1);
        assert.ok(postings(h).length > 0);
        if ([17, 19].includes(expectedRow)) assert.deepEqual(pairs(h), [[accountNumber, "112.100", "90.00"], ["007.003", "112.100", "10.00"]]);
        const expectedSingle = {
            16: ["241.100", "112.100", "100.00"],
            18: ["112.100", "231.200", "100.00"],
            21: ["316.100", "112.100", "100.00"],
            22: ["112.100", "311.200", "100.00"],
            23: ["242.100", "112.100", "100.00"],
            24: ["112.100", "122.100", "100.00"],
            25: ["143.200", "112.100", "100.00"],
        }[expectedRow];
        if (expectedSingle) assert.deepEqual(pairs(h).filter(part => Number(part[2]) !== 0), [expectedSingle]);
    }

    // Supabase receives the selected refund category without a new invoice-application gate.
    h = await harness("sent");
    h.payment({ [P.vendorType]: select("AP - Credit"), [P.vendorTypesAP]: ["AP - Credit"], [P.amount]: -100 });
    h.invoice("invoice", { [I.amountToPay]: -100, [I.application]: select("Credit to Another Order") }); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [14]);
    assert.equal(h.calls[0].body.categories[0].ruleCode, "PAY-13");
    assert.deepEqual(pairs(h), [["112.100", "211.100", "100.00"]]);

    h = await harness("sent");
    h.payment({ [P.method]: select("CC - Visa") }); h.invoice(); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [9]);
    assert.equal(h.calls[0].body.categories[0].ruleCode, "PAY-08");
    assert.deepEqual(pairs(h), [["211.100", "231.100", "100.00"]]);

    h = await harness("sent");
    h.payment({ [P.recordType]: select("CC Batch Payment"), [P.miniPayments]: [link("mini")], [P.invoices]: [] }); h.bank();
    h.add(T.payments, "mini", { [P.amount]: 100, [P.method]: select("CC - Amex"), [P.invoices]: [] });
    assert.deepEqual(rows(await h.main("payment")), [10]);
    assert.equal(postings(h)[0].amount, "100.00");
    assert.equal(postings(h)[0].creditAccount.number, "112.100");
    assert.deepEqual(pairs(h), [["231.100", "112.100", "100.00"]]);

    h = await harness("sent");
    h.payment({ [P.recordType]: select("CC Batch Payment"), [P.miniPayments]: [link("mini1"), link("mini2")], [P.invoices]: [] }); h.bank();
    h.add(T.payments, "mini1", { [P.amount]: 60, [P.method]: select("CC - Visa"), [P.invoices]: [link("bill1")] });
    h.add(T.payments, "mini2", { [P.amount]: 40, [P.method]: select("CC - Visa"), [P.invoices]: [link("bill2")] });
    h.invoice("bill1"); h.invoice("bill2"); await h.main("payment");
    assert.deepEqual(postings(h)[0].miniPaymentRecordIds, ["mini1", "mini2"]);
    assert.deepEqual(postings(h)[0].invoiceRecordIds, ["bill1", "bill2"], "Batch audit links remain structured references");

    h = await harness("sent");
    h.payment({ [P.type]: select("AP"), [P.vendorType]: select("AP - Expenses (Non-Sales Tax)"), [P.vendorTypesAP]: ["AP - Expenses (Non-Sales Tax)"] });
    h.invoice("invoice", { [I.accounts]: [link("sourceBank")] }); h.bank();
    h.add(T.accounts, "sourceBank", { [A.number]: "0747" });
    assert.deepEqual(rows(await h.main("payment")), [20]);
    assert.deepEqual(pairs(h), [["112.100", "0747", "100.00"]], "Transfers follow the chart Notes: payment bank debit, invoice bank credit");

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Product"], [P.overpaid]: 0.5 }); h.invoice(); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [2, 5]);
    const roundingPosting = h.calls[0].body.categories.find(category => category.ruleCode === "PAY-04").postings[0];
    assert.equal(roundingPosting.debitAccount.number, "007.002");
    assert.equal(roundingPosting.creditAccount.number, "121.100");
    assert.equal(roundingPosting.amount, "0.50");

    for (const [overpaid, expected] of [[-0.01, null], [0, null], [0.004, null], [0.005, "0.01"], [0.01, "0.01"], [1, "1.00"], [4.99, "4.99"], [4.999, "5.00"], [5, null], [5.01, null]]) {
        h = await harness("sent");
        h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Product"], [P.amount]: 100 + overpaid, [P.overpaid]: overpaid });
        h.invoice(); h.bank();
        assert.deepEqual(rows(await h.main("payment")), overpaid > 0 && overpaid < 5 ? [2, 5] : [2], "Eligibility uses the raw field; only posted money is rounded to cents");
        if (expected) assert.equal(h.calls[0].body.categories.find(category => category.ruleCode === "PAY-04").postings[0].amount, expected, "Only the excess is posted as rounding");
    }

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Product"], [P.amount]: 100.66, [P.overpaid]: 0.66 });
    h.invoice("invoice", { [I.transactions]: [link("transaction")] }); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [2, 5]);
    assert.deepEqual(pairs(h), [["112.100", "221.100", "100.66"], ["007.002", "121.100", "0.66"]], "The deposit posts the full payment; rounding posts only the excess without another bank movement");

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Product"], [P.amount]: 100.66, [P.overpaid]: 0.66 });
    h.invoice("invoice", { [I.transactions]: [link("transaction")], [I.firstShipDate]: "1/1/2026" }); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [3, 5]);
    assert.deepEqual(pairs(h), [["112.100", "121.100", "100.66"], ["007.002", "121.100", "0.66"]], "Row 5 follows the written fee debit and AR credit, alongside the receipt");
    const receivableCreditCents = postings(h).reduce((sum, part) => sum + (part.creditAccount.number === "121.100" ? h.moneyCents(Number(part.amount), "test") : 0) - (part.debitAccount.number === "121.100" ? h.moneyCents(Number(part.amount), "test") : 0), 0);
    assert.equal(receivableCreditCents, 10132, "Literal chart accounts credit AR for both the receipt and row 5; no alternate overpayment treatment is invented");

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Refund/Credit"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Refund/Credit"], [P.amount]: -20, [P.overpaid]: 99 });
    h.invoice("invoice", { [I.amountToPay]: -20, [I.application]: select("Credit to Another Order") }); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [4]);
    assert.equal(postings(h)[0].amount, "20.00");
    assert.deepEqual(pairs(h), [["112.100", "221.300", "20.00"]]);

    h = await harness("sent");
    h.payment({ [P.type]: select("AR"), [P.vendorType]: select("AR - Non-Product"), [P.vendorTypesAP]: [], [P.vendorTypesAR]: ["AR - Non-Product"] });
    h.invoice("invoice", { [I.amountToPay]: 200, fldde9LpRBshHfqCE: "Fully Paid", fldyTbRUtFof1IByi: 20, [I.lines]: [link("rebateOwnedByInvoiceAutomation")] }); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [28], "The consolidated Sent script handles full invoice rebates");
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].body.source.tableId, T.invoices);
    assert.equal(h.calls[0].body.categories[0].postings[0].amount, "20.00");
    assert.equal(h.reads.filter(read => read.table === T.lines).length, 0, "The payment script does not pull invoice-owned rebate components");

    h = await harness("sent", {}, { ok: false, status: 500, body: { error: "Local failure" } });
    h.payment(); h.invoice(); h.bank();
    await assert.rejects(h.main("payment"), /500|Local failure|webhook/i);
    assert.equal(h.calls.length, 1, "An uncertain write is not blindly retried by the sender");

    h = await harness("events", { eventType: "cancelled" });
    let E = h.PAYMENT_FIELDS;
    h.payment({ [E.cancelled]: true, ["fldRvZLik2A6g0KVd"]: true, [E.cancelledDate]: "2026-10-30T01:30:00.000Z", [E.amount]: -75 }); h.bank();
    matches = await h.main("payment", "cancelled");
    assert.deepEqual(rows(matches), [13]);
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].body.eventType, "cancelled");
    assert.deepEqual(h.reads.map(read => read.table), [h.TABLES.payments], "AP cancellation uses the fixed chart account without invoice/account or original-journal reads");
    assert.equal(h.calls[0].body.entryDate, "2026-10-29", "Cancellation timestamps use the Chicago calendar day");
    assert.equal(h.calls[0].body.paymentAmount, "-75.00");
    assert.equal(h.calls[0].body.categories[0].ruleCode, "PAY-12");
    assert.deepEqual(pairs(h), [["112.100", "211.100", "75.00"]], "AP cancellation is a new current-amount entry");

    h = await harness("events", { eventType: "cancelled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.cancelled]: true, [E.cancelledDate]: "2026-10-29", [E.amount]: null });
    await assert.rejects(h.main("payment", "cancelled"), /Payment Amount.*missing/);
    assert.equal(h.calls.length, 0);

    h = await harness("events", { eventType: "cancelled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.cancelled]: true, [E.cancelledDate]: "2026-10-29", [E.amount]: 0, [E.accounts]: [] });
    assert.deepEqual(rows(await h.main("payment", "cancelled")), [13]);
    assert.deepEqual(h.calls[0].body.categories[0].postings, [], "An explicit zero cancellation is a no-op");
    assert.deepEqual(h.reads.map(read => read.table), [h.TABLES.payments]);

    h = await harness("events", { eventType: "reconciled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.reconciled]: false, [E.discrepancy]: 2 });
    assert.deepEqual(await h.main("payment", "reconciled"), []);
    assert.equal(h.calls.length, 0);

    for (const [paymentDate, shipment, account] of [[null, "10/28/2026", "221.100"], ["2026-10-29", null, "221.100"], ["2026-10-29", "10/30/2026", "221.100"], ["2026-10-29", "10/29/2026", "221.100"], ["2026-10-29", "10/28/2026", "121.100"]]) {
        h = await harness("events", { eventType: "cancelled" }); E = h.PAYMENT_FIELDS;
        h.payment({ [E.cancelled]: true, [E.cancelledDate]: "2026-10-29T23:30:00.000Z", [E.type]: select("AR"), [E.vendorType]: select("AR - Product"), [E.vendorTypesAP]: [], [E.vendorTypesAR]: ["AR - Product"], [E.date]: paymentDate, fld03L3JpNZBLauEC: false });
        h.invoice("invoice", { [I.firstShipDate]: shipment }); h.bank();
        assert.deepEqual(rows(await h.main("payment", "cancelled")), [7], "AR cancellation does not require Sent");
        assert.equal(h.calls[0].body.categories[0].ruleCode, "PAY-06");
        assert.deepEqual(pairs(h), [[account, "112.100", "100.00"]]);
    }

    h = await harness("events", { eventType: "cancelled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.cancelled]: true, [E.cancelledDate]: "2026-10-29", [E.type]: select("AR"), [E.vendorType]: select("AR - Product"), [E.vendorTypesAP]: [], [E.vendorTypesAR]: ["AR - Product"], [E.invoices]: [link("a"), link("b"), link("c")], [E.amount]: 10, [E.date]: "2026-10-29" }); h.bank();
    h.invoice("a", { [I.amountToPay]: 1, [I.firstShipDate]: "10/30/2026" });
    h.invoice("b", { [I.amountToPay]: 1, [I.firstShipDate]: "10/28/2026" });
    h.invoice("c", { [I.amountToPay]: 1, [I.firstShipDate]: "10/29/2026" });
    await h.main("payment", "cancelled");
    assert.deepEqual(pairs(h), [["221.100", "112.100", "3.34"], ["121.100", "112.100", "3.33"], ["221.100", "112.100", "3.33"]], "Each cancelled invoice share uses its own shipment state while preserving every cent");

    h = await harness("events", { eventType: "cancelled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.cancelled]: true, [E.cancelledDate]: "2026-10-29", [E.type]: select("AR"), [E.vendorType]: select("AR - Product"), [E.vendorTypesAP]: [], [E.vendorTypesAR]: ["AR - Product"] }); h.bank();
    h.invoice("invoice", { [I.clients]: [link("client1"), link("client2")] }); await h.main("payment", "cancelled");
    assert.deepEqual(postings(h)[0].clientRecordIds, ["client1", "client2"]);
    assert.equal(postings(h)[0].clientRecordId, undefined, "Multiple client references are not collapsed into one client");

    h = await harness("events", { eventType: "cancelled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.cancelled]: true, [E.cancelledDate]: "2026-10-29", [E.type]: select("AR"), [E.vendorType]: select("AR - Product"), [E.vendorTypesAP]: [], [E.vendorTypesAR]: ["AR - Product"], [E.invoices]: [] });
    await assert.rejects(h.main("payment", "cancelled"), /needs linked invoices/);
    assert.equal(h.calls.length, 0);

    h = await harness("events", { eventType: "reconciled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.reconciled]: true, [E.discrepancy]: -2, [E.amount]: null, [E.reconciledDate]: "2026-10-29" });
    h.bank();
    assert.deepEqual(rows(await h.main("payment", "reconciled")), [27]);
    assert.deepEqual(pairs(h), [["007.002", "112.100", "2.00"]]);
    assert.ok(h.reads.every(read => !read.fields.includes("fldT1UF3K2uO9mFjB")), "Reconciliation uses the discrepancy field instead of recalculating from Reconciled Amount");

    h = await harness("events", { eventType: "reconciled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.type]: select("AR"), [E.vendorType]: select("AR - Product"), [E.vendorTypesAP]: [], [E.vendorTypesAR]: ["AR - Product"], [E.reconciled]: true, [E.discrepancy]: -2, [E.reconciledDate]: "2026-10-29" }); h.bank();
    await h.main("payment", "reconciled");
    assert.deepEqual(pairs(h), [["007.002", "112.100", "2.00"]], "The chart pair is unchanged by AR/AP");

    h = await harness("events", { eventType: "reconciled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.reconciled]: true, [E.discrepancy]: -6, [E.reconciledDate]: "2026-10-29" }); h.bank();
    await h.main("payment", "reconciled");
    assert.deepEqual(pairs(h), [["007.002", "112.100", "6.00"]], "Actual Triggers does not specify a suspense threshold");

    h = await harness("events", { eventType: "reconciled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.vendorType]: select("AP - Credit"), [E.vendorTypesAP]: ["AP - Credit"], [E.amount]: -100, [E.reconciled]: true, [E.discrepancy]: 2, [E.reconciledDate]: "2026-10-29" }); h.bank();
    await h.main("payment", "reconciled");
    assert.deepEqual(pairs(h), [["007.002", "112.100", "2.00"]], "Refund type does not change the written reconciliation pair");

    h = await harness("events", { eventType: "returned" });
    await assert.rejects(h.main("payment", "returned"), /cancelled or reconciled/);
    assert.equal(h.calls.length, 0, "The deleted automation cannot introduce a third event path");

    // Execute the real bottom-of-script entry point, not just the exported main function.
    h = await harness("sent");
    h.payment(); h.invoice(); h.bank();
    await h.runNative();
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].body.categories[0].ruleCode, "PAY-07");

    h = await harness("sent");
    h.payment({ [P.returned]: true, [P.amount]: -75, [P.date]: "2025-01-03", [P.invoices]: [], [P.accounts]: [] }); h.bank();
    await h.runNative();
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].body.eventType, "sent");
    assert.equal(h.calls[0].body.entryDate, "2025-01-03");
    assert.equal(h.calls[0].body.paymentAmount, "-75.00");
    assert.deepEqual(h.calls[0].body.categories.map(category => category.ruleCode), ["PAY-12"]);
    assert.deepEqual(pairs(h), [["112.100", "211.100", "75.00"]]);
    assert.deepEqual(h.reads.map(read => read.table), [T.payments], "The native unlinked return posts its chart pair under Sent");

    h = await harness("events", { eventType: "cancelled" }); E = h.PAYMENT_FIELDS;
    h.payment({ [E.cancelled]: true, ["fldRvZLik2A6g0KVd"]: true, [E.cancelledDate]: "2026-10-30T01:30:00.000Z", [E.amount]: 75 }); h.bank();
    await h.runNative();
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].body.eventType, "cancelled");
    assert.equal(h.calls[0].body.entryDate, "2026-10-29");
    assert.equal(h.calls[0].body.categories[0].ruleCode, "PAY-12");
    assert.deepEqual(pairs(h), [["112.100", "211.100", "75.00"]]);

    h = await harness("sent"); h.payment({ [P.returned]: true }); h.invoice(); h.bank();
    assert.deepEqual(rows(await h.main("payment")), [13], "Returned vendor payments cannot also post the outgoing bank-payment category");
    assert.deepEqual(h.calls[0].body.categories.map(c => c.ruleCode), ["PAY-12"]);
    assert.deepEqual(pairs(h), [["112.100", "211.100", "100.00"]], "A return restores bank and AP without an offsetting outgoing entry");
    h = await harness("sent"); h.payment({ [P.vendorType]: select("AP - Credit"), [P.vendorTypesAP]: ["AP - Credit"], [P.amount]: -100 });
    h.invoice("invoice", { [I.amountToPay]: -100 }); h.bank("bank", "0747"); await h.main("payment");
    assert.deepEqual(pairs(h), [["112.100", "211.100", "100.00"]], "Row 14 debits the chart's Fifth Third account even when its filter allows Nickel");

    for (const [vendorType, account, sheetRow] of [["AP - Staff", "005.101", 16], ["AR - Non-Product", "122.100", 24]]) {
        h = await harness("sent"); const ar = vendorType.startsWith("AR");
        h.payment({ [P.amount]: 0, [P.type]: select(ar ? "AR" : "AP"), [P.vendorType]: select(vendorType), [P.vendorTypesAP]: ar ? [] : [vendorType], [P.vendorTypesAR]: ar ? [vendorType] : [] });
        h.invoice("invoice", { [I.accounts]: [link("purpose")] }); h.bank(); h.add(T.accounts, "purpose", { [A.number]: account });
        await assert.rejects(h.main("payment"), new RegExp(`Not yet implemented.*row ${sheetRow}`));
        assert.equal(h.calls.length, 0);
    }
    assert.deepEqual([...coveredRows].sort((a, b) => a - b), [2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28]);
    console.log("Passed: loan/LOC account conditions, separate-invoice allocations, explicit chart blockers, literal account pairs, raw thresholds, all-match Sent routing, native dates and webhook errors.");
}

module.exports = { harness, record, link, select };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
