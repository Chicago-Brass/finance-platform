import type { AccountBalance } from "./report-utils";
import { ledgerRead } from "./report-session";

/**
 * Live-ledger reports. READ-ONLY: every query runs as the signed-in user through RLS.
 * Uses public.get_trial_balance(p_as_of, p_from) and the v_* views.
 */

export type TbRow = AccountBalance;

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
    // Older databases without the baseline's batched function can still read each set separately.
    if (error?.code === "PGRST202") return Promise.all(requests.map(item => getTrialBalance(item.asOf, item.from)));
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

export type LedgerAccountFilters = { account?: string; offset?: string };

export async function getGeneralLedger(from: string, to: string, requestedPage = 1, filters: LedgerAccountFilters = {}) {
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= Math.floor(Number.MAX_SAFE_INTEGER / LEDGER_PAGE_SIZE) ? requestedPage : 1;
  const offset = (page - 1) * LEDGER_PAGE_SIZE;
  const { account, offset: offsetAccount } = filters;
  return ledgerRead(async supabase => {
    let query = supabase
      .from("v_ledger")
      .select("date,account_number,account_name,offsetting_account_number,offsetting_account_name,debit,credit,notes,audit_link,offset_is_split,entry_number,line_id,line_no")
      .gte("date", from)
      .lte("date", to);
    if (account) query = query.eq("account_number", account);
    if (offsetAccount) query = query.eq("offsetting_account_number", offsetAccount);
    const { data, error } = await query
      .order("date", { ascending: true })
      .order("entry_number", { ascending: true })
      .order("line_no", { ascending: true })
      .range(offset, offset + LEDGER_PAGE_SIZE);
    if (error) throw new Error(`Ledger query failed: ${error.message}`);
    const rows = (data ?? []) as LedgerRow[];
    return { rows: rows.slice(0, LEDGER_PAGE_SIZE), hasNext: rows.length > LEDGER_PAGE_SIZE, page, pageSize: LEDGER_PAGE_SIZE };
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
