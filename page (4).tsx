import { ReportView } from "@/components/ReportView";
import { getBalanceSheet } from "@/lib/reports/sample-data";

export const metadata = { title: "Balance Sheet · Chicago Brass Finance" };

export default function BalanceSheetPage() {
  return <ReportView report={getBalanceSheet()} />;
}
