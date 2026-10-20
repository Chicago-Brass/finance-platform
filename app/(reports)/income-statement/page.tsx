import { ReportFilters } from "@/components/ReportFilters";
import { ReportView } from "@/components/ReportView";
import { getIncomeStatement, parseIncomeStatementParams } from "@/lib/reports/income-statement";

export const metadata = { title: "Income Statement · Chicago Brass Finance" };

export default async function IncomeStatementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const options = parseIncomeStatementParams(await searchParams);
  return (
    <>
      <ReportFilters options={options} />
      <ReportView report={getIncomeStatement(options)} />
    </>
  );
}
