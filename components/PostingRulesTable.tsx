"use client";

import { useMemo } from "react";
import type { TChartRow } from "@/lib/reports/ledger";
import { filterRules, groupRules, ruleAccounts } from "@/lib/reports/t-chart";
import { AccountPill } from "./AccountPill";
import "./ledger-tables.css";

function RuleAccounts({ text }: { text: string | null }) {
  const parts = ruleAccounts(text);
  if (parts.length === 0) return <span className="ledger-muted">-</span>;
  return (
    <ul className="tchart-accounts">
      {parts.map((part, index) => <li key={index}>{part.code
        ? <><AccountPill code={part.code} name={part.name ?? null} />{part.note && <small className="tchart-account-note">{part.note}</small>}</>
        : <span className="tchart-account-text">{part.text}</span>}</li>)}
    </ul>
  );
}

export function PostingRulesTable({ rules, query = "", category = "all" }: { rules: TChartRow[]; query?: string; category?: string }) {
  const groups = useMemo(() => groupRules(filterRules(rules, query, category)), [rules, query, category]);
  const shown = groups.reduce((total, group) => total + group.rules.length, 0);
  return (
    <section className="statement-panel ledger-table-panel" aria-label="Posting rules">
      <div className="table-wrap ledger-scroll" tabIndex={0} role="region" aria-label="Posting rules table">
        <table className="fin-table ledger-data-table tchart-table">
          <colgroup><col className="tchart-rule-col" /><col className="tchart-trigger-col" /><col className="tchart-account-col" /><col className="tchart-account-col" /><col className="tchart-when-col" /><col className="tchart-flag-col" /></colgroup>
          <thead><tr><th scope="col" className="label-cell">Rule</th><th scope="col" className="label-cell">Trigger</th><th scope="col" className="label-cell">Debit</th><th scope="col" className="label-cell">Credit</th><th scope="col" className="label-cell">When to post</th><th scope="col" className="label-cell">Reversible</th></tr></thead>
          {groups.length === 0
            ? <tbody><tr><td colSpan={6} className="ledger-empty">No posting rules match these display filters.</td></tr></tbody>
            : groups.map(group => (
              <tbody key={group.key}>
                <tr className="tchart-group-row"><th colSpan={6} scope="colgroup" className="label-cell">{group.label}<span>{group.rules.length} {group.rules.length === 1 ? "rule" : "rules"}</span></th></tr>
                {group.rules.map(rule => (
                  <tr key={rule.rule_code} className="row-account">
                    <th scope="row" className="label-cell"><span className="tchart-rule-code">{rule.rule_code}</span></th>
                    <td className="label-cell tchart-trigger">{rule.trigger_name}</td>
                    <td className="label-cell"><RuleAccounts text={rule.debit_accounts} /></td>
                    <td className="label-cell"><RuleAccounts text={rule.credit_accounts} /></td>
                    <td className="label-cell tchart-when">{rule.when_to_post || <span className="ledger-muted">-</span>}{rule.audit_trail && <small className="tchart-audit">Audit trail: {rule.audit_trail}</small>}</td>
                    <td className="label-cell">{rule.reversible == null ? <span className="ledger-muted">-</span> : rule.reversible ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            ))}
        </table>
      </div>
      <footer className="report-status ledger-table-footer"><span role="status">Showing {shown} of {rules.length} rules</span><span>Reference catalog. Airtable automations decide what posts.</span></footer>
    </section>
  );
}
