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
| `accounting_periods` | Explicit Open/Closed months and close metadata |
| `ledger_posting_requests` | Captured packets, review decisions, target/result journal IDs and link-repair state |
| `ledger_period_history` | Append-only period/review actions and closing account-balance snapshots |
| `ledger_rules`, `ledger_rule_lines` | Rule catalog and descriptive debit/credit mappings |

The deployed ledger sync webhook uses `ledger_daily_runs` for a global unfinished-run check,
renewable run leases and JSON checkpoints. Its migration was applied and recorded on DUAL ENTRY
on 10 November 2026. It adds no
database posting function, frontend grants or active schedule.

Business references use text arrays: vendor_ref, customer_ref, order_ref, po_ref, invoice_ref,
employee_ref and state_ref. The 7 November reference migration preserves prior single links as
one-item arrays. Missing links use empty arrays. State record IDs are separate from state_code.
The writer retains every supplied link; array order and duplicate IDs do not affect replay equality.
No historical links previously omitted by the receiver are inferred or backfilled.

Account active is a label; is_postable controls posting eligibility. App-user activation and
authorization remain enforced independently. The account-active migration changes only the
account label condition in the existing line guard; posted immutability and financial guards remain.
| `account_selectors`, `account_selector_members` | Catalog account groupings |
| `app_users` | Approved email, role, active membership and `can_manage_periods` capability |

Base tables use RLS. Reporting views use security-invoker semantics. Report requests run with the
signed-in identity, never a service-role key. `accounts.active` is a descriptive flag;
`app_users.active` gates access, and `is_postable` restricts posting.

## Writer

The generic `ledger-payment` Edge Function uses parameterized Postgres.js inside one transaction.
It resolves account identities, locks the source, checks replay equality, inserts a draft header
and lines, then posts the entry. Database guards enforce valid references, one nonzero monetary
side per line, balance, posting periods and posted immutability.

Whole-journal deletion is allowed by `20261109224024_allow_journal_entry_deletion.sql`.
Delete the `journal_entries` row; its `journal_lines` are removed by the existing cascading
foreign key. Posted-entry updates and direct posted-line updates/deletes remain blocked.

The posting service uses this permission only for journals newly created by the failing call.
A targeted Airtable read must first confirm none of those IDs was saved. A full three-field match
is success; unreadable or partial outcomes are reported without assuming rollback. Compensation
shares the source advisory lock and never deletes older or duplicate journal IDs. Daily processing
reports source errors and continues; run-budget exhaustion still pauses for resume. There is no
cross-system transaction, so interrupted or late-write outcomes can require manual reconciliation.
An original with a linked reversal must have the reversal removed first, as required by the
existing foreign key. This schema capability does not add automatic deletion to any webhook
or clear Airtable metadata.

Account lookup accepts account number or FIN record ID. FIN Nickel `0747` maps to ledger `112.300`;
card clearing is `231.100`. Category calculations and amount splits remain in Airtable.
Exact replay is a duplicate/no-op; a changed financial packet conflicts. Runtime secrets and the
verified-TLS database connection stay in the Edge environment.

The writer stores nullable `journal_lines.branch`. The four financial reports filter this value
through optional `p_branch` parameters on the trial-balance and ledger read functions. Consolidated
includes all lines, including NULL and branches outside the named dropdown options. The account-entry migration adds `journal_entries.source_entry_key` to journal
identity so one source/category can have separate account entries. Existing whole-category entries
keep an empty key. Migration and receiver deployment are pending. Names are labels; UUIDs, source references and entry/line identities are
used for lookup. Line money remains numeric in storage and is converted to checked integer cents
for report calculations.

## Read interfaces

| Interface | Use |
| --- | --- |
| `get_trial_balance(as_of, from)` | Posted debit/credit and natural balances for a range or cumulative snapshot |
| `get_trial_balances(as_of[], from[])` | Up to 100 requested periods, materializing posted activity once |
| `v_ledger` | Posted line records, resolved account/offset metadata, refs and audit links |
| `search_ledger` | Older database API retained in applied schema; the app uses `filter_ledger` |
| `v_journal_entries` | Entry summaries and counts |
| `v_t_chart` | Displayed rule catalog, not the automation router |
| `current_app_role()` | Approved-user role gate |
| `filter_ledger(...)` | Caller-scoped search and ledger filters before stable pagination |
| `count_ledger(...)` | Matching posted line count, with a lean path for scopes without search/offset |
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
- `20261105213016_ledger_filters.sql`: unified caller-scoped ledger filters and pagination.
- `20261105215238_ledger_record_count.sql`: full filtered ledger line counts.
- `seed.sql`: reference accounts, selectors and rules only; no users, periods or financial entries.

Keep applied migrations intact and add forward migrations for schema changes. A baseline marker
on an existing environment does not authorize replaying initial CREATE statements there. Compare
hosted schema/history before applying changes; see [baseline procedures](../docs/database-baseline.md).

Legacy create/post/reverse database functions remain in the schema. The generic Edge writer does
not call them. Preserve their grants and guards unless removal is specifically authorized.

## Signed journal amounts

Invoice Entry preserves signed source amounts. `20261107000900_signed_journal_amounts.sql`
removes the nonnegative line checks, retains one nonzero side per line, and updates ledger
side/offset queries to use the populated column rather than its sign. The generic Edge writer
stores equal signed debit/credit pairs on Airtable's stated accounts. Balance, closed-period,
RLS and posted-entry immutability guards remain unchanged. Existing journals are not rewritten.

Period review and request-scoped approvals are documented in [Period management](../docs/period-management.md). Period services remain in Edge code; database triggers enforce immutability, explicitly open periods and transaction-bound approval exceptions.
