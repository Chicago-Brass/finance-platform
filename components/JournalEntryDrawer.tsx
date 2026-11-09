"use client";

import { useId } from "react";
import type { JournalEntry } from "@/lib/reports/journal-entry";
import { formatReportAmount } from "@/lib/format";
import { formatDate } from "@/lib/reports/report-utils";
import { moneyTotal, safeAuditLink } from "./ledger-table-utils";
import { AccountPill } from "./AccountPill";
import { DetailDrawer } from "./DetailDrawer";
import { useReportQuery } from "./ReportData";
import { ReportDataBoundary } from "./ReportNavigation";
import { ReportIcon } from "./ReportIcons";
import "./journal-entry-drawer.css";

type Field = [string, string | number | null];
const timestamp = (value: string | null) => value ? new Date(value).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }) : null;

function Fields({ items }: { items: Field[] }) {
  const fields = items.filter(([, value]) => value !== null && value !== "");
  return fields.length ? <dl className="journal-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null;
}

function SourceLink({ url, label }: { url: string | null; label: string }) {
  const href = safeAuditLink(url);
  return href ? <a className="journal-source-link" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}><ReportIcon name="externalLink" /></a> : null;
}

/** Compact journal lines; detailed line references stay available in the read data. */
export function JournalEntryDetails({ entry, selectedLineId }: { entry: JournalEntry; selectedLineId?: string }) {
  const debit = moneyTotal(entry.lines.map(line => line.debit)), credit = moneyTotal(entry.lines.map(line => line.credit));
  const balanced = Math.round(debit * 100) === Math.round(credit * 100);
  return <>
    <section className="journal-section" aria-label="Entry details">
      <h3>Entry details</h3>
      <p className="journal-description">{entry.description}</p>
      <Fields items={[["Source", entry.source_system], ["Table", entry.source_table], ["Record", entry.source_record_id], ["Accounting date", formatDate(entry.entry_date)], ["Source date", entry.source_date ? formatDate(entry.source_date) : null], ["Transaction type", entry.transaction_type]]} />
      {entry.notes && <div className="journal-notes"><h4>Notes</h4><p>{entry.notes}</p></div>}
    </section>
    <section className="journal-section" aria-label="Journal lines">
      <div className="journal-section-heading"><h3>Journal lines</h3><span>{entry.lines.length} lines</span></div>
      <div className="journal-lines-scroll" tabIndex={0} role="region" aria-label="All lines in this journal entry">
        <table className="journal-lines">
          <thead><tr><th scope="col">Account</th><th scope="col" className="journal-money">Debit</th><th scope="col" className="journal-money">Credit</th><th scope="col"><span className="sr-only">Source</span></th></tr></thead>
          <tbody>{entry.lines.map(line => <tr key={line.id} aria-selected={String(line.id) === selectedLineId} className={String(line.id) === selectedLineId ? "journal-selected-line" : undefined}>
            <th scope="row" className="journal-account" title={`${line.account_code} ${line.account?.name ?? ""}`}><AccountPill code={line.account_code} name={line.account?.name ?? null} /></th>
            <td className="journal-money">{formatReportAmount(Number(line.debit))}</td><td className="journal-money">{formatReportAmount(Number(line.credit))}</td>
            <td className="journal-source-cell"><SourceLink url={line.audit_link} label={`Open source for ${line.account_code}`} /></td>
          </tr>)}</tbody>
          <tfoot><tr><th scope="row">Entry totals</th><td className="journal-money">{formatReportAmount(debit)}</td><td className="journal-money">{formatReportAmount(credit)}</td><td /></tr></tfoot>
        </table>
      </div>
      {!balanced && <p className="journal-warning" role="alert">Debit and credit totals differ by {formatReportAmount(Math.abs(debit - credit))}.</p>}
    </section>
    <section className="journal-section" aria-label="Posting information">
      <h3>Posting information</h3>
      <Fields items={[["Rule", entry.rule_code], ["Created", timestamp(entry.created_at)], ["Posted", timestamp(entry.posted_at)], ["Journal ID", entry.id]]} />
    </section>
  </>;
}

export function JournalEntryDrawer({ entryNumber, selectedLineId, onClose }: { entryNumber: number; selectedLineId?: string; onClose: () => void }) {
  const id = useId();
  const query = useReportQuery<JournalEntry>(`/api/reports/journal-entry?entry=${entryNumber}`);
  return <DetailDrawer titleId={`${id}-title`} className="journal-drawer" onClose={onClose}>
    <header className="drill-header"><div className="drill-heading"><h2 id={`${id}-title`}>Journal entry #{entryNumber}</h2></div>
      <SourceLink url={query.data?.audit_link ?? null} label="Open source record" />
      <button data-drawer-close type="button" className="drill-icon-button drill-close" aria-label="Close journal entry" onClick={onClose}><span aria-hidden="true">×</span></button>
    </header>
    <div className="journal-content" aria-busy={query.pending}>
      <ReportDataBoundary resetKey={entryNumber}>
        {query.pending ? <div className="drill-state drill-loading" role="status"><span className="report-spinner" aria-hidden="true" />Loading journal entry...</div> : query.error || !query.data ? <div className="drill-state" role="alert"><p>Journal entry could not be loaded.</p><button type="button" className="btn btn-quiet" onClick={query.retry}>Try again</button></div> : <JournalEntryDetails entry={query.data} selectedLineId={selectedLineId} />}
      </ReportDataBoundary>
    </div>
  </DetailDrawer>;
}
