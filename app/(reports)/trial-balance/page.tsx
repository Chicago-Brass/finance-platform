import { DateFilter } from "@/components/DateFilter";
import { TrialBalanceTable } from "@/components/LedgerTable";
import { ReportPageHeader } from "@/components/ReportPageHeader";
import { getTrialBalance } from "@/lib/reports/ledger";
import { cleanDate, todayChicago } from "@/lib/dates";
import { Suspense } from "react";
import { ReportLoading } from "@/components/ReportNavigation";

export const metadata = { title: "Trial Balance · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function TrialBalancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const asOf = cleanDate(params.to, todayChicago());
  return <Suspense key={asOf} fallback={<ReportLoading />}><Balance asOf={asOf} /></Suspense>;
}

async function Balance({ asOf }: { asOf: string }) {
  const rows = await getTrialBalance(asOf, null);
  return (
    <article className="report-page ledger-page">
      <ReportPageHeader title="Trial Balance" description="Chicago Brass Inc. / Posted ledger / USD" />
      <DateFilter to={asOf} asOfOnly note="Cumulative posted balances" />
      <TrialBalanceTable rows={rows} asOf={asOf} />
    </article>
  );
}
