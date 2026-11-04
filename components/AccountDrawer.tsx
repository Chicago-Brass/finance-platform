"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { loadAccountActivity } from "@/app/(reports)/account-activity-action";
import { formatReportAmount } from "@/lib/format";
import { activityFiltered, dayBefore, filterActivityLines, lineTotals, naturalNet, NO_ACTIVITY_FILTERS, offsetKey, offsetLabel, rangeMonths, summarizeActivity } from "@/lib/reports/account-activity";
import type { AccountActivity, ActivityFilters, DrillRange } from "@/lib/reports/account-activity";
import { formatDate } from "@/lib/reports/report-utils";
import { ReportLink } from "./ReportNavigation";
import { ledgerHref, safeAuditLink } from "./ledger-table-utils";
import "./account-drawer.css";

/** The row a drill-down opens from. `lineId` highlights one ledger line in the list. */
export type DrillTarget = { code: string; label: string; context?: string; lineId?: string };

const money = (amountCents: number) => formatReportAmount(amountCents / 100);
const percent = (value: number | null) => value == null ? "N/A" : `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

function Icon({ path }: { path: string }) {
  return <svg className="drill-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>;
}

type Load = { key: string; status: "loading" } | { key: string; status: "ready"; data: AccountActivity } | { key: string; status: "error"; message: string };

/**
 * Slide-over drill-down for one account: analytics, filters, then the posted lines behind the row.
 * It renders above the page and closes with Escape, the close button or a click on the backdrop.
 */
export function AccountDrawer({ target, range, accounts = [], onSelect, onClose }: {
  target: DrillTarget;
  range: DrillRange;
  accounts?: DrillTarget[];
  onSelect: (target: DrillTarget) => void;
  onClose: () => void;
}) {
  const id = useId();
  const panel = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [load, setLoad] = useState<Load | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>(NO_ACTIVITY_FILTERS);
  const [attempt, setAttempt] = useState(0);
  const { mode, from, to } = range;
  const key = `${target.code}|${mode}|${from}|${to}|${attempt}`;

  useEffect(() => {
    let current = true;
    setLoad({ key, status: "loading" });
    setFilters(NO_ACTIVITY_FILTERS);
    loadAccountActivity({ account: target.code, mode, from, to })
      .then(data => { if (current) setLoad({ key, status: "ready", data }); })
      .catch(() => { if (current) setLoad({ key, status: "error", message: "The account's ledger lines could not be loaded." }); });
    return () => { current = false; };
  }, [key, target.code, mode, from, to]);

  // Focus moves into the drawer and returns to the row that opened it.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    return () => { if (opener?.isConnected) opener.focus(); };
  }, []);

  const data = load?.key === key && load.status === "ready" ? load.data : null;
  const summary = useMemo(() => data ? summarizeActivity(data) : null, [data]);
  const visible = useMemo(() => data ? filterActivityLines(data.lines, filters) : [], [data, filters]);
  const totals = lineTotals(visible);
  const filtered = activityFiltered(filters);
  const index = accounts.findIndex(account => account.code === target.code);
  const previousAccount = index > 0 ? accounts[index - 1] : null;
  const nextAccount = index >= 0 && index < accounts.length - 1 ? accounts[index + 1] : null;
  const title = data ? `${data.account.code} ${data.account.name}` : target.label;
  const lineMonths = data ? rangeMonths(range.from, range.to).filter(month => data.lines.some(line => line.date.startsWith(month.key))) : [];
  const offsetOptions = data ? [...new Map(data.lines.map(line => [offsetKey(line), offsetLabel(line)])).entries()].sort((a, b) => a[1].localeCompare(b[1])) : [];
  const set = (patch: Partial<ActivityFilters>) => setFilters(previous => ({ ...previous, ...patch }));

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") { event.stopPropagation(); onClose(); return; }
    if (event.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(item => item.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return (
    <div className="drill-layer no-print">
      <div className="drill-scrim" aria-hidden="true" onClick={onClose} />
      <aside ref={panel} className="drill-drawer" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-range`} onKeyDown={onKeyDown}>
        <header className="drill-header">
          <div className="drill-heading">
            {target.context && <p className="drill-eyebrow">{target.context}</p>}
            <h2 id={`${id}-title`}>{title}</h2>
            <p id={`${id}-range`} className="drill-range">{formatDate(range.from)} – {formatDate(range.to)}</p>
          </div>
          {accounts.length > 1 && <>
            <button type="button" className="drill-icon-button" aria-label={previousAccount ? `Previous account: ${previousAccount.label}` : "No previous account"} disabled={!previousAccount} onClick={() => previousAccount && onSelect(previousAccount)}><Icon path="M18 15l-6-6-6 6" /></button>
            <button type="button" className="drill-icon-button" aria-label={nextAccount ? `Next account: ${nextAccount.label}` : "No next account"} disabled={!nextAccount} onClick={() => nextAccount && onSelect(nextAccount)}><Icon path="M6 9l6 6 6-6" /></button>
          </>}
          <button ref={closeButton} type="button" className="drill-icon-button drill-close" aria-label="Close account details" onClick={onClose}><Icon path="M6 6l12 12M18 6L6 18" /></button>
        </header>

        {load?.key === key && load.status === "error" && <div className="drill-state" role="alert"><p>{load.message}</p><button type="button" className="btn btn-quiet" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
        {!data && load?.status !== "error" && <div className="drill-state drill-loading" role="status"><span className="report-spinner" aria-hidden="true" />Loading ledger lines...</div>}

        {data && summary && <>
          <section className="drill-analytics" aria-label="Account summary">
            <div className="drill-tiles">
              {data.mode === "balance" ? <>
                <div className="drill-tile"><span>Opening · {formatDate(dayBefore(data.from))}</span><strong>{money(data.opening ?? 0)}</strong></div>
                <div className="drill-tile"><span>Debits</span><strong>{money(data.debit)}</strong><small>{summary.debitLines} lines</small></div>
                <div className="drill-tile"><span>Credits</span><strong>{money(data.credit)}</strong><small>{summary.creditLines} lines</small></div>
                <div className="drill-tile is-result"><span>Closing · {formatDate(data.to)}</span><strong>{money(summary.closing ?? 0)}</strong></div>
              </> : <>
                <div className="drill-tile"><span>Net activity</span><strong>{money(summary.net)}</strong><small>{data.account.normalBalance === "credit" ? "Credit" : "Debit"}-normal account</small></div>
                <div className="drill-tile"><span>vs same dates {data.previous?.from.slice(0, 4)}</span><strong>{summary.change ? percent(summary.change.percent) : "N/A"}</strong><small>Prior {money(data.previous?.net ?? 0)}</small></div>
                <div className="drill-tile"><span>Posted lines</span><strong>{data.lines.length}{data.truncated ? "+" : ""}</strong><small>{summary.debitLines} debits · {summary.creditLines} credits</small></div>
                <div className="drill-tile"><span>Avg per month</span><strong>{money(summary.averagePerMonth)}</strong><small>{summary.months.length} months</small></div>
              </>}
            </div>
            <div className="drill-charts">
              <MonthlyBars months={summary.months} />
              <OffsetMix offsets={summary.offsets} />
            </div>
          </section>

          <div className="drill-filters" role="search" aria-label="Filter ledger lines">
            <label className="drill-search"><Icon path="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5" /><span className="sr-only">Search lines</span><input type="search" placeholder="Search entry, offset or notes" value={filters.query} onChange={event => set({ query: event.target.value })} /></label>
            <select aria-label="Month" value={filters.month} onChange={event => set({ month: event.target.value })}><option value="">All months</option>{lineMonths.map(month => <option key={month.key} value={month.key}>{month.name}</option>)}</select>
            <select aria-label="Offsetting account" value={filters.offset} onChange={event => set({ offset: event.target.value })}><option value="">All offsetting accounts</option>{offsetOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <div className="drill-sides" role="group" aria-label="Entry side">{(["all", "debit", "credit"] as const).map(side => <button key={side} type="button" aria-pressed={filters.side === side} onClick={() => set({ side })}>{side === "all" ? "All" : side === "debit" ? "Debit" : "Credit"}</button>)}</div>
          </div>
          <div className="drill-status" role="status">
            <span><strong>{visible.length} of {data.lines.length} lines</strong>{filtered ? " match the filters" : ""}</span>
            {filtered && <button type="button" className="drill-link-button" onClick={() => setFilters(NO_ACTIVITY_FILTERS)}>Clear filters</button>}
          </div>

          <div className="drill-lines">
            <table className="drill-table">
              <thead><tr><th scope="col">Date</th><th scope="col">Entry</th><th scope="col">Offsetting account</th><th scope="col">Notes</th><th scope="col" className="num">Debit</th><th scope="col" className="num">Credit</th><th scope="col"><span className="sr-only">Source record</span></th></tr></thead>
              <tbody>
                {visible.length === 0 ? <tr><td colSpan={7} className="drill-empty">{data.lines.length ? "No lines match these filters." : "No posted lines for this account in these dates."}</td></tr> : visible.map(line => {
                  const audit = safeAuditLink(line.auditLink);
                  return <tr key={line.id} className={line.id === target.lineId ? "is-target" : undefined}>
                    <td><time dateTime={line.date}>{formatDate(line.date)}</time></td>
                    <td>{line.entry}</td>
                    <td className="drill-offset">{offsetLabel(line)}</td>
                    <td className="drill-notes">{line.notes || <span className="drill-muted">-</span>}</td>
                    <td className="num">{line.debit ? money(line.debit) : ""}</td>
                    <td className="num">{line.credit ? money(line.credit) : ""}</td>
                    <td>{audit && <a className="drill-source" href={audit} target="_blank" rel="noopener noreferrer" aria-label={`Open the source record for entry ${line.entry}`}><Icon path="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></a>}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>

          <footer className="drill-footer">
            <span>Debits <strong>{money(totals.debit)}</strong></span>
            <span>Credits <strong>{money(totals.credit)}</strong></span>
            <span>Net <strong>{money(naturalNet(totals.debit, totals.credit, data.account.normalBalance))}</strong></span>
            {!filtered && summary.tiesToTotals && <span className="drill-ties">✓ Lines tie to the trial balance</span>}
            {data.truncated && <span className="drill-warning">Showing the first {data.lines.length} lines. Totals above include every line.</span>}
            <ReportLink className="btn btn-quiet drill-ledger-link" href={`/general-ledger${ledgerHref({ from: data.from, to: data.to, account: data.account.code })}`} onClick={onClose}>Open in General Ledger</ReportLink>
          </footer>
        </>}
      </aside>
    </div>
  );
}

function MonthlyBars({ months }: { months: { key: string; label: string; name: string; net: number }[] }) {
  const max = Math.max(1, ...months.map(month => Math.abs(month.net)));
  const labelEvery = months.length > 12 ? Math.ceil(months.length / 6) : 1;
  return (
    <figure className="drill-chart">
      <figcaption>Monthly activity</figcaption>
      <div className="drill-bars" role="img" aria-label={`Monthly activity: ${months.map(month => `${month.name} ${money(month.net)}`).join(", ")}`}>
        {months.map(month => <span key={month.key} className={`drill-bar${month.net < 0 ? " is-negative" : ""}`} style={{ height: `${Math.max(month.net === 0 ? 0 : 3, Math.round(Math.abs(month.net) / max * 100))}%` }} title={`${month.name}: ${money(month.net)}`} />)}
      </div>
      <div className="drill-bar-labels" aria-hidden="true">{months.map((month, index) => <span key={month.key}>{index % labelEvery === 0 ? month.label : ""}</span>)}</div>
    </figure>
  );
}

const MIX_COLORS = ["#1e3a5f", "#3b6ea5", "#6f93b8", "#a9bdcf", "#d2dde6"];

function OffsetMix({ offsets }: { offsets: { key: string; label: string; net: number }[] }) {
  const top = offsets.slice(0, 4);
  const rest = offsets.slice(4).reduce((sum, offset) => sum + offset.net, 0);
  const items = offsets.length > 4 ? [...top, { key: "other", label: "Other accounts", net: rest }] : top;
  const total = items.reduce((sum, item) => sum + item.net, 0);
  const chartable = items.length > 0 && total > 0 && items.every(item => item.net >= 0);
  return (
    <figure className="drill-chart">
      <figcaption>Offsetting accounts</figcaption>
      {!items.length && <p className="drill-muted">No lines in these dates.</p>}
      {chartable && <div className="drill-mix" aria-hidden="true">{items.map((item, index) => <span key={item.key} style={{ width: `${item.net / total * 100}%`, background: MIX_COLORS[index] }} />)}</div>}
      <ul className="drill-legend">
        {items.map((item, index) => <li key={item.key}><span><i style={{ background: MIX_COLORS[index] }} aria-hidden="true" />{item.label}</span><span>{money(item.net)}{chartable ? ` · ${Math.round(item.net / total * 100)}%` : ""}</span></li>)}
      </ul>
    </figure>
  );
}
