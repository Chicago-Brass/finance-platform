"use client";

import { DismissibleMenu } from "./DismissibleMenu";
import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Report, ReportLine } from "@/lib/reports/types";
import type { ReportAnalytics as AnalyticsData } from "@/lib/reports/analytics";
import { formatReportAmount, formatPercent } from "@/lib/format";
import { downloadExcel } from "@/lib/reports/export-excel";
import type { DrillRange } from "@/lib/reports/account-activity";
import type { AccountActivityCache } from "@/lib/reports/account-activity-client";
import { AccountDrawer } from "./AccountDrawer";
import type { DrillTarget } from "./AccountDrawer";
import { ReportAnalytics } from "./ReportAnalytics";
import { ReportIcon } from "./ReportIcons";
import { SearchField } from "./FilterControls";

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

export type ReportDisplayState = {
  query: string;
  hideZero: boolean;
  collapsed: Set<string> | "all";
  setQuery: (query: string) => void;
  setHideZero: (hide: boolean) => void;
  setCollapsed: Dispatch<SetStateAction<Set<string> | "all">>;
};

export function useReportDisplay(): ReportDisplayState {
  const [query, setSearch] = useState("");
  const [hideZero, setHideZero] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string> | "all">(new Set());
  return { query, hideZero, collapsed, setQuery: value => { setSearch(value); setCollapsed(new Set()); }, setHideZero, setCollapsed };
}

/** Display controls stay in the page shell, even before financial data arrives. */
export function ReportDisplayControls({ display, summary = false }: { display: ReportDisplayState; summary?: boolean }) {
  const { query, hideZero, setQuery, setHideZero, setCollapsed } = display;
  return <>
    <SearchField label="Search accounts" placeholder={summary ? "Search in Details" : "Name or account number"} value={query} disabled={summary} onChange={setQuery} title={summary ? "Choose Details to search individual accounts." : undefined} />
    <DismissibleMenu className="report-filter-menu">
      <summary className="btn btn-quiet">Filters{hideZero && <span className="report-filter-count">1</span>}</summary>
      <div className="report-filter-popover">
        <h2>Account display</h2>
        <label className="report-zero-option"><input type="checkbox" checked={!hideZero} disabled={summary} onChange={event => setHideZero(!event.target.checked)} />Show zero accounts</label>
        <div className="report-collapse-actions"><button className="btn btn-quiet" type="button" onClick={() => setCollapsed(new Set())}><ReportIcon name="expand" />Expand all</button><button className="btn btn-quiet" type="button" onClick={() => setCollapsed("all")}><ReportIcon name="collapse" />Collapse all</button></div>
        <p>Display filters do not change financial totals.</p>
        {(query || hideZero) && <button type="button" className="report-reset-display" onClick={() => { setQuery(""); setHideZero(false); }}>Reset display</button>}
      </div>
    </DismissibleMenu>
  </>;
}

export function reportRows(report: Report, display: Pick<ReportDisplayState, "query" | "hideZero" | "collapsed">) {
  return visibleLines(filterReportLines(report.lines, display.query, display.hideZero), display.collapsed === "all" ? collapsibleIds(report.lines) : display.collapsed);
}

export function ReportExportButtons({ report, display }: { report: Report; display: ReportDisplayState }) {
  return <>
    <button type="button" className="btn btn-quiet" onClick={() => downloadExcel(report, reportRows(report, display))}><ReportIcon name="excel" />Export Excel</button>
    <button type="button" className="btn btn-quiet" onClick={() => window.print()}><ReportIcon name="pdf" />Export PDF</button>
  </>;
}

/** Financial data panels only. Header and controls belong to the persistent workspace shell. */
export function ReportView({ report, analytics, drill, display }: {
  report: Report;
  analytics?: AnalyticsData;
  drill?: DrillRange;
  display: ReportDisplayState;
}) {
  const [drillTarget, setDrillTarget] = useState<DrillTarget | null>(null);
  const activityCache = useMemo<AccountActivityCache>(() => new Map(), [report, drill]);
  const targets = useMemo(() => drill ? drillTargets(report) : [], [drill, report]);
  const { collapsed, setCollapsed, query, hideZero } = display;
  const canCollapse = useMemo(() => collapsibleIds(report.lines), [report.lines]);
  const collapsedIds = collapsed === "all" ? canCollapse : collapsed;
  const hasAccounts = report.lines.some(line => line.accountCode);
  const filtered = useMemo(() => filterReportLines(report.lines, query, hideZero), [report.lines, query, hideZero]);
  const rows = useMemo(() => visibleLines(filtered, collapsedIds), [filtered, collapsedIds]);
  const displayFiltered = hasAccounts && (query.trim() !== "" || hideZero);
  const matchingAccounts = filtered.filter(line => line.accountCode).length;
  const toggle = (id: string) => setCollapsed(previous => {
    const next = new Set(previous === "all" ? canCollapse : previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="statement-results">
      {report.isSample && <p className="sample-banner" role="note">Sample data. These figures are for layout review and are not Chicago Brass results.</p>}
      {report.checks.some(check => !check.ok) && <div className="report-alerts" role="status">{report.checks.filter(check => !check.ok).map(check => <p className="check check-bad" key={check.label}>{check.label}: {check.detail}</p>)}</div>}
      <div className={`report-workspace${analytics ? " has-analytics" : ""}`}>
        <section className="statement-panel" aria-label={report.title}>
          <div className="table-wrap" tabIndex={0} role="region" aria-label={`${report.title} accounts`}>
            <table className="fin-table">
              <colgroup><col className="col-label" />{report.columns.map(column => <col key={column.key} className={column.kind === "percent" ? "col-pct" : "col-amt"} />)}</colgroup>
              <thead><tr><th scope="col" className="label-cell">Account</th>{report.columns.map(column => <th key={column.key} scope="col" className="num-cell"><span className="col-head">{column.label}{column.sublabel && <> <span className="col-sub">{column.sublabel}</span></>}</span></th>)}</tr></thead>
              <tbody>
                {displayFiltered && hasAccounts && matchingAccounts === 0 && <tr><td colSpan={report.columns.length + 1} className="report-no-matches">No accounts match the display filters. Financial totals remain below.</td></tr>}
                {rows.map(line => {
                  const isToggle = canCollapse.has(line.id), isCollapsed = collapsedIds.has(line.id);
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
            {displayFiltered && <span role="status">{matchingAccounts} matching accounts. Totals include all accounts; export uses visible rows.</span>}
          </footer>
        </section>
        {analytics && <ReportAnalytics analytics={analytics} />}
      </div>
      {drill && drillTarget && <AccountDrawer target={drillTarget} range={drill} cache={activityCache} accounts={targets} onSelect={setDrillTarget} onClose={() => setDrillTarget(null)} />}
    </div>
  );
}
