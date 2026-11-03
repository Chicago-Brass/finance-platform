# FIN ledger automation scripts

Native Airtable scripts use CORE / UTILS / HELPER sections. Category functions own their
chart filters. Shared reads use FIN table/field IDs. HELPER only formats console output.
The flow is read data, evaluate every category, prepare posting payloads, post, then log results.
Sent prints its match summary before posting and logs each acknowledgement immediately, so a
later request failure retains the journal IDs already acknowledged. It does not buffer responses.
Both sources use postLedgerPayload for HTTP/authentication/error handling. The Sent source shares
that sender between payment-owned and invoice-owned packets. Payment senders do not read invoice
lines. Expense Create Entry reads matching invoice lines; accounts and amounts are finalized in CORE/UTILS.
Invoice and source-credit reads explicitly select Invoice ID (fldMZyzqDidRujeZS), the primary
field required for native record.name to supply the invoice label in descriptions and logs.
Audit references use structured record ID fields and arrays only. The senders do not generate
or send category/posting notes. Existing Supabase notes and receiver support remain unchanged;
replaying an older entry that contains notes can conflict with the new notes-free payload.

## Deployed automation ownership

| Automation | Source | Primary event | Categories |
| --- | --- | --- | --- |
| Payment Sent | payment-sent.js | Payments.Sent checked | PAY-01-05, PAY-07-13, PAY-15-24, PAY-27 |
| Payment Cancelled | payment-events.js | Payments.Cancel Payment checked | PAY-06 and PAY-12 |
| Payment Reconciled | payment-events.js | Payments.Reconciled checked | PAY-26 |
| Invoice Entry - Create Entry | invoice-entry.js | Invoices.Create Entry checked | INV-01/03/04/06/07/08/10; INV-09 blocked |
| Invoice Entry - Invoice Created | invoice-created.js | FIN Invoices record created | INV-05 blocked |
| Expense - Invoice Created | expense-created.js | FIN Invoices record created | EXP-03 prepaid expense |
| Expense - Invoice Create Entry | expense-entry.js | Invoices.Create Entry checked | EXP-01/05/06/07/09/11/12/13; only EXP-07 and EXP-09 currently post |

The three payment automations and Invoice Created were observed ON on 4 November 2026.
Expense - Invoice Create Entry is OFF, with one saved script action. Payment Sent has one script action. The former Invoice
Paid action was consolidated into that script. The separate Invoice Paid and legacy Payment
Returned automations were moved to trash, as requested. AP returns are handled by Sent + Return
Payment (AP); no standalone return event is implemented by the official chart.

The existing ON states and new expense setup were refreshed on 4 November 2026. Live state must be read again before
later changes. Source files and mock tests are not independent deployment proof.
Latest verification and test scope: [current ledger status](../docs/ledger-current-status.md).

## Inputs and secret

Payment scripts take paymentRecordId from the trigger's FIN Airtable record ID. Invoice Created
takes invoiceRecordId instead. All scripts take ledgerWebhookUrl:
https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment.

expense-entry.js takes invoiceRecordId and ledgerWebhookUrl, like Invoice Created.
payment-events.js additionally takes fixed eventType = cancelled or reconciled. The secret is
**Dual Ledger Webhook Secret**, accessed with input.secret(), matching LEDGER_WEBHOOK_SECRET.
No PAT or database credential belongs in an ordinary automation input.

## Source of truth

Use the T-Chart Debit, Credit and Actual Triggers columns. Explicit Actual Triggers account notes
take precedence, including bank transfers: debit payment bank, credit invoice bank. Older DEV/FIN
notes do not add filters, amount formulas, sign changes or suspense routing.

- Shipment date blank or Payment Date on/before shipment is a deposit; later is AR settlement.
  Clear to Purchase is not required.
- Every matching Sent category is evaluated. Row 8 requires Return Payment (AP) unchecked,
  so a returned vendor payment does not also post an outgoing bank payment. Other categories,
  including invoice-owned categories, retain their existing filters.
- Row 5 qualifies from raw Overpaid Amount > 0 and < 5; it posts Dr 007.002 / Cr 121.100.
- Vendor refunds debit Fifth Third 112.100, following the chart's account column.
- Reconciliation uses discrepancy magnitude, Dr 007.002 / Cr payment bank. No AP/AR sign flip or
  undocumented $5 suspense threshold is applied.
- Payments.Amount supplies the payment movement. Previously agreed invoice allocation uses Amount
  To Pay and conserves cents. Native negative amounts become positive ledger magnitudes; account
  columns determine direction. Money is rounded to cents only for posting.
- Vendor credits use full Credits Applied with distinct bill/source-credit invoice references.
  Card rebates use full Purchased Discounts & Rebate Total. They retain invoice-owned identities
  after consolidation, preventing a later payment from reposting the same invoice total.

## Explicitly not yet implemented

Category functions contain a comment and throw a **Not yet implemented** error when these written
filters match but their multiple-account split remains undefined:

| Sheet row / code | Category | Missing definition |
| --- | --- | --- |
| 11 / PAY-10 | Early vendor discount | Amount source is Discount Lines Total; bank versus discount credit scope/split is unclear |
| 16 / PAY-15 | Offshore/1099/owner staff | Salary versus fee amounts |
| 24 / PAY-23 | Insurance payout | Bank versus recovery amounts; chart also marks account 122.100 unresolved |

PAY-16 and PAY-18 debit the single account on each linked principal/interest invoice and credit
the payment account. Their principal account (232.100 or 231.200) must be present on the payment's
linked invoices to establish the category. Separate invoice amounts weight the shared payment;
invoice-line amounts are not used. Multiple accounts on one qualifying invoice throw, including
zero payments. Both principal types with shared interest also throw because its owner is ambiguous.
An interest-only payment cannot establish either category. Accounts 232.200/232.300 are outside
the official row mappings and are not silently treated as Auto Loan Payable.

Invoice purpose allocation with multiple linked accounts also throws instead of inventing an
invoice-line weighting formula. Single-account cases retain their chart-defined amount/account.

Payroll PAY-14 (row 15) and Fidelity income PAY-25 (row 26) have no primary trigger/filter mapping.
Their commented category stubs throw if called, but are not routed by guessed conditions.

## Posting and validation

One consolidated Sent run prepares every category before the first webhook. It then sends one
payment-owned packet, followed by invoice-owned packets for vendor-credit/rebate totals. Reads and
helpers are shared; there is no second automation or second script action for invoice totals.

A blocked category throws before this run posts anything. A later network/receiver failure can
happen after an earlier packet committed; exact retries deduplicate. Financial/source changes
conflict and require review. Historical payment-owned rebate journals were not migrated.

The generic Edge Function authenticates and writes balanced supplied pairs directly, without a database posting function
or automatic reversal/deletion. Airtable records are read only. Native missing-record, field,
account, monetary, date and multiple-Vendor-Type validation remains.
Audit links are generated in the Edge Function from paymentRecordId and open the triggering FIN
payment on every new payment-triggered header and line. Invoice-created events have no payment;
their audit links open the source invoice. Invoice ownership and invoice reference fields are separate.

## Invoice Entry - Create Entry / Invoice Created

The 4 November chart update moves worksheet rows 2/4/5/7/8/9/10/11 to
Invoices.Create Entry checked. Automation wflGhhBFp5RFocKAC / wacOwcm9tAerUy2NA
uses invoice-entry.js, invoiceRecordId from the trigger, ledgerWebhookUrl and the
existing Dual Ledger Webhook Secret. It sends invoice-owned entry_requested events.

Rows 2 and 4 use Total Received Not Yet Invoiced (fldUFz9w6y184Sn7h) > 0 / = 0.
They post Invoice Amount, Dr 211.200 / Cr 211.100 or Dr 132.100 / Cr 211.100.
A blank rollup does not qualify as numeric zero. Row 5 retains its official broad AP Product
filter and can match alongside row 2 or 4. No freight-only condition is inferred.
Rows 5/7/8/9/11 retain their previous amounts/accounts; credits use ABS(Invoice Amount).
Invoice Date supplies every entry date. Row 10 still throws until its credit-account
selection is resolved. Rows 3 and 12 remain unmapped.

invoice-created.js retains only row 6, which throws pending the freight-cost source.
All migrated handlers were removed from its CORE and main. Both scripts retain native
FIN field-ID reads and the same CORE / UTILS / HELPER infrastructure. No notes or
Airtable record writes are added. No webhook occurs if a matching blocker throws.

Existing source/rule journal identity is preserved. Re-requesting an INV rule already
posted under created can conflict on its event metadata; journals are not rewritten.
The focused check covers both scripts with mocked fetches and no live financial writes.

## Expense Create Entry - 4 November 2026

Only the Create Entry group from the current Category - Expenses sheet is installed in this phase.
The separate Fully Paid card-expense path remains deferred. Prepaid creation is now handled by expense-created.js.
All entries use Invoice Date, including chart dates marked PENDING. Existing payment and invoice
creation sources were read from their browser editors and matched the local files without replacement.

| Expense row / rule | Behavior |
| --- | --- |
| 2 / EXP-01 | Blocks: operating-account eligibility is PENDING |
| 6 / EXP-05 | Blocks: ledger account 005.102 is missing in Supabase |
| 7 / EXP-06 | Blocks: 241.600 payroll component/amount is undefined |
| 8 / EXP-07 | Each matching 005.101/005.003/005.001 Line Amount debits its account and credits 241.100 |
| 10 / EXP-09 | Each matching 005.201 Line Amount debits 005.201 and credits 241.300 |
| 12 / EXP-11 | Blocks: the credited bank account is PENDING |
| 13 / EXP-12 | Blocks: the chart's missing FIN 121.900 clarification remains unresolved |
| 14 / EXP-13 | Blocks: the chart's missing FIN 011.001/011.002 clarification remains unresolved; a two-account invoice has no defined split |

The eight CORE handlers own their filters. UTILS caches native invoice-line/account reads, batches
linked IDs, calculates integer cents and posts one packet. HELPER formats logs only. Each qualifying
line links one account and belongs only to the triggering invoice; no whole-line amount is duplicated
across accounts or invoices. Offshore payroll and bonus categories can post together atomically.
Any matching blocker throws before the first webhook, even after an earlier category was prepared.

The entry_requested invoice event is independent from created, so the same invoice can have both
events without confusing category-set replay checks. Existing EXP rule codes are used. No schema,
catalog or Airtable financial-record changes were made. Source line IDs and invoice/vendor/staff/
transaction/PO refs are passed without generated notes. Zero lines are no-ops; missing, negative or
nonfinite amounts fail. There is no automatic retry or live posting test in this phase.

Local checks cover filters, amounts, shared reads, blockers, no partial posting, date conversion,
source ownership, large linked-record batches and HTTP failures. The disposable database check covers
created plus entry_requested on one invoice, concurrent delivery, exact retries and changed-payload conflicts.

## Checks

```sh
node airtable/check.cjs
node airtable/check-invoice-settlement.cjs
node airtable/check-invoice-created.cjs
node airtable/check-expense-entry.cjs
node airtable/check-expense-created.cjs
```

The second check now exercises invoice categories inside payment-sent.js. It does not correspond
to a separate deployed sender. Fetch is mocked; fixture/account snapshots are local. No live
payment was toggled or retriggered during this cutover.

## Expense Invoice Created - 4 November 2026

Expense | Invoice Created is ON with one script action, expense-created.js. The input invoiceRecordId
is the native trigger record ID, with the standard ledgerWebhookUrl and existing Dual Ledger Webhook
Secret. The native event remains record creation in FIN Invoices; the CORE handler requires AP,
AP - Expenses (Non-Sales Tax), and Mark as Prepaid Expense? checked.

Category - Expenses row 4 / EXP-03 posts the full Invoice Amount, Dr 135.000 / Cr 211.100, on Invoice
Date. Fixed ledger account numbers need no FIN account link. Both ledger accounts and the EXP-03 rule
exist. Zero amounts produce no monetary posting; negative or missing amounts fail. Structured invoice
and related-record refs are sent without notes. Existing created-event idempotency is reused.

Six focused mocked behavior checks passed. Saved browser source was compared with local source;
inputs, attached secret and ON state were verified. No live invoice or ledger test was created.
The separate Invoice Entry row 6 AP-expense handler remains blocked on its freight source; it can also
match a prepaid invoice but is outside this installation's scope.
