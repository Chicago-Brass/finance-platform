import { verifyCustomerSettlement } from "../_shared/customer-credit.ts";
import { postCappedShipment, verifyPendingShipment } from "../_shared/shipping-deposit.ts";
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
  rejectPendingJournals,
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
  postingDate?: string,
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
  if (postingDate !== undefined &&
      (action !== "approve" || typeof postingDate !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(postingDate) ||
        !Number.isFinite(Date.parse(postingDate)) || new Date(postingDate).toISOString().slice(0, 10) !== postingDate))
    throw new PostingError("Choose a valid posting date.");
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
        await tx`select *, approved_entry_date::text as reviewed_posting_date from public.ledger_posting_requests where id=${requestId}::uuid for update`;
      if (request.status === "posted") {
        if (action !== "approve")
          throw new PostingError(
            "A posted request cannot be rejected.",
            "23505",
          );
        const approvedDate = request.reviewed_posting_date ?? lookup.accounting_date;
        if (postingDate && postingDate !== approvedDate)
          throw new PostingError("This request was already posted on a different date.", "23505");
        return {
          status: "posted",
          postingDate: approvedDate,
          requestId,
          source,
          journalEntryIds: request.journal_ids,
          writebackPending: request.writeback_pending,
          duplicate: true,
        };
      }
      if (request.status === "rejected" && action === "reject") return {
        status: "rejected", requestId, source, writebackPending: request.writeback_pending,
      };
      if (request.status !== "pending")
        throw new PostingError(
          "This request is no longer awaiting review.",
          "23505",
        );
      if (action === "reject") {
        await tx`update public.ledger_posting_requests set status='rejected',writeback_pending=${request.journal_ids.length > 0 && Object.hasOwn(LINK_FIELDS, source.tableId)},reviewed_by=${email},reviewed_at=now(),review_reason=${reason.trim()},updated_at=now() where id=${requestId}::uuid`;
        const rejected = await rejectPendingJournals(tx, requestId);
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
          writebackPending: rejected.length > 0 && Object.hasOwn(LINK_FIELDS, source.tableId),
        };
      }
      if (postingDate) {
        const destination = postingDate.slice(0, 7) + "-01";
        if (destination === lookup.accounting_date.slice(0, 7) + "-01")
          throw new PostingError("Choose a date in a different open month.");
        await lockPeriod(tx, postingDate);
        const [period] = await tx`select status from public.accounting_periods where period_month=${destination}::date`;
        if (period?.status !== "open")
          throw new PostingError("The destination month must be open.", "23505");
      }
      const entryDate = postingDate ?? lookup.accounting_date;
      await tx`update public.ledger_posting_requests set status='approved',approval_txid=txid_current(),
        approved_entry_date=${postingDate ?? null}::date,reviewed_by=${email},reviewed_at=now(),review_reason=${reason.trim()},
        last_error=null,updated_at=now() where id=${requestId}::uuid`;
      let ids: string[];
      if (request.journal_ids.length) {
        const settlement = (request.payload as LedgerPaymentEvent).customerSettlement;
        if (request.kind === "posting" && settlement)
          await verifyCustomerSettlement(tx, lookup.source_record_id, settlement, entryDate);
        if (request.kind === "posting" && request.payload.shippingRecordId)
          await verifyPendingShipment(tx, request.payload as LedgerPaymentEvent);
        const promoted = await tx`update public.journal_entries set status='posted',entry_date=${entryDate}::date
          where posting_request_id=${requestId}::uuid and id=any(${request.journal_ids}::uuid[])
            and status='pending' returning id::text`;
        if (promoted.length !== request.journal_ids.length)
          throw new PostingError("The saved journal set no longer matches this review.", "23505");
        ids = request.journal_ids;
      } else {
        const result = request.kind === "posting"
          ? await ((request.payload as LedgerPaymentEvent).shippingRecordId ? postCappedShipment : postPayment)(sql, request.payload as LedgerPaymentEvent, {
              transaction: tx,
              approvalRequestId: requestId,
              approvalEntryDate: postingDate,
              allowAdditionalCategories: request.allow_additional_categories,
            })
          : await reverseJournals(sql, request.payload as ReversalRequest, {
              transaction: tx,
              approvalRequestId: requestId,
              approvalEntryDate: postingDate,
            });
        ids =
          "reversalJournalEntryIds" in result
            ? result.reversalJournalEntryIds
            : result.journalEntryIds;
      }
      const writeback = Object.hasOwn(LINK_FIELDS, source.tableId);
      await tx`update public.ledger_posting_requests set status='posted',journal_ids=${ids}::uuid[],writeback_pending=${writeback},updated_at=now() where id=${requestId}::uuid`;
      await history(
        tx,
        lookup.accounting_date,
        "request_approved",
        email,
        reason.trim(),
        requestId,
        { journalIds: ids, originalAccountingDate: lookup.accounting_date, postingDate: entryDate },
      );
      return {
        status: "posted",
        postingDate: entryDate,
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
            : "The decision failed and the request remains pending.";
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
    const [request] = await sql<{repost_id: string | null}[]>`select payload->>'repostId' as repost_id from public.ledger_posting_requests where id=${result.requestId}::uuid`;
    await syncLedgerLinks(sql, result.source, token, fetcher, undefined, [], result.status === "posted" ? request?.repost_id ?? undefined : undefined, result.status === "rejected");
    await sql`update public.ledger_posting_requests set writeback_pending=false,last_error=null,updated_at=now() where id=${result.requestId}::uuid`;
    return { ...result, writebackPending: false };
  } catch {
    await sql`update public.ledger_posting_requests set last_error='Airtable link writeback requires retry.',updated_at=now() where id=${result.requestId}::uuid`;
    return {
      ...result,
      writebackPending: true,
      message:
        "Decision saved. Retry to repair Airtable links.",
    };
  }
}
