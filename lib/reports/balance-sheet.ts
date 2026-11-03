import { cleanDate, todayChicago } from "../dates";
import type { Report } from "./types";
import { accountCents, accountGroup, amountLine, formatDate, monthEnd, monthStart, one, section, subtractAmounts, sumAmounts } from "./report-utils";
import type { AccountBalance, Period, Snapshot } from "./report-utils";

export type BalanceSheetOptions = { asOf: string; grain: "single" | "month" | "quarter"; summary: boolean };

export function parseBalanceSheetParams(sp: Record<string, string | string[] | undefined>, today = todayChicago()): BalanceSheetOptions {
  const date = cleanDate(sp.asof, today), grain = one(sp.grain);
  return { asOf: Number(date.slice(0, 4)) >= 1900 ? date : today, grain: grain === "month" || grain === "quarter" ? grain : "single", summary: one(sp.layout) === "summary" };
}

export function balanceSheetPeriods(options: BalanceSheetOptions): Period[] {
  const year = Number(options.asOf.slice(0, 4)), dates: string[] = [];
  if (options.grain !== "single") {
    const step = options.grain === "month" ? 1 : 3;
    for (let month = step; month <= 12; month += step) {
      const end = monthEnd(year, month);
      if (end < options.asOf) dates.push(end);
    }
  }
  dates.push(options.asOf);
  return dates.map((date, index) => ({ key: `p${index}`, label: formatDate(date), from: monthStart(year, 1), to: date }));
}

export function getBalanceSheet(options: BalanceSheetOptions, snapshots: Snapshot[], priorYear: AccountBalance[], posted: number): Report {
  const accounts = snapshots[snapshots.length - 1].accounts, keys = snapshots.map(snapshot => snapshot.period.key);
  const group = (id: string, label: string, rows: AccountBalance[], creditPositive: boolean) => accountGroup(id, label, rows, snapshots, { creditPositive, summary: options.summary, depth: 1 });
  const assets = accounts.filter(row => row.account_type === "asset"), liabilities = accounts.filter(row => row.account_type === "liability");
  const assetGroup = (row: AccountBalance) => row.account_number === "121.900" ? "receivable" : row.account_number === "161.000" ? "fixed_asset" : row.account_subtype;
  const assetGroups = [
    group("cash", "Cash and cash equivalents", assets.filter(row => assetGroup(row) === "bank"), false),
    group("receivables", "Receivables, net", assets.filter(row => assetGroup(row) === "receivable"), false),
    group("inventory", "Inventory", assets.filter(row => assetGroup(row) === "inventory"), false),
    group("prepaid", "Prepayments and vendor deposits", assets.filter(row => assetGroup(row) === "prepaid"), false),
    group("fixed", "Property and equipment, net", assets.filter(row => assetGroup(row) === "fixed_asset"), false),
    group("other-assets", "Other assets", assets.filter(row => !["bank", "receivable", "inventory", "prepaid", "fixed_asset"].includes(assetGroup(row) ?? "")), false),
  ];
  const liabilityLabels: Record<string, string> = { payable: "Accounts payable", customer_funds: "Customer deposits and credits", tax_payable: "Taxes payable", accrued_payroll: "Accrued payroll and benefits", credit_card: "Credit card payable", debt: "Loans and credit facilities" };
  const liabilityGroups = Object.entries(liabilityLabels).map(([subtype, label]) => group(subtype, label, liabilities.filter(row => row.account_subtype === subtype), true));
  liabilityGroups.push(group("other-liabilities", "Other liabilities", liabilities.filter(row => !Object.hasOwn(liabilityLabels, row.account_subtype ?? "")), true));
  const equity = group("equity", "Equity accounts", accounts.filter(row => row.account_type === "equity"), true);
  const netEarnings = (rows: AccountBalance[]) => rows.filter(row => row.account_type === "revenue" || row.account_type === "expense").reduce((sum, row) => sum + accountCents(row, true), 0);
  const previous = netEarnings(priorYear);
  const priorEarnings = Object.fromEntries(keys.map(key => [key, previous]));
  const currentEarnings = Object.fromEntries(snapshots.map(snapshot => [snapshot.period.key, netEarnings(snapshot.accounts) - previous]));
  const assetTotals = sumAmounts(keys, ...assetGroups.map(item => item.total)), liabilityTotals = sumAmounts(keys, ...liabilityGroups.map(item => item.total));
  const equityTotals = sumAmounts(keys, equity.total, priorEarnings, currentEarnings), totalLE = sumAmounts(keys, liabilityTotals, equityTotals);
  const differences = subtractAmounts(keys, assetTotals, totalLE), balanced = Object.values(differences).every(value => value === 0);
  return {
    title: options.summary ? "Balance Sheet (summary)" : "Balance Sheet", entity: "Chicago Brass Inc. - Consolidated",
    periodLabel: `As of ${formatDate(options.asOf)} - all posted activity to date`, basis: "Accrual basis - Posted ledger actuals", isSample: false,
    columns: snapshots.map(snapshot => ({ key: snapshot.period.key, label: snapshot.period.label, kind: "amount" as const })),
    lines: [
      section("assets", "Assets", 0, false), ...assetGroups.flatMap(item => item.lines), amountLine("total-assets", "Total assets", assetTotals, "grandTotal", 0, true),
      section("liabilities", "Liabilities"), ...liabilityGroups.flatMap(item => item.lines), amountLine("total-liabilities", "Total liabilities", liabilityTotals, "subtotal"),
      section("equity-heading", "Stockholders' equity"), ...equity.lines,
      amountLine("prior-earnings", "Prior-year earnings not closed to equity", priorEarnings, "account", 1),
      amountLine("current-earnings", "Current-year earnings (net income)", currentEarnings, "account", 1),
      amountLine("total-equity", "Total stockholders' equity", equityTotals, "subtotal"), amountLine("total-le", "Total liabilities and stockholders' equity", totalLE, "grandTotal", 0, true),
    ],
    checks: [
      { label: "Balances", ok: balanced, detail: balanced ? "Assets = Liabilities + Equity" : snapshots.filter(snapshot => differences[snapshot.period.key] !== 0).map(snapshot => `${snapshot.period.label}: out by $${(Math.abs(differences[snapshot.period.key]) / 100).toFixed(2)}`).join("; ") },
      { label: "Posted entries", ok: true, detail: `${posted} to the selected date` },
    ],
  };
}
