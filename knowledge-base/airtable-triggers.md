# Airtable ledger triggers and references

## Official chart and ownership

[Open T-Chart.xlsx](https://chicagobrass.sharepoint.com/:x:/r/Intranet/_layouts/15/Doc.aspx?sourcedoc=%7BF609079B-B392-421C-A170-878D5E60CD60%7D&file=T-Chart.xlsx&action=default&mobileredirect=true).
The three working tabs are Category - Payments, Category - Invoice Entry and Category - Expenses.
Use official Actual Triggers, Debit and Credit columns. Older DEV/FIN prose can explain context
but must not silently add conditions or account splits.

FIN is the owning base: [app0Q1UMEdUeWl538](https://airtable.com/app0Q1UMEdUeWl538).
The AR/AP interfaces often expose synced or filtered copies. Ledger scripts run inside FIN using
native Airtable reads, so the normal ledger sender does not need an Airtable REST PAT.

| FIN table | ID |
| --- | --- |
| Invoices / master invoice table | `tbldQXuqNEp8G5pfs` |
| Payments | `tblR61NG9i0giid28` |
| Chart of Accounts | `tblJ2RF8vlOhNMBKR` |

## All ledger automations

These are editor references and local ownership mappings, not a fresh ON/OFF or publication audit.
Read the live native trigger, inputs, attached secret and saved script before editing. The dated
observations are in [current status](../docs/ledger-current-status.md).

| Automation editor | Primary trigger | Local source | Category ownership |
| --- | --- | --- | --- |
| [Payment Sent](https://airtable.com/app0Q1UMEdUeWl538/wflne8pBqyMXeoYI4/wacNc5NVvasbgYrTM?editorMode=configuration) | Payments.Sent checked | [payment-sent.js](../airtable/payment-sent.js) | Payment movement categories and invoice-owned PAY-10/11/27 handlers; PAY-10 remains blocked |
| [Payment Cancelled](https://airtable.com/app0Q1UMEdUeWl538/wfluW7C3S57rkjJtx/wacPDqO7qTjFV8l1w?editorMode=configuration) | Payments.Cancel Payment checked | [payment-events.js](../airtable/payment-events.js), `eventType=cancelled` | PAY-06 and PAY-12 |
| [Payment Reconciled](https://airtable.com/app0Q1UMEdUeWl538/wflpe86TWSqVn68YP/wacUZxjsdXeCqgEGe?editorMode=configuration) | Payments.Reconciled checked | [payment-events.js](../airtable/payment-events.js), `eventType=reconciled` | PAY-26 |
| [Invoice Entry - Create Entry](https://airtable.com/app0Q1UMEdUeWl538/wflGhhBFp5RFocKAC/wacOwcm9tAerUy2NA?editorMode=configuration) | Invoices.Create Entry checked | [invoice-entry.js](../airtable/invoice-entry.js) | INV-01/03/04/06/07/08/10; INV-09 blocked |
| [Invoice Entry - Invoice Created](https://airtable.com/app0Q1UMEdUeWl538/wflau6oB4awz7O23T/wacuGxuK7B716rxgH?editorMode=configuration) | FIN Invoice record created | [invoice-created.js](../airtable/invoice-created.js) | Remaining outbound-freight handler INV-05, blocked |
| [Expense - Invoice Created](https://airtable.com/app0Q1UMEdUeWl538/wflkMzEKAzYbWQtMt) | FIN Invoice record created | [expense-created.js](../airtable/expense-created.js) | EXP-03 prepaid expense |
| [Expense - Invoice Create Entry](https://airtable.com/app0Q1UMEdUeWl538/wfljsMLxiID5vnmsg/wac4oanK56ColQUF7?editorMode=configuration) | Invoices.Create Entry checked | [expense-entry.js](../airtable/expense-entry.js) | Eight handlers; EXP-07/09 post, others retain explicit blockers |

The old [Invoice Paid](https://airtable.com/app0Q1UMEdUeWl538/wflzzE4XKigE5cg5G) automation was
consolidated into Payment Sent and retired. The old
[Payment Returned](https://airtable.com/app0Q1UMEdUeWl538/wfl5cPAfilrCy5Cmk) automation was also retired.
Sent plus Return Payment (AP) owns the AP return path. Do not recreate those extra senders merely
because older conversation links still point to them. Other source-record-creation automations
with similar names are separate workflows.

## Inputs, transport and field identities

Payment automations take `paymentRecordId` from the native FIN trigger. Invoice automations take
`invoiceRecordId`. Each takes `ledgerWebhookUrl`:
`https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment`.
The event script additionally takes its fixed `eventType`. The secret is named
`Dual Ledger Webhook Secret` and is read with `input.secret()`. It becomes `x-ledger-secret`,
matched against the Edge runtime's `LEDGER_WEBHOOK_SECRET`. Never put its value in source or ordinary inputs.

Important current IDs are also documented inline in each source:

| Field | ID |
| --- | --- |
| Payments.Sent | `fld03L3JpNZBLauEC` |
| Payments.Amount | `fldhP2S68pT3XkZmX` |
| Payments.Payment Date | `fld0mYG8IMrDaNzdE` |
| Payments.Invoice Type | `fldkoW3MMQEe0Lwm1` |
| Payments.Vendor Type | `fldJlmVZzUf5tuz0m` |
| Payments.Master Invoice Table | `fldzPDwsJ1ZT2tVIs` |
| Invoices.Invoice ID, primary name | `fldMZyzqDidRujeZS` |
| Invoices.Invoice Amount To Pay | `fldNqZMZsZfRPiRFp` |
| Invoices.First Ship Out Date (from Linked Transaction) | `fldXs88CyaF07XyWv` |
| Invoices.Create Entry | `fldFrvGncUen39hBY` |
| Invoices.Total Received Not Yet Invoiced | `fldUFz9w6y184Sn7h` |

Select the primary Invoice ID field when using `record.name`. A locally named invoice is not
identity proof for an old/new invoice migration. Re-verify live field names/types when changing filters.

## Runtime rules that have changed during the conversation

- Same-day shipment/payment counts as deposit; Clear to Purchase was removed from the first two
  customer-payment categories. Shipment data now comes directly from the invoice rollup.
- Return Payment (AP) checked qualifies Sent's AP-return handler. Outgoing vendor-bank payment
  explicitly excludes that return path.
- Small overpayment uses raw Overpaid Amount greater than zero and less than five. Do not replace
  the chart's account direction with a guessed short-pay/write-off policy.
- PAY-11 uses invoice Credits Applied and the actual source credits, not just Payment.Amount.
  PAY-27 uses the full Purchased Discounts & Rebate Total. Both keep invoice-owned source identities.
- Current invoice-owned settlement handlers read computed Payment Invoice Status = Fully Paid.
  Earlier manual-AP-status discussions are historical; any new change must reconcile the current chart.
- Invoice Create Entry uses Invoice Date. It is distinct from record creation, allowing line-based
  invoices to be finalized before the user requests an entry.
- Return events use Payment Date; the later Return Payment Date field was not selected for this flow.
- Airtable sends structured references but does not generate notes. There is no automatic reversal.

## Blocked and unresolved cases

| Handler / case | Missing decision or current restriction |
| --- | --- |
| PAY-10 / payment row 11 | Discount Lines Total is known; bank-versus-discount credit scope/split remains undefined |
| PAY-15 / payment row 16 | Salary/fee component split |
| PAY-23 / payment row 24 | Bank/recovery amount split and unresolved chart account mapping |
| PAY-14, PAY-25 | Payroll bank-debit/Fidelity income primary triggers and complete mappings are not routed |
| PAY-16, PAY-18 | Separate single-account principal/interest invoices work; multiple accounts or shared ambiguous interest fail |
| INV-05 / invoice row 6 | Actual outbound freight/handling amount source |
| INV-09 / invoice row 10 | Choose the credit account for vendor price/expense credit |
| Invoice rows 3 and 12 | Primary mappings remain absent |
| EXP-01 | Operating account eligibility list is PENDING |
| EXP-05 | Missing 005.102 Tech Allowance ledger account |
| EXP-06 | Payroll credit 241.600 source component/amount |
| EXP-11 | Credited bank account is PENDING |
| EXP-12, EXP-13 | Outstanding FIN account clarifications and undefined multi-account split |
| Fully-paid card expense | Separate primary-event group is deferred; not the implemented Create Entry group |
| Overlapping chart rows | Broad inbound-freight AP Product filters can also match product receipt/deposit handlers; do not invent an extra filter to hide this risk |

This list is a source-based handoff, not a new accounting approval. Resolved/new chart changes may
require another code comparison. Do not silently implement anything that remains PENDING.

## Workbook note conventions

Keep Actual Trigger notes limited to `[Primary]` and `[Filters]`, one comparison per line. Field
names no longer need braces. Field Mapping lists `Amount =`, `Date =`, `Debit =`, `Credit =` on
separate lines without blank lines inside the group. Separate `[Account Mapping]` with one blank
line; list actual FIN-to-Supabase account identities there, not repeated debit/credit prose.

Use `[Clarification]` for direct unresolved questions or risks, one bullet per item with a blank
line between items. Omit common-sense setup assumptions and stale "not deployed" boilerplate.
Done values distinguish Fully, Partially (a handler exists but throws), and Not yet (no handler).
Do not change other workbook columns when only Actual Trigger/mapping/clarification edits are authorized.

See [airtable/README.md](../airtable/README.md) and the [webhook contract](../docs/ledger-webhook-contract.md)
for detailed allocations, amount sources and implementation limits.
