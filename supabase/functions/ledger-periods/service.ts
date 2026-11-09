import type { Sql, TransactionSql } from "npm:postgres@3.4.9";
import {
  postPayment,
  type LedgerPaymentEvent,
} from "../ledger-payment/ledger.ts";
import {
  reverseJournals,
  type ReversalRequest,
} from "../ledger-reversal/reversal.ts";
import { PostingError } from "../ledger-payment/errors.ts";
import {
  history,
  lockLedgerSource,
  lockPeriod,
} from "../_shared/period-review.ts";
import { LINK_FIELDS, syncLedgerLinks } from "../_shared/ledger-links.ts";

export async function requireManager(tx: TransactionSql, email: string) {
  const [user] =
    await tx`select email from public.app_users where email=${email.toLowerCase()} and active and can_manage_periods for share`;
  if (!user)
    throw new PostingError(
      "You do not have permission to manage periods.",
      "42501",
    );
}

export function validateMonth(month: string) {
  if (
    typeof month !== "string" ||
    !/^\d{4}-\d{2}-01$/.test(month) ||
    !Number.isFinite(Date.parse(month)) ||
    new Date(month).toISOString().slice(0, 10) !== month
  )
    throw new PostingError("Choose a valid accounting month.");
}

// ==================== PERIOD ACTIONS ====================
export async function changePeriod(
  sql: Sql,
  email: string,
  action: "open" | "close",
  month: string,
  reason: string,
  deferPending = false,
) {
  validateMonth(month);
  if (
    !["open", "close"].includes(action) ||
    typeof reason !== "string" ||
    !reason.trim() ||
    reason.length > 2000
  )
    throw new PostingError("An action and reason are required.");
  return sql.begin(async (tx) => {
    await tx`set local role service_role`;
    await requireManager(tx, email);
    await tx`select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(${"ledger period:" + month.slice(0, 7)},0))`;
    const [previous] =
      await tx`select status from public.accounting_periods where period_month=${month}::date for update`;
    const status = action === "close" ? "closed" : "open";
    if (previous?.status === status) return { status, changed: false };
    const [{ count }] =
      await tx`select count(*)::int as count from public.ledger_posting_requests
      where date_trunc('month',accounting_date)::date=${month}::date and status='pending'`;
    if (action === "close" && count && !deferPending)
      throw new PostingError(
        "Resolve the pending requests or explicitly defer them before closing.",
        "23505",
      );
    await tx`insert into public.accounting_periods(period_month,status,closed_at,closed_by,notes)
      values (${month}::date,${status},case when ${status}='closed' then now() end,case when ${status}='closed' then ${email} end,${reason.trim()})
      on conflict(period_month) do update set status=excluded.status,notes=excluded.notes,
      closed_at=case when excluded.status='closed' then now() else accounting_periods.closed_at end,
      closed_by=case when excluded.status='closed' then ${email} else accounting_periods.closed_by end`;
    const snapshot =
      action === "close"
        ? await tx`select l.account_code,sum(l.debit)::text as debit,sum(l.credit)::text as credit
      from public.journal_lines l join public.journal_entries e on e.id=l.entry_id
      where e.status='posted' and e.entry_date < (${month}::date+interval '1 month') group by l.account_code order by l.account_code`
        : [];
    await history(
      tx,
      month,
      action === "close"
        ? "period_closed"
        : previous
          ? "period_reopened"
          : "period_opened",
      email,
      reason.trim(),
      null,
      { deferredPending: count, accountBalances: Array.from(snapshot) },
    );
    return { status, changed: true };
  });
}

// ==================== REVIEW ACTIONS ====================
export async function reviewRequest(
  sql: Sql,
  email: string,
  requestId: string,
  action: "approve" | "reject",
  reason: string,
) {
  if (
    !/^[0-9a-f-]{36}$/i.test(requestId) ||
    !["approve", "reject"].includes(action) ||
    typeof reason !== "string" ||
    !reason.trim() ||
    reason.length > 2000
  )
    throw new PostingError(
      "A valid request, decision and reason are required.",
    );
  try {
    return await sql.begin(async (tx) => {
      await tx`set local role service_role`;
      await requireManager(tx, email);
      const [lookup] =
        await tx`select source_table,source_record_id,accounting_date::text from public.ledger_posting_requests where id=${requestId}::uuid`;
      if (!lookup) throw new PostingError("Review request not found.");
      const source = {
        tableId: lookup.source_table,
        recordId: lookup.source_record_id,
      };
      await lockLedgerSource(tx, source);
      await lockPeriod(tx, lookup.accounting_date);
      const [request] =
        await tx`select * from public.ledger_posting_requests where id=${requestId}::uuid for update`;
      if (request.status === "posted") {
        if (action !== "approve")
          throw new PostingError(
            "A posted request cannot be rejected.",
            "23505",
          );
        return {
          status: "posted",
          requestId,
          source,
          journalEntryIds: request.journal_ids,
          writebackPending: request.writeback_pending,
          duplicate: true,
        };
      }
      if (request.status !== "pending")
        throw new PostingError(
          "This request is no longer awaiting review.",
          "23505",
        );
      if (action === "reject") {
        await tx`update public.ledger_posting_requests set status='rejected',reviewed_by=${email},reviewed_at=now(),review_reason=${reason.trim()},updated_at=now() where id=${requestId}::uuid`;
        await history(
          tx,
          lookup.accounting_date,
          "request_rejected",
          email,
          reason.trim(),
          requestId,
        );
        return {
          status: "rejected",
          requestId,
          source,
          writebackPending: false,
        };
      }
      await tx`update public.ledger_posting_requests set status='approved',approval_txid=txid_current(),reviewed_by=${email},reviewed_at=now(),review_reason=${reason.trim()},last_error=null,updated_at=now() where id=${requestId}::uuid`;
      const result =
        request.kind === "posting"
          ? await postPayment(sql, request.payload as LedgerPaymentEvent, {
              transaction: tx,
              approvalRequestId: requestId,
              allowAdditionalCategories: request.allow_additional_categories,
            })
          : await reverseJournals(sql, request.payload as ReversalRequest, {
              transaction: tx,
              approvalRequestId: requestId,
            });
      const ids =
        "reversalJournalEntryIds" in result
          ? result.reversalJournalEntryIds
          : result.journalEntryIds;
      const writeback = Object.hasOwn(LINK_FIELDS, source.tableId);
      await tx`update public.ledger_posting_requests set status='posted',journal_ids=${ids}::uuid[],writeback_pending=${writeback},updated_at=now() where id=${requestId}::uuid`;
      await history(
        tx,
        lookup.accounting_date,
        "request_approved",
        email,
        reason.trim(),
        requestId,
        { journalIds: ids },
      );
      return {
        status: "posted",
        requestId,
        source,
        journalEntryIds: ids,
        writebackPending: writeback,
        duplicate: false,
      };
    });
  } catch (error) {
    if (!(error instanceof PostingError && error.code === "42501")) {
      await sql.begin(async (tx) => {
        await tx`set local role service_role`;
        await requireManager(tx, email);
        const message =
          error instanceof PostingError
            ? error.message
            : "Posting failed; no journals were created.";
        const [failed] =
          await tx`update public.ledger_posting_requests set last_error=${message},updated_at=now()
          where id=${requestId}::uuid and status='pending' returning accounting_date::text`;
        if (failed)
          await history(
            tx,
            failed.accounting_date,
            "review_failed",
            email,
            reason.trim(),
            requestId,
            { error: message },
          );
      });
    }
    throw error;
  }
}

/** Financial commit survives writeback failure; approving again only repairs source links. */
export async function completeWriteback(
  sql: Sql,
  result: Awaited<ReturnType<typeof reviewRequest>>,
  token: string,
  fetcher: typeof fetch = fetch,
) {
  if (!result.writebackPending) return result;
  try {
    await syncLedgerLinks(sql, result.source, token, fetcher);
    await sql`update public.ledger_posting_requests set writeback_pending=false,last_error=null,updated_at=now() where id=${result.requestId}::uuid`;
    return { ...result, writebackPending: false };
  } catch {
    await sql`update public.ledger_posting_requests set last_error='Journal posted; Airtable link writeback requires retry.',updated_at=now() where id=${result.requestId}::uuid`;
    return {
      ...result,
      writebackPending: true,
      message:
        "Journal posted. Retry to repair Airtable links; no new journal will be created.",
    };
  }
}
