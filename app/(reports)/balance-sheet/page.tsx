import { BalanceSheetFilters } from "@/components/BalanceSheetFilters";
import { ReportView } from "@/components/ReportView";
import { parseBalanceSheetParams } from "@/lib/reports/balance-sheet";
import { loadBalanceSheet } from "@/lib/reports/live-data";

export const metadata = { title: "Balance Sheet · Chicago Brass Finance" };

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const options = parseBalanceSheetParams(await searchParams);
  const report = await loadBalanceSheet(options);
  return (
    <>
      <BalanceSheetFilters options={options} />
      <ReportView report={report} />
    </>
  );
}
