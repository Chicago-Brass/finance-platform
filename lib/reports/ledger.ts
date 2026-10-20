import { createClient } from "@/lib/supabase/server";
import type { Report, ReportLine } from "./types";

/**
 * Live-ledger reports. READ-ONLY: every query runs as the signed-in user through RLS.
 * Uses public.get_trial_balance(p_as_of, p_from) and the v_* views.
 */

type TbRow = {
  account_number: string;
  account_name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  account_subtype: string | null;
  normal_balance: "debit" | "credit";
  total_debit: number | string;
  total_credit: number | string;
  balance: number | string;
};

const n = (v: number | string | null | undefined) => Number(v ?? 0);
const creditPos = (r: TbRow) => n(r.total_credit) - n(r.total_debit);
const debitPos = (r: TbRow) => n(r.total_debit) - n(r.total_credit);

export async function getTrialBalance(asOf: string, from: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_trial_balance", { p_as_of: asOf, p_from: from });
  if (error) throw new Error(`Trial balance query failed: ${error.message}`);
  return (data ?? []) as TbRow[];
}

export async function countPostedEntries(asOf: string, from: string | null) {
  const supabase = await createClient();
  let q = supabase.from("v_journal_entries").select("id", { count: "exact", head: true }).eq("status", "posted").lte("entry_date", asOf);
  if (from) q = q.gte("entry_date", from);
  const { count } = await q;
  return count ?? 0;
}

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

function section(id: string, label: string, rows: TbRow[], sign: (r: TbRow) => number, totalLabel: string, depth = 1) {
  const lines: ReportLine[] = [{ id: `s-${id}`, label, kind: "section", depth: depth - 1, values: {}, spaceBefore: true }];
  for (const r of rows) {
    lines.push({ id: r.account_number, label: `${r.account_number}  ${r.account_name}`, kind: "account", depth, accountCode: r.account_number, values: { amt: sign(r) } });
  }
  const total = rows.reduce((t, r) => t + sign(r), 0);
  lines.push({ id: `t-${id}`, label: totalLabel, kind: "subtotal", depth: depth - 1, values: { amt: total } });
  return { lines, total };
}

const bySub = (rows: TbRow[], ...subs: string[]) => rows.filter((r) => subs.includes(r.account_subtype ?? ""));

export async function getLedgerIncomeStatement(from: string, to: string): Promise<Report> {
  const [tb, posted] = await Promise.all([getTrialBalance(to, from), countPostedEntries(to, from)]);
  const rev = bySub(tb.filter((r) => r.account_type === "revenue"), "sales", "contra_revenue");
  const cogs = bySub(tb.filter((r) => r.account_type === "expense"), "cogs", "contra_cogs");
  const opex = tb.filter((r) => r.account_type === "expense" && !["cogs", "contra_cogs", "income_tax"].includes(r.account_subtype ?? ""));
  const other = tb.filter((r) => r.account_type === "revenue" && !["sales", "contra_revenue"].includes(r.account_subtype ?? ""));
  const tax = bySub(tb.filter((r) => r.account_type === "expense"), "income_tax");

  const a = section("rev", "Revenue", rev, creditPos, "Net revenue");
  const b = section("cogs", "Cost of goods sold", cogs, debitPos, "Total cost of goods sold");
  const gp = a.total - b.total;
  const c = section("opex", "Operating expenses", opex, debitPos, "Total operating expenses");
  const oi = gp - c.total;
  const d = section("oth", "Other income", other, creditPos, "Total other income");
  const pre = oi + d.total;
  const e = section("tax", "Income taxes", tax, debitPos, "Total income taxes");
  const ni = pre - e.total;

  const lines: ReportLine[] = [
    ...a.lines.map((l, i) => (i === 0 ? { ...l, spaceBefore: false } : l)),
    ...b.lines,
    { id: "gp", label: "Gross profit", kind: "total", depth: 0, values: { amt: gp }, spaceBefore: true },
    ...c.lines,
    { id: "oi", label: "Operating income", kind: "total", depth: 0, values: { amt: oi }, spaceBefore: true },
    ...d.lines,
    { id: "pre", label: "Income before income taxes", kind: "total", depth: 0, values: { amt: pre }, spaceBefore: true },
    ...e.lines,
    { id: "ni", label: "Net income", kind: "grandTotal", depth: 0, values: { amt: ni }, spaceBefore: true },
  ];

  return {
    title: "Income Statement",
    entity: "Chicago Brass Inc.",
    periodLabel: `${fmtDate(from)} to ${fmtDate(to)}`,
    basis: "Accrual basis · Live ledger",
    isSample: false,
    columns: [{ key: "amt", label: "Amount", sublabel: "USD", kind: "amount" }],
    lines,
    checks: [{ label: "Posted entries", ok: true, detail: `${posted} in this range` }],
  };
}

export async function getLedgerBalanceSheet(asOf: string): Promise<Report> {
  const [tb, posted] = await Promise.all([getTrialBalance(asOf, null), countPostedEntries(asOf, null)]);
  const assets = tb.filter((r) => r.account_type === "asset");
  const liabs = tb.filter((r) => r.account_type === "liability");
  const equity = tb.filter((r) => r.account_type === "equity");
  // No closing entries yet: all-time revenue less expenses is shown as current earnings.
  const earnings = tb.filter((r) => r.account_type === "revenue" || r.account_type === "expense").reduce((t, r) => t + creditPos(r), 0);

  const a = section("a", "Assets", assets, debitPos, "Total assets");
  const l = section("l", "Liabilities", liabs, creditPos, "Total liabilities");
  const e = section("e", "Equity", equity, creditPos, "Equity accounts");
  const totalEquity = e.total + earnings;
  const totalLE = l.total + totalEquity;
  const diff = Math.round((a.total - totalLE) * 100) / 100;

  const lines: ReportLine[] = [
    ...a.lines.map((x, i) => (i === 0 ? { ...x, spaceBefore: false } : x)).map((x) => (x.id === "t-a" ? { ...x, kind: "grandTotal" as const } : x)),
    ...l.lines,
    ...e.lines,
    { id: "cye", label: "Current earnings (revenue less expenses, all time)", kind: "account", depth: 1, values: { amt: earnings } },
    { id: "te", label: "Total equity", kind: "subtotal", depth: 0, values: { amt: totalEquity } },
    { id: "tle", label: "Total liabilities and equity", kind: "grandTotal", depth: 0, values: { amt: totalLE }, spaceBefore: true },
  ];

  return {
    title: "Balance Sheet",
    entity: "Chicago Brass Inc.",
    periodLabel: `As of ${fmtDate(asOf)} (all time)`,
    basis: "Accrual basis · Live ledger",
    isSample: false,
    columns: [{ key: "amt", label: "Amount", sublabel: "USD", kind: "amount" }],
    lines,
    checks: [
      { label: "Balances", ok: diff === 0, detail: diff === 0 ? "Assets = Liabilities + Equity" : `Out of balance by ${diff}` },
      { label: "Posted entries", ok: true, detail: `${posted} to date` },
    ],
  };
}

export type LedgerRow = {
  date: string;
  account_number: string;
  account_name: string;
  offsetting_account_number: string | null;
  offsetting_account_name: string | null;
  debit: number | string;
  credit: number | string;
  notes: string | null;
  audit_link: string | null;
  offset_is_split: boolean | null;
  entry_number: number;
};

export async function getGeneralLedger(from: string, to: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_ledger")
    .select("date,account_number,account_name,offsetting_account_number,offsetting_account_name,debit,credit,notes,audit_link,offset_is_split,entry_number")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true })
    .order("entry_number", { ascending: true })
    .limit(1000);
  if (error) throw new Error(`Ledger query failed: ${error.message}`);
  return (data ?? []) as LedgerRow[];
}

export type TChartRow = {
  rule_code: string;
  category: string;
  sort_order: number;
  trigger_name: string;
  debit_accounts: string | null;
  credit_accounts: string | null;
  reversible: boolean | null;
  airtable_sources: string | null;
  when_to_post: string | null;
  fin_notes: string | null;
  audit_trail: string | null;
};

export async function getTChart() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_t_chart")
    .select("rule_code,category,sort_order,trigger_name,debit_accounts,credit_accounts,reversible,airtable_sources,when_to_post,fin_notes,audit_trail")
    .order("category")
    .order("sort_order");
  if (error) throw new Error(`T-Chart query failed: ${error.message}`);
  return (data ?? []) as TChartRow[];
}
