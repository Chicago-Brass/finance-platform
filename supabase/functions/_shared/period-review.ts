import type { TransactionSql, JSONValue } from "npm:postgres@3.4.9";
import { PostingError } from "../ledger-payment/errors.ts";
import { MANUAL_TABLE } from "./manual-journal.ts";

export interface ReviewSource {
  tableId: string;
  recordId: string;
}
export interface ReviewInput {
  kind: "posting" | "reversal";
  source: ReviewSource;
  eventType: string;
  date: string;
  payload: object;
  targetIds?: string[];
  allowAdditionalCategories?: boolean;
}
export interface ReviewHold {
  status: "pending_review" | "rejected";
  requestId: string;
  journalIds: string[];
}

export async function lockLedgerSource(
  tx: TransactionSql,
  source: ReviewSource,
) {
  const prefix =
    source.tableId === MANUAL_TABLE
      ? "FIN manual journal:"
      : source.tableId === "tblR61NG9i0giid28"
      ? "FIN payment:"
      : source.tableId === "tblV26TC0f6CKDneL"
        ? "FIN invoice line:"
        : source.tableId === "tblC0dbO5UMXzHma9"
          ? "FIN depreciation:"
          : source.tableId === "tbl1LgiUYt7Gc492d"
            ? "FIN prepay:"
            : source.tableId === "tblrnXm1HN9y6HPxY"
              ? "FIN shipping:"
              : "FIN invoice:";
  await tx`select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(${prefix + source.recordId},0))`;
}

export async function lockPeriod(tx: TransactionSql, date: string) {
  await tx`select pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended(${"ledger period:" + date.slice(0, 7)},0))`;
}

export async function history(
  tx: TransactionSql,
  date: string,
  action: string,
  actor: string | null,
  reason: string | null,
  requestId: string | null,
  details: object = {},
) {
  await tx`insert into public.ledger_period_history(period_month,action,actor,reason,request_id,details)
    values (${date.slice(0, 7) + "-01"}::date,${action},${actor},${reason},${requestId}::uuid,${tx.json(details as JSONValue)})`;
}

export async function fingerprint(payload: object): Promise<string> {
  const sorted = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(sorted)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .filter(([, v]) => v !== undefined)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => [k, sorted(v)]),
          )
        : value;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(sorted(payload))),
  );
  return Array.from(new Uint8Array(digest), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}

/** Called after financial validation, under the source lock. A pending review survives reopening. */
export async function holdForReview(
  tx: TransactionSql,
  input: ReviewInput,
  approvalId?: string,
): Promise<ReviewHold | null> {
  await lockPeriod(tx, input.date);
  const event = input.kind === "posting" ? input.payload as { categories?: Record<string, unknown>[] } : null;
  // Replays and existing approvals use the financial payload without the optional display labels.
  const payload = event?.categories ? {
    ...event,
    categories: event.categories.map(({ display: _display, ...category }) => category),
  } : input.payload;
  const identity = {
    payload,
    targetIds: input.targetIds ?? [],
    allowAdditionalCategories: input.allowAdditionalCategories === true,
  };
  const hash = await fingerprint(identity);
  const fingerprints = [hash];
  // Requests captured before display metadata was excluded retain their original fingerprint.
  if (event?.categories?.some(category => Object.hasOwn(category, "display")))
    fingerprints.push(await fingerprint({...identity, payload: input.payload}));
  if (approvalId) {
    const [approved] =
      await tx`select id from public.ledger_posting_requests where id=${approvalId}::uuid
      and status='approved' and approval_txid=txid_current() and fingerprint=any(${fingerprints}::text[])
      and source_table=${input.source.tableId} and source_record_id=${input.source.recordId} and kind=${input.kind}`;
    if (!approved)
      throw new PostingError(
        "This request does not have a matching approval.",
        "23505",
      );
    return null;
  }
  const [same] =
    await tx`select id,status,journal_ids from public.ledger_posting_requests where kind=${input.kind}
    and source_table=${input.source.tableId} and source_record_id=${input.source.recordId}
    and event_type=${input.eventType} and fingerprint=any(${fingerprints}::text[]) order by (fingerprint=${hash}) desc limit 1`;
  if (same) {
    if (same.status === "posted")
      throw new PostingError(
        "Reviewed request already posted; review changed source state.",
        "23505",
      );
    return {
      status: same.status === "pending" ? "pending_review" : "rejected",
      requestId: same.id,
      journalIds: same.journal_ids,
    };
  }
  const candidates =
    await tx`select id,payload from public.ledger_posting_requests where kind=${input.kind}
    and source_table=${input.source.tableId} and source_record_id=${input.source.recordId}
    and event_type=${input.eventType} and status in ('pending','rejected')`;
  const rules = (payload: object) => [...new Set((payload as {categories?: {ruleCode: string}[]}).categories?.map(category => category.ruleCode) ?? [])].sort();
  const scope = rules(input.payload);
  const affected = candidates.filter(row => input.kind === "reversal" || rules(row.payload).some(rule => scope.includes(rule)));
  if (input.kind === "posting" && affected.some(row => JSON.stringify(rules(row.payload)) !== JSON.stringify(scope)))
    throw new PostingError("An overlapping set of rules is awaiting review. Resolve that request first.", "23505");
  const [period] =
    await tx`select status from public.accounting_periods where period_month=${input.date.slice(0, 7) + "-01"}::date`;
  if (period?.status === "open" && !affected.length) return null;
  for (const prior of affected) {
    await tx`update public.ledger_posting_requests set status='superseded',updated_at=now() where id=${prior.id}`;
    await rejectPendingJournals(tx, prior.id);
    await history(
      tx,
      input.date,
      "request_superseded",
      null,
      "A changed request requires a new review.",
      prior.id,
    );
  }
  const [saved] =
    await tx`insert into public.ledger_posting_requests(kind,source_table,source_record_id,event_type,accounting_date,fingerprint,payload,target_journal_ids,allow_additional_categories)
    values (${input.kind},${input.source.tableId},${input.source.recordId},${input.eventType},${input.date}::date,${hash},${tx.json(input.payload as JSONValue)},${input.targetIds ?? []}::uuid[],${input.allowAdditionalCategories === true}) returning id`;
  await history(
    tx,
    input.date,
    "request_received",
    null,
    period?.status === "closed"
      ? "Period is closed."
      : "Period requires explicit review.",
    saved.id,
  );
  return { status: "pending_review", requestId: saved.id, journalIds: [] };
}

export async function rejectPendingJournals(tx: TransactionSql, requestId: string) {
  return tx`update public.journal_entries set status='rejected'
    where posting_request_id=${requestId}::uuid and status='pending' returning id`;
}

export async function recordPendingJournals(tx: TransactionSql, requestId: string, ids: string[]) {
  await tx`update public.ledger_posting_requests set journal_ids=${ids}::uuid[] where id=${requestId}::uuid`;
}
