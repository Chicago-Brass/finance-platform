import type { LedgerAccountFilters, LedgerRow, TbRow } from "@/lib/reports/ledger";
import { cents } from "@/lib/reports/report-utils";
import { startOfYear } from "@/lib/dates";

export function ledgerPageNumber(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

const ACCOUNT_CODE = /^\d{3}\.\d{3}$/;

/** Accepts only a ledger account code such as 112.300; anything else means no filter. */
export function ledgerAccountParam(value: string | string[] | undefined) {
  const code = Array.isArray(value) ? value[0] : value;
  return code && ACCOUNT_CODE.test(code) ? code : undefined;
}

export type LedgerQuery = LedgerAccountFilters & { from: string; to: string; page?: number };

export function ledgerHref({ from, to, account, offset, page }: LedgerQuery) {
  const params = new URLSearchParams({ from, to });
  if (account) params.set("account", account);
  if (offset) params.set("offset", offset);
  if (page) params.set("page", String(page));
  return `?${params}`;
}

/** General Ledger for one account, from the start of the as-of year through the as-of date. */
export function accountLedgerHref(account: string, asOf: string) {
  return `/general-ledger${ledgerHref({ from: startOfYear(asOf), to: asOf, account })}`;
}

export function ledgerDatePresets(today: string) {
  const year = Number(today.slice(0, 4)), month = Number(today.slice(5, 7));
  return [
    { label: "Year to date", from: `${year}-01-01`, to: today },
    { label: "Last month", from: new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10), to: new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10) },
    { label: "Last year", from: `${year - 1}-01-01`, to: `${year - 1}-12-31` },
  ];
}

export function filterTrialAccounts(rows: TbRow[], query: string, type: string, showZero: boolean) {
  const search = query.trim().toLowerCase();
  return rows.filter(row => {
    if (type !== "all" && row.account_type !== type) return false;
    if (search && !`${row.account_number} ${row.account_name}`.toLowerCase().includes(search)) return false;
    return showZero || [row.total_debit, row.total_credit, row.balance].some(value => Number(value) !== 0);
  });
}

export function filterLedgerRecords(rows: LedgerRow[], query: string, side: string) {
  const search = query.trim().toLowerCase();
  return rows.filter(row => {
    if (side === "debit" && Number(row.debit) === 0) return false;
    if (side === "credit" && Number(row.credit) === 0) return false;
    return !search || `${row.account_number} ${row.account_name} ${row.offsetting_account_number ?? ""} ${row.offsetting_account_name ?? ""} ${row.notes ?? ""} ${row.offset_is_split ? "split multiple accounts" : ""}`.toLowerCase().includes(search);
  });
}

export function moneyTotal(values: (number | string)[]) {
  const total = values.reduce<number>((sum, value) => sum + cents(value), 0);
  if (!Number.isSafeInteger(total)) throw new Error("Ledger total exceeds supported cents precision.");
  return total / 100;
}

export function safeAuditLink(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

export const ACCOUNT_TYPES: Record<string, string> = { asset: "Asset", liability: "Liability", equity: "Equity", revenue: "Revenue", expense: "Expense" };

/** Accounts grouped by type in statement order, for account pickers. */
export function accountGroups(rows: Pick<TbRow, "account_number" | "account_name" | "account_type">[]) {
  return Object.keys(ACCOUNT_TYPES)
    .map(type => ({ type, label: ACCOUNT_TYPES[type], accounts: rows.filter(row => row.account_type === type) }))
    .filter(group => group.accounts.length > 0);
}
