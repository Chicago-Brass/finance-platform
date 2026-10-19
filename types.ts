/**
 * ReportLine data contract.
 *
 * Stage 1 feeds these from static sample data. Stage 3 feeds the SAME shape
 * from Supabase ledger views, so the UI May signs off on does not change.
 */

export type ColumnKind = "amount" | "percent";

export interface ReportColumn {
  key: string;
  label: string;
  sublabel?: string;
  kind: ColumnKind;
}

export type LineKind =
  | "section" // heading row, no numbers (e.g. "Revenue")
  | "account" // a GL account
  | "subtotal" // sum of the accounts above it in a section
  | "total" // key result (Gross profit, Total assets)
  | "grandTotal"; // bottom line (Net income), double-underlined

export interface ReportLine {
  id: string;
  label: string;
  kind: LineKind;
  depth: number; // indent level, 0 = flush left
  accountCode?: string;
  values: Record<string, number | null>;
  /** Visual gap above this row. */
  spaceBefore?: boolean;
}

export interface ReportCheck {
  label: string;
  ok: boolean;
  detail: string;
}

export interface Report {
  title: string;
  entity: string;
  periodLabel: string;
  basis: string;
  isSample: boolean;
  columns: ReportColumn[];
  lines: ReportLine[];
  checks: ReportCheck[];
}
