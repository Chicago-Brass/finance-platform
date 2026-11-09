import type { LedgerRow } from "./ledger";
import { cents } from "./report-utils";

/**
 * Account drill-down data. Amounts are integer cents. "Natural" amounts follow the account's
 * normal balance: debit-normal accounts count debits as positive, credit-normal accounts credits.
 */

export type DrillMode = "period" | "balance";
export type DrillRange = { mode: DrillMode; from: string; to: string; branch?: string };
export type NormalBalance = "debit" | "credit";

export type AccountActivityLine = {
  id: string;
  date: string;
  entry: number;
  lineNo: number;
  offsetCode: string | null;
  offsetName: string | null;
  offsetSplit: boolean;
  notes: string | null;
  auditLink: string | null;
  debit: number;
  credit: number;
};

export type AccountActivity = DrillRange & {
  account: { code: string; name: string; normalBalance: NormalBalance };
  /** Period totals from the trial balance; they cover every line even when the list is capped. */
  debit: number;
  credit: number;
  lines: AccountActivityLine[];
  truncated: boolean;
  /** Balance mode: natural balance at the end of the day before `from`. */
  opening: number | null;
  /** Period mode: the same dates one year earlier. */
  previous: { from: string; to: string; net: number } | null;
};

export type AccountActivitySummary = Omit<AccountActivity, "lines" | "truncated">;
export type AccountActivityLines = Pick<AccountActivity, "lines" | "truncated">;
export type AccountActivityParts = { summary: AccountActivitySummary; lines: AccountActivityLines };

export function toActivityLine(row: LedgerRow): AccountActivityLine {
  return {
    id: row.line_id,
    date: row.date,
    entry: row.entry_number,
    lineNo: row.line_no,
    offsetCode: row.offset_is_split ? null : row.offsetting_account_number,
    offsetName: row.offset_is_split ? null : row.offsetting_account_name,
    offsetSplit: !!row.offset_is_split,
    notes: row.notes,
    auditLink: row.audit_link,
    debit: cents(row.debit ?? 0),
    credit: cents(row.credit ?? 0),
  };
}

export function naturalNet(debit: number, credit: number, normal: NormalBalance) {
  return normal === "credit" ? credit - debit : debit - credit;
}

export function dayBefore(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** Moves a date by whole years, clamping Feb 29 to Feb 28. */
export function shiftYears(iso: string, years: number) {
  const year = Number(iso.slice(0, 4)) + years, month = Number(iso.slice(5, 7)), day = Number(iso.slice(8, 10));
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${iso.slice(5, 7)}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const MONTH_YEAR = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** Every calendar month touched by the range, oldest first. */
export function rangeMonths(from: string, to: string) {
  const months: { key: string; label: string; name: string }[] = [];
  if (from > to) return months;
  let year = Number(from.slice(0, 4)), month = Number(from.slice(5, 7));
  const endKey = to.slice(0, 7);
  for (let guard = 0; guard < 600; guard++) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const date = new Date(Date.UTC(year, month - 1, 1));
    months.push({ key, label: MONTH.format(date), name: MONTH_YEAR.format(date) });
    if (key === endKey) break;
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return months;
}

export function lineTotals(lines: AccountActivityLine[]) {
  return lines.reduce((sum, line) => ({ debit: sum.debit + line.debit, credit: sum.credit + line.credit }), { debit: 0, credit: 0 });
}

export function offsetKey(line: AccountActivityLine) {
  return line.offsetSplit ? "split" : line.offsetCode ?? "none";
}

export function offsetLabel(line: AccountActivityLine) {
  if (line.offsetSplit) return "Split / multiple accounts";
  if (!line.offsetCode) return "No offsetting account";
  return line.offsetName ? `${line.offsetCode} ${line.offsetName}` : line.offsetCode;
}

export function summarizeActivity(activity: AccountActivity) {
  const normal = activity.account.normalBalance;
  const net = naturalNet(activity.debit, activity.credit, normal);
  const months = rangeMonths(activity.from, activity.to).map(month => ({ ...month, net: 0 }));
  const byMonth = new Map(months.map(month => [month.key, month]));
  const offsets = new Map<string, { key: string; label: string; net: number }>();
  let debitLines = 0, creditLines = 0;
  for (const line of activity.lines) {
    const amount = naturalNet(line.debit, line.credit, normal);
    const month = byMonth.get(line.date.slice(0, 7));
    if (month) month.net += amount;
    const key = offsetKey(line);
    const offset = offsets.get(key) ?? { key, label: offsetLabel(line), net: 0 };
    offset.net += amount;
    offsets.set(key, offset);
    if (line.debit) debitLines += 1;
    if (line.credit) creditLines += 1;
  }
  const listed = lineTotals(activity.lines);
  const previous = activity.previous?.net ?? null;
  const difference = previous == null ? null : net - previous;
  return {
    net,
    netSide: (activity.debit >= activity.credit ? "debit" : "credit") as NormalBalance,
    closing: activity.opening == null ? null : activity.opening + net,
    months,
    averagePerMonth: months.length ? Math.round(net / months.length) : 0,
    offsets: [...offsets.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
    debitLines,
    creditLines,
    change: difference == null ? null : { difference, percent: previous === 0 ? null : difference / Math.abs(previous!) },
    /** The listed lines add up to the trial balance totals (always expected unless the list is capped). */
    tiesToTotals: !activity.truncated && listed.debit === activity.debit && listed.credit === activity.credit,
  };
}

export type ActivityFilters = { query: string; month: string; offset: string; side: "all" | "debit" | "credit" };
export const NO_ACTIVITY_FILTERS: ActivityFilters = { query: "", month: "", offset: "", side: "all" };

export function filterActivityLines(lines: AccountActivityLine[], filters: ActivityFilters) {
  const search = filters.query.trim().toLocaleLowerCase();
  return lines.filter(line => {
    if (filters.month && line.date.slice(0, 7) !== filters.month) return false;
    if (filters.offset && offsetKey(line) !== filters.offset) return false;
    if (filters.side === "debit" && !line.debit) return false;
    if (filters.side === "credit" && !line.credit) return false;
    if (!search) return true;
    return `${line.entry} entry ${line.entry} ${offsetLabel(line)} ${line.notes ?? ""} ${line.date}`.toLocaleLowerCase().includes(search);
  });
}

export function activityFiltered(filters: ActivityFilters) {
  return filters.query.trim() !== "" || filters.month !== "" || filters.offset !== "" || filters.side !== "all";
}
