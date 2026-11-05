import { TrialBalanceWorkspace } from "@/components/LedgerWorkspaces";
import { getTrialBalance } from "@/lib/reports/ledger";
import { cleanDate, todayChicago } from "@/lib/dates";

export const metadata = { title: "Trial Balance · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function TrialBalancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const asOf = cleanDate(params.to, todayChicago());
  return <TrialBalanceWorkspace asOf={asOf} data={getTrialBalance(asOf, null)} />;
}
