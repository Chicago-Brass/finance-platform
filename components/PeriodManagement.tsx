"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayChicago } from "@/lib/dates";
import { formatDate } from "@/lib/reports/report-utils";
import { formatReportAmount } from "@/lib/format";
import { useReportRefresh, useReportRevision } from "./ReportData";
import { SearchableSelect } from "./SearchableSelect";
import { FilterBar, FilterField } from "./FilterControls";
import { DetailDrawer } from "./DetailDrawer";
import { JournalEntryDrawer } from "./JournalEntryDrawer";
import "./period-management.css";

type Period = {
  period_month: string;
  status: string;
  closed_at: string | null;
  closed_by: string | null;
  posted_count: number;
  pending_count: number;
  adjustments_after_close: number;
};
type Posting = {
  debitAccount: { number?: string; recordId?: string };
  creditAccount: { number?: string; recordId?: string };
  amount: string;
};
type Packet = {
  categories?: {
    ruleCode: string;
    entryKey?: string;
    transactionType: string;
    postings: Posting[];
  }[];
  paymentName?: string;
  source?: { recordName?: string };
  entryDate?: string;
  sourceDate?: string;
};
type Review = {
  id: string;
  kind: string;
  source_table: string;
  source_record_id: string;
  event_type: string;
  accounting_date: string;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  review_reason: string | null;
  last_error: string | null;
  writeback_pending: boolean;
  payload: Packet;
};
type Posted = {
  id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  rule_code: string;
  posted_at: string;
  posting_request_id: string | null;
};
type History = {
  id: string;
  action: string;
  actor: string | null;
  reason: string | null;
  created_at: string;
  request_id: string | null;
  details: {
    journalIds?: string[];
    deferredPending?: number;
    accountBalances?: { account_code: string; debit: string; credit: string }[];
  };
};
type Data = {
  canManage: boolean;
  periods: Period[];
  rows: (Review | Posted | History)[];
  total: number;
};
type ReviewDetails = {
  item: Review;
  accounts: { code: string; name: string; airtable_record_id: string | null }[];
  lines: {
    entry_id: string;
    line_no: number;
    account_code: string;
    debit: string;
    credit: string;
  }[];
};
type Action = {
  action: "open" | "close" | "approve" | "reject";
  requestId?: string;
  label: string;
};
const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}T12:00:00Z`));
const stamp = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Chicago",
      }).format(new Date(date)) + " CT"
    : "-";
const titleCase = (value: string) => value.split("_").join(" ");

export function PeriodManagement() {
  const initial = todayChicago().slice(0, 7) + "-01";
  const [month, setMonth] = useState(initial),
    [tab, setTab] = useState("posted"),
    [page, setPage] = useState(1),
    [reviewFilter, setReviewFilter] = useState("pending"),
    [version, reload] = useState(0);
  const [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [action, setAction] = useState<Action | null>(null),
    [reason, setReason] = useState(""),
    [defer, setDefer] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [journal, setJournal] = useState<number | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [details, setDetails] = useState<ReviewDetails | null>(null),
    [detailError, setDetailError] = useState("");
  const refreshReports = useReportRefresh();
  const revision = useReportRevision();
  const selectedMonthButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { selectedMonthButton.current?.scrollIntoView({block:"nearest"}); },[month]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(
      `/api/periods?${new URLSearchParams({ month, tab, page: String(page), status: reviewFilter })}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw Error(body.error);
        return body as Data;
      })
      .then((body) => {
        if (!controller.signal.aborted) setData(body);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month, tab, page, reviewFilter, version, revision]);
  useEffect(() => {
    setDetails(null);
    setDetailError("");
    if (!selected) return;
    const controller = new AbortController();
    fetch(
      `/api/periods?${new URLSearchParams({ month, requestId: selected })}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw Error(body.error);
        return body;
      })
      .then((body) => {
        if (!controller.signal.aborted) setDetails(body);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setDetailError(e.message);
      });
    return () => controller.abort();
  }, [selected, month, version]);
  const year = Number(month.slice(0, 4));
  const period = data?.periods.find((p) => p.period_month === month);
  const begin = (value: Action) => {
    setReason("");
    setDefer(false);
    setError("");
    setAction(value);
  };
  const changeMonth = (value: string) => {
    setMonth(value);
    setPage(1);
    setSelected(null);
    setData(null);
  };
  const submit = async () => {
    if (!action) return;
    setBusy(true);
    setError("");
    try {
      const client = createClient();
      const { data: result, error: failure } = await client.functions.invoke(
        "ledger-periods",
        { body: { ...action, month, reason, deferPending: defer } },
      );
      if (failure) {
        const body =
          failure.context instanceof Response
            ? await failure.context.json()
            : null;
        throw Error(body?.error || "The action could not be completed.");
      }
      setNotice(
        result.message ||
          (action.action === "approve"
            ? "Request posted. Other pending requests are unchanged."
            : action.action === "reject"
              ? "Request rejected. No journals were posted."
              : action.action === "close"
                ? "Period closed."
                : "Period opened. Pending requests still require approval."),
      );
      setAction(null);
      setSelected(null);
      reload((n) => n + 1);
      refreshReports();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The action could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  };
  const last = new Date(Date.UTC(year, Number(month.slice(5, 7)), 0))
    .toISOString()
    .slice(0, 10);
  return (
    <article className="report-page period-page">
      <div className="report-heading">
        <h1 className="report-title">Period Management</h1>
        <p className="report-entity">
          Chicago Brass Inc. - Accounting controls
        </p>
      </div>
      <FilterBar label="Period controls">
        <SearchableSelect
          label="Year"
          value={String(year)}
          options={Array.from(
            { length: Number(initial.slice(0, 4)) - 1990 + 6 },
            (_, i) => {
              const y = 1990 + i;
              return { value: String(y), label: String(y) };
            },
          )}
          onChange={(value) => changeMonth(value + month.slice(4))}
          className="period-year"
        />
        <SearchableSelect
          label="Period"
          value={month}
          options={Array.from({ length: 12 }, (_, i) => {
            const value = `${year}-${String(i + 1).padStart(2, "0")}-01`;
            return { value, label: monthLabel(value) };
          })}
          onChange={changeMonth}
          className="period-month"
        />
        {tab === "pending" && (
          <SearchableSelect
            label="Review status"
            value={reviewFilter}
            options={[
              { value: "pending", label: "Pending / repair needed" },
              { value: "all", label: "All requests" },
            ]}
            onChange={(value) => {
              setReviewFilter(value);
              setPage(1);
            }}
            className="period-month"
          />
        )}
        <span className={`period-badge ${period?.status || "not_open"}`}>
          {titleCase(period?.status || "not_open")}
        </span>
        {data?.canManage && (
          <button
            className="btn btn-primary period-action"
            disabled={loading}
            onClick={() =>
              begin(
                period?.status === "open"
                  ? { action: "close", label: "Close period" }
                  : {
                      action: "open",
                      label:
                        period?.status === "closed"
                          ? "Reopen period"
                          : "Open period",
                    },
              )
            }
          >
            {period?.status === "open"
              ? "Close period"
              : period?.status === "closed"
                ? "Reopen period"
                : "Open period"}
          </button>
        )}
      </FilterBar>
      {notice && (
        <p className="period-notice" role="status">
          {notice}
        </p>
      )}
      {error && !action && (
        <div role="alert" className="period-error">
          {error}
          <button
            className="btn btn-quiet"
            onClick={() => reload((n) => n + 1)}
          >
            Retry
          </button>
        </div>
      )}
      <div className="period-workspace">
        <aside className="period-list" aria-label="Accounting periods">
          {Array.from({ length: 12 }, (_, i) => {
            const value = `${year}-${String(i + 1).padStart(2, "0")}-01`,
              item = data?.periods.find((p) => p.period_month === value);
            return (
              <button
                key={value}
                ref={month === value ? selectedMonthButton : undefined}
                className={month === value ? "is-selected" : ""}
                aria-current={month === value ? "date" : undefined}
                onClick={() => changeMonth(value)}
              >
                <strong>{monthLabel(value)}</strong>
                <span>
                  {titleCase(item?.status || "not_open")}
                  {Number(item?.pending_count) > 0
                    ? ` | ${item?.pending_count} pending`
                    : ""}
                </span>
              </button>
            );
          })}
        </aside>
        <section className="period-detail" aria-label="Selected period">
          <div className="period-detail-heading">
            <div className="period-detail-meta">
              <h2>{monthLabel(month)}</h2>
              <p>
                {period?.closed_at
                  ? `Last closed ${stamp(period.closed_at)} by ${period.closed_by}`
                  : "No close recorded."}
              </p>
              {Number(period?.adjustments_after_close) > 0 && (
                <p className="period-warning">
                  Adjusted after close: {period?.adjustments_after_close}{" "}
                  journals. See History for approvals.
                </p>
              )}
            </div>
            <div className="period-report-links">
              <a
                href={`/income-statement?year=${year}&from=${Number(month.slice(5, 7))}&to=${Number(month.slice(5, 7))}`}
              >
                Income Statement
              </a>
              <a href={`/balance-sheet?asof=${last}`}>Balance Sheet</a>
              <a href={`/general-ledger?from=${month}&to=${last}`}>
                General Ledger
              </a>
            </div>
          </div>
          <div
            className="period-tabs"
            role="tablist"
            aria-label="Period records"
          >
            {[
              { id: "posted", label: "Posted journals" },
              { id: "pending", label: "Pending review" },
              { id: "history", label: "History" },
            ].map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => {
                  setTab(item.id);
                  setPage(1);
                }}
              >
                {item.label}
                {item.id === "pending" && Number(period?.pending_count) > 0
                  ? ` (${period?.pending_count})`
                  : ""}
              </button>
            ))}
          </div>
          <div
            className="period-table-wrap"
            role="tabpanel"
            aria-label={
              tab === "posted"
                ? "Posted journals"
                : tab === "pending"
                  ? "Pending review"
                  : "Period history"
            }
            aria-busy={loading}
          >
            {loading ? (
              <div className="period-loading" role="status">
                <span className="report-spinner" />
                Loading period records...
              </div>
            ) : !data?.rows.length ? (
              <p className="period-empty">No records in this period.</p>
            ) : tab === "posted" ? (
              <table className="period-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Entry</th>
                    <th>Category</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.rows as Posted[]).map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(row.entry_date)}</td>
                      <td>
                        <button
                          className="period-text-button"
                          onClick={() => setJournal(row.entry_number)}
                        >
                          #{row.entry_number}
                        </button>
                      </td>
                      <td>{row.rule_code}</td>
                      <td>{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : tab === "pending" ? (
              <table className="period-table">
                <thead>
                  <tr>
                    <th>Received (CT)</th>
                    <th>Accounting date</th>
                    <th>Source / category</th>
                    <th>Status</th>
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.rows as Review[]).map((row) => (
                    <tr key={row.id}>
                      <td>{stamp(row.created_at)}</td>
                      <td>{formatDate(row.accounting_date)}</td>
                      <td>
                        {row.payload.source?.recordName ||
                          row.payload.paymentName ||
                          row.source_record_id}
                        <small>
                          {row.kind === "reversal"
                            ? "Reversal"
                            : row.payload.categories
                                ?.map((c) => c.ruleCode)
                                .join(", ")}
                        </small>
                      </td>
                      <td>
                        <span className={`period-badge ${row.status}`}>
                          {row.status === "pending"
                            ? "Pending review"
                            : titleCase(row.status)}
                        </span>
                        {row.writeback_pending && (
                          <small>Link writeback pending</small>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-quiet"
                          onClick={() => setSelected(row.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="period-table">
                <thead>
                  <tr>
                    <th>Time (CT)</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Reason / details</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.rows as History[]).map((row) => (
                    <tr key={row.id}>
                      <td>{stamp(row.created_at)}</td>
                      <td>{titleCase(row.action)}</td>
                      <td>{row.actor || "Automation"}</td>
                      <td>
                        {row.reason}
                        {row.request_id && (
                          <button
                            className="period-text-button"
                            onClick={() => setSelected(row.request_id)}
                          >
                            View request
                          </button>
                        )}
                        {row.details.journalIds && (
                          <small>
                            Journals: {row.details.journalIds.join(", ")}
                          </small>
                        )}
                        {row.details.accountBalances && (
                          <details>
                            <summary>Closing account balances</summary>
                            <ul>
                              {row.details.accountBalances.map((a) => (
                                <li key={a.account_code}>
                                  {a.account_code}: debit{" "}
                                  {formatReportAmount(Number(a.debit))} / credit{" "}
                                  {formatReportAmount(Number(a.credit))}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <footer className="period-pagination">
            <span>
              {data?.total
                ? `${(page - 1) * 50 + 1}-${Math.min(page * 50, data.total)} of ${data.total}`
                : "0 records"}
            </span>
            <button
              className="btn btn-quiet"
              disabled={loading || page === 1}
              onClick={() => setPage((n) => n - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-quiet"
              disabled={loading || page * 50 >= (data?.total ?? 0)}
              onClick={() => setPage((n) => n + 1)}
            >
              Next
            </button>
          </footer>
        </section>
      </div>
      {journal !== null && (
        <JournalEntryDrawer
          entryNumber={journal}
          onClose={() => setJournal(null)}
        />
      )}
      {selected && (
        <DetailDrawer titleId="review-title" onClose={() => setSelected(null)}>
          <header className="drill-header">
            <div className="drill-heading">
              <p className="drill-eyebrow">Period exception</p>
              <h2 id="review-title">Review proposed journals</h2>
            </div>
            <button
              data-drawer-close
              className="drill-icon-button"
              aria-label="Close review"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
          </header>
          <div className="period-review-body">
            {detailError ? (
              <p role="alert">{detailError}</p>
            ) : !details ? (
              <p role="status">Loading request...</p>
            ) : (
              <>
                <p>
                  <span className="period-badge">
                    {titleCase(details.item.status)}
                  </span>
                </p>
                <dl>
                  <dt>Accounting date</dt>
                  <dd>{formatDate(details.item.accounting_date)}</dd>
                  <dt>Source date</dt>
                  <dd>
                    {formatDate(
                      details.item.payload.sourceDate ||
                        details.item.payload.entryDate ||
                        details.item.accounting_date,
                    )}
                  </dd>
                  <dt>Received</dt>
                  <dd>{stamp(details.item.created_at)}</dd>
                  <dt>Source record</dt>
                  <dd>
                    <a
                      href={`https://airtable.com/app0Q1UMEdUeWl538/${details.item.source_table}/${details.item.source_record_id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {details.item.payload.source?.recordName ||
                        details.item.payload.paymentName ||
                        details.item.source_record_id}
                    </a>
                  </dd>
                  <dt>Event</dt>
                  <dd>{details.item.event_type}</dd>
                </dl>
                <p className="period-warning">
                  Review the captured request below. Approval posts these
                  journals only; it does not reopen the period or approve other
                  records.
                </p>
                {details.item.payload.categories?.map((category, i) => (
                  <section key={i}>
                    <h3>
                      {category.ruleCode}
                      {category.entryKey ? ` / ${category.entryKey}` : ""}
                    </h3>
                    <p>{category.transactionType}</p>
                    <table className="period-table">
                      <thead>
                        <tr>
                          <th>Debit account</th>
                          <th>Credit account</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.postings.map((posting, j) => {
                          const account = (ref: Posting["debitAccount"]) => {
                            const a = details.accounts.find(
                              (a) =>
                                a.airtable_record_id === ref.recordId ||
                                a.code ===
                                  (ref.number === "0747"
                                    ? "112.300"
                                    : ref.number),
                            );
                            return a
                              ? `${a.code} ${a.name}`
                              : ref.number || ref.recordId;
                          };
                          return (
                            <tr key={j}>
                              <td>{account(posting.debitAccount)}</td>
                              <td>{account(posting.creditAccount)}</td>
                              <td>
                                {formatReportAmount(Number(posting.amount))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </section>
                ))}
                {details.item.kind === "reversal" && (
                  <>
                    <h3>Reversal lines</h3>
                    <table className="period-table">
                      <thead>
                        <tr>
                          <th>Original journal</th>
                          <th>Account</th>
                          <th>Debit</th>
                          <th>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.lines.map((line, i) => (
                          <tr key={i}>
                            <td>{line.entry_id}</td>
                            <td>{line.account_code}</td>
                            <td>{formatReportAmount(Number(line.credit))}</td>
                            <td>{formatReportAmount(Number(line.debit))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                {details.item.last_error && (
                  <p role="alert">{details.item.last_error}</p>
                )}
                {data?.canManage && details.item.status === "pending" && (
                  <div className="period-review-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelected(null);
                        begin({
                          action: "approve",
                          requestId: details.item.id,
                          label: "Approve this request",
                        });
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-quiet"
                      onClick={() => {
                        setSelected(null);
                        begin({
                          action: "reject",
                          requestId: details.item.id,
                          label: "Reject this request",
                        });
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {data?.canManage &&
                  details.item.status === "posted" &&
                  details.item.writeback_pending && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelected(null);
                        begin({
                          action: "approve",
                          requestId: details.item.id,
                          label: "Repair Airtable links",
                        });
                      }}
                    >
                      Retry link writeback
                    </button>
                  )}
              </>
            )}
          </div>
        </DetailDrawer>
      )}
      {action && (
        <DetailDrawer
          titleId="period-action-title"
          onClose={() => !busy && setAction(null)}
        >
          <header className="drill-header">
            <div className="drill-heading">
              <h2 id="period-action-title">{action.label}</h2>
              <p>{monthLabel(month)}</p>
            </div>
            <button
              data-drawer-close
              className="drill-icon-button"
              aria-label="Close period action"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              ×
            </button>
          </header>
          <form
            className="period-review-body"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <p>
              {action.action === "approve"
                ? "Only this reviewed request will be posted. The period status will remain unchanged."
                : action.action === "open"
                  ? "Pending requests will remain pending and require individual approval."
                  : action.action === "close"
                    ? "New postings dated in this period will require review."
                    : "The request will be retained without posting any journals."}
            </p>
            <FilterField label="Reason" htmlFor="period-reason">
              <textarea
                id="period-reason"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
              />
            </FilterField>
            {action.action === "close" && Number(period?.pending_count) > 0 && (
              <label className="period-defer">
                <input
                  type="checkbox"
                  checked={defer}
                  onChange={(e) => setDefer(e.target.checked)}
                  disabled={busy}
                />
                Keep {period?.pending_count} pending requests for separate
                review. This reason documents their deferral.
              </label>
            )}
            {error && (
              <p className="period-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="btn btn-primary"
              disabled={busy || !reason.trim()}
            >
              {busy ? "Saving..." : action.label}
            </button>
          </form>
        </DetailDrawer>
      )}
    </article>
  );
}
