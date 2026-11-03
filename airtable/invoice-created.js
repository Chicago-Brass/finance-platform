// FIN Invoice Created - retain the unresolved outbound-shipping category.
// Airtable inputs: invoiceRecordId, ledgerWebhookUrl. Secret: Dual Ledger Webhook Secret.
// See DOCS at bottom.

// ==================== CORE ====================

async function handleOutboundShippingInvoice(data, results) {
    if (data.invoiceType !== "AP" || data.vendorType !== "AP - Expenses (Non-Sales Tax)") return;
    // Not yet implemented: the chart still says "Not sure" for the freight-cost source.
    throw new Error("Not yet implemented: Invoice Entry row 6 needs the freight and handling cost field.");
}

// ==================== UTILS ====================

const TABLES = { invoices: "tbldQXuqNEp8G5pfs" };
const INVOICE_FIELDS = {
    name: "fldMZyzqDidRujeZS",          // Invoice ID (primary display name)
    type: "fld9e6yDIv0PtBDV0",          // Invoice Type
    vendorTypeAP: "fldXwodwAuXLJt5rP",  // Vendor Type (AP)
    vendorTypeAR: "fldbMLaxgnu81a0O0",  // Vendor Type (AR)
    amount: "fldm5nXoW7MrwjkhW",        // Invoice Amount
    date: "fldSungTQU5nIEIvi",          // Invoice Date
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
    await handleOutboundShippingInvoice(data, results);

    printResults(data, results);
    if (!results.length) return results;
    const entryDate = data.invoice.getCellValue(INVOICE_FIELDS.date);
    if (!entryDate) throw new Error("Invoice Date is required for posting.");
    if (!ledgerWebhookUrl) throw new Error("Map ledgerWebhookUrl to the deployed ledger-payment Edge Function URL.");
    const response = await postLedgerPayload({
        invoiceRecordId: data.invoice.id, eventType: "created", entryDate,
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

function getLinkedRecords(record, fieldId) { return record.getCellValue(fieldId) || []; }

function moneyCents(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} is missing or is not a finite number.`);
    const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
    const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
    if (!Number.isSafeInteger(cents)) throw new Error(`${label} exceeds safe cent precision.`);
    return cents === 0 ? 0 : cents;
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
    const report = [divider, "INVOICE SUMMARY", divider, `Invoice name: ${data.invoice.name}`, `Invoice ID: ${data.invoice.id}`, "Event: Invoice created", `Invoice type: ${data.invoiceType || "(empty)"}`, `Vendor type: ${data.vendorType || "(empty)"}`, `Matched categories: ${results.length}`];
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
  Native FIN Invoice Created automation. CORE retains row 6's known filters and
  explicit Not yet implemented error until the freight-cost source is resolved.
  Other mapped Invoice Entry categories moved to invoice-entry.js / Create Entry.
INPUTS / SECRET
  invoiceRecordId: FIN invoice record ID from the created-record trigger.
  ledgerWebhookUrl: https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment
  Secret: Dual Ledger Webhook Secret.
SOURCE / MAPPING
  Category - Invoice Entry row 6, 4 Nov 2026. AP / AP - Expenses (Non-Sales Tax).
  Amount source is unresolved. Planned Dr 004.013 / Cr 211.100, Invoice Date.
DATA / NETWORK
  Native FIN reads by field IDs; no Airtable record writes. The blocked handler
  throws before POST. No migrated category remains in this source.
LOCAL CHECK
  node airtable/check-invoice-created.cjs
*/
