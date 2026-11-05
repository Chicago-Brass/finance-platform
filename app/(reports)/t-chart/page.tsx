import { PostingRulesWorkspace } from "@/components/LedgerWorkspaces";
import { getTChart } from "@/lib/reports/ledger";
import { todayChicago } from "@/lib/dates";

export const metadata = { title: "T-Chart · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default function TChartPage() {
  return <PostingRulesWorkspace asOf={todayChicago()} data={getTChart()} />;
}
