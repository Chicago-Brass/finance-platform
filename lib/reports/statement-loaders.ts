import { countPostedEntries, getTrialBalances } from "./ledger";
import { balanceSheetDates, incomeStatementMonths, previousIncomePeriod } from "./statement-data";
import type { BalanceSheetData, IncomeRange, IncomeStatementData } from "./statement-data";

/** Server-side: one batched trial-balance read plus the posted-entry count per statement data window. */
export async function loadIncomeStatementData({ year, from, to, branch }: IncomeRange): Promise<IncomeStatementData> {
  const range = { year, from, to, branch }, months = incomeStatementMonths(range), previous = previousIncomePeriod(range);
  const [balances, posted] = await Promise.all([
    getTrialBalances([...months, previous].map(period => ({ asOf: period.to, from: period.from })), branch),
    countPostedEntries(months[months.length - 1].to, months[0].from, branch),
  ]);
  const incomeBalances = balances.map(accounts => accounts.filter(account => account.account_type === "revenue" || account.account_type === "expense"));
  return { ...range, months: months.map((period, index) => ({ period, accounts: incomeBalances[index] })), previous: incomeBalances[months.length], posted };
}

export async function loadBalanceSheetData(asOf: string, branch?: string): Promise<BalanceSheetData> {
  const dates = balanceSheetDates(asOf);
  const [balances, posted] = await Promise.all([
    getTrialBalances(dates.map(date => ({ asOf: date, from: null })), branch),
    countPostedEntries(asOf, null, branch),
  ]);
  return { asOf, branch, balances: Object.fromEntries(dates.map((date, index) => [date, balances[index]])), posted };
}
