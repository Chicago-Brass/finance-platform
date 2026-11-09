# FIN ledger webhook contract

## Responsibilities

Airtable qualifies categories, calculates component amounts and allocations, selects final debit
and credit accounts, and sends complete source packets. The Edge Function authenticates, validates
the supplied pairs, resolves account identities and writes journal tables directly in one database
transaction. It has no category/accounting router or amount calculation and calls no database
posting function.

Sent, Cancelled, Returned and Reconciled are metadata. Every event uses the same actual-pair
writer. Existing journals are read for duplicate/history checks only. They do not supply a new
event's amount, and there is no reversal, deletion or posted-entry edit.

## Sender ownership

| Source | Trigger / contents |
| --- | --- |
| airtable/payment-sent.js | Payments.Sent; all payment movements and invoice-owned PAY-04 shortfalls/PAY-11 credits/PAY-25 interest/PAY-27 rebates; PAY-10 remains explicitly blocked |
| airtable/payment-events.js | Cancel Payment (PAY-06/PAY-12) and Reconciled (PAY-26), with a fixed eventType input per automation |
| airtable/invoice-entry.js | Invoices.Create Entry checked; INV-01/03/04/06/07/08/09/10 |
| airtable/invoice-created.js | FIN Invoices created; INV-05 |
| airtable/expense-entry.js | Invoices.Create Entry checked; EXP-01/03/05/06/07/09/12/13; EXP-06 works with benefits excluded |
| airtable/expense-fully-paid.js | Payment Invoice Status Fully Paid; EXP-02/11 |
| airtable/prepay-created.js | Prepay Expenses Log record created; EXP-04 |
| airtable/depreciation-created.js | Depreciation Table record created; EXP-10 |

There are three active payment automations, each with one script action: Payment Sent, Payment Cancelled
and Payment Reconciled. Invoice Created is ON with only the working partial outbound-freight handler. Invoice Entry Create Entry has an independent checkbox event. The former Invoice Paid and Payment Returned automations were deleted.
Sent + Return Payment (AP) handles AP returns. The event script rejects a standalone returned input;
the generic receiver still accepts returned event metadata for otherwise valid supplied pairs.

All scripts use native FIN reads and stable IDs. CORE owns category filters and calculations;
UTILS owns data reads and transport; HELPER owns readable logs. Scripts do not mutate Airtable.
No HTTP request is made for zero category matches. There is no automatic retry.

## Request

```json
{
  "paymentRecordId": "<actual triggering FIN payment ID>",
  "eventType": "sent",
  "entryDate": "2026-10-30",
  "paymentName": "<payment label>",
  "referenceNumber": "<reference>",
  "categories": [{
    "ruleCode": "PAY-07",
    "transactionType": "Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise)",
    "postings": [{
      "debitAccount": {"number": "211.100"},
      "creditAccount": {"recordId": "<FIN account ID>", "number": "0747"},
      "amount": "100.00",
      "invoiceRecordId": "<FIN invoice ID>",
      "branch": ["Chicago"]
    }]
  }]
}
```

Payment events require paymentRecordId, eventType, entryDate and categories. Supported payment eventType
values are sent, cancelled, returned and reconciled. Invoice events use eventType created, entry_requested or paid
and require invoiceRecordId instead of paymentRecordId; supplying both is rejected. entry_requested is
the Create Entry checkbox event, separate from record creation. Each category has an existing ruleCode,
a nonempty free-text transactionType and a postings array. Rule codes establish catalog identity;
they do not select accounts or amounts. The receiver supports optional category notes on the
journal header. Payment and invoice senders omit notes; the depreciation sender includes the
Associated Asset names and IDs as requested. Prepaid-use sends Prepay Log as its header note.

Each nonzero posting supplies a signed decimal amount with cents precision and both account
references. A pair expands into equal signed debit and credit journal lines on the supplied sides.
The writer does not apply ABS or swap accounts. Each line has one nonzero side and every
journal still balances exactly. Ledger side filters use the populated side, including negative values. Account identity can be an
Airtable record ID or a ledger/source account number; names are not identities. FIN Nickel 0747
maps to ledger 112.300. The caller uses card-clearing account 231.100.

Optional posting references include invoiceRecordId, debitInvoiceRecordId, creditInvoiceRecordId,
vendorRecordId, clientRecordId, staffRecordId, transactionRecordId, poRecordId, sourceRecordId,
stateCode and branch. The account-total extension also supports sourceRecordIds, persisted
as a sorted set in journal_lines.airtable_record_ids. Aggregated same-account lines supply their
invoice as sourceRecordId and every included line as sourceRecordIds. Business *RecordIds arrays
persist in vendor_ref, customer_ref, employee_ref, order_ref, po_ref and invoice_ref text[] columns.
stateRecordIds persists in state_ref text[]; stateCode remains a separate optional code. Single
record references normalize to one-item arrays. Senders do not generate notes from these references.
The receiver stores one supplied branch on each journal line. A string or an array
with one distinct branch stores that branch; missing/empty values store NULL. Any unknown branch
inside an aggregate also leaves it NULL. Aggregate
payment components spanning multiple distinct branches store NULL because they have no single
branch attribution. Amounts are not reallocated and no branch is arbitrarily selected.
Invoice senders use Invoices.Branch, except Tech Allowance uses Invoices.Branch Employee. Existing posted journals are not backfilled, and a changed
branch conflicts on replay. Report branch filters remain deferred.

## Source identity and invoice packets

An invoice-created packet does not invent a payment ID:

```json
{
  "invoiceRecordId": "<triggering FIN invoice>",
  "eventType": "created",
  "entryDate": "2026-10-31",
  "source": { "tableId": "tbldQXuqNEp8G5pfs", "recordId": "<same FIN invoice>", "recordName": "<invoice label>" },
  "categories": []
}
```

Invoice creation defaults to FIN Invoices when source is omitted. An explicit source must match
invoiceRecordId. Its audit URL opens that invoice; no trigger-payment text is added to its
description. The response identifies invoiceRecordId rather than paymentRecordId. The same
generic writer, existing INV catalog, source lock, cent/date validation and replay protections apply.
No schema change or category router is needed. Invoice Created uses Invoice Date, selects approved
pairs in Airtable and sends no notes. Zero categories produce no Airtable HTTP request.

Expense Create Entry uses this same invoice envelope with eventType entry_requested and existing
EXP rule codes. Its source must match invoiceRecordId, its audit URL opens that invoice and its
financial date is Invoice Date. It carries each qualifying Line Amount and source-line ID. created
and entry_requested maintain separate event category sets, while source/rule identity still prevents
duplicate journals. A blocked expense category prevents the sender from posting any prepared category.

### Depreciation records

Depreciation uses `depreciationRecordId` instead of a payment/invoice ID, `eventType: "created"`,
and source table `tblC0dbO5UMXzHma9`. Its explicit source record ID must match depreciationRecordId.
Mixed payment/invoice/depreciation identities and other depreciation event types are rejected.
An omitted source defaults to this table when depreciationRecordId is present. The response
identifies depreciationRecordId; header and line audit links open that record. No invoice reference
is fabricated. Existing source locks, cent/date validation and exact-replay protections apply.

EXP-10 supplies Amount Depreciated as its positive cent amount and Date as entryDate, debit
009.101 / credit 161.000, with sourceRecordId on its pair. Associated Asset becomes a header note.
Zero is a no-op. The receiver does not calculate depreciation or defer future dates. The
sender posts on record creation and preserves Date, including future dates. No scheduled-date
filter or schema change is added.

Omitted source on a payment event means FIN Payments table tblR61NG9i0giid28, with record identity paymentRecordId.
Optional source may explicitly select that same payment or a FIN Invoice in tbldQXuqNEp8G5pfs:

```json
{
  "paymentRecordId": "<actual triggering payment>",
  "source": {
    "tableId": "tbldQXuqNEp8G5pfs",
    "recordId": "<invoice ID>",
    "recordName": "<invoice label>"
  },
  "eventType": "sent",
  "entryDate": "2026-10-30",
  "categories": []
}
```

The invoice table/ID owns locking and duplicate prevention. Its header
reference is the invoice ID, and its static description retains the first triggering payment ID.
A different triggering payment, label, bank reference or payment amount does not create a new
invoice journal identity.

Invoice-owned PAY-10/11/27 inside the consolidated Sent script require computed Payment Invoice
Status Fully Paid and use:

- PAY-10: Discount Lines Total, including Open and Applied Discount lines, excluding Expired.
- PAY-11: Credits Applied, with the actual source credit invoices.
- PAY-27: full Purchased Discounts & Rebate Total on an AR Non-Product payment, with invoice account 004.011.

PAY-04 shortfalls use a verified positive Invoice Remaining Balance up to $5, and PAY-25 interest
uses the signed Invoice Amount on an AR Non-Product invoice with account 010.003. These invoice-owned
branches do not require Fully Paid status.

These amounts are invoice totals, not a fraction of Payment.Amount. Each invoice sends all its
matching categories together. PAY-10 is blocked until its account scope is clarified. All components
are prepared before the first request; separate invoices still use separate transactions.
Native invoice and source-credit reads select the Invoice ID primary field (fldMZyzqDidRujeZS)
so record.name supplies the actual invoice label for descriptions and logs. Existing posted
descriptions remain static on replay, even if the source invoice is renamed.

invoiceRecordId is the shared line reference. debitInvoiceRecordId and creditInvoiceRecordId
override it for their respective legs. The owning source invoice must appear on at least one leg.
For vendor credits, debitInvoiceRecordId is the bill and creditInvoiceRecordId is its source
credit memo. Each leg stores its own invoice reference. Every payment-triggered header and line audit URL opens
the triggering FIN payment: https://airtable.com/app0Q1UMEdUeWl538/tblR61NG9i0giid28/{paymentRecordId}.
Credits Applied is the
authoritative bill total; the verified common bill proportion allows its source credits to be
allocated by their Available Credits weights, with deterministic cent rounding.

## Amounts and dates

Payment-owned movements use signed current Payments.Amount, with invoice shares weighted by
Invoice Amount To Pay. Unspecified multi-account purpose/component splits are blocked. Multi-invoice
allocations preserve the supplied total in integer cents. Parent card-statement and child
mini-payment values are not added as another bank movement.

PAY-04 overpayments use 0 < Overpaid Amount <= 1 per payment. Its underpaid branch is invoice-owned,
using 0 < Invoice Remaining Balance <= 5 after verifying Amount To Pay minus Total Paid Amount.
PAY-15/16/18 instead use invoice-line totals grouped by source account, with a distinct entryKey
per account and every source line ID retained. No proportional partial-payment split is inferred
for these line amounts. Reconciliation PAY-26 uses the signed Reconciled Amount Discrepancy,
Dr 007.002 / Cr payment bank. No $5 suspense rule is applied.

Explicit zero components produce no monetary posting. Missing required amounts fail. Empty
postings are no-ops for all event names; they do not request a reversal.

| Event | Financial date |
| --- | --- |
| Sent, invoice settlement, Sent AP return | Payments.Payment Date |
| Cancelled | Payments.Payment Cancelled Date |
| Reconciled | Payments.Reconciliation Date - Combined |
| Invoice created | Invoices.Invoice Date |
| Invoice Create Entry checked | Invoices.Invoice Date |

Date-only values remain unchanged. Timestamp dates are converted to America/Chicago. Return
Payment Date is not used.

## Cancellation and return categories

PAY-12 has two primary paths: Cancel Payment checked + AP, or Sent checked + AP + Return Payment
(AP) checked. Each supplies current Amount as Dr Fifth Third 112.100 / Cr AP 211.100. Sent AP return
is evaluated alongside all matching Sent categories in the same script. The standalone Returned
automation was deleted. Sent is the event metadata for this primary trigger.

PAY-06 is AR Product + Cancel Payment. It does not require Sent. Current Amount is allocated to
linked invoices. Blank Payment Date, blank First Ship Out Date, or payment on/before first shipment
selects deposit 221.100; payment after shipment selects AR 121.100. That account is debited and
the payment-linked bank credited.

These are new actual entries. They do not use original journal amounts, create reversal headers
or delete payment/ledger records.

Bank transfers PAY-19 follow Actual Triggers: payment-linked bank Debit, invoice-linked bank Credit.
Same-day Sent customer payments are deposits.

## Persistence, duplicates and corrections

The service inserts draft headers and balanced lines, then marks the headers posted in one
transaction. All categories in a packet commit or roll back together. Account names, entry numbers,
periods and posting timestamps are resolved/generated by the database. transaction_type stores
the caller's exact category title; source_event_type stores event metadata.

The local account-entry extension adds optional category `entryKey`. Expense Create Entry splits
its prepared postings by debit account and uses that account number as entryKey. Repeated lines
for one account sum into one pair/journal and preserve their source-line reference array. Invoice
Amount mappings remain one-to-one. The receiver records
these supplied groups; it does not choose or recategorize the accounts. Multiple categories may
use the same ruleCode when their entryKey differs. Duplicate rule/key pairs and mixing keyed and
whole-category entries for one rule are rejected.

Durable uniqueness is source system + source table + source record ID + rule code + source_entry_key.
Omitted entryKey stores an empty key for existing senders. The migration must be applied before
deploying this receiver or using account-keyed senders. An identical
replay returns existing journal IDs. A changed date, amount, account, reference, notes, event type
or complete category set conflicts rather than editing a posted journal. Event type is not an
extra uniqueness dimension: PAY-12 Cancelled and Returned for the same source cannot create two
entries under the same rule identity.

Changing an already-posted whole-category journal into account-keyed entries, or combining keyed
entries, conflicts instead of adding duplicate money. Historical journals are not rewritten.

Audit URLs are metadata and do not participate in duplicate comparison. An invoice-owned retry
through a different payment returns the existing journal and retains its original URL. Existing
invoice-based audit links are not rewritten, and their format does not itself cause a replay conflict.

Invoice totals represent final fully-paid snapshots. Later credit/discount/rebate changes need
review and a separate correction policy; another payment ID is not a way to repost the total.
Historical reversal links remain read-only guards against reposting already-reversed history.
No reversal or correction implementation is provided.

## HTTP layers and rollout

- index.ts: environment, verified-TLS database connection and HTTP startup.
- handler.ts: shared-secret authorization, JSON parsing, service call and safe responses.
- ledger.ts: account resolution, financial validation, source identity, replay checks and direct SQL.
- errors.ts: owned safe error type.

Airtable reads **Dual Ledger Webhook Secret** through input.secret() and sends x-ledger-secret.
The handler compares it with LEDGER_WEBHOOK_SECRET before parsing or database work. The function
uses verify_jwt = false for this authenticated webhook only. SUPABASE_DB_URL stays inside Edge;
no project secret, PAT or database credential is passed to Airtable.

Successful responses include per-category posted, duplicate or noop results and journal IDs.
Validation errors are HTTP 400, identity/data conflicts 409, invalid credentials 401, wrong method
405 and unavailable configuration/database 503. Errors do not expose credentials or database internals.

Source files, saved Airtable actions and deployed Edge code are separate states. Publish compatible
senders and function together. Deployment evidence belongs in the rollout report; this contract
does not establish that publication has completed.

## Consolidated sender cutover - 30 October 2026

Payment Sent now has one script and shares native reads/helpers across cash, vendor-credit and
rebate categories. Invoice identities remain separate from payment identity inside that script.
Rows 11/PAY-10 and 24/PAY-23 throw Not yet implemented for pending account mappings.
PAY-14 payroll remains deferred. PAY-15 staff is partially working: offshore/1099/owner/W2 wages
clear 241.100, payroll taxes clear 241.200 and 401k clears 241.400. Benefits and wire/FX fees are excluded.
PAY-25 interest now posts the signed Invoice Amount to Dr 112.200 / Cr 010.003 once per invoice.
PAY-16/18 use principal and interest invoice lines. Each source account has a separate journal;
same-account lines are summed. Shared interest must have an unambiguous principal owner.
No additional sign, suspense, cancellation or return exclusions are inferred from older notes.

See [current status](ledger-current-status.md) for dated deployment and live-test evidence. Older
rollout records describe their original stage and do not override this current contract.

### Prepay Expenses Log records

`prepayLogRecordId` identifies a FIN Prepay Expenses Log record (`tbl1LgiUYt7Gc492d`) with
`eventType: "created"`. It cannot be combined with payment/invoice/depreciation owner IDs.
Its response and audit link identify the log. EXP-04 supplies Amount Deducted / Applied Date,
007.011 -> 135.000, Notes = Prepay Log, branch from linked invoices. A single linked invoice
is retained as a one-item invoice_ref array without making it the journal owner; multiple invoice
links are retained in the same reference array.

### Fully Paid invoices

`expense-fully-paid.js` uses `eventType: "paid"` and invoiceRecordId. It uses the same invoice
source/audit contract and generic pair writer. This event has its own category-set replay check,
separate from creation and Create Entry. No additional category routing occurs in the receiver.
