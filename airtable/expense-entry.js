// FIN Invoice Create Entry - evaluate Expense T-Chart categories and post final ledger pairs.
// Inputs: invoiceRecordId, ledgerWebhookUrl. Secret: Dual Ledger Webhook Secret.
// See DOCS at bottom.

// ==================== CORE ====================

async function handleOperatingExpense(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const accounts = await invoiceAccountNumbers(data);
    if (!accounts.includes("006.002")) return;
    if (accounts.length !== 1) throw new Error("Not yet implemented: Utilities uses the full Invoice Amount; multiple invoice accounts need separate amounts.");
    const units = moneyUnits(data.invoice.getCellValue(INVOICE_FIELDS.amount), 4, "Invoice Amount");
    results.push({ category: "Enter an operating expense invoice (ex: Utilities)", tChartRow: 2, postings: expensePosting(data, "006.002", "211.100", units, data.invoice.id) });
}

async function handlePrepaidExpense(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)" || !data.invoice.getCellValue(INVOICE_FIELDS.prepaid)) return;
    const units = moneyUnits(data.invoice.getCellValue(INVOICE_FIELDS.amount), 4, "Invoice Amount");
    results.push({ category: "Prepaid expense bill (pay a year up front, e.g., insurance)", tChartRow: 4, postings: expensePosting(data, "135.000", "211.100", units, data.invoice.id) });
}

async function handleTechAllowance(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff") return;
    const lines = await matchingInvoiceLines(data, ["005.102"]);
    if (!lines.length) return;
    const postings = [];
    for (const { line } of lines) {
        const units = moneyUnits(line.getCellValue(LINE_FIELDS.amount), 4, `Line Amount on ${line.id}`);
        postings.push(...expensePosting(data, "005.102", "211.100", units, line.id));
    }
    const employeeBranches = data.invoice.getCellValue(INVOICE_FIELDS.employeeBranch) || [];
    for (const posting of postings) posting.branch = employeeBranches;
    results.push({ category: "Employee Tech Allowance", tChartRow: 6, postings });
}

async function handleW2Payroll(data, results) {
    // Partial implementation - functioning: wages, payroll tax and 401k work; employee benefits remain excluded.
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff") return;
    const creditAccounts = { "005.002": "241.100", "005.006": "241.200", "005.005": "241.400" };
    const lines = await matchingInvoiceLines(data, Object.keys(creditAccounts));
    if (!lines.length) return;
    const postings = [];
    for (const { line, accountNumber } of lines) {
        const units = moneyUnits(line.getCellValue(LINE_FIELDS.amount), 4, `Line Amount on ${line.id}`);
        postings.push(...expensePosting(data, accountNumber, creditAccounts[accountNumber], units, line.id));
    }
    // Employee benefits 241.600 stay excluded until their counteraccount is defined.
    results.push({ category: "Payroll - W2 payroll register (per pay date)", tChartRow: 7, postings });
}

async function handleOffshorePayroll(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff") return;
    const lines = await matchingInvoiceLines(data, ["005.101", "005.003", "005.001"]);
    if (!lines.length) return;
    const postings = [];
    for (const { line, accountNumber } of lines) {
        const units = moneyUnits(line.getCellValue(LINE_FIELDS.amount), 4, `Line Amount on ${line.id}`);
        postings.push(...expensePosting(data, accountNumber, "241.100", units, line.id));
    }
    results.push({ category: "Payroll - offshore / 1099 / owner staff invoice", tChartRow: 8, postings });
}

async function handleBonusCommission(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Staff") return;
    const lines = await matchingInvoiceLines(data, ["005.201"]);
    if (!lines.length) return;
    const postings = [];
    for (const { line } of lines) {
        const units = moneyUnits(line.getCellValue(LINE_FIELDS.amount), 4, `Line Amount on ${line.id}`);
        postings.push(...expensePosting(data, "005.201", "241.300", units, line.id));
    }
    results.push({ category: "Month-end accrual - bonus & commission earned", tChartRow: 10, postings });
}

async function handleBadDebtReserve(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const accounts = await invoiceAccountNumbers(data);
    if (!accounts.includes("007.005")) return;
    const units = moneyUnits(data.invoice.getCellValue(INVOICE_FIELDS.amount), 4, "Invoice Amount");
    results.push({ category: "Bad-debt reserve (allowance) - month-end", tChartRow: 13, postings: expensePosting(data, "007.005", "121.900", units, data.invoice.id) });
}

async function handleIncomeTaxAccrual(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    const accounts = await invoiceAccountNumbers(data);
    const taxAccounts = accounts.filter(number => number === "242.100" || number === "242.200");
    if (!taxAccounts.length) return;
    if (taxAccounts.length !== 1) throw new Error("Not yet implemented: Expense row 14 requires exactly one tax account; multiple accounts need separate amounts.");
    const credit = taxAccounts[0], debit = credit === "242.100" ? "011.001" : "011.002";
    const units = moneyUnits(data.invoice.getCellValue(INVOICE_FIELDS.amount), 4, "Invoice Amount");
    results.push({ category: "Income tax accrual (quarterly)", tChartRow: 14, postings: expensePosting(data, debit, credit, units, data.invoice.id) });
}

// ==================== UTILS ====================

const TABLES = { invoices: "tbldQXuqNEp8G5pfs", lines: "tblV26TC0f6CKDneL", accounts: "tblJ2RF8vlOhNMBKR" };
const INVOICE_FIELDS = {
    name: "fldMZyzqDidRujeZS",          // Invoice ID (primary display name)
    type: "fld9e6yDIv0PtBDV0",          // Invoice Type
    vendorType: "fldXwodwAuXLJt5rP",    // Vendor Type (AP)
    createEntry: "fldFrvGncUen39hBY",   // Create Entry
    prepaid: "fldckuYNfSzBXq0AX",       // Mark as Prepaid Expense?
    employeeBranch: "fldSHm0sXlVswhqs4", // Branch Employee
    amount: "fldm5nXoW7MrwjkhW",        // Invoice Amount
    date: "fldSungTQU5nIEIvi",          // Invoice Date
    lines: "fldF0uqCMkPgwuIes",         // Invoice Lines
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
    await handlePrepaidExpense(data, results);
    await handleTechAllowance(data, results);
    await handleW2Payroll(data, results);
    await handleOffshorePayroll(data, results);
    await handleBonusCommission(data, results);
    await handleBadDebtReserve(data, results);
    await handleIncomeTaxAccrual(data, results);
    await handleOperatingExpense(data, results);

    const entries = results.flatMap(accountEntries);
    printResults(data, entries);
    if (!results.length) return results;
    const entryDate = invoiceDate(data.invoice.getCellValue(INVOICE_FIELDS.date));
    if (!ledgerWebhookUrl) throw new Error("Map ledgerWebhookUrl to the deployed ledger-payment Edge Function URL.");
    const response = await postLedgerPayload({
        invoiceRecordId: data.invoice.id, eventType: "entry_requested", entryDate,
        source: { tableId: TABLES.invoices, recordId: data.invoice.id, recordName: data.invoice.name },
        referenceNumber: data.invoice.id,
        categories: entries.map(result => ({
            ruleCode: `EXP-${String(result.tChartRow - 1).padStart(2, "0")}`,
            entryKey: result.entryKey,
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

function accountEntries(result) {
    if (!result.postings.length) return [result];
    const groups = new Map();
    for (const posting of result.postings) {
        const key = posting.debitAccount.number;
        if (!groups.has(key)) groups.set(key, []);
        const group = groups.get(key);
        if (group.length && group[0].creditAccount.number !== posting.creditAccount.number) throw new Error(`Account ${key} has multiple credit mappings; separate amounts are required.`);
        group.push(posting);
    }
    return [...groups].map(([entryKey, postings]) => {
        const units = postings.reduce((total, posting) => total + moneyUnits(Number(posting.amount), 4, "Account amount"), 0);
        if (!Number.isSafeInteger(units)) throw new Error(`Account ${entryKey} total exceeds safe money precision.`);
        const cents = moneyCents(units / 10000, "Account total");
        const sourceRecordIds = [...new Set(postings.map(posting => posting.sourceRecordId))].sort();
        const posting = { ...postings[0], amount: (cents / 100).toFixed(2) };
        if (sourceRecordIds.length > 1) {
            posting.sourceRecordId = posting.invoiceRecordId;
            posting.sourceRecordIds = sourceRecordIds;
        }
        return { ...result, entryKey, postings: [posting] };
    });
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

function moneyCents(value, label) { return moneyUnits(value, 2, label); }

function moneyUnits(value, precision, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} is missing or is not a finite number.`);
    const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
    const units = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + precision}`));
    if (!Number.isSafeInteger(units)) throw new Error(`${label} exceeds safe money precision.`);
    return units === 0 ? 0 : units;
}

function invoiceDate(value) {
    if (!value) throw new Error("Invoice Date is required for posting.");
    if (value.length === 10) return value;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error("Invoice Date is invalid.");
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function expensePosting(data, debit, credit, units, sourceRecordId) {
    if (!units) return [];
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
    return [{ debitAccount: { number: debit }, creditAccount: { number: credit }, amount: (units / 10000).toFixed(4), ...context }];
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
    const report = [divider, "EXPENSE ENTRY SUMMARY", divider, `Invoice name: ${data.invoice.name}`, `Invoice ID: ${data.invoice.id}`, "Event: Create Entry checked", `Invoice type: ${data.invoiceType || "(empty)"}`, `Vendor type: ${data.vendorType || "(empty)"}`, `Matched categories: ${new Set(results.map(result => result.tChartRow)).size}`, `Prepared entries: ${results.length}`];
    for (const [index, result] of results.entries()) {
        report.push("", divider, `MATCH ${index + 1}`, divider, `Category: ${result.category}`, `T-Chart row: ${result.tChartRow}`);
        if (result.entryKey) report.push(`Account entry: ${result.entryKey}`);
        for (const posting of result.postings) {
            report.push(`Amount: ${posting.amount}`, `Debit account: ${posting.debitAccount.number}`, `Credit account: ${posting.creditAccount.number}`, `Source record ID: ${posting.sourceRecordId}`);
            for (const id of posting.sourceRecordIds || []) report.push(`Source line ID: ${id}`);
        }
        for (const id of result.postings[0]?.paymentRecordIds || []) report.push(`Linked payment ID: ${id}`);
        if (!result.postings.length) report.push("Amount: 0.00", "No monetary posting.");
    }
    if (!results.length) report.push("", reason || "No Expense Create Entry category matched.");
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
  Native FIN Invoice Create Entry automation. CORE owns each chart category's filters;
  UTILS reads records and sends final pairs; HELPER formats logs only.
INPUTS / SECRET
  invoiceRecordId: triggering FIN Invoices record ID.
  ledgerWebhookUrl: https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment
  Secret: Dual Ledger Webhook Secret, matching LEDGER_WEBHOOK_SECRET.
SOURCE / MAPPING
  Category - Expenses, official Actual Trigger / Mapping from 7 Nov 2026.
  Every entry uses Invoice Date. Branch uses Invoice.Branch, except Tech Allowance
  uses Branch Employee; empty or multiple branches remain unassigned in the receiver.
  Row 2: Utilities 006.002 -> 211.100, Invoice Amount, exactly one invoice account.
  Row 4: prepaid checkbox, AP expense, Invoice Amount, 135.000 -> 211.100.
  Row 6: 005.102 Line Amount -> 211.100.
  Row 7: W2 salary 005.002 -> 241.100, payroll tax 005.006 -> 241.200,
  401k 005.005 -> 241.400. Employee benefits 241.600 are excluded for now.
  Daily 11 PM Central is documented only; native triggers remain unchanged.
  Row 8: 005.101/005.003/005.001 Line Amount -> 241.100.
  Row 10: 005.201 Line Amount -> 241.300.
  Row 13: Invoice Amount, 007.005 -> 121.900, AP expense only.
  Row 14: Invoice Amount, 011.001 -> 242.100 or 011.002 -> 242.200.
  Exactly one tax account is required; no invented split.
  Same-account invoice lines sum into one pair/journal. Different accounts stay separate;
  all contributing line IDs are retained as sourceRecordIds. Amounts use checked cents.
  Zero is a category no-op. Missing or nonfinite amounts fail; signed amounts retain their chart sides.
  Rows 3/12 belong to Fully Paid status, rows 5/11 to their own record-created events.
  PTO row 9 remains deferred.
DATA / NETWORK
  Native FIN reads by stable table/field IDs; line/account queries are cached and batched.
  No Airtable record writes. All category checks finish before the first webhook request.
  One invoice-owned entry_requested packet with EXP rule codes, refs and no generated notes.
  One entry and summed posting pair per debit account, with entryKey = that account number.
  Repeated same-account lines sum with four-decimal precision before their total rounds to cents. Their IDs are sent in sourceRecordIds;
  sourceRecordId is the invoice when multiple lines are aggregated. Receiver/schema must
  support source_entry_key before deployment. Branch = Invoices.Branch; empty stays null.
  The receiver must support entry_requested as an invoice event before enabling this automation.
  Audit links open the invoice. Exact retries deduplicate; changed payloads require review.
  No automatic retries. An unresolved matching category stops the complete run before POST.
CHECK
  node airtable/check-expense-entry.cjs
*/
