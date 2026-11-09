# FIN payment and invoice reversal

Deployed to FIN and DUAL ENTRY on 9 November 2026. The eight reversal fields and both native
automations were read back after saving. The dedicated endpoint is now ACTIVE, version 5,
including the structured posting metadata extension described below.
Depreciation, prepaid-use logs, daily processing and restoration are outside this change.

## Airtable fields

Create these fields on FIN Payments (`tblR61NG9i0giid28`) and Invoices (`tbldQXuqNEp8G5pfs`):

| Field | Type | Initial value |
| --- | --- | --- |
| Ledger Journal IDs | Long text | Blank |
| Reversal Journal IDs | Long text | Blank |
| Reverse Ledger | Checkbox | Unchecked |
| Reverse Date | Manual date, no time | Blank |

The created field IDs are embedded in the script's `SOURCE_FIELDS` map. These are not lookups,
formulas or computed dates.
Both journal ID fields contain JSON arrays. A missing original-ID list is supported: Supabase
finds all journals owned by this exact source record. Saved IDs cannot expand that scope.

| Field | Payments | Invoices |
| --- | --- | --- |
| Ledger Journal IDs | fldUTQWnsCYxYZ8wa | fldLqYrXCySCoZRQT |
| Reversal Journal IDs | fld7j7LKJNbgfyFhk | fldKWzgJ7ypvfn6Jw |
| Reverse Ledger | fldNtEQiswXd8mODj | fldOZh1NZmJi9tqkb |
| Reverse Date | fldXItbQ15eokPT0P | fld1SzFreZ84owLgq |

## Posting metadata

`Ledger Postings` is a separate plain long-text field on Payments (`fldFcvTSQ5035ZYVa`)
and Invoices (`fld2K7xKmNnLoi4u6`). Each JSON-array item contains `rule`, `key`, `datetime`
and `id`: the category code, the `source_entry_key` account component, the actual UTC
`posted_at` timestamp and the journal UUID. Several journals may share one rule; `key`
distinguishes account components and is empty for a whole-category journal.

The initial backfill populated 130 original journals across 42 payments and 64 invoices.
The posting/reversal service extension now maintains this metadata automatically, using
the actual source-owned journals from Supabase after the financial transaction succeeds. Both
endpoints share `supabase/functions/_shared/ledger-links.ts` and require `AIRTABLE_PAT`.
It refreshes the complete original ID array, the structured posting objects and reversal IDs,
then independently verifies the saved Airtable values. The structured objects retain originals
after reversal, so their categories remain marked as posted; reversal UUIDs stay in their own field.
This extension is published: `ledger-payment` version 16 and `ledger-reversal` version 5 are
ACTIVE on 9 November 2026. Nine downloaded runtime modules matched local source. Live writes
and independent readback of only these three fields passed on payment `recDpTZIeL8u62jwq` and
invoice `recvLxhRs636RZ82A`; neither check created or reversed financial journals. Existing native
scripts/triggers remain unchanged. The future daily worker uses the same field IDs and object shape,
and remains undeployed/unscheduled. Existing shared webhook authentication is unchanged.

An exact rule exclusion is `FIND("\"EXP-06\"", {Ledger Postings} & "") = 0`.
The persisted-field tests passed for present/absent rules on both tables and for complete
Utilities and vendor-deposit query filters. This field is a cache; Supabase journal identity
and duplicate/reversal checks remain authoritative.

## Native automations

Both automations are ON:

- [Payment | Reverse Ledger](https://airtable.com/app0Q1UMEdUeWl538/wflOy11pXjH4HRsEB)
- [Invoice | Reverse Ledger](https://airtable.com/app0Q1UMEdUeWl538/wflu0qz8LtuOivu4q)

Each uses:

1. When a record matches conditions: Reverse Ledger is checked.
2. Run `airtable/ledger-reversal.js`.

Inputs: `sourceTableId` (fixed to the owning table), `sourceRecordId` (trigger record ID) and
`ledgerReversalUrl` (the dedicated endpoint).
Use `input.secret('Dual Ledger Webhook Secret')`; do not place a key in an input value.

The script reads one source record and does no accounting calculations. If Reverse Date is
empty, it saves today's America/Chicago calendar date before calling the webhook. An existing
manual date stays unchanged, even after a failed call. After success, it refreshes both ID
fields from the receiver's complete source-owned ID lists. A writeback failure fails the run;
retrying the same date returns the existing reversals and repairs the IDs without reposting.

Unchecking Reverse Ledger has no effect. The script never clears the checkbox, date or ID lists.
Do not filter the automation on Ledger Journal IDs being populated; historical journals can be
found by source identity. Native posting senders need no script changes for the metadata extension;
the receiver owns writeback. The native reversal script's existing ID refresh remains compatible.

## Dedicated endpoint

`POST https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-reversal`

Authentication: the existing `x-ledger-secret` / `LEDGER_WEBHOOK_SECRET` pair. The function has
its own `verify_jwt = false` setting and reuses the existing authenticated HTTP handler. It
does not dispatch through the posting category handler or require new secrets.

```json
{
  "source": { "tableId": "tblR61NG9i0giid28", "recordId": "rec00000000000001" },
  "journalEntryIds": [],
  "reversalDate": "2026-11-09"
}
```

`journalEntryIds` can be a partial cached list or empty. Every supplied UUID must belong to
the source. The service queries the complete original journal set using the existing source
index, rather than scanning Airtable or the entire ledger. A payment reversal only affects
payment-owned journals; it does not reverse invoice-owned journals that reference that payment.

The service uses the posting writer's source lock. It creates all required reversals in one
transaction, copies stored lines and metadata, swaps debit and credit, preserves signed amounts
and original records, and records `reverses_entry_id`. Existing nonreversible-rule, postable
account, balance and accounting-period protections remain. A previously posted reversal is
returned as `already_reversed`; a different saved reversal date or unposted reversal conflicts.
An owner with no journals returns a successful empty result. No database function is called.

The response contains `source`, `journalEntryIds`, `reversalJournalEntryIds`, `reversedCount`,
`duplicateCount` and per-journal `results`. Database failures return errors, not partial success.
The existing unique reversal index and source metadata are sufficient; no migration is needed.

## Existing cancellation workflows

The existing Cancel Payment and Sent/Return Payment categories post chart-defined current-amount
entries. They are not replaced by this checkbox. Do not use both workflows for the same financial
event without deciding which entries should remain. No cancellation triggers or mappings change.

## Deferred proposal: uncheck and repost

The proposed future behavior is: an unchecked Reverse Ledger with a saved Reverse Date requests
new posting, replaces the current original journal IDs, then clears Reverse Date and reversal
IDs after success. This is not final and is not implemented. It requires changes to the current
original-journal uniqueness and historically-reversed replay guards. No journal history should
be deleted. Reversing a reversal is also outside this implementation.

## Checks and rollout

```sh
node airtable/check-ledger-reversal.cjs
node --test supabase/functions/ledger-payment/handler.test.mjs supabase/functions/ledger-reversal/handler.test.mjs
sh supabase/tests/check-payment-posting.sh
```

The database runner is disposable and loopback-only. It removes the legacy reversal RPC before
testing direct Edge writes. Tests cover multi-journal/signed reversal, preserved references,
strict ownership, concurrent duplicates, dates, rollback, blocked sources and existing guards.

Deployment verification: all eight field IDs/types were independently read from the Meta API;
Reverse Date is date-only in both tables. Both saved script copies matched the local source.
The published invoice input and ON status survived reload. Both triggers use their own table's
Reverse Ledger checkbox, checked. The existing webhook secret is attached to both scripts.

A temporary, authentication-only Airtable probe received the expected HTTP 400 for an invalid
source, before any database work. Its execution log confirmed success; the production script
and dynamic record-ID input were restored afterward. The endpoint also rejected an unauthenticated
request with HTTP 401. The deployed bundle and function configuration were read back through
the project-scoped Management API. Local checks passed: eight native cases, twelve HTTP tests,
42 disposable database tests and targeted TypeScript checking. The initial deployment probe
did not reverse any hosted journal. Subsequent authorized live verification is recorded below.

## Live reversal verification

Verified on 9 November 2026 device time, with accounting date 8 November 2026 in America/Chicago.
The approved sample covered two payment records and one invoice record, including a payment
owning three category journals. IDs were prefilled before checking Reverse Ledger.

- All three native automation runs succeeded and produced five posted reversal journals, with
  14 lines matching the originals with debit/credit swapped.
- Original journal headers and lines were independently compared with their pre-write snapshots
  and remained unchanged. Accounts, reference arrays, branch and audit information were preserved.
- Each account nets to zero across these original and reversal lines.
- Both journal ID arrays and Reverse Date were read back from the correct Airtable records.
- Repeating the three-journal payment through the native script test returned zero new journals
  and three already reversed. Independent reads confirmed the same five reversal UUIDs, and
  unchanged Airtable dates, checkboxes and ID arrays after retry.

The test records retain their checked Reverse Ledger state, date and ID links. Nothing was
deleted or restored. Unchecking/reposting remains deferred. Private record-level receipts and
financial snapshots were kept outside the public repository.

A hosted journal test is a separate real financial write and needs an explicit record/date
selection. Do not test by toggling a user's source record without that scope.
