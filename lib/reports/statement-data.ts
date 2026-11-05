import { balanceAnalyticsDates, getBalanceAnalytics, getIncomeAnalytics, previousQuarterEnd } from "./analytics";
import { balanceSheetPeriods, getBalanceSheet } from "./balance-sheet";
import type { BalanceSheetOptions } from "./balance-sheet";
import { getIncomeStatement, incomeStatementPeriods } from "./income-statement";
import type { IncomeStatementOptions } from "./income-statement";
import { cents, formatDate } from "./report-utils";
import type { AccountBalance, Period, Snapshot } from "./report-utils";

/**
 * Statement data is loaded once per data window: the Income Statement's year and months, or the
 * Balance Sheet's as-of date. Every View (columns) and Display (summary/detail) choice is built
 * from that data in the browser, so switching them needs no request.
 */

export type IncomeGrain = IncomeStatementOptions["grain"];
export type BalanceGrain = BalanceSheetOptions["grain"];
export type IncomeRange = Pick<IncomeStatementOptions, "year" | "from" | "to">;

export type IncomeStatementData = IncomeRange & { months: Snapshot[]; previous: AccountBalance[]; posted: number };
export type BalanceSheetData = { asOf: string; balances: Record<string, AccountBalance[]>; posted: number };

/** One period per calendar month in the range. Quarters and years are sums of these. */
export function incomeStatementMonths({ year, from, to }: IncomeRange): Period[] {
  return incomeStatementPeriods({ year, from, to, grain: "month", summary: false });
}

/** The prior-year comparison: the same months one year earlier, as one period. */
export function previousIncomePeriod({ year, from, to }: IncomeRange): Period {
  return incomeStatementPeriods({ year: year - 1, from, to, grain: "year", summary: false })[0];
}

const decimal = (value: number) => `${value < 0 ? "-" : ""}${Math.floor(Math.abs(value) / 100)}.${String(Math.abs(value) % 100).padStart(2, "0")}`;

/** Sums monthly activity into each period in integer cents. Months are disjoint, so sums are exact. */
export function combineMonths(months: Snapshot[], periods: Period[]): Snapshot[] {
  const accounts = new Map<string, AccountBalance>();
  for (const month of [...months].reverse()) for (const row of month.accounts) if (!accounts.has(row.account_number)) accounts.set(row.account_number, row);
  return periods.map(period => {
    const inside = months.filter(month => month.period.from >= period.from && month.period.to <= period.to);
    const totals = new Map([...accounts.keys()].map(code => [code, { debit: 0, credit: 0, balance: 0 }]));
    for (const month of inside) for (const row of month.accounts) {
      const total = totals.get(row.account_number)!;
      total.debit += cents(row.total_debit);
      total.credit += cents(row.total_credit);
      total.balance += cents(row.balance);
    }
    return {
      period,
      accounts: [...accounts.values()].map(account => {
        const total = totals.get(account.account_number)!;
        return { ...account, total_debit: decimal(total.debit), total_credit: decimal(total.credit), balance: decimal(total.balance) };
      }),
    };
  });
}

export function buildIncomeStatementView(data: IncomeStatementData, grain: IncomeGrain, summary: boolean) {
  const options: IncomeStatementOptions = { year: data.year, from: data.from, to: data.to, grain, summary };
  const report = getIncomeStatement(options, combineMonths(data.months, incomeStatementPeriods(options)), data.posted);
  const previousOptions: IncomeStatementOptions = { ...options, year: data.year - 1, grain: "year" };
  const previousReport = getIncomeStatement(previousOptions, [{ period: previousIncomePeriod(data), accounts: data.previous }], 0);
  return { options, report, analytics: getIncomeAnalytics(report, previousReport) };
}

const BALANCE_GRAINS: BalanceGrain[] = ["single", "month", "quarter", "year"];

function balanceDatesFor(options: BalanceSheetOptions) {
  const periods = balanceSheetPeriods(options);
  return {
    periods,
    columnYears: [...new Set(periods.map(period => Number(period.to.slice(0, 4))))],
    previousYearEnd: `${Number(options.asOf.slice(0, 4)) - 1}-12-31`,
    comparisonDate: previousQuarterEnd(options.asOf),
    trendDates: balanceAnalyticsDates(options.asOf, periods),
  };
}

/** Every cumulative balance date any View can show for this as-of date. */
export function balanceSheetDates(asOf: string): string[] {
  const dates = new Set<string>();
  for (const grain of BALANCE_GRAINS) {
    const { periods, columnYears, previousYearEnd, comparisonDate, trendDates } = balanceDatesFor({ asOf, grain, summary: false });
    for (const date of [...periods.map(period => period.to), ...trendDates, ...columnYears.map(year => `${year - 1}-12-31`), previousYearEnd, comparisonDate]) dates.add(date);
  }
  return [...dates].sort();
}

export function buildBalanceSheetView(data: BalanceSheetData, grain: BalanceGrain, summary: boolean) {
  const options: BalanceSheetOptions = { asOf: data.asOf, grain, summary };
  const { periods, columnYears, comparisonDate, trendDates } = balanceDatesFor(options);
  const at = (date: string) => {
    const rows = data.balances[date];
    if (!rows) throw new Error(`Missing balances for ${date}.`);
    return rows;
  };
  const snapshots = periods.map(period => ({ period, accounts: at(period.to) }));
  const priorYears = new Map(columnYears.map(year => [year, at(`${year - 1}-12-31`)]));
  const report = getBalanceSheet(options, snapshots, priorYears, data.posted);
  const trend = trendDates.map(date => ({ period: { key: date, label: formatDate(date), from: date, to: date }, accounts: at(date) }));
  return { options, report, analytics: getBalanceAnalytics(report, data.asOf, at(comparisonDate), trend) };
}
