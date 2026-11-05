import { DateFilter } from "@/components/DateFilter";
import { LedgerAccountFilter } from "@/components/LedgerAccountFilter";
import { GeneralLedgerTable } from "@/components/LedgerTable";
import { ReportPageHeader } from "@/components/ReportPageHeader";
import { ledgerAccountParam, ledgerPageNumber } from "@/components/ledger-table-utils";
import { getGeneralLedger, getLedgerAccounts } from "@/lib/reports/ledger";
import { cleanDate, startOfYear, todayChicago } from "@/lib/dates";
import { Suspense } from "react";
import { ReportLoading } from "@/components/ReportNavigation";

export const metadata = { title: "General Ledger · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
export default async function GeneralLedgerPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  return <Suspense key={JSON.stringify(params)} fallback={<ReportLoading />}><Ledger params={params} /></Suspense>;
}

async function Ledger({ params }: { params: Params }) {
  const today = todayChicago();
  const to = cleanDate(params.to, today);
  const from = cleanDate(params.from, startOfYear(to));
  const filters = { account: ledgerAccountParam(params.account), offset: ledgerAccountParam(params.offset) };
  // Independent reads: account options do not wait for the line page.
  const [result, accounts] = await Promise.all([
    getGeneralLedger(from, to, ledgerPageNumber(params.page), filters),
    getLedgerAccounts(),
  ]);
  return (
    <article className="report-page ledger-page">
      <ReportPageHeader title="General Ledger" description="Chicago Brass Inc. / Posted ledger / USD" />
      <DateFilter from={from} to={to} preserve={filters}>
        <LedgerAccountFilter from={from} to={to} accounts={accounts} {...filters} />
      </DateFilter>
      {from > to && <div className="report-alerts" role="status"><p className="check check-bad">Start date is later than end date. Choose a valid date range.</p></div>}
      <GeneralLedgerTable rows={result.rows} hasNext={result.hasNext} page={result.page} pageSize={result.pageSize} from={from} to={to} {...filters} />
    </article>
  );
}
