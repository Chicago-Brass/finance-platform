"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayChicago } from "@/lib/dates";
import { formatDate } from "@/lib/reports/report-utils";
import { formatReportAmount } from "@/lib/format";
import { useReportRefresh, useReportRevision } from "./ReportData";
import { SearchableSelect } from "./SearchableSelect";
import { FilterBar, FilterField } from "./FilterControls";
import { DismissibleMenu } from "./DismissibleMenu";
import { CalendarMark } from "./ReportViewControls";
import { periodGroups, periodPresets, periodRange, type PeriodGrouping, type PeriodOverview, type PeriodRange } from "@/lib/periods/ranges";
import { DetailDrawer } from "./DetailDrawer";
import { JournalEntryDrawer } from "./JournalEntryDrawer";
import "./period-management.css";

type Period = PeriodOverview & {
  closed_at: string | null;
  closed_by: string | null;
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
  month?: string;
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

export function PeriodStatusPill({ status }: { status: string }) {
  const state = status === "open" ? "open" : status === "mixed" ? "mixed" : "closed";
  return <span className={`period-badge ${state}`}>{state === "open" ? "Open" : state === "mixed" ? "Mixed" : "Closed"}</span>;
}

export function PeriodReviewActions({ status, writebackPending, canManage, onView, onAllow }: {
  status: string; writebackPending: boolean; canManage: boolean; onView: () => void; onAllow: () => void;
}) {
  return <div className="period-row-actions"><button type="button" className="btn btn-quiet" onClick={onView}>View</button>
    {canManage && (status === "pending" || (status === "posted" && writebackPending)) && <button type="button" className="btn btn-primary" onClick={onAllow}>{status === "pending" ? "Allow entry" : "Retry links"}</button>}
  </div>;
}

export function PeriodManagement() {
  const today = todayChicago(), initial = today.slice(0, 7) + "-01";
  const [range, setRange] = useState<PeriodRange>({from: initial.slice(0, 4) + "-01-01", to: initial.slice(0, 4) + "-12-31"});
  const [grouping, setGrouping] = useState<PeriodGrouping>("month");
  const [month, setMonth] = useState(initial),
    [tab, setTab] = useState("posted"),
    [page, setPage] = useState(1),
    [reviewFilter, setReviewFilter] = useState("pending"),
    [version, reload] = useState(0);
  const [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [overview, setOverview] = useState<Pick<Data, "periods" | "canManage"> | null>(null);
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
  const groups = useMemo(() => periodGroups(range, grouping, overview?.periods), [range, grouping, overview?.periods]);
  const group = groups.find(item => item.months.includes(month)) ?? groups[0];
  useEffect(() => { selectedMonthButton.current?.scrollIntoView({block:"nearest"}); }, [group.key]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(
      `/api/periods?${new URLSearchParams({ from: group.from, to: group.to, overviewFrom: range.from, overviewTo: range.to, tab, page: String(page), status: reviewFilter })}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw Error(body.error);
        return body as Data;
      })
      .then((body) => {
        if (!controller.signal.aborted) { setData(body); setOverview({periods: body.periods, canManage: body.canManage}); }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [group.from, group.to, range.from, range.to, tab, page, reviewFilter, version, revision]);
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
  const period = overview?.periods.find((p) => p.period_month === month);
  const monthly = grouping === "month";
  const changeRange = (value: PeriodRange) => {
    try {
      const next = periodRange(value.from, value.to);
      if (next.from === range.from && next.to === range.to) return;
      setRange(next);
      changeMonth(month >= next.from && month <= next.to ? month : next.to.slice(0, 7) + "-01");
      setData(null); setLoading(true); setSelected(null); setNotice("");
      setError("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Choose a valid date range."); }
  };
  const changeGrouping = (value: string) => {
    if (value === grouping) return;
    setGrouping(value as PeriodGrouping); setPage(1); setSelected(null); setData(null); setLoading(true);
  };
  const changeTab = (value: string) => {
    if (value === tab) return;
    setTab(value); setPage(1); setSelected(null); setData(null); setLoading(true);
  };
  const begin = (value: Action) => {
    setReason("");
    setDefer(false);
    setError("");
    setAction(value);
  };
  const changeMonth = (value: string) => {
    if (value === month) return;
    setMonth(value);
    setPage(1);
    setSelected(null);
    setData(null);
    setLoading(true);
    setNotice("");
  };
  const submit = async () => {
    if (!action) return;
    setBusy(true);
    setError("");
    try {
      const client = createClient();
      const { data: result, error: failure } = await client.functions.invoke(
        "ledger-periods",
        { body: { ...action, month: action.month ?? month, reason, deferPending: defer } },
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
  const last = group.to;
  return (
    <article className="report-page period-page">
      <div className="report-heading">
        <h1 className="report-title">Periods</h1>
        <p className="report-entity">
          Chicago Brass Inc. - Accounting controls
        </p>
      </div>
      <FilterBar label="Period controls">
        <FilterField label="Date range" className="control-bar-period period-range-control">
          <DismissibleMenu className="period-picker" key={`${range.from}:${range.to}`}>
            <summary className="period-picker-trigger"><CalendarMark /><span>{formatDate(range.from)} - {formatDate(range.to)}</span><span aria-hidden="true">▾</span></summary>
            <div className="period-picker-panel ledger-range-panel">
              <div className="date-presets" aria-label="Quick accounting periods">
                {periodPresets(today).map(preset => <button key={preset.label} type="button" className={`preset-link${range.from === preset.range.from && range.to === preset.range.to ? " is-active" : ""}`} onClick={event => { changeRange(preset.range); event.currentTarget.closest("details")?.removeAttribute("open"); }}>{preset.label}</button>)}
              </div>
              <form aria-label="Custom accounting date range" onSubmit={event => {
                event.preventDefault(); const fields = new FormData(event.currentTarget);
                changeRange({from: String(fields.get("from")), to: String(fields.get("to"))});
              }}>
                <div className="ledger-date-fields">
                  <FilterField label="Start date" htmlFor="period-from"><input id="period-from" type="date" name="from" defaultValue={range.from} min="1900-01-01" max="2199-12-31" required /></FilterField>
                  <FilterField label="End date" htmlFor="period-to"><input id="period-to" type="date" name="to" defaultValue={range.to} min="1900-01-01" max="2199-12-31" required /></FilterField>
                </div>
                <p className="filter-help">Includes complete accounting months. Choose any multi-year or multi-quarter range.</p>
                <button className="btn btn-primary" type="submit">Apply range</button>
              </form>
            </div>
          </DismissibleMenu>
        </FilterField>
        <SearchableSelect label="Group by" value={grouping} options={[{value:"month",label:"Month"},{value:"quarter",label:"Quarter"},{value:"year",label:"Year"}]} onChange={changeGrouping} className="period-grouping" />
        {monthly && overview?.canManage && (
          <button
            className="btn btn-primary period-action"
            disabled={loading}
            onClick={() =>
              begin(
                period?.status === "open"
                  ? { action: "close", label: "Close period" }
                  : {
                      action: "open",
                      label: "Reopen period",
                    },
              )
            }
          >
            {period?.status === "open"
              ? "Close period"
              : "Reopen period"}
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
          {groups.map(item => (
            <button key={item.key} ref={group.key === item.key ? selectedMonthButton : undefined}
              className={group.key === item.key ? "is-selected" : ""} aria-current={group.key === item.key ? "date" : undefined}
              onClick={() => changeMonth(item.from)}>
              <span className="period-list-heading"><strong>{item.label}</strong>{item.pending > 0 && <span className="period-pending-count" aria-label={`${item.pending} pending review`}>{item.pending.toLocaleString()}</span>}</span>
              <span className="period-list-summary"><PeriodStatusPill status={item.status} /><span>{item.posted.toLocaleString()} posted</span></span>
            </button>
          ))}
        </aside>
        <section className="period-detail" aria-label="Selected period">
          <div className="period-detail-heading">
            <div className="period-detail-meta">
              <h2>{group.label}</h2>
              <p>
                {monthly ? period?.closed_at
                  ? `Last closed ${stamp(period.closed_at)} by ${period.closed_by}`
                  : "No close recorded."
                  : `${group.months.length} accounting months - open and close each month separately.`}
              </p>
              {group.adjustments > 0 && (
                <p className="period-warning">
                  Adjusted after close: {group.adjustments}{" "}
                  journals. See History for approvals.
                </p>
              )}
            </div>
            <div className="period-report-links">
              <a
                href={`/income-statement?year=${group.from.slice(0, 4)}&from=${Number(group.from.slice(5, 7))}&to=${Number(group.to.slice(5, 7))}`}
              >
                Income Statement
              </a>
              <a href={`/balance-sheet?asof=${last}`}>Balance Sheet</a>
              <a href={`/general-ledger?from=${group.from}&to=${last}`}>
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
                tabIndex={tab === item.id ? 0 : -1}
                onClick={() => changeTab(item.id)}
                onKeyDown={event => {
                  const tabs = ["posted", "pending", "history"], index = tabs.indexOf(tab);
                  const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : -1;
                  if (next < 0) return;
                  event.preventDefault(); changeTab(tabs[next]);
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
                }}
              >
                {item.label}
                {item.id === "pending" && group.pending > 0 && <span className="period-pending-count" aria-label={`${group.pending} pending review`}>{group.pending.toLocaleString()}</span>}
              </button>
            ))}
          </div>
          {tab === "pending" && <div className="period-review-filter"><SearchableSelect label="Review status" value={reviewFilter}
            options={[{value:"pending",label:"Pending / repair needed"},{value:"all",label:"All requests"}]}
            onChange={value => {setReviewFilter(value); setPage(1); setData(null); setLoading(true);}} className="period-review-status" /></div>}
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
                    <th className="period-actions-heading">Actions</th>
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
                        <PeriodReviewActions status={row.status} writebackPending={row.writeback_pending} canManage={data.canManage}
                          onView={() => setSelected(row.id)} onAllow={() => begin({action:"approve",requestId:row.id,month:row.accounting_date.slice(0,7)+"-01",label:row.status === "pending" ? "Allow entry" : "Repair Airtable links"})} />
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
                          label: "Allow entry",
                          month: details.item.accounting_date.slice(0,7)+"-01",
                        });
                      }}
                    >
                      Allow entry
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
              <p>{monthLabel(action.month ?? month)}</p>
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
