"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { readAccountActivity } from "@/lib/reports/account-activity-client";
import type { AccountActivityCache } from "@/lib/reports/account-activity-client";
import { formatReportAmount } from "@/lib/format";
import { activityFiltered, dayBefore, filterActivityLines, lineTotals, naturalNet, NO_ACTIVITY_FILTERS, offsetKey, offsetLabel, rangeMonths, summarizeActivity } from "@/lib/reports/account-activity";
import type { AccountActivityParts, ActivityFilters, DrillRange } from "@/lib/reports/account-activity";
import { formatDate } from "@/lib/reports/report-utils";
import { ReportLink } from "./ReportNavigation";
import { SearchableSelect } from "./SearchableSelect";
import { FilterBar, SearchField, SegmentedControl } from "./FilterControls";
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

type Load = { key: string; cache: AccountActivityCache; summary?: AccountActivityParts["summary"]; lines?: AccountActivityParts["lines"]; summaryError?: boolean; linesError?: boolean };

/**
 * Slide-over drill-down for one account: analytics, filters, then the posted lines behind the row.
 * It renders above the page and closes with Escape, the close button or a click on the backdrop.
 */
export function AccountDrawer({ target, range, cache, accounts = [], onSelect, onClose }: {
  target: DrillTarget;
  range: DrillRange;
  cache: AccountActivityCache;
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
    const controller = new AbortController();
    setLoad({ key, cache });
    setFilters(NO_ACTIVITY_FILTERS);
    for (const section of ["summary", "lines"] as const) {
      readAccountActivity(cache, { account: target.code, mode, from, to }, section, controller.signal)
        .then(data => { if (!controller.signal.aborted) setLoad(previous => previous?.key === key ? { ...previous, [section]: data } : previous); })
        .catch(() => { if (!controller.signal.aborted) setLoad(previous => previous?.key === key ? { ...previous, [`${section}Error`]: true } : previous); });
    }
    return () => controller.abort();
  }, [key, target.code, mode, from, to, cache]);

  // Focus moves into the drawer and returns to the row that opened it.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    return () => { if (opener?.isConnected) opener.focus(); };
  }, []);

  const current = load?.key === key && load.cache === cache ? load : null;
  const listed = current?.lines;
  const lines = listed?.lines ?? [];
  const data = useMemo(() => current?.summary ? { ...current.summary, lines, truncated: listed?.truncated ?? true } : null, [current?.summary, listed]);
  const summary = useMemo(() => data ? summarizeActivity(data) : null, [data]);
  const visible = useMemo(() => filterActivityLines(lines, filters), [listed, filters]);
  const totals = lineTotals(visible);
  const filtered = activityFiltered(filters);
  const index = accounts.findIndex(account => account.code === target.code);
  const previousAccount = index > 0 ? accounts[index - 1] : null;
  const nextAccount = index >= 0 && index < accounts.length - 1 ? accounts[index + 1] : null;
  const title = data ? `${data.account.code} ${data.account.name}` : target.label;
  const lineMonths = rangeMonths(range.from, range.to);
  const offsetOptions = [...new Map(lines.map(line => [offsetKey(line), offsetLabel(line)])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
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

        <section className="drill-analytics" aria-label="Account summary" tabIndex={0} aria-busy={!data && !current?.summaryError}>
          {current?.summaryError ? <LoadError label="Account totals" onRetry={() => setAttempt(value => value + 1)} /> : data && summary ? <>
            <div className="drill-tiles">
              {data.mode === "balance" ? <>
                <div className="drill-tile"><span>Opening · {formatDate(dayBefore(data.from))}</span><strong>{money(data.opening ?? 0)}</strong></div>
                <div className="drill-tile"><span>Debits</span><strong>{money(data.debit)}</strong><small>{listed ? `${summary.debitLines} lines` : "Loading lines..."}</small></div>
                <div className="drill-tile"><span>Credits</span><strong>{money(data.credit)}</strong><small>{listed ? `${summary.creditLines} lines` : "Loading lines..."}</small></div>
                <div className="drill-tile is-result"><span>Closing · {formatDate(data.to)}</span><strong>{money(summary.closing ?? 0)}</strong></div>
              </> : <>
                <div className="drill-tile"><span>Net activity</span><strong>{money(summary.net)}</strong><small>{data.account.normalBalance === "credit" ? "Credit" : "Debit"}-normal account</small></div>
                <div className="drill-tile"><span>vs same dates {data.previous?.from.slice(0, 4)}</span><strong>{summary.change ? percent(summary.change.percent) : "N/A"}</strong><small>Prior {money(data.previous?.net ?? 0)}</small></div>
                <div className="drill-tile"><span>Posted lines</span><strong>{listed ? `${lines.length}${listed.truncated ? "+" : ""}` : "Loading..."}</strong><small>{listed ? `${summary.debitLines} debits / ${summary.creditLines} credits` : ""}</small></div>
                <div className="drill-tile"><span>Avg per month</span><strong>{money(summary.averagePerMonth)}</strong><small>{summary.months.length} months</small></div>
              </>}
            </div>
            {listed ? <div className="drill-charts">
              <MonthlyBars months={summary.months} />
              <OffsetMix offsets={summary.offsets} />
            </div> : <div className="drill-chart-loading" role="status"><span className="report-spinner" aria-hidden="true" /><span>Loading charts...</span></div>}
          </> : <div className="drill-summary-loading" role="status"><span className="report-spinner" aria-hidden="true" /><span>Loading account totals...</span></div>}
        </section>

          <FilterBar className="drill-filters" role="search" label="Filter ledger lines">
            <SearchField label="Search lines" placeholder="Entry, offset or notes" value={filters.query} onChange={query => set({ query })} />
            <SearchableSelect label="Month" value={filters.month} onChange={value => set({ month: value })} options={[{ value: "", label: "All months" }, ...lineMonths.map(month => ({ value: month.key, label: month.name }))]} className="drill-filter-field" />
            <SearchableSelect label="Offsetting account" value={filters.offset} onChange={value => set({ offset: value })} options={[{ value: "", label: "All offsetting accounts" }, ...offsetOptions.map(([value, label]) => ({ value, label }))]} disabled={!listed} className="drill-filter-field" />
            <SegmentedControl label="Entry side" value={filters.side} options={[{ value: "all", label: "All" }, { value: "debit", label: "Debit" }, { value: "credit", label: "Credit" }]} onChange={side => set({ side })} />
          </FilterBar>

        {current?.linesError ? <LoadError label="Ledger lines" onRetry={() => setAttempt(value => value + 1)} /> : !listed ? <section className="drill-lines drill-lines-loading" role="status" aria-label="Loading ledger lines" aria-busy="true"><span className="report-spinner" aria-hidden="true" /><span>Loading ledger lines...</span></section> : <>
          <div className="drill-status" role="status">
            <span><strong>{visible.length} of {lines.length} lines</strong>{filtered ? " match the filters" : ""}</span>
            {filtered && <button type="button" className="drill-link-button" onClick={() => setFilters(NO_ACTIVITY_FILTERS)}>Clear filters</button>}
          </div>

          <div className="drill-lines" tabIndex={0} role="region" aria-label="Account ledger lines">
            <table className="drill-table">
              <thead><tr><th scope="col">Date</th><th scope="col">Entry</th><th scope="col">Offsetting account</th><th scope="col">Notes</th><th scope="col" className="num">Debit</th><th scope="col" className="num">Credit</th><th scope="col"><span className="sr-only">Source record</span></th></tr></thead>
              <tbody>
                {visible.length === 0 ? <tr><td colSpan={7} className="drill-empty">{lines.length ? "No lines match these filters." : "No posted lines for this account in these dates."}</td></tr> : visible.map(line => {
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
            {data && <span>Net <strong>{money(naturalNet(totals.debit, totals.credit, data.account.normalBalance))}</strong></span>}
            {!filtered && summary?.tiesToTotals && <span className="drill-ties">✓ Lines tie to the trial balance</span>}
            {listed.truncated && <span className="drill-warning">Showing the first {lines.length} lines. Totals above include every line.</span>}
            <ReportLink className="btn btn-quiet drill-ledger-link" href={`/general-ledger${ledgerHref({ from, to, account: target.code })}`} onClick={onClose}>Open in General Ledger</ReportLink>
          </footer>
        </>}
      </aside>
    </div>
  );
}

function LoadError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return <div className="drill-state" role="alert"><p>{label} could not be loaded.</p><button type="button" className="btn btn-quiet" onClick={onRetry}>Try again</button></div>;
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
