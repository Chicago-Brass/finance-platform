import { supabaseConfig } from "@/lib/supabase/config";

export const EXPENSE_ISSUES_URL = "/api/maintenance/issues";
export const ISSUE_NOTE_LIMIT = 4000;

export type ExpenseIssue = {
  id: string;
  rule_codes: string[];
  title: string;
  context: string;
  finding: string;
  recommendation: string;
  examples: { label: string; detail: string; url: string }[];
  notes: string;
};

export function expenseMaintenanceEnabled() {
  return new URL(supabaseConfig().url).hostname === "yiuzyntqddjriaflwgcc.supabase.co";
}
