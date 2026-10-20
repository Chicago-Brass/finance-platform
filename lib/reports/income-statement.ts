/**
 * Income statement from the 2026 branch P&L data, in a US GAAP layout:
 * revenue, cost of goods sold, gross profit, operating expenses by group,
 * operating income, other income (expense), income before income taxes.
 *
 * Reclassified from the workbook layout: inventory adjustments, returns disposed of
 * and purchase discounts sit in cost of goods sold; interest expense is non-operating;
 * 1099 and offshore pay are contract labor. Totals for each month are unchanged.
 */
import type { Report, ReportCheck, ReportColumn, ReportLine } from "./types";
import { formatAmount } from "@/lib/format";
import {
  ACTUAL_THROUGH_MONTH,
  BRANCHES,
  PL_2026,
  PL_YEAR,
  REPORTED_CONSOLIDATED_NOI,
  type BranchCode,
} from "./pl-2026-data";

// ---------------------------------------------------------------- options
export type BranchView = "ALL" | BranchCode | "BY_BRANCH";
export type Grain = "month" | "quarter" | "year";

export interface IncomeStatementOptions {
  view: BranchView;
  grain: Grain;
  from: number; // 1..12
  to: number; // 1..12
  summary: boolean; // simplified roll-up
}

export const DEFAULT_OPTIONS: IncomeStatementOptions = {
  view: "ALL",
  grain: "month",
  from: 1,
  to: 12,
  summary: false,
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseIncomeStatementParams(
  sp: Record<string, string | string[] | undefined>,
): IncomeStatementOptions {
  const view = one(sp.view);
  const grain = one(sp.grain);
  const month = (v: string | undefined, d: number) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 12 ? n : d;
  };
  let from = month(one(sp.from), DEFAULT_OPTIONS.from);
  let to = month(one(sp.to), DEFAULT_OPTIONS.to);
  if (from > to) [from, to] = [to, from];
  return {
    view:
      view === "BY_BRANCH" || BRANCHES.some((b) => b.code === view) ? (view as BranchView) : "ALL",
    grain: grain === "quarter" || grain === "year" ? grain : "month",
    from,
    to,
    summary: one(sp.layout) === "summary",
  };
}

// ---------------------------------------------------------------- chart of accounts (P&L)
interface Acct {
  code: string;
  name: string;
  /** -1 for contra accounts shown as reductions (purchase discounts, interest expense). */
  sign?: 1 | -1;
}
interface Group {
  id: string;
  name: string;
  accounts: Acct[];
}

const REVENUE: Acct[] = [
  { code: "4100", name: "Product revenue" },
  { code: "4200", name: "Coordination fee revenue" },
  { code: "4300", name: "Freight billed to customers" },
];
const COGS: Acct[] = [
  { code: "5100", name: "Product cost" },
  { code: "5200", name: "Freight cost" },
  { code: "5300", name: "Inventory adjustments" },
  { code: "5400", name: "Returns disposed of" },
  { code: "5900", name: "Purchase discounts & rebates", sign: -1 },
];
const OPEX: Group[] = [
  {
    id: "6100",
    name: "Personnel",
    accounts: [
      { code: "6105", name: "Officer salaries" },
      { code: "6110", name: "Salaries & wages (W-2)" },
      { code: "6115", name: "Bonus" },
      { code: "6120", name: "13th month pay" },
      { code: "6125", name: "Payroll taxes" },
      { code: "6130", name: "Health, dental & STD insurance" },
      { code: "6135", name: "401(k) contributions & fees" },
      { code: "6140", name: "Workers' compensation" },
      { code: "6145", name: "Payroll processing" },
      { code: "6150", name: "Training & development" },
      { code: "6160", name: "Contract labor, domestic (1099)" },
      { code: "6165", name: "Contract labor, offshore" },
      { code: "6170", name: "Offshore technology allowance" },
    ],
  },
  {
    id: "6200",
    name: "Occupancy",
    accounts: [
      { code: "6205", name: "Rent" },
      { code: "6210", name: "Utilities" },
      { code: "6215", name: "Safety & security" },
      { code: "6220", name: "Cleaning" },
      { code: "6225", name: "Display library replenishment" },
    ],
  },
  {
    id: "6300",
    name: "Finance & administrative",
    accounts: [
      { code: "6305", name: "Accounting fees" },
      { code: "6310", name: "Bad debt expense" },
      { code: "6315", name: "Bank service charges" },
      { code: "6320", name: "Merchant services" },
      { code: "6325", name: "Insurance, general" },
      { code: "6330", name: "Insurance, officer life" },
      { code: "6335", name: "Sales tax assessments" },
      { code: "6340", name: "Legal fees" },
    ],
  },
  {
    id: "6400",
    name: "Technology",
    accounts: [
      { code: "6405", name: "Software licensing" },
      { code: "6410", name: "Server hosting" },
      { code: "6415", name: "IT services" },
      { code: "6420", name: "Telephone" },
    ],
  },
  {
    id: "6500",
    name: "General operating",
    accounts: [
      { code: "6505", name: "Consulting" },
      { code: "6510", name: "Marketing & promotion" },
      { code: "6515", name: "Depreciation" },
      { code: "6520", name: "Donations" },
      { code: "6525", name: "Dues & subscriptions" },
      { code: "6530", name: "Meals & entertainment" },
      { code: "6535", name: "Repair & maintenance" },
      { code: "6540", name: "Office expenses" },
      { code: "6545", name: "Postage" },
      { code: "6550", name: "Selling expense, misc." },
      { code: "6555", name: "Travel" },
      { code: "6560", name: "Warehouse supplies" },
      { code: "6565", name: "Permits & licenses" },
      { code: "6570", name: "Shipping insurance premiums" },
    ],
  },
];
const OTHER: Acct[] = [
  { code: "7100", name: "Interest expense", sign: -1 },
  { code: "7200", name: "Interest & dividend income" },
  { code: "7300", name: "Gain (loss) on fixed assets" },
  { code: "7400", name: "Miscellaneous income" },
  { code: "7500", name: "Miscellaneous expense", sign: -1 },
];

// ---------------------------------------------------------------- columns
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Col {
  key: string;
  label: string;
  sublabel: string;
  months: number[]; // 1-based
  branches: BranchCode[];
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function basisNote(months: number[]): string {
  const act = months.filter((m) => m <= ACTUAL_THROUGH_MONTH).length;
  if (act === months.length) return "Actual";
  if (act === 0) return "Forecast";
  return "Actual + forecast";
}

function buildColumns(o: IncomeStatementOptions): Col[] {
  const months = range(o.from, o.to);
  const allBranches = BRANCHES.map((b) => b.code);

  if (o.view === "BY_BRANCH") {
    const sub = `${MONTHS[o.from - 1]}–${MONTHS[o.to - 1]} · ${basisNote(months)}`;
    return [
      ...BRANCHES.map((b) => ({ key: b.code, label: b.name, sublabel: sub, months, branches: [b.code] })),
      { key: "total", label: "Consolidated", sublabel: sub, months, branches: allBranches },
    ];
  }

  const branches = o.view === "ALL" ? allBranches : [o.view];
  let buckets: Col[];
  if (o.grain === "month") {
    buckets = months.map((m) => ({
      key: `m${m}`,
      label: `${MONTHS[m - 1]} ${PL_YEAR}`,
      sublabel: basisNote([m]),
      months: [m],
      branches,
    }));
  } else if (o.grain === "quarter") {
    buckets = [1, 2, 3, 4]
      .map((q) => {
        const ms = range(q * 3 - 2, q * 3).filter((m) => m >= o.from && m <= o.to);
        const partial = ms.length < 3 ? `${MONTHS[ms[0] - 1]}–${MONTHS[ms[ms.length - 1] - 1]} · ` : "";
        return { key: `q${q}`, label: `Q${q} ${PL_YEAR}`, sublabel: partial + basisNote(ms), months: ms, branches };
      })
      .filter((c) => c.months.length > 0);
  } else {
    buckets = [];
  }

  const total: Col = {
    key: "total",
    label: o.grain === "year" ? String(PL_YEAR) : "Total",
    sublabel: `${MONTHS[o.from - 1]}–${MONTHS[o.to - 1]} · ${basisNote(months)}`,
    months,
    branches,
  };
  return buckets.length > 1 ? [...buckets, total] : [total];
}

// ---------------------------------------------------------------- amounts
type Amounts = Record<string, number>;

function acctAmounts(code: string, cols: Col[], sign = 1): Amounts {
  const out: Amounts = {};
  for (const c of cols) {
    let t = 0;
    for (const b of c.branches) {
      const arr = PL_2026[b][code];
      if (arr) for (const m of c.months) t += arr[m - 1];
    }
    out[c.key] = t * sign;
  }
  return out;
}

const add = (cols: Col[], ...sets: Amounts[]): Amounts =>
  Object.fromEntries(cols.map((c) => [c.key, sets.reduce((t, s) => t + (s[c.key] ?? 0), 0)]));
const sub = (cols: Col[], a: Amounts, b: Amounts): Amounts =>
  Object.fromEntries(cols.map((c) => [c.key, (a[c.key] ?? 0) - (b[c.key] ?? 0)]));
const isZero = (cols: Col[], a: Amounts) => cols.every((c) => Math.round(a[c.key] ?? 0) === 0);

// ---------------------------------------------------------------- lines
const section = (id: string, label: string, depth: number, spaceBefore: boolean): ReportLine => ({
  id,
  label,
  kind: "section",
  depth,
  values: {},
  spaceBefore,
});
const total = (
  id: string,
  label: string,
  values: Amounts,
  kind: "subtotal" | "total" | "grandTotal",
  depth = 0,
  spaceBefore = false,
): ReportLine => ({ id, label, kind, depth, values, spaceBefore });

/** Account rows with any activity in the selected columns (all-zero accounts are hidden). */
function accountRows(accts: Acct[], cols: Col[], depth: number) {
  const rows: ReportLine[] = [];
  const amounts: Amounts[] = [];
  for (const a of accts) {
    const v = acctAmounts(a.code, cols, a.sign ?? 1);
    amounts.push(v);
    if (!isZero(cols, v)) {
      rows.push({ id: `a${a.code}`, label: a.name, kind: "account", depth, accountCode: a.code, values: v });
    }
  }
  return { rows, total: add(cols, ...amounts) };
}

// ---------------------------------------------------------------- report
export function getIncomeStatement(o: IncomeStatementOptions = DEFAULT_OPTIONS): Report {
  const cols = buildColumns(o);
  const detail = !o.summary;
  const lines: ReportLine[] = [];

  const rev = accountRows(REVENUE, cols, 1);
  lines.push(section("rev", "Revenue", 0, false));
  if (detail) lines.push(...rev.rows);
  lines.push(total("t-rev", "Total revenue", rev.total, "subtotal"));

  const cogs = accountRows(COGS, cols, 1);
  lines.push(section("cogs", "Cost of goods sold", 0, true));
  if (detail) lines.push(...cogs.rows);
  lines.push(total("t-cogs", "Total cost of goods sold", cogs.total, "subtotal"));

  const gp = sub(cols, rev.total, cogs.total);
  lines.push(total("gp", "Gross profit", gp, "total", 0, true));

  lines.push(section("opex", "Operating expenses", 0, true));
  const groupTotals: Amounts[] = [];
  for (const g of OPEX) {
    const r = accountRows(g.accounts, cols, 2);
    groupTotals.push(r.total);
    if (isZero(cols, r.total)) continue;
    if (detail) {
      lines.push(section(`g${g.id}`, g.name, 1, false), ...r.rows);
      lines.push(total(`t${g.id}`, `Total ${g.name.toLowerCase()}`, r.total, "subtotal", 1));
    } else {
      lines.push({ id: `t${g.id}`, label: g.name, kind: "account", depth: 1, values: r.total });
    }
  }
  const opex = add(cols, ...groupTotals);
  lines.push(total("t-opex", "Total operating expenses", opex, "subtotal"));

  const opInc = sub(cols, gp, opex);
  lines.push(total("op-inc", "Operating income (loss)", opInc, "total", 0, true));

  const other = accountRows(OTHER, cols, 1);
  if (!isZero(cols, other.total) || other.rows.length > 0) {
    lines.push(section("other", "Other income (expense)", 0, true));
    if (detail) lines.push(...other.rows);
    lines.push(total("t-other", "Total other income (expense), net", other.total, "subtotal"));
  }

  const pretax = add(cols, opInc, other.total);
  lines.push(total("pretax", "Income (loss) before income taxes", pretax, "grandTotal", 0, true));

  // Gross margin (%) row for each column
  const gm: Record<string, number | null> = {};
  for (const c of cols) gm[c.key] = rev.total[c.key] ? gp[c.key] / rev.total[c.key] : null;

  return {
    title: o.summary ? "Income Statement (summary)" : "Income Statement",
    entity: entityLabel(o.view),
    periodLabel: periodLabel(o),
    basis: "Accrual basis · 2026 P&L workbook",
    isSample: false,
    columns: cols.map<ReportColumn>((c) => ({ key: c.key, label: c.label, sublabel: c.sublabel, kind: "amount" })),
    lines,
    checks: checks(o, cols, gm),
  };
}

function entityLabel(v: BranchView) {
  if (v === "ALL") return "Chicago Brass Inc. · Consolidated";
  if (v === "BY_BRANCH") return "Chicago Brass Inc. · By branch";
  return `Chicago Brass Inc. · ${BRANCHES.find((b) => b.code === v)?.name} branch`;
}

function periodLabel(o: IncomeStatementOptions) {
  const last = new Date(PL_YEAR, o.to, 0).getDate();
  if (o.from === o.to) return `For the month ended ${MONTHS_LONG[o.to - 1]} ${last}, ${PL_YEAR}`;
  return `For the period ${MONTHS_LONG[o.from - 1]} 1 to ${MONTHS_LONG[o.to - 1]} ${last}, ${PL_YEAR}`;
}

function checks(o: IncomeStatementOptions, cols: Col[], gm: Record<string, number | null>): ReportCheck[] {
  const out: ReportCheck[] = [];
  const months = range(o.from, o.to);

  // Branch roll-up vs the Overall P&L (consolidated views only)
  if (o.view === "ALL" || o.view === "BY_BRANCH") {
    const all: Col[] = months.map((m) => ({
      key: `m${m}`, label: "", sublabel: "", months: [m], branches: BRANCHES.map((b) => b.code),
    }));
    const rolled = (() => {
      const r = accountRows([...REVENUE], all, 0).total;
      const c = accountRows(COGS, all, 0).total;
      const ox = add(all, ...OPEX.map((g) => accountRows(g.accounts, all, 0).total));
      const ot = accountRows(OTHER, all, 0).total;
      return add(all, sub(all, sub(all, r, c), ox), ot);
    })();
    // The Overall P&L omits misc income, so compare before it; allow $5 rounding.
    const misc = acctAmounts("7400", all);
    const off = months
      .map((m) => ({ m, d: rolled[`m${m}`] - misc[`m${m}`] - REPORTED_CONSOLIDATED_NOI[m - 1] }))
      .filter((x) => Math.abs(x.d) > 5);
    out.push({
      label: "Ties to Overall P&L",
      ok: off.length === 0,
      detail:
        off.length === 0
          ? "Branches add up to the Overall P&L (within $5 rounding)"
          : off.map((x) => `${MONTHS[x.m - 1]} differs by $${formatAmount(Math.abs(x.d))}`).join("; "),
    });
  }

  if (months.some((m) => m > ACTUAL_THROUGH_MONTH)) {
    out.push({ label: "Forecast", ok: true, detail: `${MONTHS[ACTUAL_THROUGH_MONTH]}–Dec are forecast, not actuals` });
  }

  const tot = cols.find((c) => c.key === "total") ?? cols[cols.length - 1];
  const g = gm[tot.key];
  if (g != null) out.push({ label: "Gross margin", ok: true, detail: `${(g * 100).toFixed(1)}% for ${tot.label}` });

  out.push({
    label: "Income taxes",
    ok: false,
    detail: "No income tax provision recorded (ASC 740); bottom line is pre-tax",
  });
  return out;
}
