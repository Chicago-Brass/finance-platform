"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { branchLabel } from "@/lib/reports/branch";
import { startOfYear } from "@/lib/dates";
import { formatDate, monthEnd, monthStart } from "@/lib/reports/report-utils";
import { buildBalanceSheetView, buildIncomeStatementView } from "@/lib/reports/statement-data";
import type { BalanceGrain, BalanceSheetData, IncomeGrain, IncomeStatementData } from "@/lib/reports/statement-data";
import type { IncomeStatementOptions } from "@/lib/reports/income-statement";
import type { BalanceSheetOptions } from "@/lib/reports/balance-sheet";
import type { Report } from "@/lib/reports/types";
import { LOGO_DATA_URI, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/reports/logo";
import { BranchFilter } from "./BranchFilter";
import { BalanceSheetFilters } from "./BalanceSheetFilters";
import { ReportFilters } from "./ReportFilters";
import { ReportDisplayControls, ReportExportButtons, ReportView, useReportDisplay } from "./ReportView";
import type { ReportDisplayState } from "./ReportView";
import { useReportNavigate, ReportDataBoundary } from "./ReportNavigation";
import { ReportDataPanel } from "./ReportDataPanel";
import type { ReportQuery } from "./ReportData";
import { ReportIcon } from "./ReportIcons";
import { ReportViewControls } from "./ReportViewControls";
import { FilterBar } from "./FilterControls";
import "./statement-controls.css";

const INCOME_GRAINS: { value: IncomeGrain; label: string }[] = [{ value: "month", label: "Monthly" }, { value: "quarter", label: "Quarterly" }, { value: "year", label: "Annual" }];
const BALANCE_GRAINS: { value: BalanceGrain; label: string }[] = [{ value: "single", label: "As of" }, { value: "month", label: "Monthly" }, { value: "quarter", label: "Quarterly" }, { value: "year", label: "Annual" }];

/** Mode changes use the already loaded data window; history keeps shareable URLs without a read. */
function useStatementView<G extends string>(initialGrain: G, initialSummary: boolean) {
  const [view, setView] = useState({ grain: initialGrain, summary: initialSummary });
  useEffect(() => setView({ grain: initialGrain, summary: initialSummary }), [initialGrain, initialSummary]);
  const update = (changes: Partial<typeof view>) => {
    const next = { ...view, ...changes };
    setView(next);
    const params = new URLSearchParams(window.location.search);
    params.set("grain", next.grain);
    params.set("layout", next.summary ? "summary" : "detail");
    window.history.replaceState(null, "", `?${params}`);
  };
  return { ...view, onGrain: (grain: G) => update({ grain }), onSummary: (summary: boolean) => update({ summary }) };
}

function DisabledExports() {
  return <><button type="button" className="btn btn-quiet" disabled><ReportIcon name="excel" />Export Excel</button><button type="button" className="btn btn-quiet" disabled><ReportIcon name="pdf" />Export PDF</button></>;
}

function ResolvedExports<T>({ data, build, display }: { data: T; build: (data: T) => Report; display: ReportDisplayState }) {
  const report = useMemo(() => build(data), [data, build]);
  return <ReportExportButtons report={report} display={display} />;
}

function ExportArea<T>({ data, build, display }: { data: ReportQuery<T>; build: (data: T) => Report; display: ReportDisplayState }) {
  return <div className="report-exports no-print" aria-label="Export report">
    {data.pending || data.error || data.data === undefined ? <DisabledExports /> : <ReportDataBoundary resetKey={data.data} fallback={<DisabledExports />}><ResolvedExports data={data.data} build={build} display={display} /></ReportDataBoundary>}
  </div>;
}

function StatementShell({ title, period, branch, controls, exports, data, display, children }: {
  title: string; period: string; branch?: string; controls: ReactNode; exports: ReactNode; data: ReportQuery<unknown>; display: ReportDisplayState; children: ReactNode;
}) {
  const params = useSearchParams(), navigate = useReportNavigate();
  return <article className="report-page statement-page">
    <header className="report-header">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="print-logo" src={LOGO_DATA_URI} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="Chicago Brass" />
      <div className="report-heading"><h1 className="report-title">{title}</h1><p className="report-entity">Chicago Brass Inc. - {branchLabel(branch)} / Accrual basis / USD</p><p className="report-period">{period}</p></div>
      {exports}
    </header>
    <FilterBar className="statement-control-bar no-print" label={`${title} controls`}>
      {controls}
      <button type="button" className="btn btn-quiet control-reset" disabled={!branch && !display.query && !display.hideZero && display.collapsed !== "all" && display.collapsed.size === 0} onClick={() => { display.setQuery(""); display.setHideZero(false); display.setCollapsed(new Set()); if (branch) { const next = new URLSearchParams(params); next.delete("branch"); navigate(`?${next}`); } }}>Reset filters</button>
    </FilterBar>
    <ReportDataPanel query={data} analytics>{children}</ReportDataPanel>
  </article>;
}

export function IncomeStatementWorkspace({ data, options: initial }: { data: ReportQuery<IncomeStatementData>; options: IncomeStatementOptions }) {
  const view = useStatementView(initial.grain, initial.summary), display = useReportDisplay();
  const options = { ...initial, grain: view.grain, summary: view.summary };
  const build = useCallback((value: IncomeStatementData) => buildIncomeStatementView(value, view.grain, view.summary).report, [view.grain, view.summary]);
  return <StatementShell title="Income Statement" branch={initial.branch} period={`${formatDate(monthStart(initial.year, initial.from))} to ${formatDate(monthEnd(initial.year, initial.to))}`} data={data} display={display}
    controls={<ReportDisplayControls display={display} summary={view.summary}><ReportFilters options={options} /><BranchFilter value={options.branch} /><ReportViewControls grains={INCOME_GRAINS} {...view} /></ReportDisplayControls>}
    exports={<ExportArea data={data} build={build} display={display} />}>
    {data.data && <IncomeData data={data.data} grain={view.grain} summary={view.summary} display={display} />}
  </StatementShell>;
}

function IncomeData({ data, grain, summary, display }: { data: IncomeStatementData; grain: IncomeGrain; summary: boolean; display: ReportDisplayState }) {
  const built = useMemo(() => buildIncomeStatementView(data, grain, summary), [data, grain, summary]);
  const drill = useMemo(() => ({ mode: "period" as const, from: monthStart(data.year, data.from), to: monthEnd(data.year, data.to), branch: data.branch }), [data.year, data.from, data.to, data.branch]);
  return <ReportView report={built.report} analytics={built.analytics} drill={drill} display={display} />;
}

export function BalanceSheetWorkspace({ data, options: initial }: { data: ReportQuery<BalanceSheetData>; options: BalanceSheetOptions }) {
  const view = useStatementView(initial.grain, initial.summary), display = useReportDisplay();
  const options = { ...initial, grain: view.grain, summary: view.summary };
  const build = useCallback((value: BalanceSheetData) => buildBalanceSheetView(value, view.grain, view.summary).report, [view.grain, view.summary]);
  return <StatementShell title="Balance Sheet" branch={initial.branch} period={`As of ${formatDate(initial.asOf)}`} data={data} display={display}
    controls={<ReportDisplayControls display={display} summary={view.summary}><BalanceSheetFilters options={options} /><BranchFilter value={options.branch} /><ReportViewControls grains={BALANCE_GRAINS} {...view} /></ReportDisplayControls>}
    exports={<ExportArea data={data} build={build} display={display} />}>
    {data.data && <BalanceData data={data.data} grain={view.grain} summary={view.summary} display={display} />}
  </StatementShell>;
}

function BalanceData({ data, grain, summary, display }: { data: BalanceSheetData; grain: BalanceGrain; summary: boolean; display: ReportDisplayState }) {
  const built = useMemo(() => buildBalanceSheetView(data, grain, summary), [data, grain, summary]);
  const drill = useMemo(() => ({ mode: "balance" as const, from: startOfYear(data.asOf), to: data.asOf, branch: data.branch }), [data.asOf, data.branch]);
  return <ReportView report={built.report} analytics={built.analytics} drill={drill} display={display} />;
}
