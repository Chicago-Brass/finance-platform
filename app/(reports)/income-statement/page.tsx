import { ReportView } from "@/components/ReportView";
import { DateFilter } from "@/components/DateFilter";
import { getLedgerIncomeStatement } from "@/lib/reports/ledger";
import { cleanDate, startOfYear, todayChicago } from "@/lib/dates";

export const metadata = { title: "Income Statement · Chicago Brass Finance" };
export const dynamic = "force-dynamic";

export default async function IncomeStatementPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const today = todayChicago();
  const to = cleanDate(sp.to, today);
  const from = cleanDate(sp.from, startOfYear(to)); // default: current year to date
  const report = await getLedgerIncomeStatement(from, to);
  return (
    <>
      <DateFilter from={from} to={to} note="Defaults to the current year." />
      <ReportView report={report} />
    </>
  );
}
