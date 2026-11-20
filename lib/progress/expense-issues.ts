import { supabaseConfig } from "@/lib/supabase/config";

export const EXPENSE_ISSUES_URL = "/api/maintenance/issues";
export const ISSUE_NOTE_LIMIT = 4000;

export const ISSUE_CATEGORY_LABELS = {
  expense: "Expenses",
  invoice_entry: "Invoice Entry",
  payment: "Payments",
} as const;

export type IssueCategory = keyof typeof ISSUE_CATEGORY_LABELS;

export type MaintenanceIssue = {
  category: IssueCategory;
  id: string;
  rules: { code: string; trigger: string | null; source: string | null }[];
  title: string;
  context: string;
  finding: string;
  question: string | null;
  recommendation: string;
  examples: { label: string; detail: string; url: string }[];
  notes: string;
  reviewed: boolean;
  resolved: boolean;
};

export function expenseMaintenanceEnabled() {
  return new URL(supabaseConfig().url).hostname === "yiuzyntqddjriaflwgcc.supabase.co";
}
