"use client";

import type { ChangeEvent } from "react";
import type { LedgerAccountOption } from "@/lib/reports/ledger";
import { ReportForm, ReportLink } from "./ReportNavigation";
import { accountGroups, ledgerHref } from "./ledger-table-utils";

type Props = { from: string; to: string; account?: string; offset?: string; accounts: LedgerAccountOption[] };

/** Server-side account filters: they query every page, unlike the table's current-page search. */
export function LedgerAccountFilter({ from, to, account, offset, accounts }: Props) {
  const groups = accountGroups(accounts);
  const options = groups.map(group => (
    <optgroup key={group.type} label={group.label}>
      {group.accounts.map(row => <option key={row.account_number} value={row.account_number}>{row.account_number} {row.account_name}</option>)}
    </optgroup>
  ));
  const submit = (event: ChangeEvent<HTMLSelectElement>) => event.currentTarget.form?.requestSubmit();
  return (
    <ReportForm key={`${account ?? ""}:${offset ?? ""}`} className="ledger-account-filters" aria-label="General Ledger account filters">
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />
      <label className="ledger-account-field"><span className="filter-label">Account</span>
        <select name="account" defaultValue={account ?? ""} onChange={submit}><option value="">All accounts</option>{options}</select>
      </label>
      <label className="ledger-account-field"><span className="filter-label">Offsetting account</span>
        <select name="offset" defaultValue={offset ?? ""} onChange={submit}><option value="">All accounts</option>{options}</select>
      </label>
      <noscript><button className="btn btn-quiet" type="submit">Apply</button></noscript>
      {(account || offset) && <ReportLink className="filter-reset" href={ledgerHref({ from, to })}>Clear accounts</ReportLink>}
    </ReportForm>
  );
}
