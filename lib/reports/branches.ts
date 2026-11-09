import type { AccountBalance } from "./report-utils";
import { cents } from "./report-utils";
import type { Report } from "./types";

export const BRANCHES = [
  { code: "CHI", name: "Chicago", value: "Chicago" },
  { code: "MSP", name: "Minneapolis", value: "Minneapolis" },
  { code: "MKE", name: "Milwaukee", value: "Milwaukee" },
  { code: "OVH", name: "Overhead", value: "Overhead" },
  { code: "CORP", name: "Corporate", value: "Corporate" },
  { code: "UNASSIGNED", name: "Unassigned", value: null },
] as const;

export type BranchView = "ALL" | "BY_BRANCH" | typeof BRANCHES[number]["code"];
export function parseBranchView(value: string | undefined): BranchView {
  return value === "BY_BRANCH" || BRANCHES.some(branch => branch.code === value) ? value as BranchView : "ALL";
}
export type BranchLine = { id: string; entry_id: string; account_code: string; debit: number | string; credit: number | string; branch: string | null; journal_entries: { entry_date: string; status: string } };

export function branchBalances(accounts: AccountBalance[], lines: BranchLine[], asOf: string, from: string | null, branch: string | null | undefined): AccountBalance[] {
  const totals = new Map(accounts.map(account => [account.account_number, { debit: 0, credit: 0 }]));
  for (const line of lines) {
    if (line.journal_entries.status !== "posted" || line.journal_entries.entry_date > asOf || from && line.journal_entries.entry_date < from || branch !== undefined && line.branch !== branch) continue;
    const total = totals.get(line.account_code);
    if (!total) throw new Error(`Branch ledger account ${line.account_code} is missing from the report catalog.`);
    total.debit += cents(line.debit); total.credit += cents(line.credit);
    if (!Number.isSafeInteger(total.debit) || !Number.isSafeInteger(total.credit)) throw new Error("Branch total exceeds supported cents precision.");
  }
  return accounts.map(account => {
    const total = totals.get(account.account_number)!;
    return { ...account, total_debit: total.debit / 100, total_credit: total.credit / 100, balance: (account.normal_balance === "credit" ? total.credit - total.debit : total.debit - total.credit) / 100 };
  });
}

export function branchReport(report: Report, label: string): Report {
  return { ...report, entity: `Chicago Brass Inc. - ${label}` };
}

export function combineBranchReports(reports: { code: string; name: string; report: Report }[], consolidated: Report): Report {
  const all = [...reports, { code: "total", name: "Consolidated", report: consolidated }];
  return {
    ...consolidated, entity: "Chicago Brass Inc. - By branch",
    columns: all.map(item => ({ key: item.code, label: item.name, kind: "amount" })),
    lines: consolidated.lines.map(line => ({ ...line, values: line.kind === "section" ? {} : Object.fromEntries(all.map(item => {
      const row = item.report.lines.find(candidate => candidate.id === line.id);
      return [item.code, row?.values[item.report.columns[0].key] ?? 0];
    })) })),
  };
}
