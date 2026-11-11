import type { TransactionSql, JSONValue } from "npm:postgres@3.4.9";
import { PostingError } from "../ledger-payment/errors.ts";

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
}

export async function lockLedgerSource(
  tx: TransactionSql,
  source: ReviewSource,
) {
  const prefix =
    source.tableId === "tblR61NG9i0giid28"
      ? "FIN payment:"
      : source.tableId === "tblV26TC0f6CKDneL"
        ? "FIN invoice line:"
        : source.tableId === "tblC0dbO5UMXzHma9"
          ? "FIN depreciation:"
          : source.tableId === "tbl1LgiUYt7Gc492d"
            ? "FIN prepay:"
            : source.tableId === "tblAxlsdmJN0X0sQs"
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
  const hash = await fingerprint({
    payload: input.payload,
    targetIds: input.targetIds ?? [],
    allowAdditionalCategories: input.allowAdditionalCategories === true,
  });
  if (approvalId) {
    const [approved] =
      await tx`select id from public.ledger_posting_requests where id=${approvalId}::uuid
      and status='approved' and approval_txid=txid_current() and fingerprint=${hash}
      and source_table=${input.source.tableId} and source_record_id=${input.source.recordId} and kind=${input.kind}`;
    if (!approved)
      throw new PostingError(
        "This request does not have a matching approval.",
        "23505",
      );
    return null;
  }
  const [same] =
    await tx`select id,status from public.ledger_posting_requests where kind=${input.kind}
    and source_table=${input.source.tableId} and source_record_id=${input.source.recordId}
    and event_type=${input.eventType} and fingerprint=${hash}`;
  if (same) {
    if (same.status === "posted")
      throw new PostingError(
        "Reviewed request already posted; review changed source state.",
        "23505",
      );
    return {
      status: same.status === "pending" ? "pending_review" : "rejected",
      requestId: same.id,
    };
  }
  const [prior] =
    await tx`select id from public.ledger_posting_requests where kind=${input.kind}
    and source_table=${input.source.tableId} and source_record_id=${input.source.recordId}
    and event_type=${input.eventType} and status in ('pending','rejected') limit 1`;
  const [period] =
    await tx`select status from public.accounting_periods where period_month=${input.date.slice(0, 7) + "-01"}::date`;
  if (period?.status === "open" && !prior) return null;
  if (prior) {
    await tx`update public.ledger_posting_requests set status='superseded',updated_at=now() where id=${prior.id}`;
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
  return { status: "pending_review", requestId: saved.id };
}
