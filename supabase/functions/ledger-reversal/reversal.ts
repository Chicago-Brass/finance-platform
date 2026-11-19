// Reverse the stored journals of one FIN source record. Never recalculate source amounts.
import type { Sql, TransactionSql } from "npm:postgres@3.4.9";
import { holdForReview, lockLedgerSource, history, recordPendingJournals, rejectPendingJournals } from "../_shared/period-review.ts";
import { PostingError } from "../ledger-payment/errors.ts";
import { LOAN_TABLE } from "../_shared/loan-record.ts";
import { MANUAL_TABLE } from "../_shared/manual-journal.ts";

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
  posting_cycle: string | null;
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
  withdrewPending?: boolean;
  duplicateCount: number;
  results: { journalEntryId: string; reversalJournalEntryId: string; status: "reversed" | "already_reversed" }[];
}

const PAYMENTS = "tblR61NG9i0giid28";
const INVOICES = "tbldQXuqNEp8G5pfs";
const SOURCES = [LOAN_TABLE, PAYMENTS, INVOICES, "tblV26TC0f6CKDneL", "tblC0dbO5UMXzHma9", "tbl1LgiUYt7Gc492d", "tblrnXm1HN9y6HPxY", MANUAL_TABLE];

// ==================== CORE ====================

export async function reverseJournals(sql: Sql, request: ReversalRequest, options: {transaction?: TransactionSql; approvalRequestId?: string; approvalEntryDate?: string} = {}): Promise<ReversalResult> {
  validateRequest(request);
  const { source, reversalDate } = request;
  const journalEntryIds = (request.journalEntryIds ?? []).map(id => id.toLowerCase());
  const execute = async (tx: TransactionSql): Promise<ReversalResult> => {
    await tx`set local role service_role`;
    await lockLedgerSource(tx,source);
    const currentJournals = await tx<OriginalJournal[]>`select e.id::text, e.status, e.rule_code, e.posting_cycle::text, r.reversible,
      rev.id::text as reversal_id, rev.status as reversal_status, coalesce(review.accounting_date,rev.entry_date)::text as reversal_date
      from public.journal_entries e
      left join public.ledger_rules r on r.rule_code=e.rule_code
      left join public.journal_entries rev on rev.reverses_entry_id=e.id and rev.status in ('posted','pending')
      left join public.ledger_posting_requests review on review.id=rev.posting_request_id
      where e.source_system='airtable' and e.source_table=${source.tableId}
        and e.source_record_id=${source.recordId} and e.reverses_entry_id is null
        and e.id in (select id from ledger_private.current_airtable_journals(${source.tableId},${source.recordId}))
      order by e.id for update of e`;
    const withdrawn = await tx<{ id: string }[]>`select e.id::text from public.journal_entries e
      join public.ledger_posting_requests r on r.id=e.posting_request_id and r.kind='posting'
      join ledger_private.ledger_source_cancellations c on c.source_table=r.source_table and c.source_record_id=r.source_record_id
      where r.source_table=${source.tableId} and r.source_record_id=${source.recordId}
        and r.status='rejected' and r.review_reason='Source cancelled in Airtable'
        and c.reversal_date=${reversalDate}::date and e.status='rejected'`;
    const currentIds = new Set([...currentJournals.map(entry => entry.id), ...withdrawn.map(entry => entry.id)]);
    if (journalEntryIds.some(id => !currentIds.has(id.toLowerCase()))) {
      throw new PostingError("A supplied journal does not belong to this source record.");
    }
    const current = currentJournals.filter(entry => entry.status === "posted");
    const active = current.filter(entry => entry.reversal_status !== "posted");
    const reposted = current.some(entry => entry.posting_cycle);
    if (reposted && (
      !journalEntryIds.length || active.some(entry => !journalEntryIds.includes(entry.id))
    )) throw new PostingError("Send the current journal IDs to reverse a reposted source.", "23505");
    const originals = !reposted ? current : active.length ? active : current.filter(entry => journalEntryIds.includes(entry.id) && entry.reversal_date === reversalDate);
    if (current.length && !originals.length) throw new PostingError("An existing reversal has a different date. Review it before retrying.", "23505");
    const ownedIds = new Set(originals.map(entry => entry.id));
    // Keep cancellation intent even when no journal exists yet or the reversal awaits review.
    await tx`insert into ledger_private.ledger_source_cancellations(source_table,source_record_id,reversal_date)
      values (${source.tableId},${source.recordId},${reversalDate}::date) on conflict(source_table,source_record_id) do nothing`;
    const pending = await tx`update public.ledger_posting_requests set status='rejected',review_reason='Source cancelled in Airtable',reviewed_at=now(),updated_at=now()
      where source_table=${source.tableId} and source_record_id=${source.recordId} and kind='posting' and status='pending'
      returning id::text,accounting_date::text`;
    for (const row of pending) {
      await rejectPendingJournals(tx, row.id);
      await history(tx,row.accounting_date,"request_rejected","airtable","Source cancelled in Airtable",row.id);
    }
    const result: ReversalResult = {
      source: { tableId: source.tableId, recordId: source.recordId },
      journalEntryIds: originals.map(entry => entry.id), reversalJournalEntryIds: [],
      reversedCount: 0, duplicateCount: 0, results: [],
      ...(pending.length || withdrawn.length ? { withdrewPending: true } : {}),
    };
    // Capture the complete target set so approval cannot silently reverse additional later journals.
    let reviewRequestId: string | undefined;
    if (originals.some(entry => entry.reversal_status !== "posted")) {
      for (const entry of originals) {
        if (entry.status !== "posted" || (entry.reversal_status !== "posted" && entry.reversible === false)) throw new PostingError("Only posted, reversible journals can be reversed.");
      }
      if (options.approvalRequestId) {
        const [review] = await tx`select target_journal_ids from public.ledger_posting_requests where id=${options.approvalRequestId}::uuid`;
        if (JSON.stringify([...review.target_journal_ids].sort()) !== JSON.stringify([...ownedIds].sort())) throw new PostingError("Source journal set changed. Submit the reversal for review again.","23505");
      }
      const held = await holdForReview(tx,{kind:"reversal",source,eventType:"reversed",date:reversalDate,payload:request,targetIds:[...ownedIds]},options.approvalRequestId);
      if (held) {
        if (held.status === "rejected" || held.journalIds.length)
          return {...result, status: held.status, requestId: held.requestId, reversalJournalEntryIds: held.status === "pending_review" ? held.journalIds : []};
        reviewRequestId = held.requestId;
      }
    }
    const pendingIds: string[] = [];
    for (const entry of originals) {
      if (entry.status !== "posted") throw new PostingError("Only posted journals can be reversed.");
      let reversalId = entry.reversal_status === "posted" ? entry.reversal_id : null;
      if (reversalId) {
        if (entry.reversal_status !== "posted" || entry.reversal_date !== reversalDate) {
          throw new PostingError("An existing reversal is unposted or has a different date. Review it before retrying.", "23505");
        }
        result.duplicateCount++;
      } else {
        if (entry.reversible === false) throw new PostingError(`Rule ${entry.rule_code} is marked not reversible.`);
        reversalId = await createReversal(tx, entry.id, options.approvalEntryDate ?? reversalDate, reviewRequestId ?? options.approvalRequestId, reviewRequestId ? "pending" : "posted");
        if (reviewRequestId) pendingIds.push(reversalId);
        else result.reversedCount++;
      }
      result.reversalJournalEntryIds.push(reversalId);
      result.results.push({ journalEntryId: entry.id, reversalJournalEntryId: reversalId, status: entry.reversal_status === "posted" ? "already_reversed" : "reversed" });
    }
    if (reviewRequestId) {
      await recordPendingJournals(tx, reviewRequestId, pendingIds);
      return {...result, status: "pending_review", requestId: reviewRequestId, results: result.results.filter(row => row.status === "already_reversed")};
    }
    return result;
  };
  return options.transaction ? execute(options.transaction) : sql.begin(execute);
}

// ==================== UTILS ====================

async function createReversal(tx: TransactionSql, originalId: string, date: string, requestId: string | undefined, status: "posted" | "pending"): Promise<string> {
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
  await tx`update public.journal_entries set status=${status}::public.entry_status where id=${created.id}::uuid`;
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
