import type { Report } from "./types";
import { accountCents, cents, formatDate } from "./report-utils";
import type { AccountBalance, Period, Snapshot } from "./report-utils";

export type ReportAnalytics = {
  kind: "income" | "balance";
  asOf: string;
  headline: { label: string; value: number };
  composition: { title: string; items: { label: string; value: number }[] };
  secondary: { label: string; value: number; share: number | null };
  movement: {
    comparisonLabel: string;
    metrics: { label: string; value: number; previous: number }[];
    trendTitle: string;
    trend: { label: string; value: number }[];
  };
};

function dollars(value: number) {
  if (!Number.isSafeInteger(value)) throw new Error("Analytics amount exceeds supported cents precision.");
  return value / 100;
}

function reportAmount(report: Report, id: string, column?: string) {
  const key = column ?? (report.columns.some(item => item.key === "total") ? "total" : report.columns[report.columns.length - 1].key);
  const value = report.lines.find(line => line.id === id)?.values[key];
  if (typeof value !== "number") throw new Error(`Missing analytics amount: ${id}.`);
  return dollars(cents(value));
}

export function previousQuarterEnd(asOf: string) {
  const year = Number(asOf.slice(0, 4)), month = Number(asOf.slice(5, 7));
  return new Date(Date.UTC(year, Math.floor((month - 1) / 3) * 3, 0)).toISOString().slice(0, 10);
}

export function balanceAnalyticsDates(asOf: string, periods: Period[]) {
  if (periods.length > 1) return periods.map(period => period.to);
  const dates = [asOf];
  for (let index = 0; index < 3; index++) dates.unshift(previousQuarterEnd(dates[0]));
  return dates;
}

function balanceTotals(accounts: AccountBalance[]) {
  const total = (types: string[], creditPositive: boolean) => dollars(accounts.filter(row => types.includes(row.account_type)).reduce((sum, row) => sum + accountCents(row, creditPositive), 0));
  return {
    assets: total(["asset"], false),
    liabilities: total(["liability"], true),
    // Unclosed income belongs in equity just as it does in the Balance Sheet.
    equity: total(["equity", "revenue", "expense"], true),
  };
}

export function getBalanceAnalytics(report: Report, asOf: string, previousAccounts: AccountBalance[], trendSnapshots: Snapshot[]): ReportAnalytics {
  const assets = reportAmount(report, "total-assets"), liabilities = reportAmount(report, "total-liabilities"), equity = reportAmount(report, "total-equity"), cash = reportAmount(report, "t-cash");
  const previous = balanceTotals(previousAccounts);
  return {
    kind: "balance", asOf: formatDate(asOf),
    headline: { label: "Total assets", value: assets },
    composition: { title: "Funding mix", items: [{ label: "Liabilities", value: liabilities }, { label: "Equity", value: equity }] },
    secondary: { label: "Cash", value: cash, share: assets === 0 ? null : cash / assets },
    movement: {
      comparisonLabel: `Compared with ${formatDate(previousQuarterEnd(asOf))}`,
      metrics: [{ label: "Assets", value: assets, previous: previous.assets }, { label: "Liabilities", value: liabilities, previous: previous.liabilities }, { label: "Equity", value: equity, previous: previous.equity }],
      trendTitle: "Total assets",
      trend: trendSnapshots.map(snapshot => ({ label: formatDate(snapshot.period.to), value: balanceTotals(snapshot.accounts).assets })),
    },
  };
}

export function getIncomeAnalytics(report: Report, previousReport: Report): ReportAnalytics {
  const revenue = reportAmount(report, "t-revenue"), operating = reportAmount(report, "total-operating"), net = reportAmount(report, "net-income");
  const groups = [{ id: "t-personnel", label: "Personnel" }, { id: "t-occupancy", label: "Occupancy" }, { id: "t-finance", label: "Finance and administrative" }, { id: "t-technology", label: "Technology" }, { id: "t-other-operating", label: "General operating" }];
  return {
    kind: "income", asOf: report.periodLabel,
    headline: { label: "Revenue", value: revenue },
    composition: { title: "Operating expenses", items: groups.map(group => ({ label: group.label, value: reportAmount(report, group.id) })) },
    secondary: { label: "Net income", value: net, share: revenue === 0 ? null : net / revenue },
    movement: {
      comparisonLabel: `Compared with ${previousReport.periodLabel}`,
      metrics: [{ label: "Revenue", value: revenue, previous: reportAmount(previousReport, "t-revenue") }, { label: "Operating expenses", value: operating, previous: reportAmount(previousReport, "total-operating") }, { label: "Net income", value: net, previous: reportAmount(previousReport, "net-income") }],
      trendTitle: "Net income",
      trend: report.columns.filter(column => column.key !== "total").map(column => ({ label: column.label, value: reportAmount(report, "net-income", column.key) })),
    },
  };
}
