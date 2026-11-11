// Reverse the stored journals of one FIN source record. Never recalculate source amounts.
import type { Sql, TransactionSql } from "npm:postgres@3.4.9";
import { holdForReview, lockLedgerSource } from "../_shared/period-review.ts";
import { PostingError } from "../ledger-payment/errors.ts";

export interface ReversalRequest {
  source: { tableId: string; recordId: string };
  journalEntryIds?: string[];
  reversalDate: string;
}

interface OriginalJournal {
  id: string;
  status: string;
  rule_code: string | null;
  reversible: boolean | null;
  reversal_id: string | null;
  reversal_status: string | null;
  reversal_date: string | null;
}

export interface ReversalResult {
  status?: "pending_review" | "rejected";
  requestId?: string;
  source: ReversalRequest["source"];
  journalEntryIds: string[];
  reversalJournalEntryIds: string[];
  reversedCount: number;
  duplicateCount: number;
  results: { journalEntryId: string; reversalJournalEntryId: string; status: "reversed" | "already_reversed" }[];
}

const PAYMENTS = "tblR61NG9i0giid28";
const INVOICES = "tbldQXuqNEp8G5pfs";
const SOURCES = [PAYMENTS, INVOICES, "tblV26TC0f6CKDneL", "tblC0dbO5UMXzHma9", "tbl1LgiUYt7Gc492d", "tblAxlsdmJN0X0sQs"];

// ==================== CORE ====================

export async function reverseJournals(sql: Sql, request: ReversalRequest, options: {transaction?: TransactionSql; approvalRequestId?: string} = {}): Promise<ReversalResult> {
  validateRequest(request);
  const { source, reversalDate, journalEntryIds = [] } = request;
  const execute = async (tx: TransactionSql): Promise<ReversalResult> => {
    await tx`set local role service_role`;
    await lockLedgerSource(tx,source);
    const originals = await tx<OriginalJournal[]>`select e.id::text, e.status, e.rule_code, r.reversible,
      rev.id::text as reversal_id, rev.status as reversal_status, rev.entry_date::text as reversal_date
      from public.journal_entries e
      left join public.ledger_rules r on r.rule_code=e.rule_code
      left join public.journal_entries rev on rev.reverses_entry_id=e.id
      where e.source_system='airtable' and e.source_table=${source.tableId}
        and e.source_record_id=${source.recordId} and e.reverses_entry_id is null
      order by e.id for update of e`;
    const ownedIds = new Set(originals.map(entry => entry.id));
    if (journalEntryIds.some(id => !ownedIds.has(id.toLowerCase()))) {
      throw new PostingError("A supplied journal does not belong to this source record.");
    }
    const result: ReversalResult = {
      source: { tableId: source.tableId, recordId: source.recordId },
      journalEntryIds: originals.map(entry => entry.id), reversalJournalEntryIds: [],
      reversedCount: 0, duplicateCount: 0, results: [],
    };
    // Capture the complete target set so approval cannot silently reverse additional later journals.
    if (originals.some(entry => !entry.reversal_id)) {
      for (const entry of originals) {
        if (entry.status !== "posted" || (!entry.reversal_id && entry.reversible === false)) throw new PostingError("Only posted, reversible journals can be reversed.");
      }
      if (options.approvalRequestId) {
        const [review] = await tx`select target_journal_ids from public.ledger_posting_requests where id=${options.approvalRequestId}::uuid`;
        if (JSON.stringify([...review.target_journal_ids].sort()) !== JSON.stringify([...ownedIds].sort())) throw new PostingError("Source journal set changed. Submit the reversal for review again.","23505");
      }
      const held = await holdForReview(tx,{kind:"reversal",source,eventType:"reversed",date:reversalDate,payload:request,targetIds:[...ownedIds]},options.approvalRequestId);
      if (held) return {...result,reversalJournalEntryIds:originals.flatMap(entry => entry.reversal_id ? [entry.reversal_id] : []),...held};
    }
    for (const entry of originals) {
      if (entry.status !== "posted") throw new PostingError("Only posted journals can be reversed.");
      let reversalId = entry.reversal_id;
      if (reversalId) {
        if (entry.reversal_status !== "posted" || entry.reversal_date !== reversalDate) {
          throw new PostingError("An existing reversal is unposted or has a different date. Review it before retrying.", "23505");
        }
        result.duplicateCount++;
      } else {
        if (entry.reversible === false) throw new PostingError(`Rule ${entry.rule_code} is marked not reversible.`);
        reversalId = await createReversal(tx, entry.id, reversalDate, options.approvalRequestId);
        result.reversedCount++;
      }
      result.reversalJournalEntryIds.push(reversalId);
      result.results.push({ journalEntryId: entry.id, reversalJournalEntryId: reversalId, status: entry.reversal_id ? "already_reversed" : "reversed" });
    }
    return result;
  };
  return options.transaction ? execute(options.transaction) : sql.begin(execute);
}

// ==================== UTILS ====================

async function createReversal(tx: TransactionSql, originalId: string, date: string, requestId?: string): Promise<string> {
  const [created] = await tx<{ id: string }[]>`insert into public.journal_entries
    (entry_date, source_date, posting_request_id, rule_code, transaction_type, source_event_type, description, notes, audit_link,
      source_system, source_table, source_record_id, source_entry_key, external_ref, reverses_entry_id, reversal_reason)
    select ${date}::date, source_date, ${requestId ?? null}::uuid, rule_code, transaction_type, 'reversed',
      'Reversal of JE #' || entry_number || ': ' || description, notes, audit_link,
      source_system, source_table, source_record_id, source_entry_key, external_ref, id, 'Reversed from Airtable'
    from public.journal_entries where id=${originalId}::uuid returning id::text`;
  await tx`insert into public.journal_lines
    (entry_id, line_no, account_code, offset_account_code, debit, credit, notes, audit_link,
      vendor_ref, customer_ref, order_ref, po_ref, invoice_ref, employee_ref, state_ref, state_code,
      airtable_record_id, airtable_record_ids, branch)
    select ${created.id}::uuid, line_no, account_code, offset_account_code, credit, debit, notes, audit_link,
      vendor_ref, customer_ref, order_ref, po_ref, invoice_ref, employee_ref, state_ref, state_code,
      airtable_record_id, airtable_record_ids, branch
    from public.journal_lines where entry_id=${originalId}::uuid order by line_no`;
  // Existing guards enforce balance, open periods, account validity and posted immutability.
  await tx`update public.journal_entries set status='posted' where id=${created.id}::uuid`;
  return created.id;
}

function validateRequest(request: ReversalRequest): void {
  const source = request?.source;
  if (!source || !SOURCES.includes(source.tableId) || typeof source.recordId !== "string" || !/^rec[A-Za-z0-9]{14}$/.test(source.recordId)) {
    throw new PostingError("source must identify a FIN Payments, Invoices, Invoice Lines, Depreciation Table or Prepay Expenses Log record.");
  }
  if (request.journalEntryIds !== undefined && (!Array.isArray(request.journalEntryIds) || request.journalEntryIds.some(id => typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))) {
    throw new PostingError("journalEntryIds, if supplied, must be an array of journal UUIDs.");
  }
  const date = request.reversalDate;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new PostingError("reversalDate must be a valid YYYY-MM-DD date.");
  }
}
