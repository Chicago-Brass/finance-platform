"use server";

import { ledgerAccountParam } from "@/components/ledger-table-utils";
import { cleanDate } from "@/lib/dates";
import { dayBefore, naturalNet, shiftYears, toActivityLine } from "@/lib/reports/account-activity";
import type { AccountActivity, AccountActivityLine, DrillRange } from "@/lib/reports/account-activity";
import { getGeneralLedger, getTrialBalance } from "@/lib/reports/ledger";
import type { TbRow } from "@/lib/reports/ledger";
import { cents } from "@/lib/reports/report-utils";

// 20 pages of 100 lines. Totals always come from the trial balance, so a capped list is labeled, not wrong.
const MAX_PAGES = 20;
const MAX_RANGE_DAYS = 3700;

async function accountLines(account: string, from: string, to: string) {
  const lines: AccountActivityLine[] = [];
  for (let page = 1; ; page++) {
    const result = await getGeneralLedger(from, to, page, { account });
    lines.push(...result.rows.map(toActivityLine));
    if (!result.hasNext) return { lines, truncated: false };
    if (page >= MAX_PAGES) return { lines, truncated: true };
  }
}

const find = (rows: TbRow[], code: string) => rows.find(row => row.account_number === code);

/** One account's posted lines and totals for the drill-down drawer, read as the signed-in user through RLS. */
export async function loadAccountActivity(input: DrillRange & { account: string }): Promise<AccountActivity> {
  const account = ledgerAccountParam(input?.account);
  const from = cleanDate(input?.from, ""), to = cleanDate(input?.to, "");
  const mode = input?.mode === "balance" ? "balance" : input?.mode === "period" ? "period" : null;
  const days = from && to ? (Date.parse(to) - Date.parse(from)) / 86_400_000 : -1;
  if (!account || !mode || days < 0 || days > MAX_RANGE_DAYS) throw new Error("Invalid account drill-down request.");

  const previousFrom = shiftYears(from, -1), previousTo = shiftYears(to, -1);
  const [current, comparison, listed] = await Promise.all([
    getTrialBalance(to, from),
    mode === "balance" ? getTrialBalance(dayBefore(from), null) : getTrialBalance(previousTo, previousFrom),
    accountLines(account, from, to),
  ]);
  const row = find(current, account);
  if (!row) throw new Error(`Account ${account} is not in the chart of accounts.`);
  const normalBalance = row.normal_balance === "credit" ? "credit" : "debit";
  const other = find(comparison, account);
  const otherNet = other ? naturalNet(cents(other.total_debit), cents(other.total_credit), normalBalance) : 0;

  return {
    mode, from, to,
    account: { code: account, name: row.account_name, normalBalance },
    debit: cents(row.total_debit),
    credit: cents(row.total_credit),
    lines: listed.lines,
    truncated: listed.truncated,
    opening: mode === "balance" ? otherNet : null,
    previous: mode === "period" ? { from: previousFrom, to: previousTo, net: otherNet } : null,
  };
}
