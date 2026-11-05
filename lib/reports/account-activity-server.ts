import { ledgerAccountParam } from "@/components/ledger-table-utils";
import { cleanDate } from "@/lib/dates";
import { dayBefore, naturalNet, shiftYears, toActivityLine } from "./account-activity";
import type { AccountActivityLines, AccountActivitySummary, DrillRange } from "./account-activity";
import { getGeneralLedger, getTrialBalances } from "./ledger";
import { cents } from "./report-utils";

export type AccountActivityInput = DrillRange & { account: string };

export function accountActivityInput(input: Record<string, string | undefined>): AccountActivityInput {
  const account = ledgerAccountParam(input.account);
  const from = cleanDate(input.from, ""), to = cleanDate(input.to, "");
  const mode = input.mode === "balance" ? "balance" : input.mode === "period" ? "period" : null;
  const days = from && to ? (Date.parse(to) - Date.parse(from)) / 86_400_000 : -1;
  if (!account || !mode || days < 0 || days > 3700) throw new RangeError("Invalid account drill-down request.");
  return { account, from, to, mode };
}

/** Only two requested periods, in one round trip, independently of the line list. */
export async function getAccountActivitySummary({ account, from, to, mode }: AccountActivityInput): Promise<AccountActivitySummary> {
  const previousFrom = shiftYears(from, -1), previousTo = shiftYears(to, -1);
  const [current, comparison] = await getTrialBalances([
    { asOf: to, from },
    mode === "balance" ? { asOf: dayBefore(from), from: null } : { asOf: previousTo, from: previousFrom },
  ]);
  const row = current.find(row => row.account_number === account);
  if (!row) throw new Error("Account is not available in the chart of accounts.");
  const normalBalance = row.normal_balance === "credit" ? "credit" : "debit";
  const other = comparison.find(row => row.account_number === account);
  const otherNet = other ? naturalNet(cents(other.total_debit), cents(other.total_credit), normalBalance) : 0;
  return {
    mode, from, to,
    account: { code: account, name: row.account_name, normalBalance },
    debit: cents(row.total_debit), credit: cents(row.total_credit),
    opening: mode === "balance" ? otherNet : null,
    previous: mode === "period" ? { from: previousFrom, to: previousTo, net: otherNet } : null,
  };
}

/** Preserve the 2,000-line cap, using up to four 500-line reads instead of twenty 100-line reads. */
export async function getAccountActivityLines({ account, from, to }: AccountActivityInput): Promise<AccountActivityLines> {
  const lines: AccountActivityLines["lines"] = [];
  for (let page = 1; page <= 4; page++) {
    const result = await getGeneralLedger(from, to, page, { account }, 500);
    lines.push(...result.rows.map(toActivityLine));
    if (!result.hasNext) return { lines, truncated: false };
  }
  return { lines, truncated: true };
}
