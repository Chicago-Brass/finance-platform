// FIN Invoice Create Entry - evaluate Expense T-Chart categories and post final ledger pairs.
// Inputs: invoiceRecordId, ledgerWebhookUrl. Secret: Dual Ledger Webhook Secret.
// See DOCS at bottom.

// ==================== CORE ====================

async function handleOperatingExpense(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    // Not yet implemented: the chart's qualifying operating-account list is still PENDING.
    throw new Error("Not yet implemented: Expense row 2 needs the allowed operating expense accounts, excluding bank and revenue accounts.");
}

async function handleTechAllowance(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff") return;
    const lines = await matchingInvoiceLines(data, ["005.102"]);
    if (!lines.length) return;
    // Not yet implemented: the chart identifies ledger account 005.102 as missing in Supabase.
    throw new Error("Not yet implemented: Expense row 6 needs Supabase account 005.102 Tech Allowance.");
}

async function handleW2Payroll(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff") return;
    const lines = await matchingInvoiceLines(data, ["005.002", "005.005", "005.006"]);
    if (!lines.length) return;
    // Defined pairs: 005.002/241.100, 005.006/241.200, 005.005/241.400, using each Line Amount.
    // Not yet implemented: the chart also lists 241.600 without its source component or amount.
    throw new Error("Not yet implemented: Expense row 7 needs the payroll component and amount for credit account 241.600.");
}

async function handleOffshorePayroll(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff") return;
    const lines = await matchingInvoiceLines(data, ["005.101", "005.003", "005.001"]);
    if (!lines.length) return;
    const postings = [];
    for (const { line, accountNumber } of lines) {
        const cents = moneyCents(line.getCellValue(LINE_FIELDS.amount), `Line Amount on ${line.id}`);
        postings.push(...expensePosting(data, accountNumber, "241.100", cents, line.id));
    }
    results.push({ category: "Payroll - offshore / 1099 / owner staff invoice", tChartRow: 8, postings });
}

async function handleBonusCommission(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff") return;
    const lines = await matchingInvoiceLines(data, ["005.201"]);
    if (!lines.length) return;
    const postings = [];
    for (const { line } of lines) {
        const cents = moneyCents(line.getCellValue(LINE_FIELDS.amount), `Line Amount on ${line.id}`);
        postings.push(...expensePosting(data, "005.201", "241.300", cents, line.id));
    }
    results.push({ category: "Month-end accrual - bonus & commission earned", tChartRow: 10, postings });
}

async function handleBankFees(data, results) {
    if (data.invoiceType !== "AP") return;
    const accounts = await invoiceAccountNumbers(data);
    if (!accounts.includes("007.002")) return;
    // Not yet implemented: debit 007.002 is defined, but the credited bank is PENDING.
    throw new Error("Not yet implemented: Expense row 12 needs the bank account to credit for Invoice Amount.");
}

async function handleBadDebtReserve(data, results) {
    if (data.invoiceType !== "AP") return;
    const accounts = await invoiceAccountNumbers(data);
    if (!accounts.includes("007.005")) return;
    // Not yet implemented: retain the chart's unresolved FIN account 121.900 clarification.
    throw new Error("Not yet implemented: Expense row 13 needs the FIN account 121.900 clarification resolved. Planned pair: 007.005 / 121.900, Invoice Amount.");
}

async function handleIncomeTaxAccrual(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const accounts = await invoiceAccountNumbers(data);
    if (!accounts.some(number => number === "242.100" || number === "242.200")) return;
    // Defined pairs: 011.001/242.100 or 011.002/242.200, using the full Invoice Amount.
    // Not yet implemented: retain the chart's unresolved FIN account 011.001/011.002 clarification.
    throw new Error("Not yet implemented: Expense row 14 needs FIN accounts 011.001/011.002 resolved; an invoice linking both tax accounts also needs separate amounts.");
}

// ==================== UTILS ====================

const TABLES = { invoices: "tbldQXuqNEp8G5pfs", lines: "tblV26TC0f6CKDneL", accounts: "tblJ2RF8vlOhNMBKR" };
const INVOICE_FIELDS = {
    name: "fldMZyzqDidRujeZS",          // Invoice ID (primary display name)
    type: "fld9e6yDIv0PtBDV0",          // Invoice Type
    vendorType: "fldXwodwAuXLJt5rP",    // Vendor Type (AP)
    createEntry: "fldFrvGncUen39hBY",   // Create Entry
    amount: "fldm5nXoW7MrwjkhW",        // Invoice Amount
    date: "fldSungTQU5nIEIvi",          // Invoice Date
    lines: "fldF0uqCMkPgwuIes",         // Invoice Lines
    accounts: "fldT5u0prSS8G1H4x",      // Linked Chart of Accounts
    vendors: "fld77UN3hpnMagzkj",       // Linked Vendors (For both Expenses and Product Invoices)
    clients: "fld9aY5ze2BbaoWG5",       // Linked Client
    staff: "fldJXrFmx3Y6Szxa5",         // Linked Staff
    transactions: "fldxUmaAhUJjAGnrw",  // Linked Transaction
    purchaseOrders: "fldcIaoLYHgegP17m", // Related Purchase Order
    branch: "fldt5PjqGDrINUYT5",        // Branch
    states: "fld3kO1XElo5S3Hhy",        // States & Sales Tax Rates
};
const LINE_FIELDS = {
    amount: "fldkhhHCD2qKD71rI",   // Line Amount (formula, field name has a trailing space)
    accounts: "fldwr0Pfp8OHsNj5N", // Chart of Accounts
    invoices: "fldZpOBUbuVJbuaOG", // Linked Invoice
};
const ACCOUNT_FIELDS = { number: "fldTjgAITNrJVCCWq" }; // Account Number

async function main(invoiceRecordId) {
    const data = await loadExpenseData(invoiceRecordId);
    /** @type {any[]} */
    const results = [];
    if (!data.invoice.getCellValue(INVOICE_FIELDS.createEntry)) {
        printResults(data, results, "Create Entry is unchecked.");
        return results;
    }
    await handleTechAllowance(data, results);
    await handleW2Payroll(data, results);
    await handleOffshorePayroll(data, results);
    await handleBonusCommission(data, results);
    await handleBankFees(data, results);
    await handleBadDebtReserve(data, results);
    await handleIncomeTaxAccrual(data, results);
    await handleOperatingExpense(data, results);

    printResults(data, results);
    if (!results.length) return results;
    const entryDate = invoiceDate(data.invoice.getCellValue(INVOICE_FIELDS.date));
    if (!ledgerWebhookUrl) throw new Error("Map ledgerWebhookUrl to the deployed ledger-payment Edge Function URL.");
    const response = await postLedgerPayload({
        invoiceRecordId: data.invoice.id, eventType: "entry_requested", entryDate,
        source: { tableId: TABLES.invoices, recordId: data.invoice.id, recordName: data.invoice.name },
        referenceNumber: data.invoice.id,
        categories: results.map(result => ({
            ruleCode: `EXP-${String(result.tChartRow - 1).padStart(2, "0")}`,
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
    return {
        invoice, invoiceType: invoice.getCellValueAsString(INVOICE_FIELDS.type),
        vendorType: invoice.getCellValueAsString(INVOICE_FIELDS.vendorType),
        accounts: new Map(), lines: null,
    };
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

async function accountNumbers(data, ids) {
    const missing = ids.filter(id => !data.accounts.has(id));
    for (const account of await readRecords(TABLES.accounts, missing, Object.values(ACCOUNT_FIELDS))) {
        data.accounts.set(account.id, account.getCellValueAsString(ACCOUNT_FIELDS.number));
    }
    return ids.map(id => data.accounts.get(id));
}

async function invoiceAccountNumbers(data) { return await accountNumbers(data, linkedIds(data.invoice, INVOICE_FIELDS.accounts)); }

async function matchingInvoiceLines(data, numbers) {
    if (!data.lines) data.lines = await readRecords(TABLES.lines, linkedIds(data.invoice, INVOICE_FIELDS.lines), Object.values(LINE_FIELDS));
    const allAccountIds = [...new Set(data.lines.flatMap(line => linkedIds(line, LINE_FIELDS.accounts)))];
    await accountNumbers(data, allAccountIds);
    const matches = [];
    for (const line of data.lines) {
        const codes = linkedIds(line, LINE_FIELDS.accounts).map(id => data.accounts.get(id));
        if (!codes.some(code => numbers.includes(code))) continue;
        if (codes.length !== 1) throw new Error(`Not yet implemented: Invoice Line ${line.id} links multiple accounts; its Line Amount cannot be split without a mapping.`);
        const invoices = linkedIds(line, LINE_FIELDS.invoices);
        if (invoices.length !== 1 || invoices[0] !== data.invoice.id) throw new Error(`Invoice Line ${line.id} must belong only to invoice ${data.invoice.id}.`);
        matches.push({ line, accountNumber: codes[0] });
    }
    return matches;
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

function expensePosting(data, debit, credit, cents, sourceRecordId) {
    if (cents < 0) throw new Error(`Negative expense amount on ${sourceRecordId}; this category does not define its posting treatment.`);
    if (!cents) return [];
    const invoice = data.invoice;
    /** @type {any} */
    const context = { invoiceRecordId: invoice.id, sourceRecordId, branch: [] };
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
    const report = [divider, "EXPENSE ENTRY SUMMARY", divider, `Invoice name: ${data.invoice.name}`, `Invoice ID: ${data.invoice.id}`, "Event: Create Entry checked", `Invoice type: ${data.invoiceType || "(empty)"}`, `Vendor type: ${data.vendorType || "(empty)"}`, `Matched categories: ${results.length}`];
    for (const [index, result] of results.entries()) {
        report.push("", divider, `MATCH ${index + 1}`, divider, `Category: ${result.category}`, `T-Chart row: ${result.tChartRow}`);
        for (const posting of result.postings) {
            report.push(`Amount: ${posting.amount}`, `Debit account: ${posting.debitAccount.number}`, `Credit account: ${posting.creditAccount.number}`, `Invoice Line ID: ${posting.sourceRecordId}`);
        }
        if (!result.postings.length) report.push("Amount: 0.00", "No monetary posting.");
    }
    if (!results.length) report.push("", reason || "No Expense Create Entry category matched.");
    console.log(report.join("\n"));
}

function printPostingResponse(response) {
    const report = ["--------------------------------------------------------", "LEDGER RESULT", "--------------------------------------------------------"];
    for (const result of response.results || []) {
        report.push(`Rule: ${result.ruleCode}`, `Status: ${result.status}`);
        if (result.journalEntryId) report.push(`Journal ID: ${result.journalEntryId}`);
    }
    console.log(report.join("\n"));
}

/*
DOCS
PURPOSE / RUNTIME
  Native FIN Invoice Create Entry automation. CORE owns each chart category's filters;
  UTILS reads records and sends final pairs; HELPER formats logs only.
INPUTS / SECRET
  invoiceRecordId: triggering FIN Invoices record ID.
  ledgerWebhookUrl: https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment
  Secret: Dual Ledger Webhook Secret, matching LEDGER_WEBHOOK_SECRET.
SOURCE / MAPPING
  T-Chart Category - Expenses, current download 4 Nov 2026, Actual Trigger / Mapping / Clarification.
  User override: every entry uses Invoice Date, including rows whose date says PENDING.
  Rows 8 and 10 post each matching Line Amount with its own source line ID.
  Row 8: 005.101/005.003/005.001 -> 241.100. Row 10: 005.201 -> 241.300.
  Round each posting to cents; zero is a category no-op. Negative or missing amounts fail.
  Rows 2/6/7/12/13/14 retain explicit Not yet implemented errors for chart clarifications.
  Rows 3 and 4 have different primary events and do not run from this checkbox automation.
  Rows 5/9/11 have no approved Actual Trigger and are not inferred from descriptions.
DATA / NETWORK
  Native FIN reads by stable table/field IDs; line/account queries are cached and batched.
  No Airtable record writes. All category checks finish before the first webhook request.
  One invoice-owned entry_requested packet with EXP rule codes, refs and no generated notes.
  The receiver must support entry_requested as an invoice event before enabling this automation.
  Audit links open the invoice. Exact retries deduplicate; changed payloads require review.
  No automatic retries. An unresolved matching category stops the complete run before POST.
CHECK
  node airtable/check-expense-entry.cjs
*/
