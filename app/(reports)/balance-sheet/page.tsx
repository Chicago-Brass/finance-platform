import { ReportView } from "@/components/ReportView";
import { DateFilter } from "@/components/DateFilter";
import { getLedgerBalanceSheet } from "@/lib/reports/ledger";
import { cleanDate, todayChicago } from "@/lib/dates";

export const metadata = { title: "Balance Sheet · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function BalanceSheetPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const asOf = cleanDate(sp.to, todayChicago());
  const report = await getLedgerBalanceSheet(asOf);
  return (
    <>
      <DateFilter to={asOf} asOfOnly note="All activity up to this date (all time)." />
      <ReportView report={report} />
    </>
  );
}
