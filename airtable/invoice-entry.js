// FIN Invoice Create Entry - qualify Invoice Entry categories and post final ledger pairs.
// Airtable inputs: invoiceRecordId, ledgerWebhookUrl. Secret: Dual Ledger Webhook Secret.
// See DOCS at bottom.

// ==================== CORE ====================

async function handleReceivedProductInvoice(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Product" || !(data.invoice.getCellValue(INVOICE_FIELDS.receivedNotInvoiced) > 0)) return;
    const cents = moneyCents(data.invoice.getCellValue(INVOICE_FIELDS.amount), "Invoice Amount");
    results.push({
        category: "Vendor PRODUCT invoice - goods already received", tChartRow: 2,
        postings: invoicePosting(data, "211.200", "211.100", cents),
    });
}

async function handleVendorDepositInvoice(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Product" || data.invoice.getCellValue(INVOICE_FIELDS.receivedNotInvoiced) !== 0) return;
    const cents = moneyCents(data.invoice.getCellValue(INVOICE_FIELDS.amount), "Invoice Amount");
    results.push({
        category: "Vendor DEPOSIT invoice - billed before the goods ship", tChartRow: 4,
        postings: invoicePosting(data, "132.100", "211.100", cents),
    });
}

async function handleInboundFreightInvoice(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Product") return;
    const cents = moneyCents(data.invoice.getCellValue(INVOICE_FIELDS.amount), "Invoice Amount");
    results.push({
        category: "Vendor invoice for inbound freight / handling on a PO", tChartRow: 5,
        postings: invoicePosting(data, "131.100", "211.100", cents),
    });
}

async function handleSalesTaxInvoice(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Sales Tax)") return;
    const cents = moneyCents(data.invoice.getCellValue(INVOICE_FIELDS.amount), "Invoice Amount");
    results.push({
        category: "Sales tax remittance invoice (paying the state)", tChartRow: 7,
        postings: invoicePosting(data, "212.100", "211.100", cents),
    });
}

async function handleAssetInvoice(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Assets") return;
    const cents = moneyCents(data.invoice.getCellValue(INVOICE_FIELDS.amount), "Invoice Amount");
    results.push({
        category: "Fixed asset purchase invoice (vehicle, fixtures, software)", tChartRow: 8,
        postings: invoicePosting(data, "143.300", "211.100", cents),
    });
}

async function handleVendorReturnCredit(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Credit" || !getLinkedRecords(data.invoice, INVOICE_FIELDS.purchaseOrders).length) return;
    const cents = Math.abs(moneyCents(data.invoice.getCellValue(INVOICE_FIELDS.amount), "Invoice Amount"));
    results.push({
        category: "Vendor CREDIT MEMO - returned goods (RGA return for credit)", tChartRow: 9,
        postings: invoicePosting(data, "211.100", "131.400", cents),
    });
}

async function handleVendorPriceCredit(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Credit" || getLinkedRecords(data.invoice, INVOICE_FIELDS.purchaseOrders).length) return;
    // Not yet implemented: COGS versus the original expense account is not selected by the chart.
    throw new Error("Not yet implemented: Invoice Entry row 10 needs the rule selecting COGS or the original expense account.");
    // TODO: post ABS(Invoice Amount), debit AP 211.100 and credit the confirmed account.
}

async function handleCustomerNonProductInvoice(data, results) {
    if (data.invoiceType !== "AR" || data.vendorType !== "AR - Non-Product") return;
    const accounts = await readAccounts(getLinkedRecords(data.invoice, INVOICE_FIELDS.accounts));
    if (!accounts.some(account => account.getCellValueAsString(ACCOUNT_FIELDS.number) === "010.001")) return;
    const cents = moneyCents(data.invoice.getCellValue(INVOICE_FIELDS.amount), "Invoice Amount");
    results.push({
        category: "Customer invoice for a NON-product charge", tChartRow: 11,
        postings: invoicePosting(data, "121.100", "010.001", cents),
    });
}

// ==================== UTILS ====================

const TABLES = { invoices: "tbldQXuqNEp8G5pfs", accounts: "tblJ2RF8vlOhNMBKR" };
const INVOICE_FIELDS = {
    name: "fldMZyzqDidRujeZS",          // Invoice ID (primary display name)
    type: "fld9e6yDIv0PtBDV0",          // Invoice Type
    vendorTypeAP: "fldXwodwAuXLJt5rP",  // Vendor Type (AP)
    vendorTypeAR: "fldbMLaxgnu81a0O0",  // Vendor Type (AR)
    amount: "fldm5nXoW7MrwjkhW",        // Invoice Amount
    date: "fldSungTQU5nIEIvi",          // Invoice Date
    createEntry: "fldFrvGncUen39hBY",   // Create Entry
    receivedNotInvoiced: "fldUFz9w6y184Sn7h", // Total Received Not Yet Invoiced
    accounts: "fldT5u0prSS8G1H4x",      // Linked Chart of Accounts
    purchaseOrders: "fldcIaoLYHgegP17m", // Related Purchase Order
    vendors: "fld77UN3hpnMagzkj",       // Linked Vendors (For both Expenses and Product Invoices)
    clients: "fld9aY5ze2BbaoWG5",       // Linked Client
    staff: "fldJXrFmx3Y6Szxa5",         // Linked Staff
    transactions: "fldxUmaAhUJjAGnrw",  // Linked Transaction
    branch: "fldt5PjqGDrINUYT5",        // Branch
    states: "fld3kO1XElo5S3Hhy",        // States & Sales Tax Rates
};
const ACCOUNT_FIELDS = { number: "fldTjgAITNrJVCCWq" }; // Account Number

async function main(invoiceRecordId) {
    const data = await loadInvoiceData(invoiceRecordId);
    if (!data.invoice.getCellValue(INVOICE_FIELDS.createEntry)) {
        console.log("Create Entry is unchecked; no ledger posting.");
        return [];
    }
    /** @type {any[]} */
    const results = [];
    await handleReceivedProductInvoice(data, results);
    await handleVendorDepositInvoice(data, results);
    await handleInboundFreightInvoice(data, results);
    await handleSalesTaxInvoice(data, results);
    await handleAssetInvoice(data, results);
    await handleVendorReturnCredit(data, results);
    await handleVendorPriceCredit(data, results);
    await handleCustomerNonProductInvoice(data, results);

    printResults(data, results);
    if (!results.length) return results;
    const entryDate = invoiceDate(data.invoice.getCellValue(INVOICE_FIELDS.date));
    if (!ledgerWebhookUrl) throw new Error("Map ledgerWebhookUrl to the deployed ledger-payment Edge Function URL.");
    const response = await postLedgerPayload({
        invoiceRecordId: data.invoice.id, eventType: "entry_requested", entryDate,
        source: { tableId: TABLES.invoices, recordId: data.invoice.id, recordName: data.invoice.name },
        referenceNumber: data.invoice.id,
        categories: results.map(result => ({
            ruleCode: `INV-${String(result.tChartRow - 1).padStart(2, "0")}`,
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
    const vendorType = invoice.getCellValueAsString(invoiceType === "AR" ? INVOICE_FIELDS.vendorTypeAR : INVOICE_FIELDS.vendorTypeAP);
    return { invoice, invoiceType, vendorType };
}

async function readAccounts(links) {
    if (!links.length) return [];
    const ids = [...new Set(links.map(link => link.id))];
    const query = await base.getTable(TABLES.accounts).selectRecordsAsync({ recordIds: ids, fields: Object.values(ACCOUNT_FIELDS) });
    const missing = ids.filter(id => !query.records.some(record => record.id === id));
    if (missing.length) throw new Error(`Linked accounts not found: ${missing.join(", ")}`);
    return query.records;
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
    const report = [divider, "INVOICE SUMMARY", divider, `Invoice name: ${data.invoice.name}`, `Invoice ID: ${data.invoice.id}`, "Event: Create Entry checked", `Invoice type: ${data.invoiceType || "(empty)"}`, `Vendor type: ${data.vendorType || "(empty)"}`, `Matched categories: ${results.length}`];
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
    if (!results.length) report.push("", "No implemented Invoice Entry category matched.");
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
  Native FIN Invoice Entry Create Entry automation. CORE owns category filters;
  UTILS reads/posts, HELPER formats logs. Prepare every match before one POST.
INPUTS / SECRET
  invoiceRecordId: FIN invoice Airtable record ID from the matching-record trigger.
  ledgerWebhookUrl: https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment
  Secret: Dual Ledger Webhook Secret.
SOURCE / MAPPING
  Category - Invoice Entry, Actual Trigger and Mapping columns, 4 Nov 2026.
  Create Entry must be checked. Rows 2/4 use Total Received Not Yet Invoiced
  > 0 / = 0 respectively, but post Invoice Amount, not the received rollup.
  Rows 2/4/5/7/8/9/11 implement INV-01/03/04/06/07/08/10.
  Row 10 has known filters but throws until its credit-account selection is resolved.
  Row 5 retains the chart's broad AP Product filter; independent matches are retained.
  Rows 3/12 remain unmapped; row 6 stays in Invoice Created.
  Amount = Invoice Amount; credit rows use ABS. Date = Invoice Date.
  Round once to cents. Zero produces a no-op; missing/negative ordinary amounts fail.
DATA / NETWORK
  Native FIN reads by field IDs; no Airtable record writes or checkbox reset.
  Read linked accounts only for AR non-product. Retain source refs/branch, no notes.
  Send invoice-owned entry_requested event and INV rule codes; audit opens invoice.
  One authenticated POST, no retry. Existing journal source/rule identities remain;
  replaying an earlier created-event posting can conflict rather than duplicate it.
LOCAL CHECK
  node airtable/check-invoice-created.cjs
*/
