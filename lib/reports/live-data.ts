import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getIncomeStatement, incomeStatementPeriods, type IncomeStatementOptions } from "./income-statement";
import { getBalanceSheet, balanceSheetPeriods, type BalanceSheetOptions } from "./balance-sheet";
import type { AccountBalance } from "./report-utils";
import { BRANCHES, branchBalances, branchReport, combineBranchReports, type BranchLine, type BranchView } from "./branches";

type BalanceRequest = { asOf: string; from: string | null };

async function readBranchLines(asOf: string, from: string | null, view: BranchView) {
  const supabase = await createClient(), lines: BranchLine[] = [];
  const branch = BRANCHES.find(item => item.code === view);
  for (let start = 0; ; start += 1000) {
    let query = supabase.from("journal_lines").select("id,entry_id,account_code,debit,credit,branch,journal_entries!inner(entry_date,status)")
      .eq("journal_entries.status", "posted").lte("journal_entries.entry_date", asOf).order("id").range(start, start + 999);
    if (from) query = query.gte("journal_entries.entry_date", from);
    if (branch) query = branch.value === null ? query.is("branch", null) : query.eq("branch", branch.value);
    const { data, error } = await query;
    if (error) throw new Error(`Branch ledger could not be loaded: ${error.message}`);
    const page = (data ?? []) as unknown as BranchLine[];
    lines.push(...page);
    if (page.length < 1000) return lines;
  }
}

function branchColumns(lines: BranchLine[]) {
  const known = new Set<string>(BRANCHES.flatMap(branch => branch.value === null ? [] : [branch.value]));
  const extra = [...new Set(lines.map(line => line.branch).filter((value): value is string => value !== null && !known.has(value)))].sort();
  return [...BRANCHES, ...extra.map((name, index) => ({ code: `extra${index}`, name, value: name }))];
}

const postedForBranch = (lines: BranchLine[], branch: string | null | undefined) => new Set(lines.filter(line => branch === undefined || line.branch === branch).map(line => line.entry_id)).size;

// Reads use the signed-in user's existing Supabase client and ledger access controls.
async function readBalances(requests: BalanceRequest[], asOf: string, from: string | null) {
  const supabase = await createClient();
  let countQuery = supabase.from("v_journal_entries").select("id", { count: "exact", head: true }).eq("status", "posted").lte("entry_date", asOf);
  if (from) countQuery = countQuery.gte("entry_date", from);
  const [balances, count] = await Promise.all([
    supabase.rpc("get_trial_balances", { p_as_of: requests.map(item => item.asOf), p_from: requests.map(item => item.from) }),
    countQuery,
  ]);
  if (balances.error) throw new Error(`Ledger balances could not be loaded: ${balances.error.message}`);
  if (count.error) throw new Error(`Posted entry count could not be loaded: ${count.error.message}`);
  const rows = (balances.data ?? []) as { period_index: number; accounts: AccountBalance[] }[];
  if (rows.length !== requests.length || rows.some((row, index) => row.period_index !== index + 1 || !Array.isArray(row.accounts))) {
    throw new Error("Ledger balances returned unexpected report periods.");
  }
  return { balances: rows.map(row => row.accounts), posted: count.count ?? 0 };
}

export async function loadIncomeStatement(options: IncomeStatementOptions) {
  const view = options.view ?? "ALL";
  const reportOptions = view === "BY_BRANCH" ? { ...options, grain: "year" as const } : options;
  const periods = incomeStatementPeriods(reportOptions);
  const { balances, posted } = await readBalances(periods.map(period => ({ asOf: period.to, from: period.from })), periods[periods.length - 1].to, periods[0].from);
  if (view === "ALL") return getIncomeStatement(reportOptions, periods.map((period, index) => ({ period, accounts: balances[index] })), posted);
  const lines = await readBranchLines(periods[periods.length - 1].to, periods[0].from, view);
  const build = (branch: string | null | undefined) => getIncomeStatement(reportOptions, periods.map((period, index) => ({ period, accounts: branchBalances(balances[index], lines, period.to, period.from, branch) })), postedForBranch(lines, branch));
  if (view === "BY_BRANCH") return combineBranchReports(branchColumns(lines).map(branch => ({ ...branch, report: build(branch.value) })), build(undefined));
  const branch = BRANCHES.find(item => item.code === view)!;
  return branchReport(build(branch.value), branch.name);
}

export async function loadBalanceSheet(options: BalanceSheetOptions) {
  const view = options.view ?? "ALL";
  const reportOptions = view === "BY_BRANCH" ? { ...options, grain: "single" as const } : options;
  const periods = balanceSheetPeriods(reportOptions);
  const years = [...new Set(periods.map(period => Number(period.to.slice(0, 4))))];
  const requests = [...periods.map(period => ({ asOf: period.to, from: null })), ...years.map(year => ({ asOf: `${year - 1}-12-31`, from: null }))];
  const { balances, posted } = await readBalances(requests, options.asOf, null);
  const previousYears = new Map(years.map((year, index) => [year, balances[periods.length + index]]));
  if (view === "ALL") return getBalanceSheet(reportOptions, periods.map((period, index) => ({ period, accounts: balances[index] })), previousYears, posted);
  const lines = await readBranchLines(options.asOf, null, view);
  const build = (branch: string | null | undefined) => getBalanceSheet(reportOptions,
    periods.map((period, index) => ({ period, accounts: branchBalances(balances[index], lines, period.to, null, branch) })),
    new Map(years.map((year, index) => [year, branchBalances(balances[periods.length + index], lines, `${year - 1}-12-31`, null, branch)])), postedForBranch(lines, branch));
  if (view === "BY_BRANCH") return combineBranchReports(branchColumns(lines).map(branch => ({ ...branch, report: build(branch.value) })), build(undefined));
  const branch = BRANCHES.find(item => item.code === view)!;
  return branchReport(build(branch.value), branch.name);
}
