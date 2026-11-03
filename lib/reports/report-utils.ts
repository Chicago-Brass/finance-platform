import type { ReportLine } from "./types";

export type AccountBalance = {
  account_number: string; account_name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  account_subtype: string | null; normal_balance: "debit" | "credit";
  total_debit: number | string; total_credit: number | string; balance: number | string;
};
export type Period = { key: string; label: string; from: string; to: string };
export type Snapshot = { period: Period; accounts: AccountBalance[] };
export type Amounts = Record<string, number>;

export const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
export const monthStart = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}-01`;
export const monthEnd = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
export const formatDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function cents(value: number | string): number {
  const amount = Number(value), result = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(result)) throw new Error("Report amount exceeds supported cents precision.");
  return result;
}
export function accountCents(row: AccountBalance, creditPositive: boolean) {
  const net = cents(row.total_debit) - cents(row.total_credit);
  return creditPositive ? -net : net;
}
export function sumAmounts(keys: string[], ...sets: Amounts[]): Amounts {
  return Object.fromEntries(keys.map(key => [key, sets.reduce((sum, amounts) => sum + (amounts[key] ?? 0), 0)]));
}
export function subtractAmounts(keys: string[], left: Amounts, right: Amounts): Amounts {
  return Object.fromEntries(keys.map(key => [key, left[key] - right[key]]));
}
export function amountLine(id: string, label: string, values: Amounts, kind: ReportLine["kind"], depth = 0, spaceBefore = false): ReportLine {
  return { id, label, kind, depth, spaceBefore, values: Object.fromEntries(Object.entries(values).map(([key, value]) => {
    if (!Number.isSafeInteger(value)) throw new Error("Report total exceeds supported cents precision.");
    return [key, value / 100];
  })) };
}
export const section = (id: string, label: string, depth = 0, spaceBefore = true): ReportLine => ({ id, label, kind: "section", depth, values: {}, spaceBefore });

export function accountGroup(id: string, label: string, accounts: AccountBalance[], snapshots: Snapshot[], options: { creditPositive: boolean; summary: boolean; depth?: number; includeTotal?: boolean }) {
  const depth = options.depth ?? 0;
  const keys = snapshots.map(snapshot => snapshot.period.key);
  if (options.includeTotal) keys.push("total");
  const amounts = accounts.map(account => {
    const values = Object.fromEntries(snapshots.map(snapshot => {
      const row = snapshot.accounts.find(item => item.account_number === account.account_number);
      return [snapshot.period.key, row ? accountCents(row, options.creditPositive) : 0];
    }));
    if (options.includeTotal) values.total = Object.values(values).reduce((sum, value) => sum + value, 0);
    return values;
  });
  const total = sumAmounts(keys, ...amounts);
  const lines = options.summary ? [amountLine(`t-${id}`, label, total, "account", depth)] : [
    section(`s-${id}`, label, depth),
    ...accounts.map((account, index) => ({ ...amountLine(account.account_number, `${account.account_number}  ${account.account_name}`, amounts[index], "account", depth + 1), accountCode: account.account_number })),
    amountLine(`t-${id}`, `Total ${label.toLowerCase()}`, total, "subtotal", depth),
  ];
  return { lines, total };
}
