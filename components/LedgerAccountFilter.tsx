"use client";

import type { LedgerAccountFilters, LedgerAccountOption } from "@/lib/reports/ledger";
import { SearchableSelect } from "./SearchableSelect";
import type { SelectOption } from "./SearchableSelect";
import { ReportLink, useReportNavigate } from "./ReportNavigation";
import { accountGroups, ledgerHref } from "./ledger-table-utils";

type Props = LedgerAccountFilters & {
  from: string;
  to: string;
  accounts: LedgerAccountOption[];
  unavailable?: boolean;
  onChange?: (changes: Pick<LedgerAccountFilters, "account" | "offset">) => void;
};

/** Account choices load independently; selected codes remain visible before metadata arrives. */
export function LedgerAccountFilter({ from, to, account, offset, query, side, accounts, unavailable, onChange }: Props) {
  const navigate = useReportNavigate();
  const options: SelectOption[] = [{ value: "", label: "All accounts" }, ...accountGroups(accounts).flatMap(group =>
    group.accounts.map(row => ({ value: row.account_number, label: `${row.account_number} ${row.account_name}`, group: group.label })))];
  for (const code of [account, offset]) if (code && !options.some(option => option.value === code)) options.push({ value: code, label: code });
  if (unavailable) options.push({ value: "unavailable", label: "Choices unavailable - refresh to retry", disabled: true });
  const change = (changes: Pick<LedgerAccountFilters, "account" | "offset">) => onChange
    ? onChange(changes)
    : navigate(ledgerHref({ from, to, account, offset, query, side, ...changes }));
  return (
    <div className="ledger-account-filters" aria-label="General Ledger account filters">
      <SearchableSelect className="ledger-account-select" label="Account" value={account ?? ""} options={options} onChange={value => change({ account: value || undefined })} />
      <SearchableSelect className="ledger-account-select" label="Offsetting account" value={offset ?? ""} options={options} onChange={value => change({ offset: value || undefined })} />
      {(account || offset) && !onChange && <ReportLink className="filter-reset" href={ledgerHref({ from, to, query, side })}>Clear accounts</ReportLink>}
    </div>
  );
}
