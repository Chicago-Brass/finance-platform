/**
 * SAMPLE DATA ONLY: invented figures for layout review.
 * Do not replace with real numbers before Gate G1 (Vercel Pro + Supabase backups).
 * In Stage 3 these functions are replaced by queries against ledger views
 * that return the same Report shape.
 */
import type { Report, ReportColumn } from "./types";
import { type Acct, accountLines, diff, sectionLine, sum, totalLine, withVariance } from "./build";

const ENTITY = "Chicago Brass Inc.";
const IS_KEYS = ["cur", "prior", "ytd"];
const BS_KEYS = ["cur", "prior"];

const a = (code: string, name: string, cur: number, prior: number, ytd?: number): Acct => ({
  code,
  name,
  amounts: ytd === undefined ? { cur, prior } : { cur, prior, ytd },
});

// ---------- Income statement ----------
const revenue = [
  a("4000", "Product sales", 1_842_500, 1_765_300, 15_904_200),
  a("4100", "Installation & service revenue", 126_400, 118_900, 1_086_700),
  a("4900", "Sales returns & allowances", -18_200, -15_700, -151_300),
];
const cogs = [
  a("5000", "Raw materials (brass, copper, zinc)", 742_300, 713_800, 6_421_500),
  a("5100", "Direct labor", 268_900, 261_400, 2_357_800),
  a("5200", "Manufacturing overhead", 154_700, 149_200, 1_352_600),
  a("5300", "Freight in", 31_500, 29_800, 268_400),
];
const opex = [
  a("6000", "Salaries, wages & benefits", 214_600, 212_300, 1_921_700),
  a("6100", "Rent & occupancy", 48_000, 48_000, 432_000),
  a("6200", "Utilities", 22_800, 21_100, 196_500),
  a("6300", "Insurance", 15_400, 15_400, 138_600),
  a("6400", "Professional fees", 12_750, 9_800, 104_300),
  a("6500", "Depreciation", 27_300, 27_300, 245_700),
  a("6600", "Sales & marketing", 18_900, 22_400, 171_200),
  a("6700", "Office & administrative", 11_200, 10_600, 98_400),
];
const other = [
  a("7000", "Interest expense", -8_600, -8_900, -80_100),
  a("7100", "Other income", 2_100, 1_400, 14_800),
];

function incomeStatementTotals() {
  const netRevenue = sum(IS_KEYS, ...revenue.map((x) => x.amounts));
  const totalCogs = sum(IS_KEYS, ...cogs.map((x) => x.amounts));
  const grossProfit = diff(IS_KEYS, netRevenue, totalCogs);
  const totalOpex = sum(IS_KEYS, ...opex.map((x) => x.amounts));
  const operatingIncome = diff(IS_KEYS, grossProfit, totalOpex);
  const totalOther = sum(IS_KEYS, ...other.map((x) => x.amounts));
  const pretax = sum(IS_KEYS, operatingIncome, totalOther);
  const tax = Object.fromEntries(IS_KEYS.map((k) => [k, Math.round(pretax[k] * 0.25)]));
  const netIncome = diff(IS_KEYS, pretax, tax);
  return { netRevenue, totalCogs, grossProfit, totalOpex, operatingIncome, totalOther, pretax, tax, netIncome };
}

const IS_COLUMNS: ReportColumn[] = [
  { key: "cur", label: "Sep 2026", sublabel: "Current month", kind: "amount" },
  { key: "prior", label: "Aug 2026", sublabel: "Prior month", kind: "amount" },
  { key: "chg", label: "Change", sublabel: "$", kind: "amount" },
  { key: "pct", label: "Change", sublabel: "%", kind: "percent" },
  { key: "ytd", label: "YTD 2026", sublabel: "Jan to Sep", kind: "amount" },
];

export function getIncomeStatement(): Report {
  const t = incomeStatementTotals();
  const lines = withVariance(
    [
      sectionLine("rev", "Revenue", false),
      ...accountLines(revenue),
      totalLine("net-rev", "Net revenue", t.netRevenue, "subtotal"),
      sectionLine("cogs", "Cost of goods sold"),
      ...accountLines(cogs),
      totalLine("total-cogs", "Total cost of goods sold", t.totalCogs, "subtotal"),
      totalLine("gp", "Gross profit", t.grossProfit, "total", 0, true),
      sectionLine("opex", "Operating expenses"),
      ...accountLines(opex),
      totalLine("total-opex", "Total operating expenses", t.totalOpex, "subtotal"),
      totalLine("op-inc", "Operating income", t.operatingIncome, "total", 0, true),
      sectionLine("other", "Other income (expense)"),
      ...accountLines(other),
      totalLine("total-other", "Total other income (expense)", t.totalOther, "subtotal"),
      totalLine("pretax", "Income before income taxes", t.pretax, "total", 0, true),
      { ...accountLines([a("8000", "Income tax expense", t.tax.cur, t.tax.prior, t.tax.ytd)], 0)[0] },
      totalLine("ni", "Net income", t.netIncome, "grandTotal", 0, true),
    ],
    "cur",
    "prior",
  );

  const gm = t.grossProfit.cur / t.netRevenue.cur;
  return {
    title: "Income Statement",
    entity: ENTITY,
    periodLabel: "For the month ended September 30, 2026",
    basis: "Accrual basis",
    isSample: true,
    columns: IS_COLUMNS,
    lines,
    checks: [
      {
        label: "Gross margin",
        ok: true,
        detail: `${(gm * 100).toFixed(1)}% this month`,
      },
    ],
  };
}

// ---------- Balance sheet ----------
const currentAssetsExCash = [
  a("1100", "Accounts receivable", 2_146_800, 2_071_500),
  a("1150", "Allowance for doubtful accounts", -64_400, -62_100),
  a("1200", "Inventory: raw materials", 1_318_200, 1_402_700),
  a("1210", "Inventory: work in process", 286_500, 271_900),
  a("1220", "Inventory: finished goods", 942_300, 905_600),
  a("1300", "Prepaid expenses", 74_200, 81_900),
];
const fixedAssets = [
  a("1500", "Land & building", 2_450_000, 2_450_000),
  a("1510", "Machinery & equipment", 3_862_500, 3_815_000),
  a("1520", "Vehicles", 214_000, 214_000),
  a("1590", "Accumulated depreciation", -2_931_400, -2_904_100),
];
const currentLiabilities = [
  a("2000", "Accounts payable", 1_028_700, 1_094_200),
  a("2100", "Accrued payroll", 186_300, 171_800),
  a("2150", "Accrued liabilities, other", 92_400, 88_700),
  a("2200", "Line of credit", 400_000, 450_000),
  a("2300", "Current portion of long-term debt", 240_000, 240_000),
];
const longTermLiabilities = [a("2500", "Long-term debt, net of current portion", 1_560_000, 1_580_000)];

export function getBalanceSheet(): Report {
  const is = incomeStatementTotals();
  const cye = { cur: is.netIncome.ytd, prior: is.netIncome.ytd - is.netIncome.cur };
  const equityAccts = [
    a("3000", "Common stock", 500_000, 500_000),
    a("3100", "Retained earnings, beginning of year", 3_250_000, 3_250_000),
    a("3900", "Current-year earnings", cye.cur, cye.prior),
  ];

  const totalCurLiab = sum(BS_KEYS, ...currentLiabilities.map((x) => x.amounts));
  const totalLtLiab = sum(BS_KEYS, ...longTermLiabilities.map((x) => x.amounts));
  const totalLiab = sum(BS_KEYS, totalCurLiab, totalLtLiab);
  const totalEquity = sum(BS_KEYS, ...equityAccts.map((x) => x.amounts));
  const totalLiabEquity = sum(BS_KEYS, totalLiab, totalEquity);

  // Sample data: cash is derived so the sample balances. Real data will not do this.
  const otherAssets = sum(BS_KEYS, ...[...currentAssetsExCash, ...fixedAssets].map((x) => x.amounts));
  const cashAmt = diff(BS_KEYS, totalLiabEquity, otherAssets);
  const cash = a("1000", "Cash & cash equivalents", cashAmt.cur, cashAmt.prior);

  const currentAssets = [cash, ...currentAssetsExCash];
  const totalCurAssets = sum(BS_KEYS, ...currentAssets.map((x) => x.amounts));
  const netFixed = sum(BS_KEYS, ...fixedAssets.map((x) => x.amounts));
  const totalAssets = sum(BS_KEYS, totalCurAssets, netFixed);
  const outOfBalance = diff(BS_KEYS, totalAssets, totalLiabEquity);

  const lines = withVariance(
    [
      sectionLine("assets", "Assets", false),
      sectionLine("ca", "Current assets", false),
      ...accountLines(currentAssets, 2),
      totalLine("tca", "Total current assets", totalCurAssets, "subtotal", 1),
      sectionLine("fa", "Property, plant & equipment"),
      ...accountLines(fixedAssets, 2),
      totalLine("nfa", "Net property, plant & equipment", netFixed, "subtotal", 1),
      totalLine("ta", "Total assets", totalAssets, "grandTotal", 0, true),
      sectionLine("le", "Liabilities and equity"),
      sectionLine("cl", "Current liabilities", false),
      ...accountLines(currentLiabilities, 2),
      totalLine("tcl", "Total current liabilities", totalCurLiab, "subtotal", 1),
      sectionLine("ltl", "Long-term liabilities"),
      ...accountLines(longTermLiabilities, 2),
      totalLine("tl", "Total liabilities", totalLiab, "total", 1, true),
      sectionLine("eq", "Stockholders' equity"),
      ...accountLines(equityAccts, 2),
      totalLine("te", "Total stockholders' equity", totalEquity, "subtotal", 1),
      totalLine("tle", "Total liabilities and equity", totalLiabEquity, "grandTotal", 0, true),
    ],
    "cur",
    "prior",
  );

  return {
    title: "Balance Sheet",
    entity: ENTITY,
    periodLabel: "As of September 30, 2026",
    basis: "Accrual basis",
    isSample: true,
    columns: [
      { key: "cur", label: "Sep 30, 2026", sublabel: "Current", kind: "amount" },
      { key: "prior", label: "Aug 31, 2026", sublabel: "Prior month", kind: "amount" },
      { key: "chg", label: "Change", sublabel: "$", kind: "amount" },
      { key: "pct", label: "Change", sublabel: "%", kind: "percent" },
    ],
    lines,
    checks: BS_KEYS.map((k) => ({
      label: k === "cur" ? "Balances (Sep 30)" : "Balances (Aug 31)",
      ok: outOfBalance[k] === 0,
      detail: outOfBalance[k] === 0 ? "Assets = Liabilities + Equity" : `Out of balance by ${outOfBalance[k]}`,
    })),
  };
}
