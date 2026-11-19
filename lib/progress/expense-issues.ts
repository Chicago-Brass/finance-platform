import { supabaseConfig } from "@/lib/supabase/config";

export const EXPENSE_ISSUES_URL = "/api/maintenance/issues";
export const ISSUE_NOTE_LIMIT = 4000;

export type ExpenseIssue = {
  id: string;
  rules: { code: string; trigger: string | null; source: string | null }[];
  title: string;
  context: string;
  finding: string;
  recommendation: string;
  examples: { label: string; detail: string; url: string }[];
  notes: string;
  resolved: boolean;
};

export function expenseMaintenanceEnabled() {
  return new URL(supabaseConfig().url).hostname === "yiuzyntqddjriaflwgcc.supabase.co";
}
