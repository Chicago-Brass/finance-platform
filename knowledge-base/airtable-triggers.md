# Airtable ledger automation reference

The [ledger sync webhook](../supabase/functions/ledger-daily/README.md) locally prepares Payment,
Expense and Invoice Entry categories for an Airtable/Make schedule. It has a global run lock and
a separate GET-only inspector. It has not replaced these native triggers or enabled a schedule.

Reversal was deployed on 9 November 2026: the same `airtable/ledger-reversal.js` is published
in two ON Reverse Ledger checkbox automations, one on Payments and one on Invoices. It stamps
a blank manual Reverse Date once and calls the separate `ledger-reversal` endpoint. Unchecking
does nothing. Fields, contract, writeback and deferred repost behavior are in the
[reversal guide](../docs/ledger-reversal.md), including editor links and field IDs.

The existing posting/reversal receivers now maintain `Ledger Postings` objects
`{rule, key, datetime, id}` and both original/reversal ID arrays on the owning Payment or Invoice.
They share a server-only `AIRTABLE_PAT` secret and verify Airtable after each metadata write.
Native scripts and primary triggers remain unchanged. The daily worker will use the same metadata
and reversal endpoint at cutover; no daily cron is enabled.

## Ownership and specification

[T-Chart.xlsx](https://chicagobrass.sharepoint.com/:x:/r/Intranet/_layouts/15/Doc.aspx?sourcedoc=%7BF609079B-B392-421C-A170-878D5E60CD60%7D&file=T-Chart.xlsx&action=default&mobileredirect=true)
contains Category - Payments, Category - Invoice Entry and Category - Expenses. Official Actual
Triggers, Debit and Credit mappings define intended behavior. Do not infer missing conditions,
account direction or amount splits from informal wording.

[FIN](https://airtable.com/app0Q1UMEdUeWl538) owns Invoices, Payments and Chart of Accounts. AR/AP
interfaces can be synced/filtered mirrors. Scripts read native FIN records, not a REST mirror.

| Table | ID |
| --- | --- |
| Invoices | `tbldQXuqNEp8G5pfs` |
| Payments | `tblR61NG9i0giid28` |
| Chart of Accounts | `tblJ2RF8vlOhNMBKR` |
| Depreciation Table | `tblC0dbO5UMXzHma9` |
| Prepay Expenses Log | `tbl1LgiUYt7Gc492d` |

## Automation and source map

Editor links identify the owning automation. They do not establish its current publication or
ON/OFF state. Read the native trigger, saved code, inputs and secret before changing a deployment.

| Automation | Native event | Source and category scope |
| --- | --- | --- |
| [Payment Sent](https://airtable.com/app0Q1UMEdUeWl538/wflne8pBqyMXeoYI4/wacNc5NVvasbgYrTM?editorMode=configuration) | Payments.Sent checked | `payment-sent.js`; payment categories plus invoice-owned PAY-04 shortfall, PAY-10/11/25/27 |
| [Payment Cancelled](https://airtable.com/app0Q1UMEdUeWl538/wfluW7C3S57rkjJtx/wacPDqO7qTjFV8l1w?editorMode=configuration) | Payments.Cancel Payment checked | `payment-events.js`, eventType=cancelled; PAY-06/12 |
| [Payment Reconciled](https://airtable.com/app0Q1UMEdUeWl538/wflpe86TWSqVn68YP/wacUZxjsdXeCqgEGe?editorMode=configuration) | Payments.Reconciled checked | `payment-events.js`, eventType=reconciled; PAY-26 |
| [Invoice Entry - Create Entry](https://airtable.com/app0Q1UMEdUeWl538/wflGhhBFp5RFocKAC/wacOwcm9tAerUy2NA?editorMode=configuration) | Invoices.Create Entry checked | `invoice-entry.js`; INV-01/03/04/06/07/08/09/10 |
| [Invoice Entry - Invoice Created](https://airtable.com/app0Q1UMEdUeWl538/wflau6oB4awz7O23T/wacuGxuK7B716rxgH?editorMode=configuration) | Invoice record created | `invoice-created.js`; INV-05 |
| [Expense - Invoice Create Entry](https://airtable.com/app0Q1UMEdUeWl538/wfljsMLxiID5vnmsg/wac4oanK56ColQUF7?editorMode=configuration) | Invoices.Create Entry checked | `expense-entry.js`; EXP-01/03/05/06/07/09/12/13; benefits excluded |
| [Invoice Full Paid](https://airtable.com/app0Q1UMEdUeWl538/wflDvBP1auBa9c9PN/waceuIg4lkutXpjmv?editorMode=configuration) | Payment Invoice Status Fully Paid | `expense-fully-paid.js`; EXP-02/11 |
| [Depreciation Created](https://airtable.com/app0Q1UMEdUeWl538/wflncSEohUJfvRn8m/wacJduHfXZZAbR4uF?editorMode=configuration) | Depreciation Table created | `depreciation-created.js`; EXP-10 |
| [Prepaid Use Created](https://airtable.com/app0Q1UMEdUeWl538/wflknpQ6mJixShE5w/wacwerzCdBCGBAAgY) | Prepay Expenses Log created | `prepay-created.js`; EXP-04 |

Invoice Paid and standalone Payment Returned are retired senders. Payment Sent owns settlement
handlers and AP returns via Return Payment (AP). Do not recreate an extra sender without checking
category ownership and duplication risk.

The Expense senders and receiver were published on 7 November 2026. Prepaid bills moved to
Create Entry and the old Expense Invoice Created automation was deleted. Depreciation and
prepaid use-up retain their own native record-created events. No live posting tests were run.

Invoice Entry was refreshed on 7 November 2026. Row 4 uses the new invoice PO status/receipt
rollups, row 5 posts Freight, row 10 credits COGS 004.010, and signed amounts are preserved.
Daily 11 PM Central is a documentation draft only; native triggers remain unchanged until the
posted-invoice selection rule is defined. Rows 3/12 are deferred. Row 6 uses its three approved AP expense/account filters without a vendor restriction.

## Inputs and transport

Payment scripts receive `paymentRecordId`; invoice scripts receive `invoiceRecordId`.
Depreciation and prepaid-use scripts receive `depreciationRecordId` and `prepayLogRecordId` respectively. The event
script also receives its fixed `eventType`. All receive `ledgerWebhookUrl`:
`https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment`.

`input.secret('Dual Ledger Webhook Secret')` supplies `x-ledger-secret`, checked against the Edge
runtime's `LEDGER_WEBHOOK_SECRET`. Values never belong in source, ordinary inputs or logs.
Field constants use IDs with readable comments. Recheck live field ownership/types before edits.

## Category behavior

- Each invoice's Linked Chart of Accounts identifies one account. Each invoice line also has one
  account; an invoice can contain several lines with different accounts. Sum matching line amounts
  by account and create one journal per account. Invoice-amount categories use the full invoice amount.
- Payment row 20 requires different payment-linked and invoice-linked bank account IDs. The saved
  ON native sender was verified after reload; the local daily worker includes the same filter.
- Use Payments.Invoice Type and Vendor Type; multiple distinct vendor types fail.
- Blank first shipment or Payment Date on/before first shipment is deposit; later means settlement.
  The source is Invoices.First Ship Out Date (from Linked Transaction); no Clear to Purchase filter.
- Sent + Return Payment (AP) owns the AP-return path; outgoing vendor-bank payments exclude returns.
- PAY-04 uses 0 < Overpaid Amount <= 1 per payment or 0 < verified Invoice Remaining Balance <= 5 once per invoice. Both use Dr 007.002 / Cr 121.100.
- Invoice-owned settlement handlers use Payment Invoice Status = Fully Paid. PAY-11 reads actual
  applied credits; PAY-27 uses Purchased Discounts & Rebate Total. Ownership remains the invoice.
- Invoice Create Entry uses Invoice Date. Return entries use Payment Date.
- Expense row 12 / EXP-11 posts Invoice Amount once, debit 007.002 and credit the bank on Linked
  Payments -> Account to Pay/Receive. FIN 112.100 maps to 112.100; FIN 0747 maps to 112.300. All
  payments must identify the same supported bank. Missing/mixed banks fail; no Sent filter or
  payment-amount allocation is added. The primary event is now invoice Fully Paid, not Create Entry.
- Every applicable category is evaluated. Unresolved matches fail before posting prepared packets.

## Explicit implementation limits

| Handler | Unresolved mapping or restriction |
| --- | --- |
| PAY-10 | Discount credit account scope/split |
| PAY-15 | Working salary/payroll-tax/401k liability groups; wire/FX fees and benefits excluded |
| PAY-23 | Bank/recovery component split and account mapping |
| PAY-14 | Deferred payroll category |
| PAY-16/18 | Invoice-line groups supported; ambiguous shared interest fails |
| Invoice rows 3/12 | Primary mappings absent |
| EXP-06 | W2 salary/payroll-tax/401k groups implemented; employee benefits 241.600 excluded |
| Overlapping freight/product rows | Broad AP Product filters can match multiple handlers |

PAY-25 uses the full signed Invoice Amount on an AR Non-Product invoice linked to 010.003,
debit 112.200 and credit 010.003, with invoice-owned identity. PAY-15/16/18 use signed invoice-line
totals and one keyed journal per source account. Payment movements and reconciliation retain
their source sign. Native triggers remain Sent/Cancelled/Reconciled; the daily 11 PM schedule is
only in the workbook draft. See the [Payment audit](../docs/payment-category-audit.md).
See [source documentation](../airtable/README.md) and the [webhook contract](../docs/ledger-webhook-contract.md).

The fresh T-Chart (100) resolves Utilities, Tech Allowance, reserve and tax mappings. PTO remains
deferred. Same-account lines sum into one pair/journal using entryKey; all source lines persist.
Branch persists on both legs, with Branch Employee for Tech Allowance. Depreciation stays NULL;
prepaid use reads linked invoice branches. Empty or mixed attribution stays NULL. Accounts 009.002,
009.006 and 005.102 were created and verified in DUAL ENTRY. See the [Expense audit](../docs/expense-audit.md).

## Workbook formatting

Actual Trigger contains `[Primary]` and `[Filters]`, one field comparison per line. Field Mapping
lists Amount/Date/Debit/Credit sources on separate lines. Separate `[Account Mapping]` with a blank
line and list FIN-to-ledger identities there. `[Clarification]` contains direct unresolved questions
or risks, one bullet per item with space between items. Done distinguishes Fully, Partially (a
handler works with exclusions or throws for an unresolved mapping), and Not yet (no handler). Edit only the authorized workbook columns.

Current cross-automation review: [infrastructure audit](../docs/automation-infrastructure-audit.md).
Business references persist as arrays, and all line categories sum four-decimal source values
before rounding each invoice/account subtotal to cents. Signed amounts are preserved.
