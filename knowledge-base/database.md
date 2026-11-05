# Database and reporting schema

Project: [DUAL ENTRY - inzobaubbikyiekcfarj](https://supabase.com/dashboard/project/inzobaubbikyiekcfarj).
Fresh migrations and read equivalence were verified on 2026-11-05. This documents structure,
not the completeness or business correctness of the current journal dataset. The missing batched
reporting function and restricted future-function default were aligned without changing journals.

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
- `get_trial_balances(p_as_of date[], p_from date[])` (included in the initial baseline) answers up to 100
  (as-of, from) pairs in one call, one row per pair with that pair's accounts as JSON. It reads
  posted activity once for all pairs, runs as SECURITY INVOKER and grants report access to
  `authenticated`. Income Statement and Balance Sheet loaders use it. A missing-function fallback
  remains for databases that have not adopted this baseline; DUAL ENTRY has the function.
- `20261105143952_optimize_report_reads` replaces the batched function's per-period scans with
  one shared activity scan. `v_ledger` now resolves offsetting accounts through an indexed lateral
  lookup within each candidate entry instead of materializing/self-joining the entire line table.
  Column types, accounting results, invoker security and grants are preserved. The applied initial
  baseline remains unchanged; this is a normal forward migration.
- `v_journal_entries` supplies posted-entry counts.
- `v_ledger` supplies General Ledger records, including `entry_number`, `line_no`, `line_id`,
  account names/numbers, offset data, notes and audit URLs. Pagination is stable by date/entry/line.
- `v_t_chart` supplies displayed catalog rules; it is not the runtime category router.
- `current_app_role()` supports the existing approved-user gate.
- `search_ledger` (migration `20261105150253`) applies literal substring search and account/offset/
  side/date scope before stable pagination. It runs as SECURITY INVOKER, with no anon/PUBLIC execute.
  The empty-search path still uses the optimized ledger view directly. No posting function or
  financial amount behavior was changed for dashboard search.

Legacy `create_journal_entry`, `post_journal_entry` and `reverse_journal_entry` functions still exist
in the hosted schema. The new Edge writer does not call them. Their existence is not a reason to
silently delete them, alter their grants or replace the current direct-SQL implementation.

## Tracked migrations and truth limits

`20261105141013_initial_ledger.sql` is the complete public-schema starting point. The six partial
local migrations were consolidated with the hosted-only original schema. Their history remains in Git.
Hosted history is replaced by the applied baseline marker after schema equivalence is verified;
the initial CREATE statements are never replayed against the existing project.

`supabase/seed.sql` holds reference accounts, selectors and rules. It excludes users, periods and
journals. Both database test runners now restore the actual initial migration and this seed, rather
than a historical schema fixture. Only the Supabase platform auth dependencies are mocked locally.
See [baseline procedures and verification](../docs/database-baseline.md).

See [the generic webhook contract](../docs/ledger-webhook-contract.md) for envelopes, references,
replay behavior and HTTP errors, and [report mappings](../docs/ledger-reporting.md) for signs/grouping.
