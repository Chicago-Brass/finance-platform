import { branchLabel, branchParam } from "./branch";
import { todayChicago } from "../dates";
import type { Report, ReportCheck, ReportLine } from "./types";
import { accountGroup, amountLine, formatDate, monthEnd, monthStart, one, periodHeading, section, subtractAmounts, sumAmounts } from "./report-utils";
import type { Period, Snapshot } from "./report-utils";

export type IncomeStatementOptions = { branch?: string; year: number; from: number; to: number; grain: "month" | "quarter" | "year"; summary: boolean };

export function parseIncomeStatementParams(sp: Record<string, string | string[] | undefined>, today = todayChicago()): IncomeStatementOptions {
  const year = Number(one(sp.year));
  const month = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : fallback;
  };
  const selectedYear = Number.isInteger(year) && year >= 1900 && year <= 9999 ? year : Number(today.slice(0, 4));
  let from = month(one(sp.from), 1);
  let to = month(one(sp.to), selectedYear === Number(today.slice(0, 4)) ? Number(today.slice(5, 7)) : 12);
  if (from > to) [from, to] = [to, from];
  const grain = one(sp.grain);
  return { branch: branchParam(one(sp.branch)), year: selectedYear, from, to, grain: grain === "quarter" || grain === "year" ? grain : "month", summary: one(sp.layout) === "summary" };
}

export function incomeStatementPeriods(options: IncomeStatementOptions): Period[] {
  const result: Period[] = [];
  const step = options.grain === "month" ? 1 : options.grain === "quarter" ? 3 : 12;
  for (let first = 1; first <= 12; first += step) {
    const from = Math.max(first, options.from), to = Math.min(first + step - 1, options.to);
    if (from > to) continue;
    let label = String(options.year);
    if (options.grain === "quarter") label = `Q${Math.ceil(first / 3)} ${options.year}`;
    if (options.grain === "month") label = new Date(`${monthStart(options.year, from)}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
    result.push({ key: `p${first}`, label, from: monthStart(options.year, from), to: monthEnd(options.year, to) });
  }
  return result;
}

export function getIncomeStatement(options: IncomeStatementOptions, snapshots: Snapshot[], posted: number): Report {
  const accounts = snapshots[snapshots.length - 1].accounts;
  const includeTotal = snapshots.length > 1;
  const keys = snapshots.map(snapshot => snapshot.period.key).concat(includeTotal ? ["total"] : []);
  const expense = accounts.filter(row => row.account_type === "expense");
  const revenue = accounts.filter(row => row.account_type === "revenue");
  const group = (id: string, label: string, rows: typeof accounts, creditPositive: boolean, depth = 0) => accountGroup(id, label, rows, snapshots, { creditPositive, summary: options.summary, depth, includeTotal });
  const sales = group("revenue", "Revenue", revenue.filter(row => row.account_subtype !== "other_income"), true);
  const cogs = group("cogs", "Cost of goods sold", expense.filter(row => row.account_number !== "007.003" && ["cogs", "contra_cogs"].includes(row.account_subtype ?? "")), false);
  const operating = expense.filter(row => !["cogs", "contra_cogs", "income_tax", "other_expense"].includes(row.account_subtype ?? "") && row.account_number !== "007.003");
  const operatingGroups = [
    group("personnel", "Personnel", operating.filter(row => row.account_subtype === "payroll"), false, 1),
    group("occupancy", "Occupancy", operating.filter(row => row.account_subtype !== "payroll" && row.account_number.startsWith("006.")), false, 1),
    group("finance", "Finance and administrative", operating.filter(row => row.account_subtype !== "payroll" && row.account_number.startsWith("007.")), false, 1),
    group("technology", "Technology", operating.filter(row => row.account_subtype !== "payroll" && row.account_number.startsWith("008.")), false, 1),
    group("other-operating", "General operating", operating.filter(row => row.account_subtype !== "payroll" && !["006.", "007.", "008."].some(prefix => row.account_number.startsWith(prefix))), false, 1),
  ];
  const other = group("other", "Other income (expense)", [
    ...expense.filter(row => row.account_number === "007.003"),
    ...revenue.filter(row => row.account_subtype === "other_income"),
    ...expense.filter(row => row.account_number !== "007.003" && row.account_subtype === "other_expense"),
  ], true);
  const taxes = group("tax", "Income taxes", expense.filter(row => row.account_number !== "007.003" && row.account_subtype === "income_tax"), false);
  const grossProfit = subtractAmounts(keys, sales.total, cogs.total);
  const operatingExpenses = sumAmounts(keys, ...operatingGroups.map(item => item.total));
  const operatingIncome = subtractAmounts(keys, grossProfit, operatingExpenses);
  const pretax = sumAmounts(keys, operatingIncome, other.total);
  const netIncome = subtractAmounts(keys, pretax, taxes.total);
  const lines: ReportLine[] = [
    ...sales.lines, ...cogs.lines,
    amountLine("gross-profit", "Gross profit", grossProfit, "total", 0, true),
    section("operating", "Operating expenses"), ...operatingGroups.flatMap(item => item.lines),
    amountLine("total-operating", "Total operating expenses", operatingExpenses, "subtotal"),
    amountLine("operating-income", "Operating income (loss)", operatingIncome, "total", 0, true),
    ...other.lines,
    amountLine("pretax", "Income (loss) before income taxes", pretax, "total", 0, true),
    ...taxes.lines, amountLine("net-income", "Net income (loss)", netIncome, "grandTotal", 0, true),
  ];
  const checks: ReportCheck[] = [{ label: "Posted entries", ok: true, detail: `${posted} in this range` }];
  const totalKey = includeTotal ? "total" : keys[0];
  if (sales.total[totalKey]) checks.push({ label: "Gross margin", ok: true, detail: `${(grossProfit[totalKey] / sales.total[totalKey] * 100).toFixed(1)}% for the selected period` });
  return {
    title: options.summary ? "Income Statement (summary)" : "Income Statement", entity: `Chicago Brass Inc. - ${branchLabel(options.branch)}`,
    periodLabel: `${formatDate(snapshots[0].period.from)} to ${formatDate(snapshots[snapshots.length - 1].period.to)}`,
    basis: "Accrual basis - Posted ledger actuals",
    columns: snapshots.map(snapshot => ({ key: snapshot.period.key, label: periodHeading(snapshot.period.to, options.grain), sublabel: options.grain === "year" ? "Selected period" : String(options.year), kind: "amount" as const })).concat(includeTotal ? [{ key: "total", label: "Total", sublabel: "Selected period", kind: "amount" as const }] : []),
    lines, checks,
  };
}
