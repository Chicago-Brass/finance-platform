// FIN Depreciation Created - post the recorded monthly depreciation amount.
// Inputs: depreciationRecordId, ledgerWebhookUrl. Secret: Dual Ledger Webhook Secret.
// See DOCS at bottom.

// ==================== CORE ====================

async function handleMonthlyDepreciation(data, results) {
    const cents = moneyCents(data.record.getCellValue(FIELDS.amount));
    const assets = data.record.getCellValue(FIELDS.assets) || [];
    results.push({
        category: "Monthly depreciation of equipment, vehicles, fixtures", tChartRow: 11,
        notes: assets.length ? "Associated asset: " + assets.map(asset => `${asset.name} (${asset.id})`).join("; ") : undefined,
        postings: cents ? [{ debitAccount: { number: "009.101" }, creditAccount: { number: "161.000" }, amount: (cents / 100).toFixed(2), sourceRecordId: data.record.id }] : [],
    });
}

// ==================== UTILS ====================

const TABLE = "tblC0dbO5UMXzHma9"; // FIN Depreciation Table
const FIELDS = {
    name: "fld9isGL0VoPVdkeU",   // Name (primary field)
    date: "fldQ299tE4wJB4SmH",   // Date (date-only)
    assets: "fldLXqVZ4TUaxq8kF", // Associated Asset
    amount: "fld58fd0YHB0YRxC1", // Amount Depreciated
};

async function main(depreciationRecordId) {
    const data = await loadDepreciationData(depreciationRecordId);
    /** @type {any[]} */
    const results = [];
    await handleMonthlyDepreciation(data, results);
    printResults(data, results);
    const entryDate = data.record.getCellValue(FIELDS.date);
    if (!entryDate) throw new Error("Date is required for depreciation posting.");
    if (!ledgerWebhookUrl) throw new Error("Map ledgerWebhookUrl to the deployed ledger-payment Edge Function URL.");
    const response = await postLedgerPayload({
        depreciationRecordId: data.record.id, eventType: "created", entryDate,
        source: { tableId: TABLE, recordId: data.record.id, recordName: data.record.name },
        referenceNumber: data.record.id,
        categories: results.map(result => ({ ruleCode: "EXP-10", transactionType: result.category, postings: result.postings, notes: result.notes })),
    });
    printPostingResponse(response);
    return results;
}

async function loadDepreciationData(depreciationRecordId) {
    if (!depreciationRecordId) throw new Error("Map depreciationRecordId to the trigger's FIN Airtable record ID.");
    const record = await base.getTable(TABLE).selectRecordAsync(depreciationRecordId, { fields: Object.values(FIELDS) });
    if (!record) throw new Error(`Depreciation record not found: ${depreciationRecordId}`);
    return { record };
}

function moneyCents(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Amount Depreciated is missing or is not a finite number.`);
    const [digits, exponent = "0"] = String(Math.abs(value)).split("e");
    const cents = Math.sign(value) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
    if (!Number.isSafeInteger(cents)) throw new Error(`Amount Depreciated exceeds safe cent precision.`);
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

const { depreciationRecordId, ledgerWebhookUrl } = input.config();
await main(depreciationRecordId);

// ==================== HELPER ====================

function printResults(data, results) {
    const report = ["--------------------------------------------------------", "DEPRECIATION CREATED SUMMARY", "--------------------------------------------------------", `Record name: ${data.record.name}`, `Record ID: ${data.record.id}`, `Date: ${data.record.getCellValue(FIELDS.date) || "(empty)"}`, `Matched categories: ${results.length}`];
    for (const result of results) {
        report.push("", `Category: ${result.category}`, `Rule: EXP-10`, `T-Chart row: ${result.tChartRow}`);
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
  Native FIN Depreciation Table record-created automation. CORE prepares EXP-10;
  UTILS reads and posts; HELPER formats logs. No monthly depreciation is recalculated.
INPUTS / SECRET
  depreciationRecordId: record ID from the FIN Depreciation Table trigger.
  ledgerWebhookUrl: https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment
  Secret: Dual Ledger Webhook Secret, matching LEDGER_WEBHOOK_SECRET.
MAPPING
  Category - Expenses row 11, EXP-10. No additional category filter.
  Amount = Amount Depreciated; Date = Date, unchanged as a date-only value.
  Debit = 009.101 Depreciation Expense; Credit = 161.000 Accumulated Depreciation.
  Associated Asset names and record IDs are stored in the journal header notes.
DATA / NETWORK
  One native record read by IDs and one authenticated POST; no Airtable writes.
  No fabricated payment/invoice identity. The journal audit link opens depreciation.
  Zero amount is a category no-op. Missing, nonfinite or unsafe amounts fail; signed amounts are preserved.
  No automatic retry; exact replays deduplicate and changed financial packets conflict.
  Record creation posts immediately, preserving Date even when it is in the future.
CHECK
  node airtable/check-depreciation-created.cjs
*/
