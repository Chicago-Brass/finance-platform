# Ledger sync webhook

Deployed to DUAL ENTRY as `ledger-daily` version 6 on 10 November 2026, covering Category - Payment,
Category - Expenses and Category - Invoice Entry. Migration `20261108230411_ledger_daily_runs.sql`
is applied and recorded on the hosted project. The endpoint uses the existing server-side secrets.

Endpoint: `https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-daily`
Header: `x-ledger-secret` = the existing Dual Ledger Webhook Secret; use Content-Type application/json.
No scheduler or caller has been activated. No sync/posting run was executed during deployment;
the checkpoint table was independently read back empty. Missing/invalid request secrets return HTTP 401. Checkpoint RLS is enabled; only service_role
has SELECT/INSERT/UPDATE access, with no anon/authenticated table access.
Native posting remains enabled and uses the same post-and-writeback service. Reversal and period approvals keep their existing commit/retry behavior until separately changed.

## Trigger and lock

An Airtable or Make scheduler calls this authenticated webhook whenever needed. The caller owns
the schedule, including 11 PM America/Chicago if desired. There is no server-side time-of-day gate.

A transaction-wide advisory lock serializes run acquisition. Before creating a run, the store checks
for any unfinished run, across every run key and category scope. A conflicting call returns HTTP 409
with the active run key. The current invocation holds a three-minute renewable lease; another call
cannot execute the same run while that lease is held. An interrupted or paused run must be resumed
using its original run key and options. The lease expires after a crash; the unfinished run remains
available to resume rather than silently allowing a second sync.

The caller sends `{}` to start a preview, or explicit `dryRun:false` for posting after activation.
For a paused response, submit `requestForResume` unchanged until `done:true`. A completed run key
returns its completed result; omit runKey to start a new run. A long sync spans several webhook
calls, not one unlimited Edge execution. The default batch is 25 sources, maximum 50, with 80
Airtable requests and a 90-second application budget per invocation.

## Temporary date scope

All webhook processing and test previews use the last 30 UTC calendar days, including today.
The range rolls forward automatically and excludes future dates. Payment categories use
Payment Date, cancellation uses Payment Cancelled Date, and reconciliation uses its accounting
date. Expense/Invoice Entry categories use Invoice Date; logs use their recorded date. Invoice-owned
payment categories filter eligible linked payments by Payment Date, so an old invoice with a new
payment remains eligible. Created Time is not used. The final calculated accounting date is checked
again before posting or returning a test record, including resumed candidate snapshots.

## Category definitions

The workbook snapshot downloaded on 10 November 2026 has 51 categories. The registry includes
47 non-deferred categories over 49 paths; two Payment rules have separate source/event paths.
Of those 47, 45 have functioning mappings and two partial mappings remain blocked. Four deferred
rows are excluded: Expenses row 9, Invoice Entry rows 3 and 12, and Payment row 15.

| File | Responsibility |
| --- | --- |
| `rules/payments.ts` | Payment queries and their linked invoice/line discovery |
| `rules/expenses.ts` | Expense invoice, depreciation and prepaid-log queries |
| `rules/invoice-entry.ts` | Invoice Entry queries |
| `rules/common.ts` | Shared formula fragments and linked-line traversal |
| `rules/chart.ts` | Official row identity, trigger, mapping and clarification snapshot |
| `queries.ts` | Registry plus source-owned posting/reversal exclusions |
| `categories/*.js` | Named category functions ported from the current native scripts |
| `categories/index.ts` | Source selection, accounting dates and prepared writer payloads |
| `airtable.ts` | Field-ID schema resolution, filtered/batched reads and controlled writes |
| `runner.ts` | Paginated discovery, calculation, posting, checkpoints and resume |
| `store.ts` / `run-lock.ts` | Global run ownership, leases, authoritative journals and generic writer |
| `writeback.ts` | Source-owned journal IDs and `{rule,key,datetime,id}` metadata |
| `inspect.ts` | GET-only filter/calculation inspection, without database access |
| `handler.ts` / `index.ts` | Webhook authentication, input validation and runtime wiring |

Rules retain the chart's account mappings, signed amounts, notes and reference fields. Invoice-line
categories sum at four-decimal precision per account, then round the account subtotal to cents.
Separate accounts create separate journals. Working partial mappings retain their native limits,
including excluded payroll benefits/fees, the outbound vendor filter and expense-credit mapping.

PAY-10 (Payment row 11, discount) and PAY-23 (Payment row 24, insurance) include their known
filters but cannot post while their account mapping is pending. Matched candidates are reported
once per category rather than repeatedly reading every source to hit the same known blocker.

## Discovery and processing

1. Resolve current Airtable field names using stable field IDs.
2. Apply each category's direct filters, plus exact quoted-rule exclusion in Ledger Postings and
   the source's cancellation/reversal controls. Invoice rules do not require Create Entry.
3. When conditions live on linked tables, query those first and follow bounded linked IDs. Payroll
   Payment rules traverse Invoice Lines -> Invoices -> Payments. Expense payroll rules traverse
   Invoice Lines -> Invoices. Cross-record comparisons stay in the category function.
4. Snapshot all candidate IDs before writeback changes the filter. Discovery is paginated and
   checkpointed. Broad candidates are not a promise that every record will create a journal.
5. Load selected fields in batches, bulk-check existing journals, then call the category function.
6. Use the existing generic writer for atomic journal recording, immutable replay and period review.
   A held/rejected period request receives no posted marker. New categories may be added to an
   existing source; an already-posted category is final until an explicit correction workflow.
7. Reuse the native posting/reversal helper under the source lock to rebuild Ledger Postings,
   Ledger Journal IDs and Reversal Journal IDs. Independently read Airtable back before success.
   PATCH, verification GET and retries share the daily request counter and invocation deadline.
8. Save progress after each source, including a reported source failure, and continue the batch.
   A failed posting transaction never updates Airtable. On writeback failure, read the exact source's
   three ledger fields. A full match is success even if the PATCH response was lost. If none of this
   attempt's new journal IDs are present, delete only those new journals in one transaction; their
   lines cascade. Earlier and duplicate journals are preserved. The next normal run can rediscover
   the rolled-back source because it has no new category marker.
9. An unreadable response, partial save containing a new ID, or failed rollback is reported as
   unconfirmed; never guess and delete referenced journals. Other sources continue. Existing journal
   retries still deduplicate and can synchronize their links. There is no repair queue or outbox.
   Run-budget exhaustion pauses the invocation for resume; it is not a source validation failure.

New posting requires room for four Airtable requests and at least 40 seconds of invocation budget.
Normal writeback uses one PATCH and one filtered GET selecting only the three ledger fields and
one record. A lost PATCH response is checked before any new write is attempted. Verification GETs
can retry twice; rollback deletes by exact newly created journal IDs and source ownership under the
same source lock. A failure returns no posted count for that attempt. Detailed run errors retain
up to 20 examples; the error count includes every failed source/category.

This is compensation across two systems, not a distributed transaction. A server-side Airtable
write can finish after its client timeout and verification read; a terminated Edge invocation or
lost database commit acknowledgment can also leave an uncertain outcome. Exact replays remain
idempotent, but unconfirmed outcomes require checking before treating the source as reconciled.

Payment categories PAY-04 shortfall, PAY-11 vendor credits, PAY-25 interest and PAY-27 rebates are
invoice-owned. They use the latest eligible Sent payment's Payment Date (record ID breaks ties),
while their journal marker belongs to the invoice. Confirm this date convention before activation.
The payment audit link is preserved. Zero/nonqualifying calculations create no monetary journal.

Reversal remains the existing separate endpoint and automation. Reversed sources are excluded;
uncheck-and-repost restoration is still deferred. Native posting automations must be disabled at
cutover, while the reversal automations remain enabled.

## Tables awaiting writeback setup

Invoices and Payments have Ledger Postings and Ledger Journal IDs. Depreciation Table and Prepay
Expenses Log currently have no configured marker fields. Their filters and calculations work in
inspection, but posting is explicitly blocked before a journal is created until their writeback
strategy is selected. No new fields are created by this implementation.

## Webhook test mode

Send `test:true` with the same x-ledger-secret to fetch candidates, run category filters and
calculations, and return proposed records. It always stays read-only, even if dryRun:false is
included. It does not connect to the database, acquire the posting lock, write checkpoints,
post journals or update Airtable. Test progress travels in the response.

```json
{"test":true,"categoryCodes":["EXP-01"],"maxRecords":25}
```

Omit categoryCodes for all supported categories. The response contains `records`, each with:
`table`, `tableId`, `recordId`, `rule`, `category`, `entryKey`, `date`, `debitAccount`,
`creditAccount` and `amount`. Amounts retain their signs. Account numbers are read from FIN;
the existing Nickel 0747 -> 112.300 identity mapping is preserved. There is one row per nonzero
proposed debit/credit pair; a source can produce several rows.

When done:false, submit requestForResume unchanged to continue the test. Every resume request
retains test:true and carries its cursor; it cannot become a posting run. maxRecords bounds
source records evaluated per call, not the number of resulting posting pairs. Queries retain
pagination and the normal 90-second/80-request budget, so an early batch can return no rows while
still discovering candidates. Pending mappings appear in errors/blockedCategories, not as guessed
account pairs. Zero/nonqualifying calculations are excluded from records.

This previews Airtable filters/calculations. It does not run the database account, period,
immutable-replay or historical-reversal validations. Actual posting retains those guards.
The existing dryRun mode still uses durable checkpoint metadata; test:true is the no-write option.

## Read-only query benchmark

Use the separate inspector when **no database writes at all** are allowed. It imports no database
client, uses a read-only Airtable client and rejects non-GET requests. It does not create checkpoint
rows, unlike the resumable webhook's dryRun mode, which saves checkpoint metadata but no journals.
Private sample payloads are written only to the chosen local output, never to repository fixtures.

```sh
node scripts/inspect-ledger-sync.mjs --env-file=/absolute/path/to/private.env --max-pages=1 --samples=1
node scripts/inspect-ledger-sync.mjs --env-file=/absolute/path/to/private.env --max-pages=Infinity --samples=0
```

The first command bounds discovery and calculates one sample per populated path. The second
paginates all candidate-filter results without evaluating every source. Neither is a full posting
runtime benchmark. A discovery query count excludes the later calculation, journal and writeback
requests. A zero candidate count does not establish live coverage for that category.

## Activation still required

- Confirm historical/go-live scope. Blank markers currently include older eligible records.
- Decide metadata fields for depreciation and prepaid logs, and resolve or leave blocked mappings.
- Checkpoint migration applied on 10 November 2026; verify hosted state before a later cutover.
- Configure server-only AIRTABLE_PAT, SUPABASE_DB_URL and LEDGER_WEBHOOK_SECRET.
- The webhook is deployed; wire the external scheduler and resume loop only after authorization.
- Confirm native posting cutover and retain the dedicated reversal endpoint.

A single source's linked graph still needs to fit an invocation. Add persisted child-read progress
if real source graphs exceed the budget; do not assume arbitrary graph sizes fit Edge limits.

## Writeback deployment verification

On 10 November 2026, `ledger-daily` version 6 and `ledger-payment` version 18 were verified ACTIVE.
All 33 downloaded runtime modules matched local source. Both endpoints rejected an invalid secret
with HTTP 401. The existing secret and AIRTABLE_PAT were reused. No authenticated hosted posting,
Airtable write or scheduler activation was executed for this change. The disposable PostgreSQL
suite passed 78 tests; worker/handler checks and the final budget/resume regression passed, with
TypeScript clean. Reversal and period endpoints were not redeployed.

## Focused checks

```sh
node --test supabase/functions/ledger-daily/writeback.test.mjs supabase/functions/ledger-daily/test-mode.test.mjs supabase/functions/ledger-daily/sync.test.mjs supabase/functions/ledger-daily/runner.test.mjs supabase/functions/ledger-daily/airtable.test.mjs supabase/functions/ledger-daily/categories/parity.test.mjs supabase/functions/ledger-daily/categories/invoice-parity.test.mjs
```

These use synthetic/mocked sources and do not modify a hosted database. Existing disposable database
checks remain available separately, but are not needed for GET-only live filter inspection.
