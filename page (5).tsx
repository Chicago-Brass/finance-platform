import { ReportView } from "@/components/ReportView";
import { getIncomeStatement } from "@/lib/reports/sample-data";

export const metadata = { title: "Income Statement · Chicago Brass Finance" };

export default function IncomeStatementPage() {
  return <ReportView report={getIncomeStatement()} />;
}
