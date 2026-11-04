import { DateFilter } from "@/components/DateFilter";
import { TrialBalanceTable } from "@/components/LedgerTable";
import { getTrialBalance } from "@/lib/reports/ledger";
import { cleanDate, todayChicago } from "@/lib/dates";

export const metadata = { title: "Trial Balance · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function TrialBalancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const asOf = cleanDate(params.to, todayChicago());
  const rows = await getTrialBalance(asOf, null);
  return (
    <article className="report-page ledger-page">
      <header className="report-header"><div className="report-heading"><h1 className="report-title">Trial Balance</h1><p className="report-entity">Chicago Brass Inc. / Posted ledger / USD</p></div></header>
      <DateFilter to={asOf} asOfOnly note="Cumulative posted balances" />
      <TrialBalanceTable rows={rows} />
    </article>
  );
}
