import { ProgressWorkspace } from "@/components/ProgressWorkspace";
import { expenseMaintenanceEnabled } from "@/lib/progress/expense-issues";

export function generateMetadata() {
  return { title: expenseMaintenanceEnabled() ? "Maintenance - Chicago Brass Finance" : "Progress - Chicago Brass Finance" };
}

export default function ProgressPage() {
  return <ProgressWorkspace maintenance={expenseMaintenanceEnabled()} />;
}
