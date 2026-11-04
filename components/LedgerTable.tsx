"use client";

import { useMemo, useState } from "react";
import type { LedgerRow, TbRow } from "@/lib/reports/ledger";
import { formatReportAmount } from "@/lib/format";
import { formatDate } from "@/lib/reports/report-utils";
import { AccountDrawer } from "./AccountDrawer";
import type { DrillTarget } from "./AccountDrawer";
import { AccountPill } from "./AccountPill";
import { ReportIcon } from "./ReportIcons";
import { ReportLink } from "./ReportNavigation";
import { ACCOUNT_TYPES, accountLedgerHref, filterLedgerRecords, filterTrialAccounts, ledgerHref, moneyTotal, safeAuditLink } from "./ledger-table-utils";
import "./ledger-tables.css";

function AccountSearch({ query, setQuery, currentPage = false }: { query: string; setQuery: (query: string) => void; currentPage?: boolean }) {
  return <label className="report-account-search"><ReportIcon name="search" /><span className="sr-only">{currentPage ? "Search this page" : "Search accounts"}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={currentPage ? "Search this page" : "Search accounts"} /></label>;
}

/** An account pill that opens the General Ledger for that account. */
export function AccountLedgerLink({ code, name, asOf }: { code: string; name: string | null; asOf: string }) {
  return <ReportLink className="account-pill-link" href={accountLedgerHref(code, asOf)} title={`Open ${code} in the General Ledger`}><AccountPill code={code} name={name} /></ReportLink>;
}

export function TrialBalanceTable({ rows, asOf }: { rows: TbRow[]; asOf?: string }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [showZero, setShowZero] = useState(true);
  const visible = useMemo(() => filterTrialAccounts(rows, query, type, showZero), [rows, query, type, showZero]);
  const debit = moneyTotal(rows.map(row => row.total_debit));
  const credit = moneyTotal(rows.map(row => row.total_credit));
  const balanced = Math.round(debit * 100) === Math.round(credit * 100);
  const types = [...new Set(rows.map(row => row.account_type))];
  const filtered = query.trim() !== "" || type !== "all" || !showZero;
  return (
    <section className="statement-panel ledger-table-panel" aria-label="Trial Balance accounts">
      <div className="statement-toolbar ledger-toolbar no-print">
        <div className="ledger-view-controls"><span className="segment-label">Account type</span><select aria-label="Account type" value={type} onChange={event => setType(event.target.value)}><option value="all">All types</option>{types.map(item => <option key={item} value={item}>{ACCOUNT_TYPES[item] ?? item}</option>)}</select><label className="ledger-checkbox" title="Accounts with zero debits, credits and balance"><input type="checkbox" checked={showZero} onChange={event => setShowZero(event.target.checked)} />Show zero accounts</label></div>
        <div className="statement-tools"><AccountSearch query={query} setQuery={setQuery} />{filtered && <button type="button" className="btn btn-quiet" onClick={() => { setQuery(""); setType("all"); setShowZero(true); }}>Reset display</button>}</div>
      </div>
      <div className="table-wrap ledger-scroll">
        <table className="fin-table ledger-data-table trial-balance-table">
          <colgroup><col className="ledger-account-col" /><col className="ledger-type-col" /><col className="ledger-money-col" /><col className="ledger-money-col" /><col className="ledger-money-col" /></colgroup>
          <thead><tr><th scope="col" className="label-cell">Account</th><th scope="col" className="label-cell">Type</th><th scope="col" className="num-cell">Debits</th><th scope="col" className="num-cell">Credits</th><th scope="col" className="num-cell">Balance</th></tr></thead>
          <tbody>{visible.length === 0 ? <tr><td colSpan={5} className="ledger-empty">No accounts match these display filters.</td></tr> : visible.map(row => <tr key={row.account_number} className="row-account"><th scope="row" className="label-cell">{asOf ? <AccountLedgerLink code={row.account_number} name={row.account_name} asOf={asOf} /> : <AccountPill code={row.account_number} name={row.account_name} />}</th><td className="label-cell"><span className="ledger-type-label">{ACCOUNT_TYPES[row.account_type] ?? row.account_type}</span>{row.account_subtype && <small className="ledger-subtype">{row.account_subtype.replaceAll("_", " ")}</small>}</td><td className="num-cell">{formatReportAmount(Number(row.total_debit))}</td><td className="num-cell">{formatReportAmount(Number(row.total_credit))}</td><td className="num-cell">{formatReportAmount(Number(row.balance))}</td></tr>)}</tbody>
          <tfoot><tr><th scope="row" className="label-cell">All-account totals</th><td /><td className="num-cell">{formatReportAmount(debit)}</td><td className="num-cell">{formatReportAmount(credit)}</td><td /></tr></tfoot>
        </table>
      </div>
      <footer className="report-status ledger-table-footer"><span className={balanced ? "" : "ledger-balance-warning"}>{balanced && <ReportIcon name="check" />}{balanced ? "Debits = Credits" : `Debits and credits differ by ${formatReportAmount(Math.abs(debit - credit))}`}</span><span role="status">Showing {visible.length} of {rows.length} accounts</span>{filtered && <span>Totals include all accounts.</span>}</footer>
    </section>
  );
}

export function GeneralLedgerTable({ rows, from, to, page, pageSize, hasNext, account, offset }: { rows: LedgerRow[]; from: string; to: string; page: number; pageSize: number; hasNext: boolean; account?: string; offset?: string }) {
  const [query, setQuery] = useState("");
  const [side, setSide] = useState("all");
  const [drill, setDrill] = useState<DrillTarget | null>(null);
  const drillRange = useMemo(() => ({ mode: "period" as const, from, to }), [from, to]);
  const visible = useMemo(() => filterLedgerRecords(rows, query, side), [rows, query, side]);
  const debit = moneyTotal(rows.map(row => row.debit));
  const credit = moneyTotal(rows.map(row => row.credit));
  const filtered = query.trim() !== "" || side !== "all";
  const first = (page - 1) * pageSize + 1;
  return (
    <section className="statement-panel ledger-table-panel" aria-label="General Ledger records">
      <div className="statement-toolbar ledger-toolbar no-print">
        <div className="ledger-view-controls"><span className="segment-label">Current page</span><div className="ledger-side-controls" role="group" aria-label="Entry side">{[{value:"all",label:"All lines"},{value:"debit",label:"Debit lines"},{value:"credit",label:"Credit lines"}].map(item => <button key={item.value} type="button" aria-pressed={side === item.value} onClick={() => setSide(item.value)}>{item.label}</button>)}</div></div>
        <div className="statement-tools"><AccountSearch query={query} setQuery={setQuery} currentPage />{filtered && <button type="button" className="btn btn-quiet" onClick={() => { setQuery(""); setSide("all"); }}>Reset display</button>}</div>
      </div>
      {offset && <p className="report-display-note">Offsetting account filter: entries split across several offsetting accounts are not included.</p>}
      {filtered && <p className="report-display-note" role="status">Showing {visible.length} of {rows.length} records on this page. Page totals include all loaded records.</p>}
      <div className="table-wrap ledger-scroll">
        <table className="fin-table ledger-data-table general-ledger-table">
          <colgroup><col className="ledger-date-col" /><col className="ledger-account-col" /><col className="ledger-offset-col" /><col className="ledger-money-col" /><col className="ledger-money-col" /><col className="ledger-notes-col" /><col className="ledger-audit-col" /></colgroup>
          <thead><tr><th scope="col" className="label-cell">Date</th><th scope="col" className="label-cell">Account</th><th scope="col" className="label-cell">Offsetting account</th><th scope="col" className="num-cell">Debit</th><th scope="col" className="num-cell">Credit</th><th scope="col" className="label-cell">Notes</th><th scope="col" className="label-cell">Audit link</th></tr></thead>
          <tbody>{visible.length === 0 ? <tr><td colSpan={7} className="ledger-empty">{rows.length ? "No records match the display filters on this page." : account || offset ? "No posted journal lines match these accounts for the selected dates." : "No posted journal lines on this page for the selected dates."}</td></tr> : visible.map(row => {
            const auditLink = safeAuditLink(row.audit_link);
            const drilled = drill?.lineId === row.line_id;
            return <tr key={row.line_id} className={`row-account${drilled ? " is-drilled" : ""}`}><td className="label-cell ledger-date-cell"><time dateTime={row.date}>{formatDate(row.date)}</time><small>Entry {row.entry_number}</small></td><th scope="row" className="label-cell"><button type="button" className="drill-trigger" aria-haspopup="dialog" aria-expanded={drilled} title={`Open ${row.account_number} details`} onClick={() => setDrill({ code: row.account_number, label: `${row.account_number} ${row.account_name}`, context: "General Ledger", lineId: row.line_id })}><span className="drill-trigger-label"><AccountPill code={row.account_number} name={row.account_name} /></span></button></th><td className="label-cell">{row.offset_is_split ? <span className="ledger-split-pill" title="This journal entry includes multiple offsetting accounts.">Split / multiple accounts</span> : <AccountPill code={row.offsetting_account_number} name={row.offsetting_account_name} />}</td><td className="num-cell">{formatReportAmount(Number(row.debit))}</td><td className="num-cell">{formatReportAmount(Number(row.credit))}</td><td className="label-cell ledger-notes-cell">{row.notes || <span className="ledger-muted">-</span>}</td><td className="label-cell">{auditLink ? <a href={auditLink} target="_blank" rel="noopener noreferrer" className="ledger-audit-link">Open<ReportIcon name="arrowUp" /></a> : <span className="ledger-muted">{row.audit_link || "-"}</span>}</td></tr>;
          })}</tbody>
          <tfoot><tr><th colSpan={3} scope="row" className="label-cell">Current page totals</th><td className="num-cell">{formatReportAmount(debit)}</td><td className="num-cell">{formatReportAmount(credit)}</td><td colSpan={2} /></tr></tfoot>
        </table>
      </div>
      <footer className="ledger-pagination"><div className="ledger-page-status"><span>{rows.length ? `Records ${first}-${first + rows.length - 1}` : "0 records on this page"}</span><small>{pageSize} records per page / Posted entries only</small></div><nav className="ledger-page-links" aria-label="Ledger pagination">{page > 1 ? <ReportLink className="btn btn-quiet" href={ledgerHref({ from, to, account, offset, page: page - 1 })} rel="prev"><ReportIcon name="chevronRight" className="ledger-previous-icon" />Previous</ReportLink> : <button className="btn btn-quiet" disabled type="button"><ReportIcon name="chevronRight" className="ledger-previous-icon" />Previous</button>}<span className="ledger-page-number" aria-current="page">Page {page}</span>{hasNext ? <ReportLink className="btn btn-quiet" href={ledgerHref({ from, to, account, offset, page: page + 1 })} rel="next">Next<ReportIcon name="chevronRight" /></ReportLink> : <button className="btn btn-quiet" disabled type="button">Next<ReportIcon name="chevronRight" /></button>}</nav></footer>
      {drill && <AccountDrawer target={drill} range={drillRange} onSelect={setDrill} onClose={() => setDrill(null)} />}
    </section>
  );
}
