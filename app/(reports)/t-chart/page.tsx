import { PostingRulesTable } from "@/components/PostingRulesTable";
import { ReportPageHeader } from "@/components/ReportPageHeader";
import { getTChart } from "@/lib/reports/ledger";
import { todayChicago } from "@/lib/dates";
import { Suspense } from "react";
import { ReportLoading } from "@/components/ReportNavigation";

export const metadata = { title: "T-Chart · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default function TChartPage() {
  return <Suspense fallback={<ReportLoading />}><Rules /></Suspense>;
}

async function Rules() {
  const rules = await getTChart();
  return (
    <article className="report-page ledger-page">
      <ReportPageHeader title="T-Chart" description={`Chicago Brass Inc. / Posting rules / ${rules.length} rules`} />
      <PostingRulesTable rules={rules} asOf={todayChicago()} />
    </article>
  );
}
