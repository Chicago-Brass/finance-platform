/**
 * Classified balance sheet (US GAAP) on the Chicago Brass chart of accounts (COA_Explanation.xlsx).
 * Current-year earnings come from the Income Statement data, so the two reports tie.
 * Account balances come from BS_BALANCES (empty until a trial balance is loaded).
 */
import type { Report, ReportCheck, ReportColumn, ReportLine } from "./types";
import { formatAmount } from "@/lib/format";
import { ACTUAL_THROUGH_MONTH, BRANCHES, PL_2026, PL_YEAR, type BranchCode } from "./pl-2026-data";
import { BS_BALANCES, type BranchKey } from "./balance-sheet-data";

// ---------------------------------------------------------------- options
export type BsView = "ALL" | BranchCode | "BY_BRANCH";
export type BsGrain = "single" | "month" | "quarter";

export interface BalanceSheetOptions {
  view: BsView;
  grain: BsGrain;
  asOf: number; // month-end 1..12 of PL_YEAR
  summary: boolean;
}

/** "All time" through the last month with actuals. */
export const BS_DEFAULTS: BalanceSheetOptions = { view: "ALL", grain: "single", asOf: ACTUAL_THROUGH_MONTH, summary: false };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseBalanceSheetParams(sp: Record<string, string | string[] | undefined>): BalanceSheetOptions {
  const view = one(sp.view);
  const grain = one(sp.grain);
  const n = Number(one(sp.asof));
  return {
    view: view === "BY_BRANCH" || BRANCHES.some((b) => b.code === view) ? (view as BsView) : "ALL",
    grain: grain === "month" || grain === "quarter" ? grain : "single",
    asOf: Number.isInteger(n) && n >= 1 && n <= 12 ? n : BS_DEFAULTS.asOf,
    summary: one(sp.layout) === "summary",
  };
}

// ---------------------------------------------------------------- chart of accounts (balance sheet)
interface Acct {
  code: string;
  name: string;
  /** Inactive or "RETIRE" in the COA: shown only if it carries a balance. */
  inactive?: boolean;
}
interface Group {
  id: string;
  name: string;
  accounts: Acct[];
}
interface Block {
  id: string;
  name: string;
  total: string;
  groups: Group[];
}

const ASSETS: Block[] = [
  {
    id: "ca",
    name: "Current assets",
    total: "Total current assets",
    groups: [
      { id: "cash", name: "Cash and cash equivalents", accounts: [
        { code: "112.100", name: "Cash – Fifth Third Operating" },
        { code: "112.200", name: "Cash – Fidelity" },
        { code: "112.300", name: "Cash – Nickel Operating" },
        { code: "121.200", name: "Payments in transit (undeposited / merchant clearing)" },
      ] },
      { id: "ar", name: "Accounts receivable, net", accounts: [
        { code: "121.100", name: "Accounts receivable – trade" },
        { code: "121.900", name: "Allowance for doubtful accounts" },
        { code: "121.300", name: "Deposit invoices billed – unpaid (memo)", inactive: true },
      ] },
      { id: "orec", name: "Other receivables", accounts: [
        { code: "122.100", name: "Insurance claims receivable" },
      ] },
      { id: "inv", name: "Inventory", accounts: [
        { code: "131.100", name: "Committed to client orders" },
        { code: "131.300", name: "On-hand stock (uncommitted)" },
        { code: "131.400", name: "Pending return processing" },
        { code: "131.500", name: "Samples on loan" },
        { code: "131.200", name: "Received not invoiced (retire)", inactive: true },
      ] },
      { id: "prep", name: "Prepaid expenses and deposits", accounts: [
        { code: "132.100", name: "Vendor deposits / PO prepayments" },
        { code: "135.000", name: "Prepaid expenses" },
        { code: "133.000", name: "Sales tax prepayment", inactive: true },
        { code: "132.200", name: "PO deposit invoiced – unpaid (retire)", inactive: true },
      ] },
    ],
  },
  {
    id: "ppe",
    name: "Property and equipment",
    total: "Property and equipment, net",
    groups: [
      { id: "fa", name: "Property and equipment, at cost", accounts: [
        { code: "143.100", name: "Leasehold improvements" },
        { code: "143.300", name: "Display fixtures & equipment" },
        { code: "151.100", name: "Automobiles" },
        { code: "151.200", name: "Software (capitalized)" },
        { code: "141.000", name: "Land", inactive: true },
        { code: "142.000", name: "Buildings", inactive: true },
        { code: "153.000", name: "Tooling", inactive: true },
      ] },
      { id: "ad", name: "Accumulated depreciation", accounts: [
        { code: "161.000", name: "Accumulated depreciation" },
      ] },
    ],
  },
  {
    id: "oa",
    name: "Other assets",
    total: "Total other assets",
    groups: [{ id: "dep", name: "Deposits", accounts: [{ code: "143.200", name: "Security deposits" }] }],
  },
];

const LIABILITIES: Block[] = [
  {
    id: "cl",
    name: "Current liabilities",
    total: "Total current liabilities",
    groups: [
      { id: "ap", name: "Accounts payable", accounts: [
        { code: "211.100", name: "Accounts payable – trade" },
        { code: "211.200", name: "Received not yet invoiced (GRNI)" },
        { code: "211.300", name: "AP – unapproved & disputed" },
        { code: "211.400", name: "Deposits to vendor – invoiced unpaid (retire)", inactive: true },
      ] },
      { id: "cd", name: "Customer deposits and credits", accounts: [
        { code: "221.100", name: "Customer deposits (unearned revenue)" },
        { code: "221.300", name: "Client credits on account" },
        { code: "221.200", name: "Deposit invoices billed – offset (memo)", inactive: true },
      ] },
      { id: "stx", name: "Sales tax payable", accounts: [
        { code: "212.100", name: "Sales tax payable – IL" },
        { code: "212.200", name: "Sales tax payable – WI" },
        { code: "212.300", name: "Sales tax payable – MN" },
        { code: "212.400", name: "Sales tax payable – other states" },
      ] },
      { id: "acc", name: "Accrued payroll and benefits", accounts: [
        { code: "241.100", name: "Accrued salaries & wages" },
        { code: "241.200", name: "Accrued payroll taxes" },
        { code: "241.300", name: "Accrued bonus & commission" },
        { code: "241.400", name: "Accrued 401(k)" },
        { code: "241.500", name: "Accrued PTO" },
        { code: "241.600", name: "Employee benefit deductions payable" },
      ] },
      { id: "oth", name: "Other current liabilities", accounts: [
        { code: "231.100", name: "Credit card payable (Amex / Visa)" },
        { code: "231.200", name: "Line of credit payable" },
        { code: "242.100", name: "Accrued federal income tax" },
        { code: "242.200", name: "Accrued state income tax" },
        { code: "251.000", name: "Accrued expenses – other" },
        { code: "999.999", name: "Suspense / migration clearing (must be zero)" },
      ] },
    ],
  },
  {
    id: "ltl",
    name: "Long-term liabilities",
    total: "Total long-term liabilities",
    groups: [
      { id: "debt", name: "Notes and loans payable", accounts: [
        { code: "232.100", name: "Auto loan payable" },
        { code: "232.200", name: "Note payable – officers" },
        { code: "232.300", name: "Note payable – prior owners" },
      ] },
    ],
  },
];

const EQUITY: Group = {
  id: "eq",
  name: "Stockholders' equity",
  accounts: [
    { code: "311.100", name: "Capital stock" },
    { code: "311.200", name: "Additional paid-in capital" },
    { code: "311.300", name: "Accumulated other comprehensive income (unrealized gains)" },
    { code: "313.100", name: "Retained earnings" },
    { code: "316.100", name: "Shareholder distributions" },
    { code: "314.000", name: "Treasury stock", inactive: true },
  ],
};

// ---------------------------------------------------------------- columns
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ALL_BRANCHES = BRANCHES.map((b) => b.code);

interface Col {
  key: string;
  label: string;
  sublabel: string;
  month: number; // month-end
  branches: BranchCode[];
  /** Include company-wide (ALL) balances. */
  company: boolean;
}

const lastDay = (m: number) => new Date(PL_YEAR, m, 0).getDate();
const basis = (m: number) => (m <= ACTUAL_THROUGH_MONTH ? "Actual" : "Forecast earnings");

function buildColumns(o: BalanceSheetOptions): Col[] {
  const label = (m: number) => `${MONTHS[m - 1]} ${lastDay(m)}, ${PL_YEAR}`;
  if (o.view === "BY_BRANCH") {
    const sub = label(o.asOf);
    return [
      ...BRANCHES.map((b) => ({ key: b.code, label: b.name, sublabel: sub, month: o.asOf, branches: [b.code], company: false })),
      { key: "co", label: "Company-wide", sublabel: sub, month: o.asOf, branches: [], company: true },
      { key: "total", label: "Consolidated", sublabel: sub, month: o.asOf, branches: ALL_BRANCHES, company: true },
    ];
  }
  const branches = o.view === "ALL" ? ALL_BRANCHES : [o.view];
  const company = o.view === "ALL";
  let months: number[];
  if (o.grain === "month") months = Array.from({ length: o.asOf }, (_, i) => i + 1);
  else if (o.grain === "quarter") months = [3, 6, 9, 12].filter((m) => m < o.asOf).concat(o.asOf);
  else months = [o.asOf];
  return months.map((m) => ({
    key: `m${m}`,
    label: label(m),
    sublabel: basis(m),
    month: m,
    branches,
    company,
  }));
}

// ---------------------------------------------------------------- amounts
type Amounts = Record<string, number>;
const period = (m: number) => `${PL_YEAR}-${String(m).padStart(2, "0")}`;

function balance(code: string, c: Col): number {
  const row = BS_BALANCES[period(c.month)]?.[code];
  if (!row) return 0;
  let t = 0;
  for (const b of c.branches) t += row[b as BranchKey] ?? 0;
  if (c.company) t += row.ALL ?? 0;
  return t;
}

/** Income before income taxes from the Income Statement data, Jan through the column's month. */
function currentYearEarnings(c: Col): number {
  let t = 0;
  for (const b of c.branches) {
    const d = PL_2026[b];
    for (const [code, arr] of Object.entries(d)) {
      const sum = arr.slice(0, c.month).reduce((s, v) => s + v, 0);
      if (code.startsWith("4") || code === "5900" || code === "7200" || code === "7300" || code === "7400") t += sum;
      else t -= sum; // COGS, operating expenses, interest and misc. expense
    }
  }
  return t;
}

const add = (cols: Col[], ...sets: Amounts[]): Amounts =>
  Object.fromEntries(cols.map((c) => [c.key, sets.reduce((t, s) => t + (s[c.key] ?? 0), 0)]));
const isZero = (cols: Col[], a: Amounts) => cols.every((c) => Math.round((a[c.key] ?? 0) * 100) === 0);
const hasBalances = (cols: Col[]) => cols.some((c) => BS_BALANCES[period(c.month)] !== undefined);

// ---------------------------------------------------------------- lines
const section = (id: string, label: string, depth: number, spaceBefore = false): ReportLine => ({
  id, label, kind: "section", depth, values: {}, spaceBefore,
});
const totalLine = (id: string, label: string, values: Amounts, kind: ReportLine["kind"], depth: number, spaceBefore = false): ReportLine => ({
  id, label, kind, depth, values, spaceBefore,
});

function groupLines(g: Group, cols: Col[], depth: number, summary: boolean, extra?: ReportLine) {
  const rows: ReportLine[] = [];
  const amounts: Amounts[] = [];
  for (const a of g.accounts) {
    const v = Object.fromEntries(cols.map((c) => [c.key, balance(a.code, c)]));
    amounts.push(v);
    if (a.inactive && isZero(cols, v)) continue;
    rows.push({ id: `a${a.code}`, label: `${a.code}  ${a.name}`, kind: "account", depth: depth + 1, accountCode: a.code, values: v });
  }
  if (extra) {
    rows.push(extra);
    amounts.push(extra.values as Amounts);
  }
  const total = add(cols, ...amounts);
  const lines = summary
    ? [{ id: `t-${g.id}`, label: g.name, kind: "account" as const, depth, values: total }]
    : [section(`g-${g.id}`, g.name, depth), ...rows, totalLine(`t-${g.id}`, `Total ${g.name.toLowerCase()}`, total, "subtotal", depth)];
  return { lines, total };
}

function blockLines(b: Block, cols: Col[], summary: boolean) {
  const lines: ReportLine[] = [section(`b-${b.id}`, b.name, 1, true)];
  const totals: Amounts[] = [];
  for (const g of b.groups) {
    const r = groupLines(g, cols, 2, summary);
    lines.push(...r.lines);
    totals.push(r.total);
  }
  const total = add(cols, ...totals);
  lines.push(totalLine(`t-${b.id}`, b.total, total, "subtotal", 1));
  return { lines, total };
}

// ---------------------------------------------------------------- report
export function getBalanceSheet(o: BalanceSheetOptions = BS_DEFAULTS): Report {
  const cols = buildColumns(o);
  const lines: ReportLine[] = [];

  lines.push(section("assets", "Assets", 0));
  const aTotals: Amounts[] = [];
  for (const b of ASSETS) {
    const r = blockLines(b, cols, o.summary);
    lines.push(...r.lines);
    aTotals.push(r.total);
  }
  const assets = add(cols, ...aTotals);
  lines.push(totalLine("t-assets", "Total assets", assets, "grandTotal", 0, true));

  lines.push(section("le", "Liabilities and stockholders' equity", 0, true));
  lines.push(section("liab", "Liabilities", 1, true));
  const lTotals: Amounts[] = [];
  for (const b of LIABILITIES) {
    const r = blockLines(b, cols, o.summary);
    for (const l of r.lines) lines.push({ ...l, depth: l.depth + 1 });
    lTotals.push(r.total);
  }
  const liab = add(cols, ...lTotals);
  lines.push(totalLine("t-liab", "Total liabilities", liab, "subtotal", 1));

  const cye: ReportLine = {
    id: "cye",
    label: "Current-year earnings (from Income Statement, pre-tax)",
    kind: "account",
    depth: 2,
    values: Object.fromEntries(cols.map((c) => [c.key, currentYearEarnings(c)])),
  };
  const eq = groupLines(EQUITY, cols, 1, o.summary, cye);
  lines.push(...eq.lines.map((l) => (l.id === "g-eq" ? { ...l, spaceBefore: true } : l)));
  const le = add(cols, liab, eq.total);
  lines.push(totalLine("t-le", "Total liabilities and stockholders' equity", le, "grandTotal", 0, true));

  return {
    title: o.summary ? "Balance Sheet (summary)" : "Balance Sheet",
    entity: entityLabel(o.view),
    periodLabel: `As of ${MONTHS_LONG[o.asOf - 1]} ${lastDay(o.asOf)}, ${PL_YEAR} (all activity to date)`,
    basis: "Accrual basis · Chicago Brass chart of accounts",
    isSample: false,
    columns: cols.map<ReportColumn>((c) => ({ key: c.key, label: c.label, sublabel: c.sublabel, kind: "amount" })),
    lines,
    checks: checks(o, cols, assets, le),
  };
}

function entityLabel(v: BsView) {
  if (v === "ALL") return "Chicago Brass Inc. · Consolidated";
  if (v === "BY_BRANCH") return "Chicago Brass Inc. · By branch";
  return `Chicago Brass Inc. · ${BRANCHES.find((b) => b.code === v)?.name} branch`;
}

function checks(o: BalanceSheetOptions, cols: Col[], assets: Amounts, le: Amounts): ReportCheck[] {
  const out: ReportCheck[] = [];
  if (!hasBalances(cols)) {
    out.push({
      label: "Balances",
      ok: false,
      detail: "Waiting for a trial balance; only current-year earnings are filled in",
    });
  } else {
    const off = cols.filter((c) => Math.abs(assets[c.key] - le[c.key]) >= 1);
    out.push({
      label: "Balances",
      ok: off.length === 0,
      detail:
        off.length === 0
          ? "Assets equal liabilities plus equity"
          : off.map((c) => `${c.label} out by $${formatAmount(Math.abs(assets[c.key] - le[c.key]))}`).join("; "),
    });
  }
  out.push({ label: "Ties to Income Statement", ok: true, detail: "Current-year earnings = income before income taxes, Jan to as-of date" });
  if (cols.some((c) => c.month > ACTUAL_THROUGH_MONTH)) {
    out.push({ label: "Forecast", ok: true, detail: `${MONTHS[ACTUAL_THROUGH_MONTH]}–Dec earnings are forecast` });
  }
  if (o.view === "BY_BRANCH") {
    out.push({ label: "Branches", ok: true, detail: "Balances not assigned to a branch show under Company-wide" });
  } else if (o.view !== "ALL") {
    out.push({ label: "Branches", ok: true, detail: "Shows only balances assigned to this branch" });
  }
  return out;
}
