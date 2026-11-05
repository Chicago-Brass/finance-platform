import { IncomeStatementWorkspace } from "@/components/StatementWorkspace";
import { parseIncomeStatementParams } from "@/lib/reports/income-statement";
import { loadIncomeStatementData } from "@/lib/reports/statement-loaders";

export const metadata = { title: "Income Statement · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function IncomeStatementPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const options = parseIncomeStatementParams(await searchParams);
  return <IncomeStatementWorkspace options={options} data={loadIncomeStatementData(options)} />;
}
