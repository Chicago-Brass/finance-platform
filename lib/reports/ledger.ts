import type { AccountBalance } from "./report-utils";
import { ledgerRead } from "./report-session";

/**
 * Live-ledger reports. READ-ONLY: every query runs as the signed-in user through RLS.
 * Uses public.get_trial_balance(p_as_of, p_from) and the v_* views.
 */

export type TbRow = AccountBalance;
export type LedgerAccountOption = Pick<TbRow, "account_number" | "account_name" | "account_type">;
export type LedgerCategoryOption = { rule_code: string; trigger_name: string; category: string };

export async function getLedgerCategories(): Promise<LedgerCategoryOption[]> {
  return ledgerRead(async supabase => {
    const { data, error } = await supabase.from("ledger_rules").select("rule_code,trigger_name,category").order("rule_code");
    if (error) throw new Error(`Transaction category options query failed: ${error.message}`);
    return data ?? [];
  });
}

/** Dropdown choices need account metadata, not a cumulative financial aggregation. */
export async function getLedgerAccounts(): Promise<LedgerAccountOption[]> {
  return ledgerRead(async supabase => {
    const { data, error } = await supabase.from("accounts").select("account_number:code,account_name:name,account_type").order("code");
    if (error) throw new Error(`Account options query failed: ${error.message}`);
    return data ?? [];
  });
}

export async function getTrialBalance(asOf: string, from: string | null) {
  return ledgerRead(async supabase => {
    const { data, error } = await supabase.rpc("get_trial_balance", { p_as_of: asOf, p_from: from });
    if (error) throw new Error(`Trial balance query failed: ${error.message}`);
    return (data ?? []) as TbRow[];
  });
}

export type TrialBalanceRequest = { asOf: string; from: string | null };

/**
 * Several trial balances in one round trip (public.get_trial_balances), in request order. Each set
 * equals getTrialBalance(asOf, from): the database function calls get_trial_balance for every pair.
 */
export async function getTrialBalances(requests: TrialBalanceRequest[]): Promise<TbRow[][]> {
  if (requests.length === 0) return [];
  return ledgerRead(async supabase => {
    const { data, error } = await supabase.rpc("get_trial_balances", { p_as_of: requests.map(item => item.asOf), p_from: requests.map(item => item.from) });
    if (error) throw new Error(`Trial balances query failed: ${error.message}`);
    const rows = (data ?? []) as { period_index: number; accounts: TbRow[] }[];
    if (rows.length !== requests.length || rows.some((row, index) => row.period_index !== index + 1)) throw new Error("Trial balances query returned unexpected periods.");
    return rows.map(row => row.accounts);
  });
}

export async function countPostedEntries(asOf: string, from: string | null) {
  return ledgerRead(async supabase => {
    let q = supabase.from("v_journal_entries").select("id", { count: "exact", head: true }).eq("status", "posted").lte("entry_date", asOf);
    if (from) q = q.gte("entry_date", from);
    const { count, error } = await q;
    if (error) throw new Error(`Posted entry count failed: ${error.message}`);
    return count ?? 0;
  });
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
  line_id: string;
  line_no: number;
};

export const LEDGER_PAGE_SIZE = 100;
const LEDGER_COLUMNS = "date,account_number,account_name,offsetting_account_number,offsetting_account_name,debit,credit,notes,audit_link,offset_is_split,entry_number,line_id,line_no";

export type LedgerSide = "all" | "debit" | "credit";
export type LedgerAccountFilters = { account?: string; offset?: string; query?: string; side?: LedgerSide; accountType?: TbRow["account_type"]; category?: string; min?: number; max?: number };

function ledgerFilterArgs(from: string, to: string, filters: LedgerAccountFilters) {
  return {
    p_from: from, p_to: to, p_query: filters.query?.trim().slice(0, 200) || "",
    p_account: filters.account ?? null, p_offset: filters.offset ?? null,
    p_side: filters.side === "debit" || filters.side === "credit" ? filters.side : "all",
    p_account_type: filters.accountType ?? null, p_category: filters.category ?? null,
    p_min: filters.min ?? null, p_max: filters.max ?? null,
  };
}

export async function getLedgerCount(from: string, to: string, filters: LedgerAccountFilters = {}) {
  return ledgerRead(async supabase => {
    const { data, error } = await supabase.rpc("count_ledger", ledgerFilterArgs(from, to, filters));
    if (error) throw new Error(`Ledger count failed: ${error.message}`);
    const count = Number(data);
    if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid ledger record count.");
    return count;
  });
}

export async function getGeneralLedger(from: string, to: string, requestedPage = 1, filters: LedgerAccountFilters = {}, pageSize = LEDGER_PAGE_SIZE) {
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= Math.floor(Number.MAX_SAFE_INTEGER / pageSize) ? requestedPage : 1;
  const offset = (page - 1) * pageSize;
  return ledgerRead(async supabase => {
    const { data, error } = await supabase.rpc("filter_ledger", {
      ...ledgerFilterArgs(from, to, filters),
      p_skip: offset, p_take: pageSize + 1,
    }).select(LEDGER_COLUMNS);
    if (error) throw new Error(`Ledger query failed: ${error.message}`);
    const rows = (data ?? []) as LedgerRow[];
    return { rows: rows.slice(0, pageSize), hasNext: rows.length > pageSize, page, pageSize };
  });
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
  return ledgerRead(async supabase => {
    const { data, error } = await supabase
      .from("v_t_chart")
      .select("rule_code,category,sort_order,trigger_name,debit_accounts,credit_accounts,reversible,airtable_sources,when_to_post,fin_notes,audit_trail")
      .order("category")
      .order("sort_order");
    if (error) throw new Error(`T-Chart query failed: ${error.message}`);
    return (data ?? []) as TChartRow[];
  });
}
