import { BalanceSheetFilters } from "@/components/BalanceSheetFilters";
import { ReportView } from "@/components/ReportView";
import { getBalanceSheet, parseBalanceSheetParams } from "@/lib/reports/balance-sheet";

export const metadata = { title: "Balance Sheet · Chicago Brass Finance" };

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const options = parseBalanceSheetParams(await searchParams);
  return (
    <>
      <BalanceSheetFilters options={options} />
      <ReportView report={getBalanceSheet(options)} />
    </>
  );
}
