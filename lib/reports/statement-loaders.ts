import { countPostedEntries, getTrialBalance } from "./ledger";
import { balanceSheetDates, incomeStatementMonths, previousIncomePeriod } from "./statement-data";
import type { BalanceSheetData, IncomeRange, IncomeStatementData } from "./statement-data";

/** Server-side: reads everything one statement data window needs, in parallel. */
export async function loadIncomeStatementData({ year, from, to }: IncomeRange): Promise<IncomeStatementData> {
  const range = { year, from, to }, months = incomeStatementMonths(range), previous = previousIncomePeriod(range);
  const [snapshots, previousAccounts, posted] = await Promise.all([
    Promise.all(months.map(async period => ({ period, accounts: await getTrialBalance(period.to, period.from) }))),
    getTrialBalance(previous.to, previous.from),
    countPostedEntries(months[months.length - 1].to, months[0].from),
  ]);
  return { ...range, months: snapshots, previous: previousAccounts, posted };
}

export async function loadBalanceSheetData(asOf: string): Promise<BalanceSheetData> {
  const dates = balanceSheetDates(asOf);
  const [balances, posted] = await Promise.all([
    Promise.all(dates.map(date => getTrialBalance(date, null))),
    countPostedEntries(asOf, null),
  ]);
  return { asOf, balances: Object.fromEntries(dates.map((date, index) => [date, balances[index]])), posted };
}
