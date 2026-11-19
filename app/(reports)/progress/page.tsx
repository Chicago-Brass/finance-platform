import { ExpenseIssues } from "@/components/ExpenseIssues";
import { ProgressWorkspace } from "@/components/ProgressWorkspace";
import { expenseMaintenanceEnabled } from "@/lib/progress/expense-issues";

export function generateMetadata() {
  return { title: expenseMaintenanceEnabled() ? "Maintenance - Chicago Brass Finance" : "Progress - Chicago Brass Finance" };
}

export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const maintenance = expenseMaintenanceEnabled();
  if (maintenance && (await searchParams).tab === "issues") return <ExpenseIssues />;
  return <ProgressWorkspace maintenance={maintenance} />;
}
