// FIN Reverse Ledger - stamp Reverse Date once, request reversal, then save the journal IDs.
// Runtime: native Airtable automation. Secret: Dual Ledger Webhook Secret. See DOCS below.

// ==================== CORE ====================

async function main() {
    const fields = SOURCE_FIELDS[sourceTableId];
    if (!fields) throw new Error("Use the FIN Payments or Invoices table ID.");
    if (!sourceRecordId) throw new Error("Map sourceRecordId to the trigger's FIN Airtable record ID.");
    if (!ledgerReversalUrl) throw new Error("Map ledgerReversalUrl to the dedicated ledger-reversal endpoint.");
    const table = base.getTable(sourceTableId);
    const record = await table.selectRecordAsync(sourceRecordId, { fields: [fields.reverse, fields.reverseDate, fields.journalIds] });
    if (!record) throw new Error(`Source record not found: ${sourceRecordId}`);
    if (!record.getCellValue(fields.reverse)) {
        console.log("Reverse Ledger is unchecked. No action.");
        return;
    }
    const journalEntryIds = JSON.parse(record.getCellValueAsString(fields.journalIds) || "[]");
    let reversalDate = record.getCellValue(fields.reverseDate);
    if (!reversalDate) {
        reversalDate = chicagoToday();
        // Persist before the request so a failed run or retry keeps the same accounting date.
        await table.updateRecordAsync(record.id, { [fields.reverseDate]: reversalDate });
    }
    const response = await fetch(ledgerReversalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ledger-secret": input.secret("Dual Ledger Webhook Secret") },
        body: JSON.stringify({ source: { tableId: sourceTableId, recordId: record.id }, journalEntryIds, reversalDate }),
    });
    if (!response.ok) throw new Error(`Ledger reversal failed (${response.status}): ${await response.text()}`);
    const result = await response.json();
    if (result.status === "pending_review" || result.status === "rejected") {
        console.log(`Ledger reversal: ${result.status}\nReview request: ${result.requestId}\nNo reversal journal IDs were written.`);
        return;
    }
    if (result.source?.tableId !== sourceTableId || result.source?.recordId !== record.id || !Array.isArray(result.journalEntryIds) || !Array.isArray(result.reversalJournalEntryIds) || !Array.isArray(result.results)) {
        throw new Error("Unexpected reversal response. Journal ID fields were not changed.");
    }
    await table.updateRecordAsync(record.id, {
        [fields.journalIds]: JSON.stringify(result.journalEntryIds),
        [fields.reversalIds]: JSON.stringify(result.reversalJournalEntryIds),
    });
    printResult(record.id, reversalDate, result);
}

// ==================== UTILS ====================

/** @type {Record<string, {reverse: string, reverseDate: string, journalIds: string, reversalIds: string}>} */
const SOURCE_FIELDS = {
    tblR61NG9i0giid28: { // FIN Payments
        reverse: "fldNtEQiswXd8mODj", reverseDate: "fldXItbQ15eokPT0P",
        journalIds: "fldUTQWnsCYxYZ8wa", reversalIds: "fld7j7LKJNbgfyFhk",
    },
    tbldQXuqNEp8G5pfs: { // FIN Invoices
        reverse: "fldOZh1NZmJi9tqkb", reverseDate: "fld1SzFreZ84owLgq",
        journalIds: "fldLqYrXCySCoZRQT", reversalIds: "fldKWzgJ7ypvfn6Jw",
    },
};

function chicagoToday() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date()).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}

const { sourceTableId, sourceRecordId, ledgerReversalUrl } = input.config();
await main();

// ==================== HELPER ====================

function printResult(recordId, date, result) {
    const lines = ["--------------------------------------------------------", "LEDGER REVERSAL", "--------------------------------------------------------",
        `Record ID: ${recordId}`, `Reverse Date: ${date}`, `Journals reversed: ${result.reversedCount}`, `Already reversed: ${result.duplicateCount}`];
    if (!result.journalEntryIds.length) lines.push("No posted journals found for this record.");
    for (const entry of result.results) lines.push("", `Original journal: ${entry.journalEntryId}`, `Reversal journal: ${entry.reversalJournalEntryId}`, `Result: ${entry.status}`);
    console.log(lines.join("\n"));
}

/*
DOCS
PURPOSE / RUNTIME
  Native FIN automation. One record read; no category, allocation or amount calculations.
  One instance for Payments, another for Invoices. Trigger: Reverse Ledger is checked.
INPUTS / SECRET
  sourceTableId: fixed FIN Payments tblR61NG9i0giid28 or Invoices tbldQXuqNEp8G5pfs.
  sourceRecordId: trigger's Airtable record ID.
  SOURCE_FIELDS holds the created field IDs for each table. Reverse Date is manual date-only;
  Ledger Journal IDs and Reversal Journal IDs are long-text JSON arrays.
  ledgerReversalUrl: https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-reversal
  Secret: Dual Ledger Webhook Secret, matching Edge LEDGER_WEBHOOK_SECRET.
WRITES / RETRIES
  Stamp an empty Reverse Date with today's America/Chicago date before the webhook.
  Keep an existing manual date unchanged, including after failure or retry.
  After success, refresh both ID lists from the authoritative Supabase response.
  No automatic retry. Rerun the same request after failure; the receiver deduplicates.
  Never clear dates, IDs or checkboxes. Unchecking does nothing; restoration is deferred.
  No linked payments/invoices are reversed merely because they reference this record.
LOCAL CHECK
  node airtable/check-ledger-reversal.cjs
*/
