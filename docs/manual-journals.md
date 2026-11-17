# Manual journal entries

Manual journals are separate from the three T-Chart category sheets. `MAN-01` uses the same
`ledger-daily` webhook, daily 11 PM America/Chicago dispatcher, run lock, account validation,
transactional writer, period review and verified Airtable writeback.

## Source and mapping

FIN Direct Journal Entries (`tblCoBk0WB46B662R`) is the owner. One parent creates one Supabase
journal containing every linked Journal Line's debit/credit pair. Journal Lines
(`tblmXtIRH6Bj2jNZM`) are details, not independently posted or reversed sources.
All unique linked accounts are loaded together through the existing bounded record reader,
rather than fetching each new debit or credit account sequentially.

- Qualify: Date Approved is populated, Posted Entry is false, Cancel Entry is false, no reversal
  date and no prior MAN-01 posting. Use `LEN({Date Approved}&"")>0` for the populated-date test.
- Accounting date: parent Date Approved. Branch: parent Branch, nullable.
- Each line: Line Amount, one Debit Account and one Credit Account. Preserve signed cents.
- Optional Linked Invoices: reference arrays only (invoice, vendor, client, staff, transaction,
  PO and state). Invoice amounts, dates and branches do not override the manual entry.
- Validate all lines before posting. Missing lines, ambiguous ownership, unmapped accounts or
  invalid amounts fail the entire parent. Old parent Amount/Debit Account/Credit Account fields
  are not fallback inputs.

The parent has Ledger Postings (`{rule,key,datetime,id}` JSON), Ledger Journal IDs,
Reversal Journal IDs and Reverse Date. The shared writer writes the three metadata fields and
Posted Entry=true in one PATCH and independently verifies them. Existing duplicate detection and
bounded retry/compensation apply. A partially saved Posted Entry flag is unconfirmed; it never
authorizes deleting the journal.

## Preventing ordinary T-Chart duplication

Invoices.Direct Journal Entries must be empty for ordinary invoice T-Charts. A shared evaluator
check also excludes linked invoice-line, payment, prepaid and shipping sources. If any invoice
in a payment belongs to a manual entry, skip the whole payment, including CC batch mini-payment
invoice links. Do not post an unchanged full Payment Amount after filtering out only one invoice.
Depreciation without invoice links is unaffected. The check applies to scheduled, targeted and
no-write preview calls, and uses the invocation's linked-record cache.

Manual invoices are dedicated to this flow from creation. Automatic-to-manual conversion and
automatic reversal of historical ordinary postings are outside the workflow.

## Cancellation

The native [Manual Journal | Cancel Entry](https://airtable.com/app0Q1UMEdUeWl538/wfl7tuVmVFiIqk0dt/wacrRJYNIu8ZkFRSl)
automation reuses `airtable/ledger-reversal.js`.
Trigger: parent Cancel Entry is checked. It stamps an empty Reverse Date once, then calls the
existing production `ledger-reversal` endpoint with the parent table ID, record ID and date.
It does not calculate amounts. Supabase reverses the stored journal and writes its IDs back.

Cancellation before posting produces no journal. A pending closed-period manual posting request
is rejected under the same source lock, so it cannot later be approved. Cancellation after posting
creates one opposite journal; repeats deduplicate. Posted Entry remains true. Unchecking Cancel
Entry does not automatically restore the entry.

## Scope and environments

Production scheduling retains the explicit November 17, 2026 accounting/creation floors. An older
draft requires an explicit targeted manual date override without `createdFrom`, even if approved
later. Develop has the same code/catalog/schema but no production FIN writer credentials or cron.
Closed-period manual entries follow the existing review process and are not marked posted early.
No new financial tables or separate posting endpoint are needed.

## Checks

- `node --test supabase/functions/ledger-daily/categories/manual-journals.test.mjs`
- `node --test supabase/functions/ledger-payment/source-contract.test.mjs`
- `node airtable/check-ledger-reversal.cjs`
- `sh supabase/tests/check-payment-posting.sh` (disposable PostgreSQL; includes manual posting,
  atomic failure, idempotency, reference/branch preservation, reversal, writeback compensation and
  pending-period cancellation)

Hosted test previews do not post or mutate Airtable. A published native automation and a disposable
database test do not constitute an actual live Cancel Entry checkbox test.
