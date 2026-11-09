// FIN Prepay Created - post the recorded monthly prepaid use-up amount.
// Inputs: prepayLogRecordId, ledgerWebhookUrl. Secret: Dual Ledger Webhook Secret.
// See DOCS at bottom.

// ==================== CORE ====================

async function handlePrepaidUse(data, results) {
    const cents = moneyCents(data.record.getCellValue(FIELDS.amount));
    const note = data.record.getCellValueAsString(FIELDS.name);
    results.push({
        category: "Prepaid expense - monthly use-up", tChartRow: 5,
        notes: note || undefined,
        postings: cents ? [{ debitAccount: { number: "007.011" }, creditAccount: { number: "135.000" }, amount: (cents / 100).toFixed(2), sourceRecordId: data.record.id, invoiceRecordIds: data.invoiceIds, ...(data.invoiceIds.length === 1 ? { invoiceRecordId: data.invoiceIds[0] } : {}), branch: data.branches }] : [],
    });
}

// ==================== UTILS ====================

const TABLE = "tbl1LgiUYt7Gc492d"; // FIN Prepay Expenses Log
const FIELDS = {
    name: "fldBuTnJqQ5ymPhRt",   // Prepay Log (primary formula)
    date: "fldXoWjXIrS76p84x",   // Applied Date
    invoices: "fldg3040Hc1Z6AQoe", // Invoices
    amount: "fld5NmFxp9Dhza6BK", // Amount Deducted
};
const INVOICES = "tbldQXuqNEp8G5pfs";
const BRANCH = "fldt5PjqGDrINUYT5"; // Invoices.Branch

async function main(prepayLogRecordId) {
    const data = await loadPrepayData(prepayLogRecordId);
    /** @type {any[]} */
    const results = [];
    await handlePrepaidUse(data, results);
    printResults(data, results);
    const entryDate = data.record.getCellValue(FIELDS.date);
    if (!entryDate) throw new Error("Date is required for prepay posting.");
    if (!ledgerWebhookUrl) throw new Error("Map ledgerWebhookUrl to the deployed ledger-payment Edge Function URL.");
    const response = await postLedgerPayload({
        prepayLogRecordId: data.record.id, eventType: "created", entryDate,
        source: { tableId: TABLE, recordId: data.record.id, recordName: data.record.name },
        referenceNumber: data.record.id,
        categories: results.map(result => ({ ruleCode: "EXP-04", transactionType: result.category, postings: result.postings, notes: result.notes })),
    });
    printPostingResponse(response);
    return results;
}

async function loadPrepayData(prepayLogRecordId) {
    if (!prepayLogRecordId) throw new Error("Map prepayLogRecordId to the trigger's FIN Airtable record ID.");
    const record = await base.getTable(TABLE).selectRecordAsync(prepayLogRecordId, { fields: Object.values(FIELDS) });
    if (!record) throw new Error(`Prepay record not found: ${prepayLogRecordId}`);
    const invoiceIds = [...new Set((record.getCellValue(FIELDS.invoices) || []).map(link => link.id))];
    const branches = [];
    for (let start = 0; start < invoiceIds.length; start += 100) {
        const ids = invoiceIds.slice(start, start + 100);
        const query = await base.getTable(INVOICES).selectRecordsAsync({ recordIds: ids, fields: [BRANCH] });
        const missing = ids.filter(id => !query.records.some(invoice => invoice.id === id));
        if (missing.length) throw new Error(`Linked invoice not found: ${missing.join(", ")}`);
        for (const invoice of query.records) branches.push(invoice.getCellValue(BRANCH)?.name || "");
    }
    return { record, invoiceIds, branches: [...new Set(branches)] };
}

function moneyCents(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Amount Deducted is missing or is not a finite number.`);
    const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
    const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
    if (!Number.isSafeInteger(cents)) throw new Error(`Amount Deducted exceeds safe cent precision.`);
    return cents === 0 ? 0 : cents;
}

async function postLedgerPayload(payload) {
    const response = await fetch(ledgerWebhookUrl, {
        method: "POST", headers: { "Content-Type": "application/json", "x-ledger-secret": input.secret("Dual Ledger Webhook Secret") },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Ledger webhook failed (${response.status}): ${await response.text()}`);
    return await response.json();
}

const { prepayLogRecordId, ledgerWebhookUrl } = input.config();
await main(prepayLogRecordId);

// ==================== HELPER ====================

function printResults(data, results) {
    const report = ["--------------------------------------------------------", "PREPAY CREATED SUMMARY", "--------------------------------------------------------", `Record name: ${data.record.name}`, `Record ID: ${data.record.id}`, `Date: ${data.record.getCellValue(FIELDS.date) || "(empty)"}`, `Matched categories: ${results.length}`];
    for (const result of results) {
        report.push("", `Category: ${result.category}`, `Rule: EXP-04`, `T-Chart row: ${result.tChartRow}`);
        for (const posting of result.postings) report.push(`Amount: ${posting.amount}`, `Debit account: ${posting.debitAccount.number}`, `Credit account: ${posting.creditAccount.number}`);
        if (result.notes) report.push(result.notes);
        if (!result.postings.length) report.push("Amount: 0.00", "No monetary posting.");
    }
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
        if (result.journalEntryId) report.push(`Journal ID: ${result.journalEntryId}`);
    }
    console.log(report.join("\n"));
}

/*
DOCS
PURPOSE / RUNTIME
  Native FIN Prepay Expenses Log record-created automation. CORE owns EXP-04;
  UTILS reads the log and invoice branches; HELPER formats console logs.
INPUTS / SECRET
  prepayLogRecordId: triggering FIN Prepay Expenses Log record ID.
  ledgerWebhookUrl: https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment
  Secret: Dual Ledger Webhook Secret, matching LEDGER_WEBHOOK_SECRET.
MAPPING
  Amount = Amount Deducted; Date = Applied Date; Notes = Prepay Log.
  Debit = 007.011 General Insurance; Credit = 135.000 Prepaid Expenses.
  Branch = linked Invoices.Branch; empty or mixed branches remain NULL in Supabase.
  Source and audit link = triggering log. Linked invoice IDs remain structured refs.
DATA / NETWORK
  Native FIN reads only. One authenticated POST after all reads and validation.
  No invented invoice or payment owner. Zero amount is a category no-op;
  missing, nonfinite or unsafe amounts fail; signed amounts are preserved. Date stays date-only.
  No automatic retry; exact replays deduplicate, changed packets conflict.
CHECK
  node airtable/check-prepay-created.cjs
*/
