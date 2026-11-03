import { ReportFilters } from "@/components/ReportFilters";
import { ReportView } from "@/components/ReportView";
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
  const [snapshots, posted] = await Promise.all([
    Promise.all(periods.map(async period => ({ period, accounts: await getTrialBalance(period.to, period.from) }))),
    countPostedEntries(periods[periods.length - 1].to, periods[0].from),
  ]);
  const report = getIncomeStatement(options, snapshots, posted);
  return (
    <>
      <ReportFilters options={options} />
      <ReportView report={report} />
    </>
  );
}
