import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getIncomeStatement, incomeStatementPeriods, type IncomeStatementOptions } from "./income-statement";
import { getBalanceSheet, balanceSheetPeriods, type BalanceSheetOptions } from "./balance-sheet";
import type { AccountBalance } from "./report-utils";

type BalanceRequest = { asOf: string; from: string | null };

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
  const periods = incomeStatementPeriods(options);
  const { balances, posted } = await readBalances(periods.map(period => ({ asOf: period.to, from: period.from })), periods[periods.length - 1].to, periods[0].from);
  return getIncomeStatement(options, periods.map((period, index) => ({ period, accounts: balances[index] })), posted);
}

export async function loadBalanceSheet(options: BalanceSheetOptions) {
  const periods = balanceSheetPeriods(options);
  const years = [...new Set(periods.map(period => Number(period.to.slice(0, 4))))];
  const requests = [...periods.map(period => ({ asOf: period.to, from: null })), ...years.map(year => ({ asOf: `${year - 1}-12-31`, from: null }))];
  const { balances, posted } = await readBalances(requests, options.asOf, null);
  const previousYears = new Map(years.map((year, index) => [year, balances[periods.length + index]]));
  return getBalanceSheet(options, periods.map((period, index) => ({ period, accounts: balances[index] })), previousYears, posted);
}
