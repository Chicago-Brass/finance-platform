# Ledger sync webhook

`ledger-daily` is the authenticated, scheduler-neutral discovery endpoint in DUAL ENTRY. It reads
Airtable, evaluates named category functions and calls the shared generic journal writer. The
writer receives final signed account pairs; it does not categorize or allocate amounts.

Endpoint: `https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-daily`

Send POST JSON with `Content-Type: application/json` and `x-ledger-secret` set to the existing
Dual Ledger Webhook Secret. Server credentials remain `AIRTABLE_PAT`, `SUPABASE_DB_URL` and
`LEDGER_WEBHOOK_SECRET`. Invalid secrets return 401. No new secret or scheduler is required.
Production now uses a private pg_cron dispatcher at 11 PM America/Chicago, with continuation
ticks until its checkpoint completes. Manual callers still use this same endpoint. Develop is
unscheduled and has no FIN writer credentials. See [environments](../../../knowledge-base/environments.md).

Authenticated ledger requests arriving outside Oregon are forwarded once to the same project's
`us-west-2` runtime, beside its database. Existing webhook URLs, bodies and secrets remain valid.
Callers can avoid that extra hop with `x-region: us-west-2`, or
`?forceFunctionRegion=us-west-2`. Posting, reversal and discovery share this routing; the global
lock and source transactions still execute once. A lost forwarding response is not automatically
retried. Retry the same payload and run key, as with other uncertain webhook responses.

## Current category controls

Expense and Invoice Entry enable their fully implemented rules: 22 Expense and eight Invoice
Entry. Two working partials and five red deferred rules are disabled. Three black rules are
excluded from the registry. Five replaced Invoice Entry rules are also removed from discovery.
Unreferenced obsolete/black catalog rows are deleted; referenced historical rules are retained
inactive/disabled so their journals and reversals remain valid.

Sixteen fully implemented Payment rules are enabled. Two blocked loan categories remain disabled. Payment black rows 20-33 are excluded. See
[Payment mappings](../../../docs/ledger-payment-category-matrix.md). Other rules remain disabled.
The six replaced native Expense/Invoice Entry posting automations are OFF; reversal remains ON.
MAN-01 separately posts approved Direct Journal Entries as one parent journal with all linked
Journal Lines. It uses Date Approved and parent Branch, writes Posted Entry on success and reverses
through Cancel Entry. Ordinary invoice-linked T-Charts skip manual-owned invoices and whole
payments. See [manual journals](../../../docs/manual-journals.md).
Production scheduling is active; its definition migrations never enable a job on develop. Shipping uses the current Shipping Records, Transactions and MTAs tables. Its deposit cap is
rechecked atomically against the invoice-linked ledger balance before posting.

`ledger_rules.enabled` is checked before normal discovery and again inside the posting transaction.
`active` remains a descriptive label. Exact journal replay and dedicated reversal still work when
a category is disabled. See [category enablement](../../../docs/category-enablement.md).

Operating Expense invoice and payment rules share the 37-account allowlist in
`rules/expense-accounts.ts`. The FIN Operating Expense Account Triggers checkbox is a review aid,
not a runtime dependency. Dedicated Expense categories stay outside this allowlist.

Payment routing uses FIN `Payment Record Type`: `Regular Payment` for ordinary postings,
`CC Batch Payment` for PAY-09, `Return Payment` for PAY-12 and `Repayment` for PAY-30.
Blank or unknown types do not post. The old return and repayment checkboxes are not used by this
worker. Linked payments qualifying discount lines must be Regular Payment. Cashback is owned by its
Regular Payment and uses that payment's amount and date.
PAY-12 negates the signed return Payment Amount; ordinary payments and repayments retain it.

## Requests

| Parameter | Behavior |
| --- | --- |
| `test` | Default false. True means no-write preview; shipping also reads posted deposit availability. |
| `dryRun` | Default true. False permits posting. A normal dry run still saves run checkpoints. |
| `categoryCodes` | Optional array of up to 60 stable codes. Normal runs also apply enabled switches. |
| `source` | Optional `{tableId, recordId}`. Restricts discovery and processing to that owning record. |
| `fromDate`, `toDate` | Optional inclusive YYYY-MM-DD date bounds. Missing bounds use their normal defaults. |
| `createdFrom` | Optional inclusive owning-record creation timestamp in ISO UTC. Omitted means no creation-date floor. Production cron always sends `2026-11-17T06:00:00.000Z` (Nov 17, 2026 midnight Central). |
| `maxRecords` | Sources per invocation, default 25, range 1-50. |
| `runKey` | Optional stable run identity. Reuse only for the same source, dates, categories and mode. |
| `cursor` | Test-only continuation, supplied through `requestForResume`. |

A full sync omits `source`. A single-record sync uses the same rules, writer and global lock:

```json
{
  "dryRun": false,
  "source": {
    "tableId": "tbldQXuqNEp8G5pfs",
    "recordId": "<actual FIN Airtable record ID>"
  }
}
```

Supported owners are Invoices, Payments, Invoice Lines, Shipping Record, Prepay Expenses Log,
Depreciation Table and Direct Journal Entries. Each category is evaluated only for its defined owner. An invoice request
will not implicitly post its linked payments or invoice lines; request those owners separately.
Single-record mode queries `RECORD_ID()` directly and lets the category handler read its linked
records. It never scans an entire related table merely to locate that named source.

Fresh requests with `createdFrom`, including scheduled runs, also query the owning table first.
The date, lifecycle and posted-rule filters run in Airtable before linked records are fetched.
Only returned owners' linked graphs are loaded. Unbounded manual discovery and already-started
related-query checkpoints retain their existing query order.

Within one targeted invocation, the owning source is refreshed between category evaluations,
while linked invoices, lines and accounts are reused. The linked graph is an invocation snapshot;
it is not cached across requests. Full-sync batches retain their normal full-cache invalidation.

Manual calls keep the last-30-UTC-calendar-days safety window by default. The scheduled dispatcher
explicitly sends `fromDate:"2026-11-17"` and its Chicago day as `toDate`, so the scheduled start
does not move forward. Existing checkpoints retain their original date scope. Accounting dates,
not Created Time, determine this range. Override it explicitly when reviewing an older record:

```json
{
  "test": true,
  "source": {
    "tableId": "tbldQXuqNEp8G5pfs",
    "recordId": "<actual FIN Airtable record ID>"
  },
  "fromDate": "2025-01-01",
  "toDate": "2025-12-31"
}
```

The override applies to direct queries, linked discovery and the final calculated date check.
`createdFrom` separately filters Airtable `CREATED_TIME()` on the owning source, not linked parents
or accounting dates. The production cron fixes this floor at November 17, 2026 midnight Central.
Manual API calls can omit it to include older-created records; resumptions must retain the original floor.
It does not bypass category filters, Sent/cancellation/reversal guards, duplicate protection,
account validation, or closed-period review. Full and manual calls are otherwise identical.

`test:true` does not consult database enablement or period/account state. Shipping alone reads
the posted balance of 221.100 for its linked deposit invoice using a read-only transaction. To preview just the
current enabled categories, supply their categoryCodes. It returns proposed source/rule/date,
accounts and signed amount. Test cursor data is validated against the original source and dates;
it cannot inject another record into a single-source preview.

## Lock, continuation and failure behavior

Every posting/dry-run invocation acquires the same global run lock, including single-record calls.
An unfinished run blocks a competing run with HTTP 409. A three-minute renewable lease prevents
concurrent execution; a paused run must be resumed with `requestForResume` unchanged until
`done:true`. Reusing a run key for different options is rejected. Completed keys remain completed.

The application budget is 90 seconds and 80 Airtable requests per invocation. Discovery snapshots
candidate IDs before writeback changes their filters. Sources are loaded in small batches and the
database checks existing source journals in bulk. One source's linked graph must fit an invocation.

Each source owns its journal IDs and `{rule,key,datetime,id}` cache in Airtable. Existing categories
are not posted twice. New journals are recorded atomically; then the owning source's three ledger
metadata fields are written and read back. If a lost response is confirmed absent, only that
source's new unreferenced journals are rolled back. An uncertain read or partial write retains
journals and reports an unconfirmed outcome. Other sources continue; no prior journals are deleted.
Writeback allows up to three PATCH attempts, with independent verification before retrying the
same metadata. HTTP 429 waits 30 seconds; permanent permission/validation failures do not retry.
The time budget can stop retries early. Twelve request slots are reserved before posting, and
safe errors identify the failed operation, status, attempt and reason without raw response data.

Reversal uses the separate `ledger-reversal` endpoint with the same source format. It reverses all
stored journals for that owner, preserving accounts, signed amounts, references and branch. Native
scripts stamp a missing manual Reverse Date once before calling it. Disabled posting categories
remain reversible. Unchecking the checkbox does not restore or repost a reversed source.

## Implementation map

| File | Responsibility |
| --- | --- |
| `rules/expenses.ts`, `rules/invoice-entry.ts`, `rules/payments.ts` | Category filters and linked-record discovery |
| `rules/chart.ts` | Current row identity, filters, mappings and issues |
| `categories/expenses.js`, `categories/invoice-entry.js`, `categories/payments.js` | Named handlers and final calculations |
| `categories/index.ts`, `definitions.ts` | Source identity, fields and writer packets |
| `scope.ts`, `queries.ts` | Accounting-date bounds and lifecycle/duplicate exclusions |
| `airtable.ts` | Schema resolution, filtered reads, pacing and request budget |
| `../_shared/database-region.ts` | Authenticated routing beside the finance database |
| `runner.ts`, `store.ts`, `run-lock.ts` | Discovery, source processing, checkpoints and lock |
| `test-mode.ts` | No-write preview using the same runner and category handlers |
| `handler.ts`, `index.ts` | Authentication, request validation and runtime wiring |

See [Expense rules](../../../docs/expense-audit.md),
[Invoice Entry rules](../../../docs/invoice-entry-audit.md),
[reversal](../../../docs/ledger-reversal.md), and
[testing](../../../knowledge-base/testing.md). Category and boundary tests use synthetic inputs;
`sh supabase/tests/check-payment-posting.sh` uses a disposable loopback database only.
