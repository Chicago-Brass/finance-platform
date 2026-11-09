import { branchParam } from "./branch";
import { cleanDate, startOfYear, todayChicago } from "../dates";
import { ledgerAccountParam, ledgerHref, ledgerPageNumber, ledgerSearchParam, ledgerSideParam, ledgerTypeParam, ledgerCategoryParam, ledgerAmountParam } from "@/components/ledger-table-utils";
import { parseIncomeStatementParams } from "./income-statement";
import type { IncomeStatementOptions } from "./income-statement";
import { parseBalanceSheetParams } from "./balance-sheet";
import type { BalanceSheetOptions } from "./balance-sheet";
import type { LedgerAccountFilters } from "./ledger";

export const REPORT_PATHS = {
  income: "/income-statement",
  balance: "/balance-sheet",
  trial: "/trial-balance",
  ledger: "/general-ledger",
  rules: "/t-chart",
} as const;

export type ReportKind = keyof typeof REPORT_PATHS;
export type LedgerOptions = LedgerAccountFilters & { from: string; to: string; page: number };
export type ReportScreen =
  | { kind: "income"; options: IncomeStatementOptions; request: string }
  | { kind: "balance"; options: BalanceSheetOptions; request: string }
  | { kind: "trial"; options: { asOf: string; branch?: string }; request: string }
  | { kind: "ledger"; options: LedgerOptions; request: string; countRequest: string }
  | { kind: "rules"; request: string };

const request = (report: ReportKind, params: Record<string, string> = {}) => `/api/reports/data?${new URLSearchParams({ report, ...params })}`;

/** Client shells and JSON reads use the same normalized options and financial-data request key. */
export function parseReportScreen(pathname: string, params: Record<string, string | string[] | undefined>, today = todayChicago()): ReportScreen {
  if (pathname === REPORT_PATHS.income) {
    const options = parseIncomeStatementParams(params, today);
    return { kind: "income", options, request: request("income", { ...(options.branch ? {branch:options.branch}:{}), year: String(options.year), from: String(options.from), to: String(options.to) }) };
  }
  if (pathname === REPORT_PATHS.balance) {
    const options = parseBalanceSheetParams(params, today);
    return { kind: "balance", options, request: request("balance", { ...(options.branch ? {branch:options.branch}:{}), asof: options.asOf }) };
  }
  if (pathname === REPORT_PATHS.trial) {
    const options = { asOf: cleanDate(params.to, today), branch:branchParam(params.branch) };
    return { kind: "trial", options, request: request("trial", { to: options.asOf, ...(options.branch ? {branch:options.branch}:{}) }) };
  }
  if (pathname === REPORT_PATHS.ledger) {
    const to = cleanDate(params.to, today), from = cleanDate(params.from, startOfYear(to));
    const options: LedgerOptions = {
      branch:branchParam(params.branch), from, to, page: ledgerPageNumber(params.page),
      account: ledgerAccountParam(params.account), offset: ledgerAccountParam(params.offset),
      query: ledgerSearchParam(params.q), side: ledgerSideParam(params.side),
      accountType: ledgerTypeParam(params.type), category: ledgerCategoryParam(params.category),
      min: ledgerAmountParam(params.min), max: ledgerAmountParam(params.max),
    };
    return { kind: "ledger", options, request: `/api/reports/data?report=ledger&${ledgerHref(options).slice(1)}`, countRequest: `/api/reports/data?report=ledger-count&${ledgerHref({ ...options, page: undefined }).slice(1)}` };
  }
  if (pathname === REPORT_PATHS.rules) return { kind: "rules", request: request("rules") };
  throw new RangeError("Unknown report.");
}
