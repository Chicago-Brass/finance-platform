# Ledger database and data contracts

Hosted project: [DUAL ENTRY - inzobaubbikyiekcfarj](https://supabase.com/dashboard/project/inzobaubbikyiekcfarj).
The schema and catalog are tracked in `supabase/`. Environment contents and journal completeness
must be verified separately from source or migration history.

## Tables

| Table | Data |
| --- | --- |
| `accounts` | Code/name, type/subtype, normal balance, bank/postable/active flags and FIN account identity |
| `journal_entries` | UUID, unique entry number, accounting date/period, status, description, rule, source identity, transaction/event metadata, optional notes/audit URL and posting timestamps |
| `journal_lines` | Entry ID, ordered line number, account/offset code, debit/credit, notes/audit URL, vendor/customer/order/PO/invoice/employee/state references and nullable branch |
| `accounting_periods` | Month/status and close metadata enforced by posting guards |
| `ledger_rules`, `ledger_rule_lines` | Rule catalog and descriptive debit/credit mappings |
| `account_selectors`, `account_selector_members` | Catalog account groupings |
| `app_users` | Approved email, role and active application membership |

Base tables use RLS. Reporting views use security-invoker semantics. Report requests run with the
signed-in identity, never a service-role key. `accounts.active` is a descriptive flag;
`app_users.active` gates access, and `is_postable` restricts posting.

## Writer

The generic `ledger-payment` Edge Function uses parameterized Postgres.js inside one transaction.
It resolves account identities, locks the source, checks replay equality, inserts a draft header
and lines, then posts the entry. Database guards enforce valid references, one positive monetary
side per line, balance, posting periods and posted immutability.

Account lookup accepts account number or FIN record ID. FIN Nickel `0747` maps to ledger `112.300`;
card clearing is `231.100`. Category calculations and amount splits remain in Airtable.
Exact replay is a duplicate/no-op; a changed financial packet conflicts. Runtime secrets and the
verified-TLS database connection stay in the Edge environment.

`journal_lines.branch` is reserved for attribution; the writer leaves it unpopulated and reports
have no branch filter. Names are labels; UUIDs, source references and entry/line identities are
used for lookup. Line money remains numeric in storage and is converted to checked integer cents
for report calculations.

## Read interfaces

| Interface | Use |
| --- | --- |
| `get_trial_balance(as_of, from)` | Posted debit/credit and natural balances for a range or cumulative snapshot |
| `get_trial_balances(as_of[], from[])` | Up to 100 requested periods, materializing posted activity once |
| `v_ledger` | Posted line records, resolved account/offset metadata, refs and audit links |
| `search_ledger` | Literal global search and account/offset/side/date filtering before pagination |
| `v_journal_entries` | Entry summaries and counts |
| `v_t_chart` | Displayed rule catalog, not the automation router |
| `current_app_role()` | Approved-user role gate |
| `v_account_monthly_activity`, `v_trial_balance`, `v_rule_conformance` | Additional reporting/catalog interfaces |

Ledger pagination is stable by date, entry number and line number. Full-journal detail reads one
posted `journal_entries` header by unique entry number and all `journal_lines` by entry UUID,
ordered and paged in batches of 500. Account names join through the account FK. It does not inherit
Ledger display filters or the 100-line report-page limit.

Income Statement ranges and cumulative Balance Sheet snapshots have different semantics. Every
Balance Sheet column uses its own prior-year baseline to separate current and unclosed prior
income from recorded equity. Account classification and signs are defined in
[report mappings](../docs/ledger-reporting.md).

## Migrations and seed

- `20261105141013_initial_ledger.sql`: complete public-schema baseline.
- `20261105143952_optimize_report_reads.sql`: shared batched-aggregation scan and indexed offset lookup.
- `20261105150253_add_ledger_search.sql`: scoped literal search before pagination.
- `seed.sql`: reference accounts, selectors and rules only; no users, periods or financial entries.

Keep applied migrations intact and add forward migrations for schema changes. A baseline marker
on an existing environment does not authorize replaying initial CREATE statements there. Compare
hosted schema/history before applying changes; see [baseline procedures](../docs/database-baseline.md).

Legacy create/post/reverse database functions remain in the schema. The generic Edge writer does
not call them. Preserve their grants and guards unless removal is specifically authorized.
