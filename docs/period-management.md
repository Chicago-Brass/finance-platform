# Accounting period management

## Ownership

Airtable supplies category/account calculations. The shared Edge writer validates them and writes each journal as posted or pending review. Period actions use the signed-in user's JWT and the live `app_users.can_manage_periods` boolean. The webhook secret cannot approve requests. New app users default to disabled; the initial deployment enables existing users only at Jeric's explicit instruction.

## Behavior

- Open periods accept new, valid requests. Missing periods require explicit opening/review.
- Closed or missing periods save valid journals and lines as pending and write their IDs to Airtable. General Ledger and Periods show pending journals. Financial statements, trial balance, their drilldowns and exports count posted journals only.
- Pending and rejected requests stay blocked on webhook/worker retries, including after reopening.
- A changed packet supersedes the earlier request for the same rule scope and retains its old journal as rejected. Independent rules on the same source keep separate review decisions.
- Approval promotes the saved journals with their existing IDs. The period can remain closed. Legacy requests without saved journals materialize their captured packet on approval.
- The approval, status change and audit event commit together. A request-scoped, transaction-bound database guard prevents reuse of an approval as a general bypass.
- The same source lock coordinates native posting, review approval and reversal. Period shared/exclusive transaction locks coordinate posting and closing.
- A reversal review captures its original journal target set. Additional source journals require a new review.
- Successful journals retain existing immutable-replay and reversal protections. Airtable links are written after commit and can be repaired without reposting.
- Rejected/superseded packets do not silently reactivate. No record is approved merely by reopening a period.

## UI

`/periods` shares the report navigation and layout. Its toolbar contains Date range and Group by;
presets and custom ranges support multiple years or quarters. Ranges use whole accounting months.
The left list selects the month, quarter or year, newest first, with compact green Open or red Closed pills.
Missing periods display Closed without creating a period or bypassing the review requirement.
Mixed groups keep a neutral Mixed pill. Posted journals, review requests and append-only history
aggregate over the selected group. Yellow badges show pending-review counts on both the group and tab.
Close period and Reopen period appear only in month grouping for authorized users. Grouped views
do not change several months at once. Posted entries reuse the journal drawer.
Selecting a review row opens its saved journal lines in a sidebar. Authorized reviewers can keep
the original accounting date as an exception or choose a new date in a different open month. Both
decisions require a reason. The review preserves the original request date, journal IDs and source
date, and records the original and final posting dates in history. Requests awaiting Airtable
writeback still offer Retry links without posting another journal.
Closing with unresolved pending requests requires explicit deferral and a reason.

History records actors, reasons, decisions, resulting journal IDs and a compact account-balance snapshot on close. The overview labels adjustments posted after the last close. Existing statement/ledger links and Excel/PDF exports are reused; there is no separate report-versioning engine.

`source_date` records the source event date; `entry_date` remains the accounting date. Existing created/posted timestamps record receipt/posting. Historic source dates remain NULL rather than being invented. No automatic date shifting, year-end earnings transfer or restoration of reversed sources is implemented.

## Code

- `supabase/functions/_shared/period-review.ts`: source/period locks, capture, deduplication and history.
- `supabase/functions/ledger-payment/ledger.ts`: validated posting and shared review gate.
- `supabase/functions/ledger-reversal/reversal.ts`: source-owned reversal and review target checks.
- `supabase/functions/ledger-periods/`: user authentication, period/review actions and link recovery.
- `app/api/periods/route.ts`: user-scoped, paginated overview/details reads.
- `components/PeriodManagement.tsx`: page, review and action drawers.
- `supabase/migrations/20261109155126_period_management.sql`: capability, queue, history, reporting view and financial guards.
- The pending-journal migrations add review statuses, preserve posted-only financial reads and enforce review decisions in the journal guards.

The production daily worker runs at 11 PM America/Chicago; develop remains unscheduled. It
records pending attempts separately from reportable postings. Invalid requests still fail validation
instead of becoming trusted approvals. This queue covers received events; it does not discover
Airtable records that have never reached the pipeline.

## Checks

`sh supabase/tests/check-payment-posting.sh` uses a disposable loopback database. Period tests cover closed capture, reopen/retry persistence, single closed-period exceptions, permission denial, changed packets, reversals, missing periods, append-only history, rollback, concurrent close/approval and writeback recovery. Also run TypeScript, the Edge checks, native reversal checks, and focused middleware/report/journal tests. Never close real accounting months or post financial fixtures merely to test the UI.

## Installed state

The period schema and pending-review guard are installed in DUAL ENTRY. The initial five app
users received `can_manage_periods=true` by explicit authorization; new users default to false.
The Period Management page is deployed in the finance application.

On 12 November 2026, `ledger-periods` v3 was published with JWT verification enabled and the
current posting, reversal, source-lock and writeback dependencies. It supports exception approval
for Payments, Invoices, Invoice Lines, Prepay Expenses Log and Depreciation Table.
`ledger-payment` v20, `ledger-reversal` v8 and `ledger-daily` v12 were published alongside it;
all 42 downloaded runtime modules matched local source. The daily worker remains unscheduled.
All five native reversal automations were reloaded ON with saved scripts and inputs verified.

Current isolated checks passed 91 disposable posting/reversal/review checks, 11 native reversal
checks, 56 focused checks, 17 report checks and TypeScript. An additional disposable proof
covered closed-period reversal capture, authorized exception approval, metadata writeback and
duplicate-free retry for all five source tables, using mocked Airtable calls.

Authorized live testing posted and reversed 66 journals from 62 Expense sources across 15 rules.
All source writebacks were verified, and report builders/date windows/branch reads reconciled
to stored lines. Missing periods were not opened to force samples; a category with only
missing-period candidates remains a coverage gap. No real accounting period state was
changed for the test. Historical checks are separate from this current deployment evidence.
