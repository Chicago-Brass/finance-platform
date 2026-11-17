// FIN Expense Fully Paid - post card expenses and bank fees from the invoice status event.
// Inputs: invoiceRecordId, ledgerWebhookUrl. Secret: Dual Ledger Webhook Secret.
// See DOCS at bottom.

// ==================== CORE ====================

async function handleCardExpense(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const invoiceAccountIds = linkedIds(data.invoice, INVOICE_FIELDS.accounts);
    if (!invoiceAccountIds.length) return;
    const payments = await linkedPayments(data);
    const paymentAccountIds = [...new Set(payments.flatMap(payment => linkedIds(payment, PAYMENT_FIELDS.accounts)))];
    const paymentAccounts = await accountNumbers(data, paymentAccountIds);
    if (!paymentAccounts.includes("231.100")) return;
    if (invoiceAccountIds.length !== 1) throw new Error("Not yet implemented: Card expense uses the full Invoice Amount; multiple invoice accounts need separate amounts.");
    const [debit] = await accountNumbers(data, invoiceAccountIds);
    const cents = moneyCents(data.invoice.getCellValue(INVOICE_FIELDS.amount), "Invoice Amount");
    results.push({
        category: "Company credit-card purchase with NO vendor bill", tChartRow: 3, entryKey: debit,
        postings: expensePosting(data, debit, "231.100", cents),
    });
}

async function handleBankFees(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const accounts = await accountNumbers(data, linkedIds(data.invoice, INVOICE_FIELDS.accounts));
    if (!accounts.includes("007.002")) return;
    const payments = await linkedPayments(data);
    if (!payments.length) throw new Error("Bank-fee invoice needs a linked payment to identify the bank account.");
    const banks = [];
    for (const payment of payments) {
        const ids = linkedIds(payment, PAYMENT_FIELDS.accounts);
        if (ids.length !== 1) throw new Error(`Bank-fee payment ${payment.id} must identify exactly one bank account.`);
        const [number] = await accountNumbers(data, ids);
        if (number !== "112.100" && number !== "0747") throw new Error(`Bank-fee payment ${payment.id} must use Fifth Third (112.100) or Nickel (0747).`);
        banks.push(number);
    }
    if (new Set(banks).size !== 1) throw new Error("Bank-fee invoice links payments using different banks; the invoice amount cannot be split without a mapping.");
    const credit = banks[0];
    const cents = moneyCents(data.invoice.getCellValue(INVOICE_FIELDS.amount), "Invoice Amount");
    results.push({
        category: "Bank fees and charges shown only on the bank statement", tChartRow: 12, entryKey: "007.002",
        postings: expensePosting(data, "007.002", credit, cents),
    });
}

// ==================== UTILS ====================

const TABLES = { invoices: "tbldQXuqNEp8G5pfs", payments: "tblR61NG9i0giid28", accounts: "tblJ2RF8vlOhNMBKR" };
const INVOICE_FIELDS = {
    name: "fldMZyzqDidRujeZS",          // Invoice ID (primary display name)
    type: "fld9e6yDIv0PtBDV0",          // Invoice Type
    vendorType: "fldXwodwAuXLJt5rP",    // Vendor Type (AP)
    status: "fldde9LpRBshHfqCE",        // Payment Invoice Status
    amount: "fldm5nXoW7MrwjkhW",        // Invoice Amount
    date: "fldSungTQU5nIEIvi",          // Invoice Date
    accounts: "fldT5u0prSS8G1H4x",      // Linked Chart of Accounts
    payments: "fldeNFOgl9OBHPlNm",      // Linked Payments
    vendors: "fld77UN3hpnMagzkj",       // Linked Vendors (For both Expenses and Product Invoices)
    clients: "fld9aY5ze2BbaoWG5",       // Linked Client
    staff: "fldJXrFmx3Y6Szxa5",         // Linked Staff
    transactions: "fldxUmaAhUJjAGnrw",  // Linked Transaction
    purchaseOrders: "fldcIaoLYHgegP17m", // Related Purchase Order
    branch: "fldt5PjqGDrINUYT5",        // Branch
    states: "fld3kO1XElo5S3Hhy",        // States & Sales Tax Rates
};
const PAYMENT_FIELDS = { accounts: "fldCIQSOdytBGi91S" }; // Account to Pay/Receive
const ACCOUNT_FIELDS = { number: "fldTjgAITNrJVCCWq" }; // Account Number

async function main(invoiceRecordId) {
    const data = await loadExpenseData(invoiceRecordId);
    /** @type {any[]} */
    const results = [];
    if (data.invoice.getCellValueAsString(INVOICE_FIELDS.status) !== "Fully Paid") {
        printResults(data, results, "Payment Invoice Status is not Fully Paid.");
        return results;
    }
    await handleCardExpense(data, results);
    await handleBankFees(data, results);
    printResults(data, results);
    if (!results.length) return results;
    const entryDate = invoiceDate(data.invoice.getCellValue(INVOICE_FIELDS.date));
    if (!ledgerWebhookUrl) throw new Error("Map ledgerWebhookUrl to the deployed ledger-payment Edge Function URL.");
    const response = await postLedgerPayload({
        invoiceRecordId: data.invoice.id, eventType: "paid", entryDate,
        source: { tableId: TABLES.invoices, recordId: data.invoice.id, recordName: data.invoice.name },
        referenceNumber: data.invoice.id,
        categories: results.map(result => ({
            ruleCode: `EXP-${String(result.tChartRow - 1).padStart(2, "0")}`, entryKey: result.entryKey,
            transactionType: result.category, postings: result.postings,
        })),
    });
    printPostingResponse(response);
    return results;
}

async function loadExpenseData(invoiceRecordId) {
    if (!invoiceRecordId) throw new Error("Map invoiceRecordId to the trigger's FIN Airtable record ID.");
    const invoice = await base.getTable(TABLES.invoices).selectRecordAsync(invoiceRecordId, { fields: Object.values(INVOICE_FIELDS) });
    if (!invoice) throw new Error(`Invoice not found: ${invoiceRecordId}`);
    return { invoice, invoiceType: invoice.getCellValueAsString(INVOICE_FIELDS.type), vendorType: invoice.getCellValueAsString(INVOICE_FIELDS.vendorType), accounts: new Map(), payments: null };
}

function linkedIds(record, fieldId) { return [...new Set((record.getCellValue(fieldId) || []).map(link => link.id))]; }

async function readRecords(tableId, recordIds, fields) {
    const ids = [...new Set(recordIds)].sort(), records = [];
    for (let start = 0; start < ids.length; start += 100) {
        const batch = ids.slice(start, start + 100);
        const query = await base.getTable(tableId).selectRecordsAsync({ recordIds: batch, fields });
        const missing = batch.filter(id => !query.records.some(record => record.id === id));
        if (missing.length) throw new Error(`Missing linked records in ${tableId}: ${missing.join(", ")}`);
        records.push(...query.records);
    }
    return records.sort((a, b) => a.id.localeCompare(b.id));
}

async function linkedPayments(data) {
    if (!data.payments) data.payments = await readRecords(TABLES.payments, linkedIds(data.invoice, INVOICE_FIELDS.payments), Object.values(PAYMENT_FIELDS));
    return data.payments;
}

async function accountNumbers(data, ids) {
    const missing = ids.filter(id => !data.accounts.has(id));
    for (const account of await readRecords(TABLES.accounts, missing, Object.values(ACCOUNT_FIELDS))) data.accounts.set(account.id, account.getCellValueAsString(ACCOUNT_FIELDS.number));
    return ids.map(id => data.accounts.get(id));
}

function moneyCents(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} is missing or is not a finite number.`);
    const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
    const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
    if (!Number.isSafeInteger(cents)) throw new Error(`${label} exceeds safe cent precision.`);
    return cents === 0 ? 0 : cents;
}

function invoiceDate(value) {
    if (!value) throw new Error("Invoice Date is required for posting.");
    if (value.length === 10) return value;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error("Invoice Date is invalid.");
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function expensePosting(data, debit, credit, cents) {
    if (!cents) return [];
    const invoice = data.invoice;
    /** @type {any} */
    const context = { invoiceRecordId: invoice.id, sourceRecordId: invoice.id, branch: [], paymentRecordIds: linkedIds(invoice, INVOICE_FIELDS.payments) };
    const branch = invoice.getCellValue(INVOICE_FIELDS.branch);
    if (branch) context.branch = [branch.name];
    for (const [name, field] of [["vendor", INVOICE_FIELDS.vendors], ["client", INVOICE_FIELDS.clients], ["staff", INVOICE_FIELDS.staff], ["transaction", INVOICE_FIELDS.transactions], ["po", INVOICE_FIELDS.purchaseOrders]]) {
        const ids = linkedIds(invoice, field);
        context[`${name}RecordIds`] = ids;
        if (ids.length === 1) context[`${name}RecordId`] = ids[0];
    }
    const states = invoice.getCellValue(INVOICE_FIELDS.states) || [];
    context.stateRecordIds = states.map(link => link.id);
    context.stateNames = states.map(link => link.name);
    if (states.length === 1 && /^[A-Z]{2}$/.test(states[0].name)) context.stateCode = states[0].name;
    return [{ debitAccount: { number: debit }, creditAccount: { number: credit }, amount: (cents / 100).toFixed(2), ...context }];
}

async function postLedgerPayload(payload) {
    const response = await fetch(ledgerWebhookUrl, {
        method: "POST", headers: { "Content-Type": "application/json", "x-ledger-secret": input.secret("Dual Ledger Webhook Secret") },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Ledger webhook failed (${response.status}): ${await response.text()}`);
    return await response.json();
}

const { invoiceRecordId, ledgerWebhookUrl } = input.config();
await main(invoiceRecordId);

// ==================== HELPER ====================

function printResults(data, results, reason = "") {
    const divider = "--------------------------------------------------------";
    const report = [divider, "EXPENSE FULLY PAID SUMMARY", divider, `Invoice name: ${data.invoice.name}`, `Invoice ID: ${data.invoice.id}`, "Event: Payment Invoice Status = Fully Paid", `Invoice type: ${data.invoiceType || "(empty)"}`, `Vendor type: ${data.vendorType || "(empty)"}`, `Matched categories: ${results.length}`];
    for (const result of results) {
        report.push("", divider, `Category: ${result.category}`, `T-Chart row: ${result.tChartRow}`, `Account entry: ${result.entryKey}`);
        for (const posting of result.postings) report.push(`Amount: ${posting.amount}`, `Debit account: ${posting.debitAccount.number}`, `Credit account: ${posting.creditAccount.number}`);
        for (const id of result.postings[0]?.paymentRecordIds || []) report.push(`Linked payment ID: ${id}`);
        if (!result.postings.length) report.push("Amount: 0.00", "No monetary posting.");
    }
    if (!results.length) report.push("", reason || "No Expense Fully Paid category matched.");
    console.log(report.join("\n"));
}

function printPostingResponse(response) {
    if (response.status === "pending_review" || response.status === "rejected") {
        console.log(`Ledger: ${response.status}\nReview request: ${response.requestId}\nNo journals were posted.`);
        return;
    }
    const report = ["--------------------------------------------------------", "LEDGER RESULT", "--------------------------------------------------------"];
    for (const result of response.results || []) {
        report.push(`Rule: ${result.ruleCode}`, `Status: ${result.status}`);
        if (result.entryKey) report.push(`Account entry: ${result.entryKey}`);
        if (result.journalEntryId) report.push(`Journal ID: ${result.journalEntryId}`);
    }
    console.log(report.join("\n"));
}

/*
DOCS
PURPOSE / RUNTIME
  Native FIN Invoices automation when Payment Invoice Status becomes Fully Paid.
  CORE owns chart filters and mappings; UTILS owns native reads and transport; HELPER logs only.
INPUTS / SECRET
  invoiceRecordId: trigger's FIN invoice record ID. ledgerWebhookUrl: existing ledger-payment URL.
  Secret: Dual Ledger Webhook Secret, matching LEDGER_WEBHOOK_SECRET.
MAPPING
  Category - Expenses rows 3 / EXP-02 and 12 / EXP-11, reviewed against T-Chart (100).
  Both require AP and AP - Expenses (Non-Sales Tax). Both use Invoice Amount and Invoice Date.
  Row 3: linked invoice account is nonempty and a linked payment account is FIN 231.100.
  Debit the single invoice account; credit 231.100. Multiple invoice accounts throw.
  Row 12: invoice account includes 007.002. Debit 007.002; credit the shared payment bank.
  FIN 112.100 -> ledger 112.100; FIN 0747 -> ledger 112.300. Missing/mixed banks throw.
  Branch = Invoices.Branch, empty stays null. Structured refs only; no generated notes.
DATA / NETWORK
  One invoice-owned paid event, with entryKey = debit account. No fabricated payment ID.
  All category checks complete before one POST. No Airtable writes, retry or automatic reversal.
  Zero amount is a no-op. Missing/nonfinite/unsafe amounts fail; signed amounts are preserved before POST.
  Receiver must support paid and source_entry_key before publishing this sender.
CHECK
  node airtable/check-expense-fully-paid.cjs
*/
