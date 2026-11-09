# Accounting period management

## Ownership

Airtable supplies category/account calculations. The shared Edge writer validates them and either posts or captures a durable review request. Period actions use the signed-in user's JWT and the live `app_users.can_manage_periods` boolean. The webhook secret cannot approve requests. New app users default to disabled; the initial deployment enables existing users only at Jeric's explicit instruction.

## Behavior

- Open periods accept new, valid requests. Missing periods require explicit opening/review.
- Closed periods retain valid requests without creating financial journals or Airtable posting markers.
- Pending and rejected requests stay blocked on webhook/worker retries, including after reopening.
- A changed captured packet supersedes the earlier unposted request and requires fresh review.
- Approving a request posts only its captured packet. The period can remain closed.
- Approval, journal creation and the audit event commit together. A request-scoped, transaction-bound database guard prevents reuse of an approval as a general bypass.
- The same source lock coordinates native posting, review approval and reversal. Period shared/exclusive transaction locks coordinate posting and closing.
- A reversal review captures its original journal target set. Additional source journals require a new review.
- Successful journals retain existing immutable-replay and reversal protections. Airtable links are written after commit and can be repaired without reposting.
- Rejected/superseded packets do not silently reactivate. No record is approved merely by reopening a period.

## UI

`/periods` shares the report navigation and layout. Each month has posted journals, review requests and append-only history. Posted entries reuse the journal drawer. Review details show the exact account pairs and signed amounts, source links and relevant dates. The review list defaults to pending and link-repair requests, with an All requests filter. Closing with unresolved pending requests requires explicit deferral and a reason.

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
- `supabase/migrations/20261109162203_enforce_pending_period_review.sql`: prevents direct/manual posting from bypassing a queued review after reopening.

The staged daily worker remains unscheduled. It recognizes held requests and does not mark them posted. Invalid requests still fail validation instead of becoming trusted approvals. This queue covers received events; it does not discover Airtable records that have never reached the pipeline.

## Checks

`sh supabase/tests/check-payment-posting.sh` uses a disposable loopback database. Period tests cover closed capture, reopen/retry persistence, single closed-period exceptions, permission denial, changed packets, reversals, missing periods, append-only history, rollback, concurrent close/approval and writeback recovery. Also run TypeScript, the Edge checks, native reversal checks, and focused middleware/report/journal tests. Never close real accounting months or post financial fixtures merely to test the UI.

## Installed state

The period schema and pending-review guard are installed in DUAL ENTRY. The existing five app users have `can_manage_periods=true` by explicit authorization; future users default to false. The original 144 journals remain intact. The three Edge endpoints are published, and all 11 native automation instances have review-aware response handling. The daily worker is still not deployed or scheduled. The Period Management frontend is available locally; it has not been deployed to production.

Before the user stopped further QA, the disposable posting/reversal/review suite passed 66 checks, report database reads passed 12 checks, the focused app/auth cohort passed 36 checks, native reversal checks passed nine checks, and TypeScript/Edge checks passed. The live-backed page was inspected on desktop. Full end-to-end period actions in the browser and additional visual QA were not completed.
