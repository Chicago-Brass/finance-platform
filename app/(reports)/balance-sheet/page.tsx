import { BalanceSheetWorkspace } from "@/components/StatementWorkspace";
import { parseBalanceSheetParams } from "@/lib/reports/balance-sheet";
import { loadBalanceSheetData } from "@/lib/reports/statement-loaders";
import type { BalanceSheetOptions } from "@/lib/reports/balance-sheet";
import { Suspense } from "react";
import { ReportLoading } from "@/components/ReportNavigation";

export const metadata = { title: "Balance Sheet · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const options = parseBalanceSheetParams(await searchParams);
  return <Suspense key={options.asOf} fallback={<ReportLoading />}><Statement options={options} /></Suspense>;
}

async function Statement({ options }: { options: BalanceSheetOptions }) {
  const data = await loadBalanceSheetData(options.asOf);
  return <BalanceSheetWorkspace data={data} grain={options.grain} summary={options.summary} />;
}
