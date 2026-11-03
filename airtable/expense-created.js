// FIN Expense Invoice Created - post prepaid expenses to the ledger.
// Airtable inputs: invoiceRecordId, ledgerWebhookUrl. Secret: Dual Ledger Webhook Secret.
// See DOCS at bottom.

// ==================== CORE ====================

async function handlePrepaidExpense(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)" || !data.invoice.getCellValue(INVOICE_FIELDS.prepaid)) return;
    const cents = moneyCents(data.invoice.getCellValue(INVOICE_FIELDS.amount), "Invoice Amount");
    results.push({
        category: "Prepaid expense bill (pay a year up front, e.g., insurance)", tChartRow: 4,
        postings: invoicePosting(data, "135.000", "211.100", cents),
    });
}

// ==================== UTILS ====================

const TABLES = { invoices: "tbldQXuqNEp8G5pfs" };
const INVOICE_FIELDS = {
    name: "fldMZyzqDidRujeZS",          // Invoice ID (primary display name)
    type: "fld9e6yDIv0PtBDV0",          // Invoice Type
    vendorTypeAP: "fldXwodwAuXLJt5rP",  // Vendor Type (AP)
    amount: "fldm5nXoW7MrwjkhW",        // Invoice Amount
    date: "fldSungTQU5nIEIvi",          // Invoice Date
    prepaid: "fldckuYNfSzBXq0AX",       // Mark as Prepaid Expense?
    purchaseOrders: "fldcIaoLYHgegP17m", // Related Purchase Order
    vendors: "fld77UN3hpnMagzkj",       // Linked Vendors (For both Expenses and Product Invoices)
    clients: "fld9aY5ze2BbaoWG5",       // Linked Client
    staff: "fldJXrFmx3Y6Szxa5",         // Linked Staff
    transactions: "fldxUmaAhUJjAGnrw",  // Linked Transaction
    branch: "fldt5PjqGDrINUYT5",        // Branch
    states: "fld3kO1XElo5S3Hhy",        // States & Sales Tax Rates
};

async function main(invoiceRecordId) {
    const data = await loadInvoiceData(invoiceRecordId);
    /** @type {any[]} */
    const results = [];
    await handlePrepaidExpense(data, results);

    printResults(data, results);
    if (!results.length) return results;
    const entryDate = invoiceDate(data.invoice.getCellValue(INVOICE_FIELDS.date));
    if (!ledgerWebhookUrl) throw new Error("Map ledgerWebhookUrl to the deployed ledger-payment Edge Function URL.");
    const response = await postLedgerPayload({
        invoiceRecordId: data.invoice.id, eventType: "created", entryDate,
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

async function loadInvoiceData(invoiceRecordId) {
    if (!invoiceRecordId) throw new Error("Map invoiceRecordId to the trigger's FIN Airtable record ID.");
    const invoice = await base.getTable(TABLES.invoices).selectRecordAsync(invoiceRecordId, { fields: Object.values(INVOICE_FIELDS) });
    if (!invoice) throw new Error(`Invoice not found: ${invoiceRecordId}`);
    const invoiceType = invoice.getCellValueAsString(INVOICE_FIELDS.type);
    const vendorType = invoice.getCellValueAsString(INVOICE_FIELDS.vendorTypeAP);
    return { invoice, invoiceType, vendorType };
}

function getLinkedRecords(record, fieldId) { return record.getCellValue(fieldId) || []; }

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


function invoicePosting(data, debit, credit, cents) {
    if (cents < 0) throw new Error(`Invoice ${data.invoice.id} has a negative amount; this category does not define its negative posting treatment.`);
    if (!cents) return [];
    const invoice = data.invoice;
    /** @type {any} */
    const context = { invoiceRecordId: invoice.id, sourceRecordId: invoice.id, branch: [] };
    const branch = invoice.getCellValue(INVOICE_FIELDS.branch);
    if (branch) context.branch = [branch.name];
    for (const [name, field] of [["vendor", INVOICE_FIELDS.vendors], ["client", INVOICE_FIELDS.clients], ["staff", INVOICE_FIELDS.staff], ["transaction", INVOICE_FIELDS.transactions], ["po", INVOICE_FIELDS.purchaseOrders]]) {
        const ids = getLinkedRecords(invoice, field).map(link => link.id);
        context[`${name}RecordIds`] = ids;
        if (ids.length === 1) context[`${name}RecordId`] = ids[0];
    }
    const states = getLinkedRecords(invoice, INVOICE_FIELDS.states);
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

function printResults(data, results) {
    const divider = "--------------------------------------------------------";
    const report = [divider, "EXPENSE INVOICE CREATED SUMMARY", divider, `Invoice name: ${data.invoice.name}`, `Invoice ID: ${data.invoice.id}`, "Event: Invoice created", `Invoice type: ${data.invoiceType || "(empty)"}`, `Vendor type: ${data.vendorType || "(empty)"}`, `Matched categories: ${results.length}`];
    for (const [index, result] of results.entries()) {
        report.push("", divider, `MATCH ${index + 1}`, divider, `Category: ${result.category}`, `T-Chart row: ${result.tChartRow}`);
        for (const posting of result.postings) {
            report.push(`Amount: ${posting.amount}`, `Debit account: ${posting.debitAccount.number}`, `Credit account: ${posting.creditAccount.number}`);
            for (const [key, label] of [["vendorRecordIds", "Vendor ID"], ["clientRecordIds", "Client ID"], ["staffRecordIds", "Staff ID"], ["transactionRecordIds", "Transaction ID"], ["poRecordIds", "PO ID"], ["stateRecordIds", "State ID"]]) {
                for (const id of posting[key] || []) report.push(`${label}: ${id}`);
            }
        }
        if (!result.postings.length) report.push("Amount: 0.00", "No monetary posting.");
    }
    if (!results.length) report.push("", "No prepaid expense category matched.");
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
  Native FIN Expense | Invoice Created automation. CORE owns category filters,
  UTILS reads/posts, HELPER formats logs. Evaluates before the authenticated POST.
INPUTS / SECRET
  invoiceRecordId: FIN Invoices record ID from the created-record trigger.
  ledgerWebhookUrl: https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment
  Secret: Dual Ledger Webhook Secret, matching LEDGER_WEBHOOK_SECRET.
SOURCE / MAPPING
  Category - Expenses row 4, EXP-03. AP + AP - Expenses (Non-Sales Tax) +
  Mark as Prepaid Expense? checked. Amount = Invoice Amount, date = Invoice Date,
  debit 135.000 Prepaid Expenses, credit 211.100 AP. Round once to cents for posting.
  Date-only values stay unchanged; timestamps use the invoice's Chicago calendar date.
DATA / NETWORK
  Native FIN reads by table/field IDs; no Airtable writes or linked account lookup.
  Fixed ledger codes resolve directly in Supabase. No notes are sent, only source refs.
  Invoice-owned created event; its audit link opens the source invoice.
  Zero is an explicit category no-op; missing, nonfinite or negative amounts fail.
  One POST for a match, none for a nonmatch. No automatic retry; exact replays deduplicate
  in the receiver. Changed financial payloads require review.
CHECK
  node airtable/check-expense-created.cjs
*/
