import { BalanceSheetFilters } from "@/components/BalanceSheetFilters";
import { ReportView } from "@/components/ReportView";
import { balanceSheetPeriods, getBalanceSheet, parseBalanceSheetParams } from "@/lib/reports/balance-sheet";

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
  const [snapshots, priorYear, posted] = await Promise.all([
    Promise.all(periods.map(async period => ({ period, accounts: await getTrialBalance(period.to, null) }))),
    getTrialBalance(previousYearEnd, null),
    countPostedEntries(options.asOf, null),
  ]);
  const report = getBalanceSheet(options, snapshots, priorYear, posted);
  return (
    <>
      <BalanceSheetFilters options={options} />
      <ReportView report={report} />
    </>
  );
}
