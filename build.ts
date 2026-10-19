import type { ReportLine } from "./types";

/** Amounts per column key for one account. */
export type Amounts = Record<string, number>;

export interface Acct {
  code: string;
  name: string;
  amounts: Amounts;
}

export const sum = (keys: string[], ...sets: Amounts[]): Amounts =>
  Object.fromEntries(keys.map((k) => [k, sets.reduce((t, s) => t + (s[k] ?? 0), 0)]));

export const diff = (keys: string[], a: Amounts, b: Amounts): Amounts =>
  Object.fromEntries(keys.map((k) => [k, (a[k] ?? 0) - (b[k] ?? 0)]));

export const sectionLine = (id: string, label: string, spaceBefore = true): ReportLine => ({
  id,
  label,
  kind: "section",
  depth: 0,
  values: {},
  spaceBefore,
});

export const accountLines = (accts: Acct[], depth = 1): ReportLine[] =>
  accts.map((a) => ({
    id: a.code,
    label: a.name,
    kind: "account",
    depth,
    accountCode: a.code,
    values: { ...a.amounts },
  }));

export const totalLine = (
  id: string,
  label: string,
  amounts: Amounts,
  kind: "subtotal" | "total" | "grandTotal",
  depth = 0,
  spaceBefore = false,
): ReportLine => ({ id, label, kind, depth, values: { ...amounts }, spaceBefore });

/** Adds "change $" and "change %" columns comparing two amount columns. */
export function withVariance(lines: ReportLine[], cur: string, prior: string): ReportLine[] {
  return lines.map((l) => {
    if (l.kind === "section") return l;
    const c = l.values[cur];
    const p = l.values[prior];
    if (c == null || p == null) return l;
    const chg = c - p;
    return { ...l, values: { ...l.values, chg, pct: p === 0 ? null : chg / Math.abs(p) } };
  });
}
