import { countPostedEntries, getTrialBalances } from "./ledger";
import { balanceSheetDates, incomeStatementMonths, previousIncomePeriod } from "./statement-data";
import type { BalanceSheetData, IncomeRange, IncomeStatementData } from "./statement-data";

/** Server-side: one batched trial-balance read plus the posted-entry count per statement data window. */
export async function loadIncomeStatementData({ year, from, to }: IncomeRange): Promise<IncomeStatementData> {
  const range = { year, from, to }, months = incomeStatementMonths(range), previous = previousIncomePeriod(range);
  const [balances, posted] = await Promise.all([
    getTrialBalances([...months, previous].map(period => ({ asOf: period.to, from: period.from }))),
    countPostedEntries(months[months.length - 1].to, months[0].from),
  ]);
  const incomeBalances = balances.map(accounts => accounts.filter(account => account.account_type === "revenue" || account.account_type === "expense"));
  return { ...range, months: months.map((period, index) => ({ period, accounts: incomeBalances[index] })), previous: incomeBalances[months.length], posted };
}

export async function loadBalanceSheetData(asOf: string): Promise<BalanceSheetData> {
  const dates = balanceSheetDates(asOf);
  const [balances, posted] = await Promise.all([
    getTrialBalances(dates.map(date => ({ asOf: date, from: null }))),
    countPostedEntries(asOf, null),
  ]);
  return { asOf, balances: Object.fromEntries(dates.map((date, index) => [date, balances[index]])), posted };
}
