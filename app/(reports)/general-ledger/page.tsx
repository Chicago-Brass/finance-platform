import { GeneralLedgerWorkspace } from "@/components/LedgerWorkspaces";
import { ledgerAccountParam, ledgerPageNumber, ledgerSearchParam, ledgerSideParam } from "@/components/ledger-table-utils";
import { getGeneralLedger, getLedgerAccounts } from "@/lib/reports/ledger";
import { cleanDate, startOfYear, todayChicago } from "@/lib/dates";

export const metadata = { title: "General Ledger · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;
export default async function GeneralLedgerPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const to = cleanDate(params.to, todayChicago());
  const from = cleanDate(params.from, startOfYear(to));
  const filters = { account: ledgerAccountParam(params.account), offset: ledgerAccountParam(params.offset), query: ledgerSearchParam(params.q), side: ledgerSideParam(params.side) };
  const page = ledgerPageNumber(params.page);
  return <GeneralLedgerWorkspace options={{ from, to, page, ...filters }} data={getGeneralLedger(from, to, page, filters)} accountData={getLedgerAccounts()} />;
}
