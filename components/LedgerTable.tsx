"use client";

import { useMemo, useState } from "react";
import type { LedgerAccountFilters, LedgerAccountOption, LedgerRow, TbRow } from "@/lib/reports/ledger";
import { formatReportAmount } from "@/lib/format";
import { formatDate } from "@/lib/reports/report-utils";
import { JournalEntryDrawer } from "./JournalEntryDrawer";
import { AccountPill } from "./AccountPill";
import { ReportIcon } from "./ReportIcons";
import { ReportLink } from "./ReportNavigation";
import { ACCOUNT_TYPES, accountLedgerHref, filterTrialAccounts, ledgerHref, moneyTotal, safeAuditLink } from "./ledger-table-utils";
import "./ledger-tables.css";

/** An account pill that opens the General Ledger for that account. */
export function AccountLedgerLink({ code, name, asOf, branch }: { code: string; name: string | null; asOf: string; branch?: string }) {
  return <ReportLink className="account-pill-link" href={accountLedgerHref(code, asOf, branch)} title={`Open ${code} in the General Ledger`}><AccountPill code={code} name={name} /></ReportLink>;
}

export function TrialBalanceTable({ rows, asOf, branch, query = "", type = "all" }: { rows: TbRow[]; asOf?: string; branch?: string; query?: string; type?: string }) {
  const visible = useMemo(() => filterTrialAccounts(rows, query, type), [rows, query, type]);
  const debit = moneyTotal(rows.map(row => row.total_debit));
  const credit = moneyTotal(rows.map(row => row.total_credit));
  const balanced = Math.round(debit * 100) === Math.round(credit * 100);
  const filtered = query.trim() !== "" || type !== "all";
  return (
    <section className="statement-panel ledger-table-panel" aria-label="Trial Balance accounts">
      <div className="table-wrap ledger-scroll" tabIndex={0} role="region" aria-label="Trial Balance table">
        <table className="fin-table ledger-data-table trial-balance-table">
          <colgroup><col className="ledger-account-col" /><col className="ledger-type-col" /><col className="ledger-money-col" /><col className="ledger-money-col" /><col className="ledger-money-col" /></colgroup>
          <thead><tr><th scope="col" className="label-cell">Account</th><th scope="col" className="label-cell">Type</th><th scope="col" className="num-cell">Debits</th><th scope="col" className="num-cell">Credits</th><th scope="col" className="num-cell">Balance</th></tr></thead>
          <tbody>{visible.length === 0 ? <tr><td colSpan={5} className="ledger-empty">No accounts match these display filters.</td></tr> : visible.map(row => <tr key={row.account_number} className="row-account"><th scope="row" className="label-cell">{asOf ? <AccountLedgerLink code={row.account_number} name={row.account_name} asOf={asOf} branch={branch} /> : <AccountPill code={row.account_number} name={row.account_name} />}</th><td className="label-cell"><span className="ledger-type-label">{ACCOUNT_TYPES[row.account_type] ?? row.account_type}</span>{row.account_subtype && <small className="ledger-subtype">{row.account_subtype.replaceAll("_", " ")}</small>}</td><td className="num-cell">{formatReportAmount(Number(row.total_debit))}</td><td className="num-cell">{formatReportAmount(Number(row.total_credit))}</td><td className="num-cell">{formatReportAmount(Number(row.balance))}</td></tr>)}</tbody>
          <tfoot><tr><th scope="row" className="label-cell">All-account totals</th><td /><td className="num-cell">{formatReportAmount(debit)}</td><td className="num-cell">{formatReportAmount(credit)}</td><td /></tr></tfoot>
        </table>
      </div>
      <footer className="report-status ledger-table-footer"><span className={balanced ? "" : "ledger-balance-warning"}>{balanced && <ReportIcon name="check" />}{balanced ? "Debits = Credits" : `Debits and credits differ by ${formatReportAmount(Math.abs(debit - credit))}`}</span><span role="status">Showing {visible.length} of {rows.length} accounts</span>{filtered && <span>Totals include all accounts.</span>}</footer>
    </section>
  );
}

export function GeneralLedgerTable({ rows, accounts = [], from, to, page, pageSize, hasNext, total, countPending = false, ...filters }: LedgerAccountFilters & { rows: LedgerRow[]; accounts?: LedgerAccountOption[]; from: string; to: string; page: number; pageSize: number; hasNext: boolean; total?: number; countPending?: boolean }) {
  const [journal, setJournal] = useState<{ entryNumber: number; lineId: string } | null>(null);
  const visible = rows;
  const accountNames = new Map(accounts.map(account => [account.account_number, account.account_name]));
  const first = (page - 1) * pageSize + 1;
  return (
    <section className="statement-panel ledger-table-panel" aria-label="General Ledger records">
      <div className="table-wrap ledger-scroll" tabIndex={0} role="region" aria-label="General Ledger table">
        <table className="fin-table ledger-data-table general-ledger-table">
          <colgroup><col className="ledger-date-col" /><col className="ledger-account-col" /><col className="ledger-offset-col" /><col className="ledger-money-col" /><col className="ledger-money-col" /><col className="ledger-notes-col" /><col className="ledger-audit-col" /></colgroup>
          <thead><tr><th scope="col" className="label-cell">Date</th><th scope="col" className="label-cell">Account</th><th scope="col" className="label-cell">Offsetting account</th><th scope="col" className="num-cell">Debit</th><th scope="col" className="num-cell">Credit</th><th scope="col" className="label-cell">Notes</th><th scope="col" className="label-cell">Audit link</th></tr></thead>
          <tbody>{visible.length === 0 ? <tr><td colSpan={7} className="ledger-empty">No posted journal lines match the selected dates and filters.</td></tr> : visible.map(row => {
            const auditLink = safeAuditLink(row.audit_link);
            const drilled = journal?.entryNumber === row.entry_number;
            return <tr key={row.line_id} className={`row-account ledger-entry-row${drilled ? " is-drilled" : ""}`} tabIndex={0} aria-label={`Open journal entry ${row.entry_number}, ${row.account_number} ${row.account_name}`} aria-haspopup="dialog" aria-expanded={drilled} onClick={event => {
              if ((event.target as HTMLElement).closest("a,button,input,select,textarea")) return;
              event.currentTarget.focus();
              setJournal({ entryNumber: row.entry_number, lineId: String(row.line_id) });
            }} onKeyDown={event => {
              if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
              event.preventDefault();
              setJournal({ entryNumber: row.entry_number, lineId: String(row.line_id) });
            }}><td className="label-cell ledger-date-cell"><time dateTime={row.date}>{formatDate(row.date)}</time><small>Entry {row.entry_number}</small></td><th scope="row" className="label-cell"><AccountPill code={row.account_number} name={row.account_name} /></th><td className="label-cell">{row.offset_is_split ? <div className="ledger-offset-accounts">{(row.offsetting_account_number?.split(", ") ?? []).map(code => <AccountPill key={code} code={code} name={accountNames.get(code) ?? null} />)}</div> : <AccountPill code={row.offsetting_account_number} name={row.offsetting_account_name} />}</td><td className="num-cell">{formatReportAmount(Number(row.debit))}</td><td className="num-cell">{formatReportAmount(Number(row.credit))}</td><td className="label-cell ledger-notes-cell">{row.notes || <span className="ledger-muted">-</span>}</td><td className="label-cell">{auditLink ? <a href={auditLink} target="_blank" rel="noopener noreferrer" className="ledger-audit-link">Open<ReportIcon name="arrowUp" /></a> : <span className="ledger-muted">{row.audit_link || "-"}</span>}</td></tr>;
          })}</tbody>
        </table>
      </div>
      <footer className="ledger-pagination"><div className="ledger-page-status" role="status" aria-busy={countPending}>Showing {rows.length ? `${first.toLocaleString("en-US")}-${(first + rows.length - 1).toLocaleString("en-US")}` : "0"}{total !== undefined ? ` of ${total.toLocaleString("en-US")} records` : countPending ? " of ... records" : " records (total unavailable)"}</div><nav className="ledger-page-links" aria-label="Ledger pagination">{page > 1 ? <ReportLink className="btn btn-quiet" href={ledgerHref({ from, to, ...filters, page: page - 1 })} rel="prev"><ReportIcon name="chevronRight" className="ledger-previous-icon" />Previous</ReportLink> : <button className="btn btn-quiet" disabled type="button"><ReportIcon name="chevronRight" className="ledger-previous-icon" />Previous</button>}<span className="ledger-page-number" aria-current="page">Page {page}</span>{hasNext ? <ReportLink className="btn btn-quiet" href={ledgerHref({ from, to, ...filters, page: page + 1 })} rel="next">Next<ReportIcon name="chevronRight" /></ReportLink> : <button className="btn btn-quiet" disabled type="button">Next<ReportIcon name="chevronRight" /></button>}</nav></footer>
      {journal && <JournalEntryDrawer entryNumber={journal.entryNumber} selectedLineId={journal.lineId} onClose={() => setJournal(null)} />}
    </section>
  );
}
