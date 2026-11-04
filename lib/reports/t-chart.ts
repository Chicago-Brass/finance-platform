import type { TChartRow } from "./ledger";

const CATEGORY_LABELS: Record<string, string> = {
  expense: "Expenses",
  payment: "Payments",
  invoice_entry: "Invoice Entry",
  other: "Other Transactions",
};

export const ruleCategoryLabel = (category: string) => CATEGORY_LABELS[category] ?? category;

export type RuleGroup = { key: string; label: string; rules: TChartRow[] };

/** Groups rules in the catalog's own category order. */
export function groupRules(rows: TChartRow[]): RuleGroup[] {
  const groups = new Map<string, TChartRow[]>();
  for (const row of rows) groups.set(row.category, [...(groups.get(row.category) ?? []), row]);
  return [...groups].map(([key, rules]) => ({ key, label: ruleCategoryLabel(key), rules }));
}

export function filterRules(rows: TChartRow[], query: string, category: string) {
  const search = query.trim().toLowerCase();
  return rows.filter(row => {
    if (category !== "all" && row.category !== category) return false;
    return !search || [row.rule_code, row.trigger_name, row.debit_accounts, row.credit_accounts, row.when_to_post, ruleCategoryLabel(row.category)]
      .join(" ").toLowerCase().includes(search);
  });
}

export type RuleAccount = { text: string; code?: string; name?: string; note?: string };

const SINGLE_ACCOUNT = /^(.+?)\s*\((\d{3}\.\d{3})\)\s*(?:\[([^\]]*)\])?$/;

/**
 * Splits catalog account text on bullets. Only an exact "Name (000.000)" part, with an optional
 * [note], becomes an account reference; alternatives and descriptions stay as written.
 */
export function ruleAccounts(text: string | null): RuleAccount[] {
  if (!text?.trim()) return [];
  return text.split("•").map(part => part.trim()).filter(Boolean).map(part => {
    const match = SINGLE_ACCOUNT.exec(part);
    // A name that itself holds an account code is an alternative ("A (1) or B (2)"), not one account.
    return match && !/\d{3}\.\d{3}/.test(match[1]) ? { text: part, name: match[1], code: match[2], note: match[3] } : { text: part };
  });
}
