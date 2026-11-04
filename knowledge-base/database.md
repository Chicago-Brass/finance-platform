# Database and reporting schema

Project: [DUAL ENTRY - inzobaubbikyiekcfarj](https://supabase.com/dashboard/project/inzobaubbikyiekcfarj).
The metadata below was verified read-only on 2026-11-04. This documents structure, not the completeness
or business correctness of the current journal dataset. No data or schema was changed for this handoff.

## Tables

| Table | Purpose and important fields |
| --- | --- |
| `accounts` | `code`, `name`, `account_type`, `subtype`, `normal_balance`, `is_bank`, `is_postable`, `active`, `airtable_record_id` |
| `journal_entries` | Financial date/period, status, rule, source identity, transaction/event types, description, optional notes/audit URL, posting metadata and historical reversal links |
| `journal_lines` | Entry/line number, account/offset code, debit/credit, structured vendor/client/order/PO/invoice/staff/state refs, source line ID, audit URL and nullable branch |
| `accounting_periods` | Month/status and close metadata used by financial guards |
| `ledger_rules` | Rule code, category/title, chart metadata and descriptive notes |
| `ledger_rule_lines` | Catalog debit/credit lines, optional selectors and labels |
| `account_selectors`, `account_selector_members` | Existing catalog account group metadata |
| `app_users` | Approved email, role and active membership used for application access |

All nine listed public base tables have RLS enabled. The six reporting views were verified with
`security_invoker=true`: `v_account_monthly_activity`, `v_journal_entries`, `v_ledger`,
`v_rule_conformance`, `v_t_chart`, and `v_trial_balance`.

## Writer

The Edge Function connects through its runtime database URL, enters the intended database role and
uses parameterized Postgres.js SQL. It locks by FIN source, validates catalog/account references,
inserts draft headers and balanced lines, then marks headers posted within one transaction.

Amounts persist as database numerics. Posting pairs use positive decimal strings; debit and credit
account selection establishes direction. Account lookup can use the FIN record ID or account number.
FIN Nickel `0747` maps to ledger `112.300`; credit-card clearing is `231.100`.

Journal source identity, posted immutability, valid line/account references, one monetary side per line,
balanced entries and closed periods are protected by the service and existing database constraints/
guards. An exact source replay does not create a new journal. Do not clear or modify production
journals to test these guarantees.

`accounts.active` is treated as a label in the current reports/writer. `app_users.active` still gates
application access, and `is_postable` remains a posting
restriction. Branch attribution is deferred: `journal_lines.branch` exists, but the current Edge
writer does not populate it and the reports have no branch filter.

## Read API

- `get_trial_balance(p_as_of date, p_from date default null)` returns account metadata and posted
  debit/credit/balance aggregates. Income Statement uses period ranges; Balance Sheet and Trial
  Balance use cumulative snapshots.
- `get_trial_balances(p_as_of date[], p_from date[])` (migration `20261105120000`) answers up to 100
  (as-of, from) pairs in one call, one row per pair with that pair's accounts as JSON. It calls
  `get_trial_balance` for each pair, runs as SECURITY INVOKER and is executable only by
  `authenticated`. Income Statement and Balance Sheet loaders use it; until it is applied, the
  app falls back to one `get_trial_balance` call per pair.
- `v_journal_entries` supplies posted-entry counts.
- `v_ledger` supplies General Ledger records, including `entry_number`, `line_no`, `line_id`,
  account names/numbers, offset data, notes and audit URLs. Pagination is stable by date/entry/line.
- `v_t_chart` supplies displayed catalog rules; it is not the runtime category router.
- `current_app_role()` supports the existing approved-user gate.

Legacy `create_journal_entry`, `post_journal_entry` and `reverse_journal_entry` functions still exist
in the hosted schema. The new Edge writer does not call them. Their existence is not a reason to
silently delete them, alter their grants or replace the current direct-SQL implementation.

## Tracked migrations and truth limits

Local migrations include app-user allowlisting, invoker permissions, default privilege restrictions,
`20261029182556_add_journal_transaction_type.sql`, and
`20261103214849_add_journal_line_branch.sql`. The latest hosted migration metadata was verified as
`20261103214849 / add_journal_line_branch` during this handoff.

The test fixture is an older core-schema/catalog snapshot, not a complete current migration history.
Use the migration ledger and live metadata when changing schema. Existing posting guard functions
are allowed infrastructure; the design decision was to keep new accounting/posting logic in Edge,
not to remove every database function.

See [the generic webhook contract](../docs/ledger-webhook-contract.md) for envelopes, references,
replay behavior and HTTP errors, and [report mappings](../docs/ledger-reporting.md) for signs/grouping.
