"use client";

import { useMemo, useState } from "react";
import { buildBalanceSheetView, buildIncomeStatementView } from "@/lib/reports/statement-data";
import type { BalanceGrain, BalanceSheetData, IncomeGrain, IncomeStatementData } from "@/lib/reports/statement-data";
import { BalanceSheetFilters } from "./BalanceSheetFilters";
import { ReportFilters } from "./ReportFilters";
import { ReportView } from "./ReportView";
import { ReportViewControls } from "./ReportViewControls";

const INCOME_GRAINS: { value: IncomeGrain; label: string }[] = [{ value: "month", label: "Monthly" }, { value: "quarter", label: "Quarterly" }, { value: "year", label: "Annual" }];
const BALANCE_GRAINS: { value: BalanceGrain; label: string }[] = [{ value: "single", label: "As of" }, { value: "month", label: "Monthly" }, { value: "quarter", label: "Quarterly" }, { value: "year", label: "Annual" }];

/**
 * View and Display choices are browser state. The URL is updated with a native history replace,
 * which Next keeps in sync without a server request, so links and reloads still show the same view.
 */
function useStatementView<G extends string>(initialGrain: G, initialSummary: boolean) {
  const [view, setView] = useState({ grain: initialGrain, summary: initialSummary });
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

export function IncomeStatementWorkspace({ data, grain, summary }: { data: IncomeStatementData; grain: IncomeGrain; summary: boolean }) {
  const view = useStatementView(grain, summary);
  const { options, report, analytics } = useMemo(() => buildIncomeStatementView(data, view.grain, view.summary), [data, view.grain, view.summary]);
  return <ReportView report={report} analytics={analytics} filters={<ReportFilters options={options} />} viewControls={<ReportViewControls grains={INCOME_GRAINS} {...view} />} />;
}

export function BalanceSheetWorkspace({ data, grain, summary }: { data: BalanceSheetData; grain: BalanceGrain; summary: boolean }) {
  const view = useStatementView(grain, summary);
  const { options, report, analytics } = useMemo(() => buildBalanceSheetView(data, view.grain, view.summary), [data, view.grain, view.summary]);
  return <ReportView report={report} analytics={analytics} filters={<BalanceSheetFilters options={options} />} viewControls={<ReportViewControls grains={BALANCE_GRAINS} {...view} />} />;
}
