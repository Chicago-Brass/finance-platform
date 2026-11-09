import { ReportFilters } from "@/components/ReportFilters";
import { ReportView } from "@/components/ReportView";
import { parseIncomeStatementParams } from "@/lib/reports/income-statement";
import { loadIncomeStatement } from "@/lib/reports/live-data";

export const metadata = { title: "Income Statement · Chicago Brass Finance" };

export default async function IncomeStatementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const options = parseIncomeStatementParams(await searchParams);
  const report = await loadIncomeStatement(options);
  return (
    <>
      <ReportFilters options={options} />
      <ReportView report={report} />
    </>
  );
}
