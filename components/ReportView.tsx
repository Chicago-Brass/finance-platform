"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Report, ReportLine } from "@/lib/reports/types";
import type { ReportAnalytics as AnalyticsData } from "@/lib/reports/analytics";
import { formatReportAmount, formatPercent } from "@/lib/format";
import { downloadExcel } from "@/lib/reports/export-excel";
import { LOGO_DATA_URI, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/reports/logo";
import type { DrillRange } from "@/lib/reports/account-activity";
import type { AccountActivityCache } from "@/lib/reports/account-activity-client";
import { AccountDrawer } from "./AccountDrawer";
import type { DrillTarget } from "./AccountDrawer";
import { ReportAnalytics } from "./ReportAnalytics";
import { ReportIcon } from "./ReportIcons";

/** A section can collapse when its next row is nested inside it. */
export function collapsibleIds(lines: ReportLine[]) {
  const ids = new Set<string>();
  lines.forEach((line, index) => {
    if (line.kind === "section" && lines[index + 1]?.depth > line.depth) ids.add(line.id);
  });
  return ids;
}

export function visibleLines(lines: ReportLine[], collapsed: Set<string>) {
  const rows: ReportLine[] = [];
  let hideBelow: number | null = null;
  for (const line of lines) {
    if (hideBelow !== null) {
      if (line.depth > hideBelow) continue;
      hideBelow = null;
    }
    rows.push(line);
    if (line.kind === "section" && collapsed.has(line.id)) hideBelow = line.depth;
  }
  return rows;
}

/** Display filters hide individual accounts; financial totals retain their full-period values. */
export function filterReportLines(lines: ReportLine[], query: string, hideZero: boolean) {
  const search = query.trim().toLocaleLowerCase();
  return lines.filter(line => {
    if (!line.accountCode) return true;
    if (search && !`${line.accountCode} ${line.label}`.toLocaleLowerCase().includes(search)) return false;
    const values = Object.values(line.values);
    return !hideZero || !values.length || !values.every(value => value === 0);
  });
}

/** Account rows in report order, each labeled with its report section, for the drill-down drawer. */
export function drillTargets(report: Report): DrillTarget[] {
  let section = "";
  const targets: DrillTarget[] = [];
  for (const line of report.lines) {
    if (line.kind === "section") section = line.label;
    else if (line.accountCode) targets.push({ code: line.accountCode, label: line.label, context: section ? `${report.title} · ${section}` : report.title });
  }
  return targets;
}

export function ReportView({ report, analytics, filters, viewControls, drill }: {
  report: Report;
  analytics?: AnalyticsData;
  filters?: ReactNode;
  viewControls?: ReactNode;
  /** When set, account rows open the drill-down drawer for this date range. */
  drill?: DrillRange;
}) {
  const [drillTarget, setDrillTarget] = useState<DrillTarget | null>(null);
  const activityCache = useMemo<AccountActivityCache>(() => new Map(), [report, drill]);
  const targets = useMemo(() => drill ? drillTargets(report) : [], [drill, report]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [hideZero, setHideZero] = useState(false);
  const canCollapse = useMemo(() => collapsibleIds(report.lines), [report.lines]);
  const hasAccounts = report.lines.some(line => line.accountCode);
  const filtered = useMemo(() => filterReportLines(report.lines, query, hideZero), [report.lines, query, hideZero]);
  const rows = useMemo(() => visibleLines(filtered, collapsed), [filtered, collapsed]);
  const displayFiltered = hasAccounts && (query.trim() !== "" || hideZero);
  const matchingAccounts = filtered.filter(line => line.accountCode).length;
  const toggle = (id: string) => setCollapsed(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <article className="report-page">
      <header className="report-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="print-logo" src={LOGO_DATA_URI} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="Chicago Brass" />
        <div className="report-heading">
          <h1 className="report-title">{report.title}</h1>
          <p className="report-entity">{report.entity} / {report.basis.split(" - ")[0]} / USD</p>
          <p className="report-period">{report.periodLabel}</p>
        </div>
        <div className="report-exports no-print" aria-label="Export report">
          <button type="button" className="btn btn-quiet" onClick={() => downloadExcel(report, rows)}><ReportIcon name="excel" />Export Excel</button>
          <button type="button" className="btn btn-quiet" onClick={() => window.print()}><ReportIcon name="pdf" />Export PDF</button>
        </div>
      </header>

      {report.isSample && <p className="sample-banner" role="note">Sample data. These figures are for layout review and are not Chicago Brass results.</p>}
      {report.checks.some(check => !check.ok) && <div className="report-alerts" role="status">{report.checks.filter(check => !check.ok).map(check => <p className="check check-bad" key={check.label}>{check.label}: {check.detail}</p>)}</div>}
      {filters}

      <div className={`report-workspace${analytics ? " has-analytics" : ""}`}>
        <section className="statement-panel" aria-label={report.title}>
          <div className="statement-toolbar no-print">
            <div className="statement-view-controls">{viewControls}</div>
            <div className="statement-tools">
              {hasAccounts && <label className="report-account-search"><ReportIcon name="search" /><span className="sr-only">Search accounts</span><input type="search" placeholder="Search accounts" value={query} onChange={event => { setQuery(event.target.value); setCollapsed(new Set()); }} /></label>}
              {(hasAccounts || canCollapse.size > 0) && <details className="report-filter-menu">
                <summary className="btn btn-quiet"><ReportIcon name="filter" />Filters{hasAccounts && hideZero && <span className="report-filter-count">1</span>}</summary>
                <div className="report-filter-popover">
                  <h2>Account display</h2>
                  {hasAccounts && <label className="report-zero-option"><input type="checkbox" checked={!hideZero} onChange={event => setHideZero(!event.target.checked)} />Show zero accounts</label>}
                  {canCollapse.size > 0 && <div className="report-collapse-actions"><button className="btn btn-quiet" type="button" onClick={() => setCollapsed(new Set())}><ReportIcon name="expand" />Expand all</button><button className="btn btn-quiet" type="button" onClick={() => setCollapsed(new Set(canCollapse))}><ReportIcon name="collapse" />Collapse all</button></div>}
                  <p>Display filters do not change financial totals.</p>
                  {displayFiltered && <button type="button" className="report-reset-display" onClick={() => { setQuery(""); setHideZero(false); }}>Reset display filters</button>}
                </div>
              </details>}
            </div>
          </div>

          {displayFiltered && <p className="report-display-note" role="status">{matchingAccounts} matching accounts. Totals include all accounts.</p>}
          <div className="table-wrap">
            <table className="fin-table">
              <colgroup><col className="col-label" />{report.columns.map(column => <col key={column.key} className={column.kind === "percent" ? "col-pct" : "col-amt"} />)}</colgroup>
              <thead><tr><th scope="col" className="label-cell">Account</th>{report.columns.map(column => <th key={column.key} scope="col" className="num-cell"><span className="col-head">{column.label}</span>{column.sublabel && <span className="col-sub">{column.sublabel}</span>}</th>)}</tr></thead>
              <tbody>
                {displayFiltered && hasAccounts && matchingAccounts === 0 && <tr><td colSpan={report.columns.length + 1} className="report-no-matches">No accounts match the display filters. Financial totals remain below.</td></tr>}
                {rows.map(line => {
                  const isToggle = canCollapse.has(line.id), isCollapsed = collapsed.has(line.id);
                  const target = drill && line.accountCode && !isToggle ? targets.find(item => item.code === line.accountCode) : undefined;
                  const drilled = !!target && drillTarget?.code === target.code;
                  return <tr key={line.id} className={`row-${line.kind}${line.spaceBefore ? " row-gap" : ""}${drilled ? " is-drilled" : ""}`} data-account={line.accountCode}>
                    <th scope="row" className="label-cell" style={{ paddingLeft: `${14 + line.depth * 14}px` }}>
                      {isToggle ? <button type="button" className="row-toggle" aria-expanded={!isCollapsed} onClick={() => toggle(line.id)}><ReportIcon name={isCollapsed ? "chevronRight" : "chevronDown"} className="row-caret no-print" />{line.label}</button>
                        : target ? <button type="button" className="drill-trigger" aria-haspopup="dialog" aria-expanded={drilled} title={`Open ${target.code} details`} onClick={() => setDrillTarget(target)}><span className="drill-trigger-label">{line.label}</span></button>
                        : line.label}
                    </th>
                    {report.columns.map(column => {
                      const value = line.values[column.key];
                      const text = line.kind === "section" ? "" : column.kind === "percent" ? formatPercent(value) : formatReportAmount(value);
                      return <td key={column.key} className={`num-cell${typeof value === "number" && value < 0 ? " neg" : ""}`}>{text}</td>;
                    })}
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <footer className="report-status">
            {report.checks.filter(check => check.ok).map(check => <span key={check.label} title={check.detail}><ReportIcon name="check" />{check.label}: {check.detail}</span>)}
            {displayFiltered && <span>Export includes the visible account rows.</span>}
          </footer>
        </section>
        {analytics && <ReportAnalytics analytics={analytics} />}
      </div>
      {drill && drillTarget && <AccountDrawer target={drillTarget} range={drill} cache={activityCache} accounts={targets} onSelect={setDrillTarget} onClose={() => setDrillTarget(null)} />}
    </article>
  );
}
