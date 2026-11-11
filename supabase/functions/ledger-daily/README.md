# Ledger sync webhook

`ledger-daily` is the authenticated, scheduler-neutral discovery endpoint in DUAL ENTRY. It reads
Airtable, evaluates named category functions and calls the shared generic journal writer. The
writer receives final signed account pairs; it does not categorize or allocate amounts.

Endpoint: `https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-daily`

Send POST JSON with `Content-Type: application/json` and `x-ledger-secret` set to the existing
Dual Ledger Webhook Secret. Server credentials remain `AIRTABLE_PAT`, `SUPABASE_DB_URL` and
`LEDGER_WEBHOOK_SECRET`. Invalid secrets return 401. No new secret or scheduler is required.
An external caller may schedule 11 PM America/Chicago or call the same endpoint manually.

## Current category controls

Only fully implemented Expense and Invoice Entry rules are enabled: 21 Expense and six Invoice
Entry. Four working partials and six red deferred rules are disabled. Three black rules are
excluded from the registry. Five replaced Invoice Entry rules are also removed from discovery.
Unreferenced obsolete/black catalog rows are deleted; referenced historical rules are retained
inactive/disabled so their journals and reversals remain valid.

Payment and Other rules remain disabled and unchanged. The six replaced native Expense/Invoice
Entry posting automations are OFF. Existing reversal automations remain ON; no external schedule
has been activated. Shipping is partial and disabled; its endpoint and script support reversal,
but its native checkbox automation is not yet configured.

`ledger_rules.enabled` is checked before normal discovery and again inside the posting transaction.
`active` remains a descriptive label. Exact journal replay and dedicated reversal still work when
a category is disabled. See [category enablement](../../../docs/category-enablement.md).

## Requests

| Parameter | Behavior |
| --- | --- |
| `test` | Default false. True means GET-only Airtable preview, with no database client or writes. |
| `dryRun` | Default true. False permits posting. A normal dry run still saves run checkpoints. |
| `categoryCodes` | Optional array of up to 60 stable codes. Normal runs also apply enabled switches. |
| `source` | Optional `{tableId, recordId}`. Restricts discovery and processing to that owning record. |
| `fromDate`, `toDate` | Optional inclusive YYYY-MM-DD date bounds. Missing bounds use their normal defaults. |
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

Supported owners are Invoices, Payments, Invoice Lines, Shipping Record, Prepay Expenses Log and
Depreciation Table. Each category is evaluated only for its defined owner. An invoice request
will not implicitly post its linked payments or invoice lines; request those owners separately.
Single-record mode queries `RECORD_ID()` directly and lets the category handler read its linked
records. It never scans an entire related table merely to locate that named source.

All processing keeps the last-30-UTC-calendar-days safety window by default. Accounting dates,
not Created Time, determine inclusion. Override it explicitly when reviewing an older record:

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
It does not bypass category filters, Sent/cancellation/reversal guards, duplicate protection,
account validation, or closed-period review. Full and manual calls are otherwise identical.

`test:true` does not consult database enablement or period/account state. To preview just the
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

Reversal uses the separate `ledger-reversal` endpoint with the same source format. It reverses all
stored journals for that owner, preserving accounts, signed amounts, references and branch. Native
scripts stamp a missing manual Reverse Date once before calling it. Disabled posting categories
remain reversible. Unchecking the checkbox does not restore or repost a reversed source.

## Implementation map

| File | Responsibility |
| --- | --- |
| `rules/expenses.ts`, `rules/invoice-entry.ts` | Category filters and linked-record discovery |
| `rules/chart.ts` | Current row identity, filters, mappings and issues |
| `categories/expenses.js`, `categories/invoice-entry.js` | Named handlers and final calculations |
| `categories/index.ts`, `definitions.ts` | Source identity, fields and writer packets |
| `scope.ts`, `queries.ts` | Accounting-date bounds and lifecycle/duplicate exclusions |
| `airtable.ts` | Schema resolution, filtered reads, pacing and request budget |
| `runner.ts`, `store.ts`, `run-lock.ts` | Discovery, source processing, checkpoints and lock |
| `test-mode.ts` | No-write preview using the same runner and category handlers |
| `handler.ts`, `index.ts` | Authentication, request validation and runtime wiring |

See [Expense rules](../../../docs/expense-audit.md),
[Invoice Entry rules](../../../docs/invoice-entry-audit.md),
[reversal](../../../docs/ledger-reversal.md), and
[testing](../../../knowledge-base/testing.md). Category and boundary tests use synthetic inputs;
`sh supabase/tests/check-payment-posting.sh` uses a disposable loopback database only.
