// FIN payment events - qualify cancellation/reconciliation and send a ledger webhook.
// Airtable inputs: paymentRecordId, eventType, ledgerWebhookUrl.
// Secret: Dual Ledger Webhook Secret. See DOCS at bottom.

// ==================== CORE ====================
// Each category checks its filters, then handles and logs a match.

async function handleClientPaymentCancelled(data, results) {
    // Partial implementation - functioning: current cancellation entry works; the new cancellation/deletion workflow is deferred.
    const { payment, eventType, invoiceType, vendorType } = data;
    if (
        eventType !== "cancelled" ||
        !payment.getCellValue(PAYMENT_FIELDS.cancelled) ||
        invoiceType !== "AR" ||
        vendorType !== "AR - Product"
    ) return;

    const cents = moneyCents(payment.getCellValue(PAYMENT_FIELDS.amount), "Payment Amount");
    const postings = [];
    const invoiceDetails = [];
    if (cents) {
        const invoices = await readRecords(TABLES.invoices, linkedIds(payment, PAYMENT_FIELDS.invoices), Object.values(INVOICE_FIELDS));
        if (!invoices.length) throw new Error("An AR cancellation needs linked invoices to identify its deposit or receivable accounts.");
        const bank = await loadPaymentAccount(data);
        const shares = invoiceShares(cents, invoices);
        const paymentDate = payment.getCellValue(PAYMENT_FIELDS.date);
        for (const invoice of invoices) {
            const shipOutDate = parseFirstShipOutDate(invoice);
            const account = !paymentDate || !shipOutDate || paymentDate <= shipOutDate ? "221.100" : "121.100";
            const amount = shares.get(invoice.id);
            const clients = linkedIds(invoice, INVOICE_FIELDS.clients);
            invoiceDetails.push({ id: invoice.id, name: invoice.name, shipOutDate, amount: moneyString(amount), account });
            if (!amount) continue;
            postings.push({
                debitAccount: { number: account }, creditAccount: bank, amount: moneyString(amount),
                sourceRecordId: payment.id, invoiceRecordId: invoice.id,
                clientRecordIds: clients, clientRecordId: clients.length === 1 ? clients[0] : undefined,
                branch: invoice.getCellValue(INVOICE_FIELDS.branch)?.name,
            });
        }
    }

    const accounts = [...new Set(postings.map(posting => posting.debitAccount.number))];
    for (const entryKey of accounts.length ? accounts : [""]) {
        results.push({
            category: "Client payment voided / bounced", tChartRow: 7, entryKey,
            postings: postings.filter(posting => posting.debitAccount.number === entryKey),
            invoices: invoiceDetails.filter(invoice => invoice.account === entryKey),
            ...formatMatchDetails(data, [PAYMENT_FIELDS.cancelled, PAYMENT_FIELDS.type, PAYMENT_FIELDS.vendorType, PAYMENT_FIELDS.date, PAYMENT_FIELDS.amount]),
        });
    }
}

async function handleVendorPaymentCancelled(data, results) {
    // Partial implementation - functioning: current cancellation entry works; the new cancellation/deletion workflow is deferred.
    const { payment, eventType, invoiceType } = data;
    if (eventType !== "cancelled" || !payment.getCellValue(PAYMENT_FIELDS.cancelled) || invoiceType !== "AP") return;

    const cents = moneyCents(payment.getCellValue(PAYMENT_FIELDS.amount), "Payment Amount");

    results.push({
        category: "Vendor payment cancelled / returned", tChartRow: 13,
        postings: cents ? [{ debitAccount: { number: "112.100" }, creditAccount: { number: "211.100" }, amount: moneyString(cents), sourceRecordId: payment.id }] : [],
        ...formatMatchDetails(data, [PAYMENT_FIELDS.cancelled, PAYMENT_FIELDS.type, PAYMENT_FIELDS.amount]),
    });
}

async function handleBankReconciliationDifference(data, results) {
    const { payment, eventType } = data;
    if (
        eventType !== "reconciled" ||
        !payment.getCellValue(PAYMENT_FIELDS.reconciled) ||
        (payment.getCellValue(PAYMENT_FIELDS.discrepancy) || 0) === 0
    ) return;

    const amount = moneyCents(payment.getCellValue(PAYMENT_FIELDS.discrepancy), "Reconciled Amount Discrepancy");
    const bank = amount ? await loadPaymentAccount(data) : null;
    results.push({
        category: "Bank reconciliation rounding difference", tChartRow: 27,
        postings: amount ? [{
            debitAccount: { number: "007.002" }, creditAccount: bank,
            amount: moneyString(amount), sourceRecordId: payment.id,
        }] : [],
        ...formatMatchDetails(data, [PAYMENT_FIELDS.reconciled, PAYMENT_FIELDS.discrepancy]),
    });
}
// ==================== UTILS ====================
// Configuration, shared native data reads and the category runner.

const TABLES = { payments: "tblR61NG9i0giid28", accounts: "tblJ2RF8vlOhNMBKR", invoices: "tbldQXuqNEp8G5pfs" };
const ACCOUNT_FIELDS = { number: "fldTjgAITNrJVCCWq" };
const PAYMENT_FIELDS = {
    name: "fld0WzELo8ivaRfEb",            // Payment formula (primary display name)
    amount: "fldhP2S68pT3XkZmX",          // Amount
    date: "fld0mYG8IMrDaNzdE",             // Payment Date
    reference: "fldxjaur2SnqKmRfN",       // Reference Number
    method: "fldu02yC1LElzDabE",           // Method - AP
    methodAR: "fldICKCPwydpwAPL1",        // Method - AR
    accounts: "fldCIQSOdytBGi91S",        // Account to Pay/Receive
    cancelledDate: "fldsRLo5cO8fSdut8",    // Payment Cancelled Date
    reconciledDate: "fldnw5Y6ATOWrhNJq",  // Reconciliation Date - Combined
    invoices: "fldzPDwsJ1ZT2tVIs",      // Master Invoice Table

    vendorType: "fldJlmVZzUf5tuz0m",       // Vendor Type (includes override)
    vendorTypesAP: "fldXsmHPdtpkNKFun",    // Vendor Type AP (New), raw rollup
    vendorTypesAR: "fldRIZiZhwJb4rztx",    // Vendor Type AR (New), raw rollup

    cancelled: "fldpmVZHFDVYEhUvo",        // Cancel Payment
    reconciled: "fldFpyRR8rlLXE4WO",       // Reconciled
    discrepancy: "fldo8tnQ820K5aYyv",      // Reconciled Amount Discrepancy
    type: "fldkoW3MMQEe0Lwm1",             // Invoice Type
};
const INVOICE_FIELDS = {
    name: "fldMZyzqDidRujeZS",         // Invoice ID (primary display name)
    amountToPay: "fldNqZMZsZfRPiRFp", // Invoice Amount To Pay
    firstShipDate: "fldXs88CyaF07XyWv", // First Ship Out Date (from Linked Transaction)
    clients: "fld9aY5ze2BbaoWG5",      // Linked Client (FIN)
    branch: "fldt5PjqGDrINUYT5",       // Branch
};

function linkedIds(record, fieldId) { return [...new Set((record.getCellValue(fieldId) || []).map(link => link.id))]; }

async function readRecords(tableId, recordIds, fields) {
    const ids = [...new Set(recordIds)];
    const records = [];
    for (let start = 0; start < ids.length; start += 100) {
        const batch = ids.slice(start, start + 100);
        const query = await base.getTable(tableId).selectRecordsAsync({ recordIds: batch, fields });
        const found = new Set(query.records.map(record => record.id));
        const missing = batch.filter(id => !found.has(id));
        if (missing.length) throw new Error(`Missing linked records in ${tableId}: ${missing.join(", ")}`);
        records.push(...query.records);
    }
    return records;
}
async function loadPaymentData(paymentRecordId) {
    if (!paymentRecordId) throw new Error("Map paymentRecordId to the trigger's Airtable record ID.");
    const payment = await base.getTable(TABLES.payments).selectRecordAsync(paymentRecordId, { fields: Object.values(PAYMENT_FIELDS) });
    if (!payment) throw new Error(`Payment not found: ${paymentRecordId}`);
    const vendorTypes = [...new Set([
        payment.getCellValue(PAYMENT_FIELDS.vendorTypesAP),
        payment.getCellValue(PAYMENT_FIELDS.vendorTypesAR),
    ].flat().filter(Boolean))];
    if (vendorTypes.length > 1) throw new Error(`Payment ${payment.id} has multiple Vendor Types: ${vendorTypes.join(", ")}. Correct the payment links before processing.`);
    return { payment, invoiceType: payment.getCellValueAsString(PAYMENT_FIELDS.type), vendorType: payment.getCellValueAsString(PAYMENT_FIELDS.vendorType) };
}

async function main(paymentRecordId, eventType) {
    if (!["cancelled", "reconciled"].includes(eventType)) throw new Error("Set eventType to cancelled or reconciled for this automation.");
    const data = { ...await loadPaymentData(paymentRecordId), eventType };
    /** @type {any[]} */
    const results = [];

    await handleClientPaymentCancelled(data, results);
    await handleVendorPaymentCancelled(data, results);
    await handleBankReconciliationDifference(data, results);

    printResults(results, data, eventType, results.length ? "" : getNoMatchReason(data));
    const postingResponse = await pushWebhook(data, results, eventType);
    if (postingResponse) printPostingResponse(postingResponse);
    return results;
}

function moneyCents(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} is missing or is not a finite number.`);
    const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
    const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
    if (!Number.isSafeInteger(cents)) throw new Error(`${label} exceeds safe cent precision.`);
    return cents === 0 ? 0 : cents;
}

function moneyString(cents) { return (cents / 100).toFixed(2); }

function invoiceShares(totalCents, invoices) {
    if (invoices.length === 1) return new Map([[invoices[0].id, totalCents]]);
    const weights = invoices.map(invoice => ({ id: invoice.id, cents: moneyCents(invoice.getCellValue(INVOICE_FIELDS.amountToPay), `Invoice ${invoice.id} Amount To Pay`) }));
    if (new Set(weights.filter(value => value.cents).map(value => Math.sign(value.cents))).size > 1) throw new Error("Mixed-sign invoice amounts require an explicit allocation before posting.");
    const ordered = weights.map(value => ({ ...value, cents: Math.abs(value.cents) })).sort((a, b) => a.id.localeCompare(b.id));
    const sum = ordered.reduce((total, weight) => total + weight.cents, 0);
    if (!sum) throw new Error("Cannot allocate a payment against zero invoice amounts.");
    const parts = ordered.map(weight => {
        const product = totalCents * weight.cents;
        if (!Number.isSafeInteger(product)) throw new Error("Allocation exceeds safe cent precision.");
        return { id: weight.id, cents: Math.trunc(product / sum), remainder: product % sum };
    });
    const direction = Math.sign(totalCents);
    let remainder = totalCents - parts.reduce((total, part) => total + part.cents, 0);
    for (const part of [...parts].sort((a, b) => direction * (b.remainder - a.remainder) || a.id.localeCompare(b.id))) {
        if (!remainder) break;
        part.cents += direction;
        remainder -= direction;
    }
    return new Map(parts.map(part => [part.id, part.cents]));
}

function parseFirstShipOutDate(invoice) {
    const value = invoice.getCellValueAsString(INVOICE_FIELDS.firstShipDate);
    if (!value) return "";
    // This lookup is limited to one M/D/YYYY date. Compare without a timezone shift.
    const [month, day, year] = value.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function chicagoDate(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
    const field = type => {
        const part = parts.find(part => part.type === type);
        if (!part) throw new Error(`Cannot derive ${type} from the event date.`);
        return part.value;
    };
    return `${field("year")}-${field("month")}-${field("day")}`;
}

async function loadPaymentAccount(data) {
    if (data.paymentAccount) return data.paymentAccount;
    const links = data.payment.getCellValue(PAYMENT_FIELDS.accounts) || [];
    if (links.length !== 1) throw new Error("The payment must identify one payment account.");
    const account = await base.getTable(TABLES.accounts).selectRecordAsync(links[0].id, { fields: Object.values(ACCOUNT_FIELDS) });
    if (!account) throw new Error(`Payment account not found: ${links[0].id}`);
    data.paymentAccount = { recordId: account.id, number: account.getCellValueAsString(ACCOUNT_FIELDS.number) };
    return data.paymentAccount;
}

async function pushWebhook(data, results, eventType) {
    if (!results.length) return;
    if (!ledgerWebhookUrl) throw new Error("Map ledgerWebhookUrl to the deployed ledger-payment function URL.");
    let dateValue;
    if (eventType === "cancelled") dateValue = data.payment.getCellValue(PAYMENT_FIELDS.cancelledDate);
    if (eventType === "reconciled") dateValue = data.payment.getCellValue(PAYMENT_FIELDS.reconciledDate);
    if (!dateValue) throw new Error(`The ${eventType} effective date is missing.`);
    const entryDate = chicagoDate(dateValue);
    const rawAmount = data.payment.getCellValue(PAYMENT_FIELDS.amount);
    const payload = {
        paymentRecordId: data.payment.id, eventType, entryDate,
        paymentName: data.payment.getCellValueAsString(PAYMENT_FIELDS.name) || data.payment.id,
        referenceNumber: data.payment.getCellValueAsString(PAYMENT_FIELDS.reference),
        paymentAmount: rawAmount == null ? null : moneyString(moneyCents(rawAmount, "Payment Amount")),
        invoiceType: data.invoiceType,
        paymentMethod: data.payment.getCellValueAsString(PAYMENT_FIELDS.method) || data.payment.getCellValueAsString(PAYMENT_FIELDS.methodAR),
        paymentAccount: data.paymentAccount || null,
        categories: results.map(result => ({ ruleCode: `PAY-${String(result.tChartRow - 1).padStart(2, "0")}`, entryKey: result.entryKey, transactionType: result.category.trim().replace(/[\u2013\u2014]/g, "-"), postings: result.postings })),
    };
    return postLedgerPayload(payload);
}

async function postLedgerPayload(payload) {
    const response = await fetch(ledgerWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ledger-secret": input.secret("Dual Ledger Webhook Secret") },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Ledger webhook failed (${response.status}): ${await response.text()}`);
    return await response.json();
}

const { paymentRecordId, eventType, ledgerWebhookUrl } = input.config();
await main(paymentRecordId, eventType);

// ==================== HELPER ====================
function printPostingResponse(response) {
    if (response.status === "pending_review" || response.status === "rejected") {
        console.log(`Ledger: ${response.status}\nReview request: ${response.requestId}\nNo journals were posted.`);
        return;
    }
    const report = ["--------------------------------------------------------", "LEDGER RESULT", "--------------------------------------------------------"];
    for (const result of response.results || []) {
        report.push(`Rule: ${result.ruleCode}`, `Status: ${result.status}`);
        for (const id of result.journalEntryIds || (result.journalEntryId ? [result.journalEntryId] : [])) report.push(`Journal ID: ${id}`);
    }
    console.log(report.join("\n"));
}

// Result details and console formatting only. No qualification or posting.

function getNoMatchReason(data) {
    const { payment, eventType, invoiceType } = data;
    let reason = "No approved category qualifies for this payment's Invoice Type.";
    if (eventType === "cancelled" && !payment.getCellValue(PAYMENT_FIELDS.cancelled)) reason = "Cancel Payment is not checked.";
    if (eventType === "reconciled") reason = "Reconciled Amount Discrepancy is zero.";
    if (eventType === "reconciled" && !payment.getCellValue(PAYMENT_FIELDS.reconciled)) reason = "Reconciled is not checked.";
    if (eventType === "cancelled" && payment.getCellValue(PAYMENT_FIELDS.cancelled) && invoiceType === "AR") {
        reason = "Payments.Vendor Type is not AR - Product.";
    }
    return reason;
}

function formatFields(tableId, record, fieldIds) {
    const table = base.getTable(tableId);
    return Object.fromEntries(fieldIds.map(fieldId => [table.getField(fieldId).name, record.getCellValue(fieldId)]));
}

function formatMatchDetails(data, paymentFieldIds) {
    return { paymentRecordId: data.payment.id, paymentFilters: formatFields(TABLES.payments, data.payment, paymentFieldIds) };
}

function formatValue(value) {
    if (value == null) return "(empty)";
    if (typeof value === "boolean") return value ? "checked" : "unchecked";
    if (typeof value === "number") return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return typeof value === "object" ? value.name : String(value);
}

function printResults(results, data, eventType, reason = "") {
    const divider = "--------------------------------------------------------";
    const eventName = "Payment " + eventType.charAt(0).toUpperCase() + eventType.slice(1);
    const report = [divider, "PAYMENT SUMMARY", divider, `Payment ID: ${data.payment.id}`, `Event: ${eventName}`, `Matched categories: ${new Set(results.map(result => result.tChartRow)).size}`, `Prepared journals: ${results.length}`];
    for (const [index, match] of results.entries()) {
        report.push("", divider, `MATCH ${index + 1}`, divider, `Category: ${match.category}`, `T-Chart row: ${match.tChartRow}`, "", "PAYMENT FILTERS");
        if (match.entryKey) report.push(`Account entry: ${match.entryKey}`);
        for (const [name, value] of Object.entries(match.paymentFilters)) report.push(`${name}: ${formatValue(value)}`);
        for (const invoice of match.invoices || []) report.push("", "INVOICE", `Invoice name: ${invoice.name}`, `Invoice ID: ${invoice.id}`, `First shipment date: ${invoice.shipOutDate || "(empty)"}`, `Allocated amount: ${invoice.amount}`, `Debit account: ${invoice.account}`);
    }
    if (!results.length) report.push("", "No approved category matched.");
    if (reason) report.push(`Reason: ${reason}`);
    console.log(report.join("\n"));
}

/*
DOCS
PURPOSE / RUNTIME
  Native FIN Airtable event script. Existing category filters remain authoritative.
  Calculate current-amount cancellation entries and reconciliation account pairs locally.
  These are new ledger records, not reversals or deletions of prior posted entries.
INPUTS / SECRET
  paymentRecordId: FIN Payments record ID.
  eventType: fixed cancelled or reconciled for the automation.
  Sent handles Return Payment (AP); the legacy Returned automation was deleted.
  ledgerWebhookUrl: deployed ledger-payment Edge Function URL.
  Secret: Dual Ledger Webhook Secret, matching Edge LEDGER_WEBHOOK_SECRET.
DATES
  Cancelled uses Payment Cancelled Date.
  Reconciled uses the existing combined date.
  Date-only values are preserved; timestamps are converted to America/Chicago.
  Missing event dates fail before the POST. No financial date is inferred from posted_at.
OWNERSHIP / NETWORK
  Native FIN reads only; no Airtable records are written. One POST after qualification.
  Cancellation uses signed current Payment Amount. AP debits Fifth Third Bank
  112.100 and credits AP 211.100, matching the T-Chart. AR debits deposits 221.100 for blank dates or payments
  on/before first shipment, otherwise AR 121.100, and credits the selected bank.
  Multi-invoice AR amounts allocate by Amount To Pay with exact cent conservation.
  Zero amounts are no-ops; missing amounts or invoice/account context fail.
  Reconciliation uses the signed discrepancy: debit 007.002 and credit the
  payment bank, following the chart. No AP/AR sign flip or suspense threshold is added.
  No original-journal lookup is made.
  No automatic retries. A repeat uses the same source/category identity at Supabase.
LOCAL CHECK
  node airtable/check.cjs
*/
