import { DateFilter } from "@/components/DateFilter";
import { GeneralLedgerTable } from "@/components/LedgerTable";
import { ledgerPageNumber } from "@/components/ledger-table-utils";
import { getGeneralLedger } from "@/lib/reports/ledger";
import { cleanDate, startOfYear, todayChicago } from "@/lib/dates";

export const metadata = { title: "General Ledger · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function GeneralLedgerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const to = cleanDate(params.to, todayChicago());
  const from = cleanDate(params.from, startOfYear(to));
  const result = await getGeneralLedger(from, to, ledgerPageNumber(params.page));
  return (
    <article className="report-page ledger-page">
      <header className="report-header"><div className="report-heading"><h1 className="report-title">General Ledger</h1><p className="report-entity">Chicago Brass Inc. / Posted ledger / USD</p></div></header>
      <DateFilter from={from} to={to} note={`${result.pageSize} records per page`} />
      {from > to && <div className="report-alerts" role="status"><p className="check check-bad">Start date is later than end date. Choose a valid date range.</p></div>}
      <GeneralLedgerTable rows={result.rows} hasNext={result.hasNext} page={result.page} pageSize={result.pageSize} from={from} to={to} />
    </article>
  );
}
