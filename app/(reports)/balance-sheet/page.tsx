import { BalanceSheetFilters, BalanceSheetViewControls } from "@/components/BalanceSheetFilters";
import { ReportView } from "@/components/ReportView";
import { balanceAnalyticsDates, getBalanceAnalytics, previousQuarterEnd } from "@/lib/reports/analytics";
import { balanceSheetPeriods, getBalanceSheet, parseBalanceSheetParams } from "@/lib/reports/balance-sheet";
import { formatDate } from "@/lib/reports/report-utils";

import { countPostedEntries, getTrialBalance } from "@/lib/reports/ledger";

export const metadata = { title: "Balance Sheet · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const options = parseBalanceSheetParams(await searchParams);
  const periods = balanceSheetPeriods(options);
  const previousYearEnd = `${Number(options.asOf.slice(0, 4)) - 1}-12-31`;
  const columnYears = [...new Set(periods.map(period => Number(period.to.slice(0, 4))))];
  const priorYearDates = columnYears.map(year => `${year - 1}-12-31`);
  const comparisonDate = previousQuarterEnd(options.asOf);
  const trendDates = balanceAnalyticsDates(options.asOf, periods);
  const dates = [...new Set([...periods.map(period => period.to), ...trendDates, ...priorYearDates, comparisonDate])];
  const [balances, posted] = await Promise.all([
    Promise.all(dates.map(date => getTrialBalance(date, null))),
    countPostedEntries(options.asOf, null),
  ]);
  const byDate = new Map(dates.map((date, index) => [date, balances[index]]));
  const snapshots = periods.map(period => ({ period, accounts: byDate.get(period.to)! }));
  const priorYears = new Map(columnYears.map(year => [year, byDate.get(`${year - 1}-12-31`)!]));
  const report = getBalanceSheet(options, snapshots, byDate.get(previousYearEnd)!, posted, priorYears);
  const trend = trendDates.map(date => ({ period: { key: date, label: formatDate(date), from: date, to: date }, accounts: byDate.get(date)! }));
  const analytics = getBalanceAnalytics(report, options.asOf, byDate.get(comparisonDate)!, trend);
  return (
    <ReportView report={report} analytics={analytics} filters={<BalanceSheetFilters options={options} />} viewControls={<BalanceSheetViewControls options={options} />} />
  );
}
