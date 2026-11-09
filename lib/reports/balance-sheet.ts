import { cleanDate, todayChicago } from "../dates";
import type { Report } from "./types";
import { accountCents, accountGroup, amountLine, formatDate, monthEnd, monthStart, one, periodHeading, section, subtractAmounts, sumAmounts } from "./report-utils";
import type { AccountBalance, Period, Snapshot } from "./report-utils";

export type BalanceSheetOptions = { asOf: string; grain: "single" | "month" | "quarter" | "year"; summary: boolean };

export function parseBalanceSheetParams(sp: Record<string, string | string[] | undefined>, today = todayChicago()): BalanceSheetOptions {
  const date = cleanDate(sp.asof, today), grain = one(sp.grain);
  return { asOf: Number(date.slice(0, 4)) >= 1900 ? date : today, grain: grain === "month" || grain === "quarter" || grain === "year" ? grain : "single", summary: one(sp.layout) === "summary" };
}

export function balanceSheetPeriods(options: BalanceSheetOptions): Period[] {
  const year = Number(options.asOf.slice(0, 4)), dates: string[] = [];
  if (options.grain === "year") {
    dates.push(`${year - 2}-12-31`, `${year - 1}-12-31`);
  } else if (options.grain !== "single") {
    const step = options.grain === "month" ? 1 : 3;
    for (let month = step; month <= 12; month += step) {
      const end = monthEnd(year, month);
      if (end < options.asOf) dates.push(end);
    }
  }
  dates.push(options.asOf);
  return dates.map((date, index) => ({ key: `p${index}`, label: formatDate(date), from: monthStart(Number(date.slice(0, 4)), 1), to: date }));
}

export function getBalanceSheet(options: BalanceSheetOptions, snapshots: Snapshot[], priorYears: ReadonlyMap<number, AccountBalance[]>, posted: number): Report {
  const accounts = snapshots[snapshots.length - 1].accounts, keys = snapshots.map(snapshot => snapshot.period.key);
  const group = (id: string, label: string, rows: AccountBalance[], creditPositive: boolean, depth = 2) => accountGroup(id, label, rows, snapshots, { creditPositive, summary: options.summary, depth });
  const assets = accounts.filter(row => row.account_type === "asset"), liabilities = accounts.filter(row => row.account_type === "liability");
  // Follow mae/testing's account families while keeping the live catalog's account types authoritative.
  const assetGroup = (row: AccountBalance) => {
    if (row.account_number === "121.200") return "bank";
    if (row.account_number === "121.900") return "receivable";
    if (row.account_number.startsWith("122.")) return "other-receivable";
    if (row.account_number === "161.000") return "depreciation";
    if (row.account_number === "143.200") return "deposit";
    return row.account_subtype;
  };
  const currentAssetGroups = [
    group("cash", "Cash and cash equivalents", assets.filter(row => assetGroup(row) === "bank"), false),
    group("receivables", "Accounts receivable, net", assets.filter(row => assetGroup(row) === "receivable"), false),
    group("other-receivables", "Other receivables", assets.filter(row => assetGroup(row) === "other-receivable"), false),
    group("inventory", "Inventory", assets.filter(row => assetGroup(row) === "inventory"), false),
    group("prepaid", "Prepaid expenses and deposits", assets.filter(row => assetGroup(row) === "prepaid"), false),
  ];
  const fixedGroups = [
    group("property", "Property and equipment, at cost", assets.filter(row => assetGroup(row) === "fixed_asset"), false),
    group("depreciation", "Accumulated depreciation", assets.filter(row => assetGroup(row) === "depreciation"), false),
  ];
  const otherAssetGroups = [
    group("deposits", "Deposits", assets.filter(row => assetGroup(row) === "deposit"), false),
    group("other-assets", "Other asset accounts", assets.filter(row => !["bank", "receivable", "other-receivable", "inventory", "prepaid", "fixed_asset", "depreciation", "deposit"].includes(assetGroup(row) ?? "")), false),
  ];
  const liabilityGroup = (row: AccountBalance) => {
    if (row.account_number.startsWith("232.")) return "long-term";
    if (row.account_number.startsWith("242.") || row.account_subtype === "credit_card" || row.account_number === "231.200") return "other-current";
    return row.account_subtype;
  };
  const currentLiabilityLabels = { payable: "Accounts payable", customer_funds: "Customer deposits and credits", tax_payable: "Sales tax payable", accrued_payroll: "Accrued payroll and benefits", "other-current": "Other current liabilities" };
  const currentLiabilityGroups = Object.entries(currentLiabilityLabels).map(([subtype, label]) => group(subtype, label, liabilities.filter(row => liabilityGroup(row) === subtype), true, 3));
  const longTermGroups = [group("long-term-debt", "Notes and loans payable", liabilities.filter(row => liabilityGroup(row) === "long-term"), true, 3)];
  const otherLiabilities = group("other-liabilities", "Other liabilities", liabilities.filter(row => liabilityGroup(row) !== "long-term" && !Object.hasOwn(currentLiabilityLabels, liabilityGroup(row) ?? "")), true, 2);
  const block = (id: string, label: string, totalLabel: string, groups: ReturnType<typeof group>[], depth = 1) => {
    const total = sumAmounts(keys, ...groups.map(item => item.total));
    return { total, lines: [section(`s-${id}`, label, depth), ...groups.flatMap(item => item.lines), amountLine(`t-${id}`, totalLabel, total, "subtotal", depth)] };
  };
  const assetBlocks = [
    block("current-assets", "Current assets", "Total current assets", currentAssetGroups),
    block("fixed", "Property and equipment", "Property and equipment, net", fixedGroups),
    block("other-asset-block", "Other assets", "Total other assets", otherAssetGroups),
  ];
  const liabilityBlocks = [
    block("current-liabilities", "Current liabilities", "Total current liabilities", currentLiabilityGroups, 2),
    block("long-term-liabilities", "Long-term liabilities", "Total long-term liabilities", longTermGroups, 2),
  ];
  const equity = group("equity", "Equity accounts", accounts.filter(row => row.account_type === "equity"), true);
  const netEarnings = (rows: AccountBalance[]) => rows.filter(row => row.account_type === "revenue" || row.account_type === "expense").reduce((sum, row) => sum + accountCents(row, true), 0);
  const priorEarnings = Object.fromEntries(snapshots.map(snapshot => {
    const year = Number(snapshot.period.to.slice(0, 4)), rows = priorYears.get(year);
    if (!rows) throw new Error(`Missing prior-year balances for ${year}.`);
    return [snapshot.period.key, netEarnings(rows)];
  }));
  const currentEarnings = Object.fromEntries(snapshots.map(snapshot => [snapshot.period.key, netEarnings(snapshot.accounts) - priorEarnings[snapshot.period.key]]));
  const assetTotals = sumAmounts(keys, ...assetBlocks.map(item => item.total)), liabilityTotals = sumAmounts(keys, ...liabilityBlocks.map(item => item.total), otherLiabilities.total);
  const equityTotals = sumAmounts(keys, equity.total, priorEarnings, currentEarnings), totalLE = sumAmounts(keys, liabilityTotals, equityTotals);
  const differences = subtractAmounts(keys, assetTotals, totalLE), balanced = Object.values(differences).every(value => value === 0);
  return {
    title: options.summary ? "Balance Sheet (summary)" : "Balance Sheet", entity: "Chicago Brass Inc. - Consolidated",
    periodLabel: `As of ${formatDate(options.asOf)} - all posted activity to date`, basis: "Accrual basis - Posted ledger actuals",
    columns: snapshots.map(({ period }) => {
      let sublabel: string | undefined;
      if (options.grain === "year") sublabel = formatDate(period.to).replace(/, \d{4}$/, "");
      else if (options.grain !== "single") {
        const completeMonth = period.to === monthEnd(Number(period.to.slice(0, 4)), Number(period.to.slice(5, 7)));
        sublabel = completeMonth ? period.to.slice(0, 4) : formatDate(period.to);
      }
      return { key: period.key, label: periodHeading(period.to, options.grain), sublabel, kind: "amount" as const };
    }),
    lines: [
      section("assets", "Assets", 0, false), ...assetBlocks.flatMap(item => item.lines), amountLine("total-assets", "Total assets", assetTotals, "grandTotal", 0, true),
      section("liabilities-equity", "Liabilities and stockholders' equity"),
      section("liabilities", "Liabilities", 1), ...liabilityBlocks.flatMap(item => item.lines), ...otherLiabilities.lines, amountLine("total-liabilities", "Total liabilities", liabilityTotals, "subtotal", 1),
      section("equity-heading", "Stockholders' equity", 1), ...equity.lines,
      amountLine("prior-earnings", "Prior-year earnings not closed to equity", priorEarnings, "account", 2),
      amountLine("current-earnings", "Current-year earnings (net income)", currentEarnings, "account", 2),
      amountLine("total-equity", "Total stockholders' equity", equityTotals, "subtotal", 1), amountLine("total-le", "Total liabilities and stockholders' equity", totalLE, "grandTotal", 0, true),
    ],
    isSample: false,
    checks: [
      { label: "Balances", ok: balanced, detail: balanced ? "Assets = Liabilities + Equity" : snapshots.filter(snapshot => differences[snapshot.period.key] !== 0).map(snapshot => `${snapshot.period.label}: out by $${(Math.abs(differences[snapshot.period.key]) / 100).toFixed(2)}`).join("; ") },
      { label: "Posted entries", ok: true, detail: `${posted} to the selected date` },
    ],
  };
}
