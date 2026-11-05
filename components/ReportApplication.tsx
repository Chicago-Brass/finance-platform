"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { parseReportScreen, REPORT_PATHS } from "@/lib/reports/report-routes";
import type { ReportScreen } from "@/lib/reports/report-routes";
import type { LedgerAccountOption, TbRow, TChartRow, getGeneralLedger } from "@/lib/reports/ledger";
import type { BalanceSheetData, IncomeStatementData } from "@/lib/reports/statement-data";
import { IncomeStatementWorkspace, BalanceSheetWorkspace } from "./StatementWorkspace";
import { TrialBalanceWorkspace, GeneralLedgerWorkspace, PostingRulesWorkspace } from "./LedgerWorkspaces";
import { useReportQuery } from "./ReportData";
import type { ReportQuery } from "./ReportData";
import { useReportPath } from "./ReportNavigation";

type LedgerData = Awaited<ReturnType<typeof getGeneralLedger>>;
const TITLES = { income: "Income Statement", balance: "Balance Sheet", trial: "Trial Balance", ledger: "General Ledger", rules: "T-Chart" };

/** The destination shell renders from the URL; financial data arrives afterward through JSON. */
export function ReportApplication({ children }: { children: ReactNode }) {
  const pathname = useReportPath(), params = useSearchParams();
  const screen = Object.values(REPORT_PATHS).some(path => path === pathname)
    ? parseReportScreen(pathname, Object.fromEntries(params)) : null;
  return screen ? <ActiveReport key={pathname} screen={screen} /> : children;
}

function ActiveReport({ screen }: { screen: ReportScreen }) {
  const query = useReportQuery<unknown>(screen.request);
  const accounts = useReportQuery<LedgerAccountOption[]>(screen.kind === "ledger" ? "/api/reports/data?report=accounts" : null);
  useEffect(() => {
    document.title = `${TITLES[screen.kind]} · Chicago Brass Finance`;
  }, [screen.kind]);
  switch (screen.kind) {
    case "income": return <IncomeStatementWorkspace options={screen.options} data={query as ReportQuery<IncomeStatementData>} />;
    case "balance": return <BalanceSheetWorkspace options={screen.options} data={query as ReportQuery<BalanceSheetData>} />;
    case "trial": return <TrialBalanceWorkspace asOf={screen.options.asOf} data={query as ReportQuery<TbRow[]>} />;
    case "ledger": return <GeneralLedgerWorkspace options={screen.options} data={query as ReportQuery<LedgerData>} accountData={accounts} />;
    case "rules": return <PostingRulesWorkspace asOf={screen.options.asOf} data={query as ReportQuery<TChartRow[]>} />;
  }
}
