"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { startOfYear } from "@/lib/dates";
import { formatDate, monthEnd, monthStart } from "@/lib/reports/report-utils";
import { buildBalanceSheetView, buildIncomeStatementView } from "@/lib/reports/statement-data";
import type { BalanceGrain, BalanceSheetData, IncomeGrain, IncomeStatementData } from "@/lib/reports/statement-data";
import type { IncomeStatementOptions } from "@/lib/reports/income-statement";
import type { BalanceSheetOptions } from "@/lib/reports/balance-sheet";
import type { Report } from "@/lib/reports/types";
import { LOGO_DATA_URI, LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/reports/logo";
import { BalanceSheetFilters } from "./BalanceSheetFilters";
import { ReportFilters } from "./ReportFilters";
import { ReportDisplayControls, ReportExportButtons, ReportView, useReportDisplay } from "./ReportView";
import type { ReportDisplayState } from "./ReportView";
import { ReportDataBoundary, ReportDataLoading, ReportDataRegion, useReportPending } from "./ReportNavigation";
import { ReportIcon } from "./ReportIcons";
import { ReportViewControls } from "./ReportViewControls";
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

function ResolvedExports<T>({ data, build, display }: { data: Promise<T>; build: (data: T) => Report; display: ReportDisplayState }) {
  const value = use(data);
  return <ReportExportButtons report={build(value)} display={display} />;
}

function ExportArea({ children, resetKey }: { children: ReactNode; resetKey: unknown }) {
  const pending = useReportPending();
  return <div className="report-exports no-print" aria-label="Export report">
    {pending ? <DisabledExports /> : <ReportDataBoundary resetKey={resetKey} fallback={<DisabledExports />}><Suspense fallback={<DisabledExports />}>{children}</Suspense></ReportDataBoundary>}
  </div>;
}

function StatementShell({ title, period, controls, exports, resetKey, children }: {
  title: string; period: string; controls: ReactNode; exports: ReactNode; resetKey: unknown; children: ReactNode;
}) {
  return <article className="report-page statement-page">
    <header className="report-header">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="print-logo" src={LOGO_DATA_URI} width={LOGO_WIDTH} height={LOGO_HEIGHT} alt="Chicago Brass" />
      <div className="report-heading"><h1 className="report-title">{title}</h1><p className="report-entity">Chicago Brass Inc. - Consolidated / Accrual basis / USD</p><p className="report-period">{period}</p></div>
      {exports}
    </header>
    <div className="dashboard-control-bar statement-control-bar no-print" aria-label={`${title} controls`}>{controls}</div>
    <ReportDataRegion analytics>
      <ReportDataBoundary resetKey={resetKey} analytics><Suspense fallback={<ReportDataLoading analytics />}>{children}</Suspense></ReportDataBoundary>
    </ReportDataRegion>
  </article>;
}

export function IncomeStatementWorkspace({ data, options: initial }: { data: Promise<IncomeStatementData>; options: IncomeStatementOptions }) {
  const view = useStatementView(initial.grain, initial.summary), display = useReportDisplay();
  const options = { ...initial, grain: view.grain, summary: view.summary };
  const build = (value: IncomeStatementData) => buildIncomeStatementView(value, view.grain, view.summary).report;
  return <StatementShell title="Income Statement" period={`${formatDate(monthStart(initial.year, initial.from))} to ${formatDate(monthEnd(initial.year, initial.to))}`} resetKey={data}
    controls={<><ReportFilters options={options} /><ReportViewControls grains={INCOME_GRAINS} {...view} /><ReportDisplayControls display={display} summary={view.summary} /></>}
    exports={<ExportArea resetKey={data}><ResolvedExports data={data} build={build} display={display} /></ExportArea>}>
    <IncomeData data={data} grain={view.grain} summary={view.summary} display={display} />
  </StatementShell>;
}

function IncomeData({ data, grain, summary, display }: { data: Promise<IncomeStatementData>; grain: IncomeGrain; summary: boolean; display: ReportDisplayState }) {
  const value = use(data);
  const built = useMemo(() => buildIncomeStatementView(value, grain, summary), [value, grain, summary]);
  const drill = useMemo(() => ({ mode: "period" as const, from: monthStart(value.year, value.from), to: monthEnd(value.year, value.to) }), [value.year, value.from, value.to]);
  return <ReportView report={built.report} analytics={built.analytics} drill={drill} display={display} />;
}

export function BalanceSheetWorkspace({ data, options: initial }: { data: Promise<BalanceSheetData>; options: BalanceSheetOptions }) {
  const view = useStatementView(initial.grain, initial.summary), display = useReportDisplay();
  const options = { ...initial, grain: view.grain, summary: view.summary };
  const build = (value: BalanceSheetData) => buildBalanceSheetView(value, view.grain, view.summary).report;
  return <StatementShell title="Balance Sheet" period={`As of ${formatDate(initial.asOf)}`} resetKey={data}
    controls={<><BalanceSheetFilters options={options} /><ReportViewControls grains={BALANCE_GRAINS} {...view} /><ReportDisplayControls display={display} summary={view.summary} /></>}
    exports={<ExportArea resetKey={data}><ResolvedExports data={data} build={build} display={display} /></ExportArea>}>
    <BalanceData data={data} grain={view.grain} summary={view.summary} display={display} />
  </StatementShell>;
}

function BalanceData({ data, grain, summary, display }: { data: Promise<BalanceSheetData>; grain: BalanceGrain; summary: boolean; display: ReportDisplayState }) {
  const value = use(data);
  const built = useMemo(() => buildBalanceSheetView(value, grain, summary), [value, grain, summary]);
  const drill = useMemo(() => ({ mode: "balance" as const, from: startOfYear(value.asOf), to: value.asOf }), [value.asOf]);
  return <ReportView report={built.report} analytics={built.analytics} drill={drill} display={display} />;
}
