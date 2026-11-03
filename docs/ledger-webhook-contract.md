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
| airtable/payment-sent.js | Payments.Sent; all payment movements and invoice-owned PAY-11 credits/PAY-27 rebates; PAY-10 remains explicitly blocked |
| airtable/payment-events.js | Cancel Payment (PAY-06/PAY-12) and Reconciled (PAY-26), with a fixed eventType input per automation |
| airtable/invoice-entry.js | Invoices.Create Entry checked; INV-01/03/04/06/07/08/10; INV-09 remains blocked |
| airtable/invoice-created.js | FIN Invoices created; INV-05 remains blocked |
| airtable/expense-entry.js | Invoices.Create Entry checked; EXP-07/09 post; EXP-01/05/06/11/12/13 remain explicitly blocked |

There are three active payment automations, each with one script action: Payment Sent, Payment Cancelled
and Payment Reconciled. Invoice Created is ON with only the blocked outbound-freight handler. Invoice Entry Create Entry is saved OFF for review. The former Invoice Paid and Payment Returned automations were deleted.
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
values are sent, cancelled, returned and reconciled. Invoice events use eventType created or entry_requested
and require invoiceRecordId instead of paymentRecordId; supplying both is rejected. entry_requested is
the Create Entry checkbox event, separate from record creation. Each category has a distinct existing ruleCode,
a nonempty free-text transactionType and a postings array. Rule codes establish catalog identity;
they do not select accounts or amounts. The receiver supports optional category notes on the
journal header, but the Airtable senders do not send notes.

Each nonzero posting supplies a positive decimal amount with cents precision and both account
references. A pair expands into equal debit and credit journal lines. Account identity can be an
Airtable record ID or a ledger/source account number; names are not identities. FIN Nickel 0747
maps to ledger 112.300. The caller uses card-clearing account 231.100.

Optional posting references include invoiceRecordId, debitInvoiceRecordId, creditInvoiceRecordId,
vendorRecordId, clientRecordId, staffRecordId, transactionRecordId, poRecordId, sourceRecordId,
stateCode and branch. Plural *RecordIds arrays preserve multiple links in the packet. The Airtable
senders do not generate notes from these references. The current journal schema stores singular
reference columns only; plural arrays remain payload context and are not persisted as notes.
Structured branch storage remains deferred.

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

Omitted source means FIN Payments table tblR61NG9i0giid28, with record identity paymentRecordId.
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

Invoice-owned categories inside the consolidated Sent script require computed Payment Invoice
Status Fully Paid and use:

- PAY-10: Discount Lines Total, including Open and Applied Discount lines, excluding Expired.
- PAY-11: Credits Applied, with the actual source credit invoices.
- PAY-27: full Purchased Discounts & Rebate Total on an AR Non-Product payment.

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

Payment-owned movements use current Payments.Amount magnitude, with invoice shares weighted by
Invoice Amount To Pay. Unspecified multi-account purpose/component splits are blocked. Multi-invoice
allocations preserve the supplied total in integer cents. Parent card-statement and child
mini-payment values are not added as another bank movement.

The special payment-owned amount is PAY-04, which uses Overpaid Amount strictly above $0 and
below $5. Reconciliation PAY-26 uses Reconciled Amount Discrepancy magnitude. The current official chart uses Dr 007.002 / Cr bank for discrepancy magnitude. No $5 suspense rule is applied.

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

Durable uniqueness is source system + source table + source record ID + rule code. An identical
replay returns existing journal IDs. A changed date, amount, account, reference, notes, event type
or complete category set conflicts rather than editing a posted journal. Event type is not an
extra uniqueness dimension: PAY-12 Cancelled and Returned for the same source cannot create two
entries under the same rule identity.

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
Rows 11/PAY-10, 16/PAY-15 and 24/PAY-23 throw Not yet implemented for their unresolved account
splits. PAY-14 payroll and PAY-25 Fidelity income have no primary mappings and are not routed.
Rows 17/PAY-16 and 19/PAY-18 are implemented: the principal invoice establishes loan versus LOC;
each principal/interest invoice must link one account and receives its proportional payment share.
Multiple accounts per repayment invoice throw. Interest shared by both principal types is ambiguous
and throws; interest alone cannot establish a category.
No additional sign, suspense, cancellation or return exclusions are inferred from older notes.

See [current status](ledger-current-status.md) for dated deployment and live-test evidence. Older
rollout records describe their original stage and do not override this current contract.
