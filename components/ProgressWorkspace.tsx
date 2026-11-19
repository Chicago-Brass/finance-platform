"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { ProgressData, ProgressDetail, ProgressJournal, ProgressRule, ImplementationStatus } from "@/lib/progress/types";
import { todayChicago } from "@/lib/dates";
import { formatDate } from "@/lib/reports/report-utils";
import { formatReportAmount } from "@/lib/format";
import { AccountPill } from "./AccountPill";
import { FilterBar, FilterField, SearchField } from "./FilterControls";
import { SearchableSelect } from "./SearchableSelect";
import { DismissibleMenu } from "./DismissibleMenu";
import { DetailDrawer } from "./DetailDrawer";
import { ReportPageHeader } from "./ReportPageHeader";
import { ReportDataPanel } from "./ReportDataPanel";
import { useReportQuery, useReportRefresh } from "./ReportData";
import { ReportIcon } from "./ReportIcons";
import { ReportLink } from "./ReportNavigation";
import { CalendarMark } from "./ReportViewControls";
import { ledgerDatePresets, safeAuditLink } from "./ledger-table-utils";
import "./ledger-tables.css";
import "./progress-workspace.css";

type Range = { from?: string; to?: string };
const CATEGORIES = [{ value: "", label: "All categories" }, { value: "expense", label: "Expenses" }, { value: "invoice_entry", label: "Invoice Entry" }, { value: "payment", label: "Payments" }, { value: "other", label: "Other / manual journals" }];
const IMPLEMENTATION = [{ value: "", label: "All stages" }, { value: "fully", label: "Implemented" }, { value: "partial", label: "Partial" }, { value: "not_implemented", label: "Not yet" }, { value: "deferred", label: "Deferred" }];
const IMPLEMENTATION_LABELS: Record<ImplementationStatus, string> = { fully: "Implemented", partial: "Partial", not_implemented: "Not yet", deferred: "Not yet" };
const categoryLabel = (category: string) => CATEGORIES.find(item => item.value === category)?.label ?? category;
const count = (value: number) => value.toLocaleString("en-US");
const timestamp = (value: string) => new Date(value).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

export function progressLedgerHref(journal: Pick<ProgressJournal, "entryNumber" | "entryDate">) {
  return `/general-ledger?${new URLSearchParams({ from: journal.entryDate, to: journal.entryDate, entry: String(journal.entryNumber) })}`;
}

export function progressAccounts(text: string | null): { code: string | null; name: string }[] {
  if (!text?.trim()) return [];
  const value = text.trim();
  if (/^invoice(?: expense| loan|[- ]line)? account linked\b/i.test(value) && /examples?:/i.test(value)) return [{ code: null, name: "Multiple invoice accounts" }];
  const accounts: { code: string | null; name: string }[] = [];
  for (const line of value.split(/[\n•]/)) {
    const plain = line.trim().replace(/^examples?:\s*/i, "");
    const first = /^(\d{3}\.\d{3}|\d{4,6})\s*:\s*(.+)$/.exec(plain);
    if (first) accounts.push({ code: first[1], name: first[2].trim() });
    else for (const match of plain.matchAll(/(.+?)\s*\((\d{3}\.\d{3}|\d{4,6})\)/g)) accounts.push({ code: match[2], name: match[1].replace(/^[\s,;]+/, "").trim() });
  }
  const unique = accounts.filter((account, index) => accounts.findIndex(item => item.code === account.code) === index);
  return unique.length > 5 ? [{ code: null, name: "Multiple accounts" }] : unique.length ? unique : [{ code: null, name: /invoice.*account.*linked/i.test(value) ? "Multiple invoice accounts" : /account.*linked/i.test(value) ? "Multiple accounts" : value }];
}

function Accounts({ text }: { text: string | null }) {
  const parts = progressAccounts(text);
  return parts.length ? <ul className="tchart-accounts progress-accounts">{parts.map((part, index) => <li key={index}><AccountPill code={part.code} name={part.name} /></li>)}</ul> : <span className="ledger-muted">-</span>;
}

function Implementation({ rule }: { rule: ProgressRule }) {
  return <span className={`progress-stage ${rule.implementationStatus}`}>{IMPLEMENTATION_LABELS[rule.implementationStatus]}</span>;
}

function Activity({ rule }: { rule: ProgressRule }) {
  return <div className="progress-activity"><span className="progress-activity-values" aria-label={`${count(rule.succeededCount)} succeeded, ${count(rule.failedCount)} failed, ${count(rule.postedCount)} posted`}><span>{count(rule.succeededCount)}</span><span aria-hidden="true"> / </span><span className={rule.failedCount ? "progress-failure-count" : ""}>{count(rule.failedCount)}</span><span aria-hidden="true"> / </span><strong>{count(rule.postedCount)}</strong></span>{rule.reversalCount > 0 && <small className="progress-rule-category">{count(rule.reversalCount)} reversed</small>}</div>;
}

type ToggleProps = { canManage: boolean; savingCode: string | null; errors: Record<string, string>; enabled: Record<string, boolean>; onToggle: (code: string, enabled: boolean) => void };
const noToggle: ToggleProps = { canManage: false, savingCode: null, errors: {}, enabled: {}, onToggle() {} };

export function RuleToggle({ rule, controls = noToggle }: { rule: ProgressRule; controls?: ToggleProps }) {
  const enabled = controls.enabled[rule.ruleCode] ?? rule.enabled, saving = controls.savingCode === rule.ruleCode, error = controls.errors[rule.ruleCode];
  return <div className="progress-toggle-field"><button type="button" role="switch" aria-checked={enabled} aria-label={`Enable ${rule.displayCode}`} aria-busy={saving} disabled={!controls.canManage || controls.savingCode !== null} className="progress-rule-toggle" title={!controls.canManage ? "Only administrators can change rule posting." : enabled ? "Disable posting" : "Enable posting"} onClick={event => { event.stopPropagation(); controls.onToggle(rule.ruleCode, !enabled); }}><span className="progress-toggle-track" aria-hidden="true"><span /></span><span className="progress-toggle-label">{saving ? "Saving..." : enabled ? "On" : "Off"}</span></button>{error && <span className="progress-toggle-error" role="alert">{error}</span>}</div>;
}

export async function saveRuleEnabled(ruleCode: string, enabled: boolean) {
  const response = await fetch("/api/progress", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ruleCode, enabled }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not update rule posting.");
  if (result.ruleCode !== ruleCode || result.enabled !== enabled) throw new Error("Rule update was not confirmed. Refresh before trying again.");
  return result as { ruleCode: string; enabled: boolean };
}

function Pagination({ page, pageSize, total, loading = false, onChange, label }: { page: number; pageSize: number; total: number; loading?: boolean; onChange: (page: number) => void; label: string }) {
  const first = total ? (page - 1) * pageSize + 1 : 0, last = Math.min(page * pageSize, total);
  return <footer className="ledger-pagination"><span className="ledger-page-status" role="status">Showing {count(first)}-{count(last)} of {count(total)} {label}</span><nav className="ledger-page-links" aria-label={`${label} pagination`}><button className="btn btn-quiet" disabled={loading || page <= 1} onClick={() => onChange(page - 1)} type="button"><ReportIcon name="chevronRight" className="ledger-previous-icon" />Previous</button><span className="ledger-page-number" aria-current="page">{page}</span><button className="btn btn-quiet" disabled={loading || page * pageSize >= total} onClick={() => onChange(page + 1)} type="button">Next<ReportIcon name="chevronRight" /></button></nav></footer>;
}

function PeriodFilter({ range, onChange }: { range: Range; onChange: (range: Range) => void }) {
  const today = todayChicago(), presets = ledgerDatePresets(today);
  const label = range.from && range.to ? `${formatDate(range.from)} - ${formatDate(range.to)}` : "All time";
  const choose = (event: MouseEvent<HTMLElement>, next: Range) => {
    onChange(next);
    const menu = event.currentTarget.closest("details");
    if (menu) menu.open = false;
  };
  return <FilterField label="Activity period" className="control-bar-period"><DismissibleMenu className="period-picker" key={`${range.from}:${range.to}`}>
    <summary className="period-picker-trigger"><CalendarMark /><span>{label}</span><span aria-hidden="true">▾</span></summary>
    <div className="period-picker-panel ledger-range-panel">
      <div className="date-presets" aria-label="Quick progress periods"><button className={`preset-link${!range.from ? " is-active" : ""}`} type="button" onClick={event => choose(event, {})}>All time</button>{presets.map(preset => <button key={preset.label} className={`preset-link${range.from === preset.from && range.to === preset.to ? " is-active" : ""}`} type="button" onClick={event => choose(event, { from: preset.from, to: preset.to })}>{preset.label}</button>)}</div>
      <form aria-label="Custom progress dates" onSubmit={event => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget), from = String(fields.get("from")), to = String(fields.get("to"));
        const end = event.currentTarget.elements.namedItem("to") as HTMLInputElement;
        if (from > to) { end.setCustomValidity("End date must be on or after the start date."); end.reportValidity(); return; }
        onChange({ from, to });
      }} onInput={event => (event.currentTarget.elements.namedItem("to") as HTMLInputElement).setCustomValidity("")}>
        <div className="ledger-date-fields"><FilterField label="Start date" htmlFor="progress-from"><input id="progress-from" name="from" type="date" defaultValue={range.from ?? `${today.slice(0, 4)}-01-01`} required /></FilterField><FilterField label="End date" htmlFor="progress-to"><input id="progress-to" name="to" type="date" defaultValue={range.to ?? today} required /></FilterField></div>
        <p className="filter-help">Posting dates for journals; processing dates for attempts. All dates use Central Time.</p><button className="btn btn-primary" type="submit">Apply dates</button>
      </form>
    </div>
  </DismissibleMenu></FilterField>;
}

export function ProgressRulesTable({ data, selected, onSelect, onPage, controls = noToggle }: { data: ProgressData; selected: string | null; onSelect: (code: string) => void; onPage: (page: number) => void; controls?: ToggleProps }) {
  const open = (event: KeyboardEvent<HTMLTableRowElement>, code: string) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(code); } };
  return <section className="statement-panel ledger-table-panel progress-table-panel" aria-label="Rule progress">
    <div className="table-wrap ledger-scroll" tabIndex={0} role="region" aria-label="Rule progress table"><table className="fin-table ledger-data-table progress-table">
      <colgroup><col className="progress-code-col" /><col className="progress-name-col" /><col className="progress-source-col" /><col className="progress-account-col" /><col className="progress-account-col" /><col className="progress-count-col" /><col className="progress-enabled-col" /></colgroup>
      <thead><tr><th scope="col" className="label-cell">Code</th><th scope="col" className="label-cell">Rule</th><th scope="col" className="label-cell">Source</th><th scope="col" className="label-cell">Debit</th><th scope="col" className="label-cell">Credit</th><th scope="col" className="num-cell">Activity<small className="progress-activity-legend">Succeeded / Failed / Posted</small></th><th scope="col" className="label-cell">Enabled</th></tr></thead>
      <tbody>{data.rules.length ? data.rules.map(rule => <tr key={rule.ruleCode} tabIndex={0} className={`ledger-entry-row${selected === rule.ruleCode ? " is-drilled" : ""}`} aria-haspopup="dialog" aria-expanded={selected === rule.ruleCode} aria-label={`View ${rule.displayCode} ${rule.name} activity`} onKeyDown={event => open(event, rule.ruleCode)} onClick={event => { event.currentTarget.focus(); onSelect(rule.ruleCode); }}>
        <th scope="row" className="label-cell"><div className="progress-rule-code"><span className="tchart-rule-code">{rule.displayCode}</span><Implementation rule={rule} /></div></th><td className="label-cell"><strong className="progress-rule-name">{rule.name}</strong><small className="progress-rule-category">{categoryLabel(rule.category)}{rule.family ? ` / ${rule.family}` : ""}</small></td><td className="label-cell"><span className="progress-source-pill">{rule.sourceLabel}</span></td><td className="label-cell"><Accounts text={rule.debitLabel} /></td><td className="label-cell"><Accounts text={rule.creditLabel} /></td><td className="num-cell"><Activity rule={rule} /></td><td className="label-cell"><RuleToggle rule={rule} controls={controls} /></td>
      </tr>) : <tr><td className="ledger-empty" colSpan={7}>No rules match these filters.</td></tr>}</tbody>
    </table></div><Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={onPage} label="rules" />
  </section>;
}

export function ProgressJournalList({ journals }: { journals: ProgressJournal[] }) {
  return journals.length ? <div className="progress-journals">{journals.map(journal => {
    const audit = safeAuditLink(journal.auditLink);
    return <section className="progress-journal" key={journal.id} aria-label={`Journal entry ${journal.entryNumber}`}>
      <header className="progress-journal-heading"><div><strong className="progress-journal-link">Entry #{journal.entryNumber}</strong><time dateTime={journal.entryDate}>{formatDate(journal.entryDate)}</time></div><div className="progress-journal-actions">{journal.isReversal && <span className="progress-stage deferred">Reversal</span>}<ReportLink className="progress-journal-redirect" href={progressLedgerHref(journal)} title="Open in General Ledger" aria-label={`Open General Ledger for journal ${journal.entryNumber}`}>Ledger<ReportIcon name="arrowRight" /></ReportLink>{audit && <a className="progress-journal-redirect" href={audit} target="_blank" rel="noopener noreferrer" title="Open Airtable record" aria-label={`Open Airtable source for journal ${journal.entryNumber}`}>Airtable<ReportIcon name="externalLink" /></a>}</div></header>
      <p className="progress-journal-description">{journal.description}</p>
      <table className="progress-journal-lines"><thead><tr><th scope="col">Account</th><th scope="col" className="num-cell">Debit</th><th scope="col" className="num-cell">Credit</th></tr></thead><tbody>{journal.lines.map(line => <tr key={line.lineNumber}><th scope="row"><AccountPill code={line.accountCode} name={line.accountName} /></th><td className="num-cell">{formatReportAmount(Number(line.debit))}</td><td className="num-cell">{formatReportAmount(Number(line.credit))}</td></tr>)}</tbody></table>
    </section>;
  })}</div> : <p className="progress-empty">No journals have been posted for this rule in the selected period.</p>;
}

function RuleDrawer({ code, range, controls, onClose }: { code: string; range: Range; controls: ToggleProps; onClose: () => void }) {
  const id = useId(), [page, setPage] = useState(1), [tab, setTab] = useState("journals");
  const params = new URLSearchParams({ rule: code, page: String(page) });
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);
  const url = `/api/progress?${params}`, query = useReportQuery<ProgressDetail>(url), retained = useRef<{ url: string; data: ProgressDetail } | null>(null);
  if (query.data) retained.current = { url, data: query.data };
  const data = query.data ?? (retained.current?.url === url ? retained.current.data : undefined);
  return <DetailDrawer titleId={`${id}-title`} className="progress-drawer" onClose={onClose}>
    <header className="drill-header"><div className="drill-heading"><div className="progress-drawer-status"><span className="tchart-rule-code">{data?.rule.displayCode ?? "Rule activity"}</span>{data && <Implementation rule={data.rule} />}</div><h2 id={`${id}-title`}>{data?.rule.name ?? "Rule activity"}</h2></div><button type="button" className="drill-icon-button drill-close" data-drawer-close aria-label="Close rule activity" onClick={onClose}><span aria-hidden="true">×</span></button></header>
    <div className="progress-drawer-body" aria-busy={query.pending}>
      {query.pending && !data ? <div className="drill-state drill-loading" role="status"><span className="report-spinner" aria-hidden="true" />Loading rule activity...</div> : query.error || !data ? <div className="drill-state" role="alert"><p>Rule activity could not be loaded.</p><button className="btn btn-quiet" type="button" onClick={query.retry}>Try again</button></div> : <>
        <section className="progress-rule-overview" aria-label="Rule details"><div className="progress-overview-top"><div><span className="progress-source-pill">{data.rule.sourceLabel}</span><span className="progress-overview-category">{categoryLabel(data.rule.category)}{data.rule.family ? ` / ${data.rule.family}` : ""}</span></div><div className="progress-posting-control"><span>Posting</span><RuleToggle rule={data.rule} controls={controls} /></div></div><div className="progress-overview-activity"><span className="progress-activity-legend">Succeeded / Failed / Posted</span><Activity rule={data.rule} /></div><dl className="progress-mapping"><div><dt>Debit</dt><dd aria-label="Debit accounts"><Accounts text={data.rule.debitLabel} /></dd></div><div><dt>Credit</dt><dd aria-label="Credit accounts"><Accounts text={data.rule.creditLabel} /></dd></div></dl></section>
        <div className="progress-detail-tabs" role="tablist" aria-label="Rule activity type">{[{ value: "journals", label: "Journals" }, { value: "attempts", label: "Attempts" }].map((item, index) => <button type="button" role="tab" key={item.value} id={`${id}-${item.value}-tab`} aria-controls={`${id}-panel`} tabIndex={tab === item.value ? 0 : -1} aria-selected={tab === item.value} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index;
          setTab(next === 0 ? "journals" : "attempts");
          event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
        }} onClick={() => setTab(item.value)}>{item.label}</button>)}</div>
        <section id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}-tab`}>
        {tab === "journals" ? <><ProgressJournalList journals={data.journals} /><Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} label="journals" /></> : <section className="progress-attempts" aria-label="Latest rule attempts"><p className="progress-tracking">Tracking started {timestamp(data.trackingSince)}. Earlier attempts are unavailable.</p><h3>Latest attempts (up to {data.attemptsLimit})</h3>{data.attempts.length ? <ul>{data.attempts.map(attempt => {
          const audit = safeAuditLink(attempt.auditLink);
          return <li key={attempt.id}><div className="progress-attempt-heading"><span className={`progress-stage ${attempt.outcome}`}>{attempt.outcome === "pending" ? "Pending review" : attempt.outcome === "failed" ? "Failed" : "Succeeded"}</span><time dateTime={attempt.occurredAt}>{timestamp(attempt.occurredAt)}</time>{audit && <a href={audit} target="_blank" rel="noopener noreferrer" className="progress-attempt-source" aria-label={`Open Airtable source ${attempt.sourceRecordId}`}><ReportIcon name="externalLink" /></a>}</div><span className="progress-record-id">{attempt.sourceRecordId}</span>{attempt.error && <p className="progress-attempt-error">{attempt.error}</p>}</li>;
        })}</ul> : <p className="progress-empty">No attempts were recorded for this rule in the selected period.</p>}</section>}
        </section>
      </>}
    </div>
  </DetailDrawer>;
}

export function ProgressWorkspace() {
  const [search, setSearch] = useState(""), [draft, setDraft] = useState(""), [category, setCategory] = useState(""), [implementation, setImplementation] = useState(""), [enabled, setEnabled] = useState("all"), [range, setRange] = useState<Range>({}), [page, setPage] = useState(1), [selected, setSelected] = useState<string | null>(null);
  const params = new URLSearchParams({ page: String(page) });
  for (const [key, value] of Object.entries({ q: search, category, implementation, enabled: enabled === "all" ? "" : enabled, ...range })) if (value) params.set(key, value);
  const url = `/api/progress?${params}`, query = useReportQuery<ProgressData>(url), refresh = useReportRefresh();
  const retained = useRef<{ url: string; data: ProgressData } | null>(null);
  if (query.data) retained.current = { url, data: query.data };
  const data = query.data ?? (retained.current?.url === url ? retained.current.data : undefined);
  const [savingCode, setSavingCode] = useState<string | null>(null), [errors, setErrors] = useState<Record<string, string>>({}), [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  useEffect(() => { if (query.data) setConfirmed({}); }, [query.data]);
  const toggle = async (ruleCode: string, value: boolean) => {
    if (savingCode !== null) return;
    setSavingCode(ruleCode);
    setErrors(previous => { const next = { ...previous }; delete next[ruleCode]; return next; });
    try {
      const result = await saveRuleEnabled(ruleCode, value);
      setConfirmed(previous => ({ ...previous, [result.ruleCode]: result.enabled }));
      refresh();
    } catch (error) { setErrors(previous => ({ ...previous, [ruleCode]: error instanceof Error ? error.message : "Could not update rule posting." })); }
    finally { setSavingCode(null); }
  };
  const controls: ToggleProps = { canManage: data?.canManage === true, savingCode, errors, enabled: confirmed, onToggle: toggle };
  const change = (update: () => void) => { update(); setPage(1); setSelected(null); };
  const submitSearch = () => { const value = draft.trim(); if (value !== search) change(() => setSearch(value)); };
  const filtered = !!draft || !!category || !!implementation || enabled !== "all" || !!range.from || !!range.to;
  return <article className="report-page ledger-page progress-page">
    <ReportPageHeader title="Progress" description="Chicago Brass Inc. / Ledger rules and posting activity" />
    <FilterBar label="Rule progress filters" className="progress-filter-bar no-print">
      <form className="ledger-global-search" role="search" onSubmit={event => { event.preventDefault(); submitSearch(); }}><SearchField label="Search rules" value={draft} onChange={setDraft} onBlur={submitSearch} placeholder="Code, rule or account" maxLength={200} /></form>
      <PeriodFilter range={range} onChange={value => change(() => setRange(value))} />
      <SearchableSelect label="Category" value={category} options={CATEGORIES} onChange={value => change(() => setCategory(value))} className="progress-category-filter" />
      <SearchableSelect label="Implementation" value={implementation} options={IMPLEMENTATION} onChange={value => change(() => setImplementation(value))} className="progress-implementation-filter" />
      <SearchableSelect label="Posting" value={enabled} options={[{ value: "all", label: "All rules" }, { value: "enabled", label: "Enabled" }, { value: "disabled", label: "Disabled" }]} onChange={value => change(() => setEnabled(value))} className="progress-enabled-filter" />
      <button className="btn btn-quiet control-reset" type="button" disabled={!filtered} onClick={() => change(() => { setDraft(""); setSearch(""); setCategory(""); setImplementation(""); setEnabled("all"); setRange({}); })}>Reset filters</button>
    </FilterBar>
    <div className="progress-context" aria-live="polite"><span>{data ? `${count(data.summary.enabled)} enabled / ${count(data.summary.rules)} rules` : "Rule activity"}</span><span>{data ? `Attempt tracking since ${timestamp(data.trackingSince)}. Earlier attempts are unavailable.` : "Posted counts include original journals; reversals are shown separately."}</span></div>
    <ReportDataPanel query={{ ...query, data, pending: query.pending && !data }} label="Loading rule progress">{data && <ProgressRulesTable data={data} selected={selected} onSelect={setSelected} onPage={setPage} controls={controls} />}</ReportDataPanel>
    {selected && <RuleDrawer key={selected} code={selected} range={range} controls={controls} onClose={() => setSelected(null)} />}
  </article>;
}
