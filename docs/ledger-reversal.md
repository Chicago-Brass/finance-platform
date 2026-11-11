# FIN source-record reversal

The dedicated `ledger-reversal` endpoint reverses the stored journals owned by one FIN record.
It supports Payments, Invoices, Invoice Lines, Prepay Expenses Log and Depreciation Table.
It does not recalculate categories or amounts, or reverse linked records merely referenced by
the source. Unchecking Reverse Ledger does nothing; restoration remains deferred.

## Native automations

All five Reverse Ledger checkbox automations are ON and use `airtable/ledger-reversal.js`:

| Owning table | Table ID | Automation |
| --- | --- | --- |
| Payments | `tblR61NG9i0giid28` | [Payment Reverse Ledger](https://airtable.com/app0Q1UMEdUeWl538/wflOy11pXjH4HRsEB) |
| Invoices | `tbldQXuqNEp8G5pfs` | [Invoice Reverse Ledger](https://airtable.com/app0Q1UMEdUeWl538/wflu0qz8LtuOivu4q) |
| Invoice Lines | `tblV26TC0f6CKDneL` | [Invoice Line Reverse Ledger](https://airtable.com/app0Q1UMEdUeWl538/wfllk4vGHSWhiJYjX) |
| Prepay Expenses Log | `tbl1LgiUYt7Gc492d` | [Prepaid Log Reverse Ledger](https://airtable.com/app0Q1UMEdUeWl538/wflK3FbhAacWxaC2N) |
| Depreciation Table | `tblC0dbO5UMXzHma9` | [Depreciation Reverse Ledger](https://airtable.com/app0Q1UMEdUeWl538/wfl9mtZA0btC00cOv) |

Each triggers when its own record's Reverse Ledger is checked. Inputs are `sourceTableId`
(the fixed owning table), `sourceRecordId` (the trigger record ID), and `ledgerReversalUrl`.
The script uses `input.secret("Dual Ledger Webhook Secret")`, matching the existing Edge secret.

The script reads only the checkbox and manual date. If Reverse Date is blank, it saves today's
America/Chicago calendar date before the webhook. An existing date stays unchanged, including
after failure. The request contains source identity and date only. Supabase owns journal lookup
and metadata writeback; the native script does not read or rewrite cached journal IDs.
Do not require populated Ledger Journal IDs in the trigger: historical journals are found by
source identity. There is no automatic native retry; rerun the same source/date after failure.

## Airtable fields and posting metadata

Each of the five source tables has these fields:

| Field | Type | Ownership |
| --- | --- | --- |
| Ledger Postings | Long text | Supabase writes JSON objects `{rule,key,datetime,id}` |
| Ledger Journal IDs | Long text | Supabase writes the complete original journal UUID array |
| Reversal Journal IDs | Long text | Supabase writes the posted reversal UUID array |
| Reverse Ledger | Checkbox | User requests reversal |
| Reverse Date | Manual date, no time | User date; native script stamps it once when blank |

Exact field IDs live in the native script's `SOURCE_FIELDS` and
[`_shared/ledger-links.ts`](../supabase/functions/_shared/ledger-links.ts) `LINK_FIELDS` maps.
Each posting object's `rule` is the category code, `key` is its account component (empty for
a whole-category journal), `datetime` is the actual UTC posting timestamp, and `id` is the journal
UUID. Original objects remain after reversal, so their categories stay marked as posted.

Posting and reversal receivers synchronize all three metadata fields from actual Supabase
journals under the shared source lock, then independently read back the exact Airtable record.
They require server-only `AIRTABLE_PAT`. These fields are caches; Supabase identity and
duplicate/reversal guards remain authoritative.

## Dedicated endpoint

`POST https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-reversal`

Authentication uses the existing `x-ledger-secret` / `LEDGER_WEBHOOK_SECRET` pair.
The function has `verify_jwt = false` and checks this secret before service work. It uses
`SUPABASE_DB_URL` for parameterized direct SQL; no posting/reversal database function is called.

```json
{
  "source": { "tableId": "tblR61NG9i0giid28", "recordId": "rec00000000000001" },
  "reversalDate": "2026-11-12"
}
```

An optional `journalEntryIds` array remains accepted for older callers. It cannot expand the
source's scope; each supplied ID must belong to that exact source. The server always queries
the complete original journal set using indexed source identity.

The transaction creates all required opposite entries together. It copies stored lines and
metadata, swaps debit and credit, preserves signed amounts and original records, and records
`reverses_entry_id`. Account, balance, reversible-rule and accounting-period guards remain.
The same source/date retry returns existing reversals; a changed reversal date conflicts.
A source with no journals returns a successful empty result.

A closed or missing accounting period can return `pending_review` instead of posting. An
authorized user approves that captured target set through `ledger-periods`; reopening alone
does not approve it. Pending/rejected responses do not write new posting markers.

After financial commit, Supabase verifies Airtable metadata writeback before returning success.
If writeback fails, the reversal remains committed and the call fails. Retrying the same
source/date synchronizes the links without another reversal; it does not delete journal history.

Successful responses include `source`, `journalEntryIds`, `reversalJournalEntryIds`,
`reversedCount`, `duplicateCount` and per-journal `results`.

## Cancellation and restoration

Cancel Payment and Sent/Return Payment categories post their chart-defined entries. They are
separate from Reverse Ledger; combining them for one financial event requires an accounting
decision. This reversal change does not change those triggers or mappings.

Unchecking Reverse Ledger does not delete a reversal, clear dates/IDs, or repost the source.
The proposed uncheck-and-repost behavior and reversing a reversal remain deferred.

## Deployment and checks

On 12 November 2026, `ledger-payment` v20, `ledger-reversal` v8, `ledger-periods` v3 and
`ledger-daily` v12 were published. The period endpoint retains JWT verification and the
`can_manage_periods` permission check. All 42 downloaded runtime modules matched local source.
The daily worker remains unscheduled; publication does not replace native posting triggers.

Each native reversal automation was reloaded and verified ON with its own table/checkbox,
fixed table input, dynamic trigger record ID and shared secret. All five complete saved scripts
matched the local sender. Temporary test automations were removed after live verification.

```sh
node airtable/check-ledger-reversal.cjs
node --test supabase/functions/ledger-reversal/handler.test.mjs
sh supabase/tests/check-payment-posting.sh
```

Current isolated checks passed: 11 native sender cases, 91 disposable database checks,
56 focused checks, 17 report checks and TypeScript. An additional disposable proof passed
closed-period capture, exception approval, metadata writeback and duplicate-free retry for
all five source tables; those Airtable calls were mocked.

## Live verification - 12 November 2026

After an authorized clean slate, 62 real Expense source records across 15 rules created
66 original journals. Checking their native Reverse Ledger fields created 66 opposite journals
with 264 total original/reversal lines. All 62 source records' original and reversal writebacks
were independently verified. A two-journal W2 replay created no new journals and returned two
duplicates. A request using a disabled Payment rule was rejected before posting.

Report builders, five date windows and four branch-filter RPCs reconciled to stored lines.
Same-period original/reversal pairs netted to zero. Prior-year originals reversed in the current
year correctly affect different reporting periods; each individual year's income need not net
to zero. Seven active categories still lacked eligible live samples; see the
[Expense implementation review](expense-audit.md) for the coverage limits. Five deferred
categories remain disabled. No missing accounting period was opened to force a sample.

## Historical live verification

Historical live checks on 9 November 2026 reversed five test journals (14 lines) owned by two
payments and one invoice. They preserved original data and returned no new journals on retry.
That historical evidence does not constitute live financial testing of the three newer source
automations. Hosted financial tests require an explicitly selected record/date scope.

Shipping Record is also a supported source (`tblAxlsdmJN0X0sQs`). Its native template maps
Reverse Ledger `fld8oS4rTOmZtuTl6` and Reverse Date `fldAgNtldwTtWCfo2`. The dedicated endpoint
reverses its stored journals without re-reading or recalculating linked MTA prices. A native
checkbox automation must be configured separately before checking that field will call it.
