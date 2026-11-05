# Airtable ledger automation reference

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

## Automation and source map

Editor links identify the owning automation. They do not establish its current publication or
ON/OFF state. Read the native trigger, saved code, inputs and secret before changing a deployment.

| Automation | Native event | Source and category scope |
| --- | --- | --- |
| [Payment Sent](https://airtable.com/app0Q1UMEdUeWl538/wflne8pBqyMXeoYI4/wacNc5NVvasbgYrTM?editorMode=configuration) | Payments.Sent checked | `payment-sent.js`; payment categories plus invoice-owned PAY-10/11/27 |
| [Payment Cancelled](https://airtable.com/app0Q1UMEdUeWl538/wfluW7C3S57rkjJtx/wacPDqO7qTjFV8l1w?editorMode=configuration) | Payments.Cancel Payment checked | `payment-events.js`, eventType=cancelled; PAY-06/12 |
| [Payment Reconciled](https://airtable.com/app0Q1UMEdUeWl538/wflpe86TWSqVn68YP/wacUZxjsdXeCqgEGe?editorMode=configuration) | Payments.Reconciled checked | `payment-events.js`, eventType=reconciled; PAY-26 |
| [Invoice Entry - Create Entry](https://airtable.com/app0Q1UMEdUeWl538/wflGhhBFp5RFocKAC/wacOwcm9tAerUy2NA?editorMode=configuration) | Invoices.Create Entry checked | `invoice-entry.js`; INV-01/03/04/06/07/08/10, INV-09 placeholder |
| [Invoice Entry - Invoice Created](https://airtable.com/app0Q1UMEdUeWl538/wflau6oB4awz7O23T/wacuGxuK7B716rxgH?editorMode=configuration) | Invoice record created | `invoice-created.js`; INV-05 placeholder |
| [Expense - Invoice Created](https://airtable.com/app0Q1UMEdUeWl538/wflkMzEKAzYbWQtMt) | Invoice record created | `expense-created.js`; EXP-03 prepaid expense |
| [Expense - Invoice Create Entry](https://airtable.com/app0Q1UMEdUeWl538/wfljsMLxiID5vnmsg/wac4oanK56ColQUF7?editorMode=configuration) | Invoices.Create Entry checked | `expense-entry.js`; EXP-07/09/11 post, remaining matched placeholders fail |

Invoice Paid and standalone Payment Returned are retired senders. Payment Sent owns settlement
handlers and AP returns via Return Payment (AP). Do not recreate an extra sender without checking
category ownership and duplication risk.

## Inputs and transport

Payment scripts receive `paymentRecordId`; invoice scripts receive `invoiceRecordId`. The event
script also receives its fixed `eventType`. All receive `ledgerWebhookUrl`:
`https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment`.

`input.secret('Dual Ledger Webhook Secret')` supplies `x-ledger-secret`, checked against the Edge
runtime's `LEDGER_WEBHOOK_SECRET`. Values never belong in source, ordinary inputs or logs.
Field constants use IDs with readable comments. Recheck live field ownership/types before edits.

## Category behavior

- Use Payments.Invoice Type and Vendor Type; multiple distinct vendor types fail.
- Blank first shipment or Payment Date on/before first shipment is deposit; later means settlement.
  The source is Invoices.First Ship Out Date (from Linked Transaction); no Clear to Purchase filter.
- Sent + Return Payment (AP) owns the AP-return path; outgoing vendor-bank payments exclude returns.
- Small overpayment uses raw Overpaid Amount greater than zero and less than five.
- Invoice-owned settlement handlers use Payment Invoice Status = Fully Paid. PAY-11 reads actual
  applied credits; PAY-27 uses Purchased Discounts & Rebate Total. Ownership remains the invoice.
- Invoice Create Entry uses Invoice Date. Return entries use Payment Date.
- Expense row 12 / EXP-11 posts Invoice Amount once, debit 007.002 and credit the bank on Linked
  Payments -> Account to Pay/Receive. FIN 112.100 maps to 112.100; FIN 0747 maps to 112.300. All
  payments must identify the same supported bank. Missing/mixed banks fail; no Sent filter or
  payment-amount allocation is added. The generic expense placeholder skips this specific match.
- Every applicable category is evaluated. Unresolved matches fail before posting prepared packets.

## Explicit implementation limits

| Handler | Unresolved mapping or restriction |
| --- | --- |
| PAY-10 | Discount credit account scope/split |
| PAY-15 | Payroll salary/fee split |
| PAY-23 | Bank/recovery component split and account mapping |
| PAY-14/25 | Primary trigger and complete routing not implemented |
| PAY-16/18 | Single-account components supported; ambiguous multiple-account splits fail |
| INV-05 | Outbound freight/handling amount source |
| INV-09 | Credit account for vendor price/expense credit |
| Invoice rows 3/12 | Primary mappings absent |
| EXP-01 | Eligible operating-account list |
| EXP-05 | Missing 005.102 Tech Allowance mapping |
| EXP-06 | Source amount for payroll component 241.600 |
| EXP-12/13 | FIN account clarifications and undefined multi-account split |
| Fully-paid card expense | Separate event group not wired by the Create Entry sender |
| Overlapping freight/product rows | Broad AP Product filters can match multiple handlers |

This is the checked-in implementation boundary, not accounting approval or a live chart audit.
See [source documentation](../airtable/README.md) and the [webhook contract](../docs/ledger-webhook-contract.md).

## Workbook formatting

Actual Trigger contains `[Primary]` and `[Filters]`, one field comparison per line. Field Mapping
lists Amount/Date/Debit/Credit sources on separate lines. Separate `[Account Mapping]` with a blank
line and list FIN-to-ledger identities there. `[Clarification]` contains direct unresolved questions
or risks, one bullet per item with space between items. Done distinguishes Fully, Partially (a
handler exists but throws), and Not yet (no handler). Edit only the authorized workbook columns.
