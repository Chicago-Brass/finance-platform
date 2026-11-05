import { BalanceSheetWorkspace } from "@/components/StatementWorkspace";
import { parseBalanceSheetParams } from "@/lib/reports/balance-sheet";
import { loadBalanceSheetData } from "@/lib/reports/statement-loaders";

export const metadata = { title: "Balance Sheet · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function BalanceSheetPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const options = parseBalanceSheetParams(await searchParams);
  return <BalanceSheetWorkspace options={options} data={loadBalanceSheetData(options.asOf)} />;
}
