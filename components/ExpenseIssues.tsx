"use client";

import { useId, useRef, useState } from "react";
import { EXPENSE_ISSUES_URL, ISSUE_NOTE_LIMIT, type ExpenseIssue } from "@/lib/progress/expense-issues";
import { MaintenanceTabs } from "./MaintenanceTabs";
import { ReportPageHeader } from "./ReportPageHeader";
import { useReportQuery } from "./ReportData";
import { ReportIcon } from "./ReportIcons";
import { safeAuditLink } from "./ledger-table-utils";

type IssueChanges = Partial<Pick<ExpenseIssue, "notes" | "resolved">>;

function ExpenseIssueCard({ issue, onChange }: {
  issue: ExpenseIssue;
  onChange: (changes: IssueChanges) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    setFailed(false);
    try {
      const response = await fetch(EXPENSE_ISSUES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: issue.id, note: draft }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The note could not be saved.");
      onChange({ notes: result.notes });
      setDraft("");
      setMessage("Note saved.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "The note could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus() {
    setChangingStatus(true);
    setStatusError("");
    try {
      const response = await fetch(EXPENSE_ISSUES_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: issue.id, resolved: !issue.resolved }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The issue status could not be saved.");
      onChange({ resolved: result.resolved });
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "The issue status could not be saved.");
    } finally {
      setChangingStatus(false);
    }
  }

  return <article className={issue.resolved ? "maintenance-card is-resolved" : "maintenance-card"} aria-labelledby={id}>
    <div className="maintenance-card-heading">
      <div><p className="maintenance-category">Category - Expenses</p><h3 id={id}>{issue.title}</h3></div>
      <button type="button" className="btn btn-quiet maintenance-resolve" aria-pressed={issue.resolved}
        disabled={changingStatus} onClick={() => void changeStatus()}>Resolved</button>
    </div>
    {statusError && <p className="maintenance-status-error" role="alert">{statusError}</p>}
    <ul className="maintenance-codes" aria-label="Affected rules">{issue.rules.map(rule => <li key={rule.code}>
      <span className="maintenance-rule-code">{rule.code}</span>
      <span><strong>{rule.trigger ?? "Trigger name unavailable"}</strong><small>{["Expenses", rule.source].filter(Boolean).join(" / ")}</small></span>
    </li>)}</ul>
    <dl className="maintenance-finding">
      <div><dt>Context</dt><dd>{issue.context}</dd></div>
      <div><dt>Issue</dt><dd>{issue.finding}</dd></div>
      <div><dt>Potential solutions</dt><dd>
        <ul>{issue.recommendation.split("\n").map(option => <li key={option}>{option}</li>)}</ul>
      </dd></div>
    </dl>
    <section className="maintenance-examples" aria-label="Example records">
      <h4>Example records</h4>
      <ul>{issue.examples.map(example => {
        const href = safeAuditLink(example.url);
        return <li key={example.url}>
          {href ? <a href={href} target="_blank" rel="noopener noreferrer">{example.label}<ReportIcon name="externalLink" /></a> : <strong>{example.label}</strong>}
          <span>{example.detail}</span>
        </li>;
      })}</ul>
    </section>
    <form className="maintenance-notes" onSubmit={event => { event.preventDefault(); void save(); }}>
      <div className="maintenance-note-history" aria-label="Review notes">
        <strong>Review notes</strong>
        {issue.notes && <div className="maintenance-note-text">{issue.notes}</div>}
      </div>
      <label htmlFor={id + "-notes"}>Add a note</label>
      <textarea id={id + "-notes"} value={draft} disabled={saving} maxLength={ISSUE_NOTE_LIMIT} rows={4} placeholder="Add a decision, correction, or follow-up..." onChange={event => {
        setDraft(event.target.value);
        setMessage("");
      }} />
      <div className="maintenance-note-actions">
        {message && <span role={failed ? "alert" : "status"}>{message}</span>}
        <button className="btn btn-primary" type="submit" disabled={saving || !draft.trim()}>{saving ? "Saving..." : "Save note"}</button>
      </div>
    </form>
  </article>;
}

export function ExpenseIssues() {
  const query = useReportQuery<ExpenseIssue[]>(EXPENSE_ISSUES_URL);
  const retained = useRef<ExpenseIssue[] | undefined>(undefined);
  if (query.data) retained.current = query.data;
  const issues = query.data ?? retained.current;

  function updateIssue(id: string, changes: IssueChanges) {
    retained.current = retained.current?.map(issue => issue.id === id ? { ...issue, ...changes } : issue);
    query.retry();
  }
  return <article className="report-page maintenance-page">
    <ReportPageHeader title="Maintenance" description="Chicago Brass Inc. / Ledger rules and review" />
    <MaintenanceTabs active="issues" />
    <section className="maintenance-issues" aria-labelledby="expense-issues-title">
      <header className="maintenance-issues-heading"><h2 id="expense-issues-title">Expense issues</h2><p>Ledger review for January 1 through November 16, 2026</p></header>
      {query.error && <div role="alert"><p>Expense issues could not be refreshed.</p><button type="button" className="btn btn-quiet" onClick={query.retry}>Try again</button></div>}
      {issues?.length ? issues.map(issue => <ExpenseIssueCard key={issue.id} issue={issue} onChange={changes => updateIssue(issue.id, changes)} />)
        : query.pending ? <p role="status">Loading expense issues...</p>
        : !query.error && <p>No expense issues are available.</p>}
    </section>
  </article>;
}
