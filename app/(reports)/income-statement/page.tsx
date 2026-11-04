import { IncomeStatementViewControls, ReportFilters } from "@/components/ReportFilters";
import { ReportView } from "@/components/ReportView";
import { getIncomeAnalytics } from "@/lib/reports/analytics";
import { getIncomeStatement, incomeStatementPeriods, parseIncomeStatementParams } from "@/lib/reports/income-statement";

import { countPostedEntries, getTrialBalance } from "@/lib/reports/ledger";

export const metadata = { title: "Income Statement · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function IncomeStatementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const options = parseIncomeStatementParams(await searchParams);
  const periods = incomeStatementPeriods(options);
  const previousOptions = { ...options, year: options.year - 1, grain: "year" as const };
  const previousPeriod = incomeStatementPeriods(previousOptions)[0];
  const [snapshots, previousAccounts, posted] = await Promise.all([
    Promise.all(periods.map(async period => ({ period, accounts: await getTrialBalance(period.to, period.from) }))),
    getTrialBalance(previousPeriod.to, previousPeriod.from),
    countPostedEntries(periods[periods.length - 1].to, periods[0].from),
  ]);
  const report = getIncomeStatement(options, snapshots, posted);
  const previousReport = getIncomeStatement(previousOptions, [{ period: previousPeriod, accounts: previousAccounts }], 0);
  const analytics = getIncomeAnalytics(report, previousReport);
  return (
    <ReportView report={report} analytics={analytics} filters={<ReportFilters options={options} />} viewControls={<IncomeStatementViewControls options={options} />} />
  );
}
