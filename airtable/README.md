# FIN ledger automation scripts

The reversal-only script `ledger-reversal.js` is published in five ON automations: Payments,
Invoices, Invoice Lines, Prepay Expenses Log and Depreciation Table. It stamps a blank manual
Reverse Date once and sends only source identity and date to `ledger-reversal`. Supabase finds
all original journals owned by that exact record and maintains the three metadata fields;
the native sender does not read or rewrite cached journal IDs. Unchecking does nothing.
See the [reversal setup and automation links](../docs/ledger-reversal.md).

The five source tables have `Ledger Postings` JSON objects `{rule,key,datetime,id}`, plus
original/reversal journal ID arrays. Shared receiver code writes and independently reads back
these fields using server-only `AIRTABLE_PAT`. Original posting markers remain after reversal.
On 12 November 2026, `ledger-payment` v20, `ledger-reversal` v8, `ledger-periods` v3
and `ledger-daily` v12 were published. All 42 downloaded runtime modules matched local source.
All five native reversal automations were reloaded ON with correct inputs, shared secret and
exact saved script matches. The daily webhook remains unscheduled. Temporary test automations
were removed after verification.

Current isolated checks passed 11 native reversal cases, 91 disposable database checks,
56 focused checks, 17 report checks and TypeScript, plus all-five-source closed-period
approval/retry proof. Authorized live testing posted and reversed 66 journals from 62 Expense
sources across 15 rules. All original/reversal writebacks were verified; report calculations
reconciled with stored lines across date windows and branches. Coverage limits are in the
[Expense review](../docs/expense-audit.md). Historical 9 November live tests covered
Payments/Invoices only. Restoration remains deferred.

Native Airtable scripts use CORE / UTILS / HELPER sections. Category functions own their
chart filters. Shared reads use FIN table/field IDs. HELPER only formats console output.
The flow is read data, evaluate every category, prepare posting payloads, post, then log results.
Sent prints its match summary before posting and logs each acknowledgement immediately, so a
later request failure retains the journal IDs already acknowledged. It does not buffer responses.
Both sources use postLedgerPayload for HTTP/authentication/error handling. The Sent source shares
that sender between payment-owned and invoice-owned packets. Payment Sent reads invoice lines for staff, loan/LOC repayments and the pending discount category. Expense Create Entry reads matching invoice lines; accounts and amounts are finalized in CORE/UTILS.
Invoice and source-credit reads explicitly select Invoice ID (fldMZyzqDidRujeZS), the primary
field required for native record.name to supply the invoice label in descriptions and logs.
Payment and invoice audit references use structured record ID fields and arrays only. Those senders
do not generate or send category/posting notes. Existing Supabase notes and receiver support remain unchanged;
replaying an older entry that contains notes can conflict with the new notes-free payload.

## Depreciation Created

`depreciation-created.js` implements Category - Expenses row 11 / EXP-10 for a record-created
event in FIN Depreciation Table (`tblC0dbO5UMXzHma9`). The sender and receiver are published. Creation posts immediately,
preserving Date even when it is in the future; no scheduled-date filter is added.

Target: [Expense - Depreciation Created](https://airtable.com/app0Q1UMEdUeWl538/wflncSEohUJfvRn8m/wacJduHfXZZAbR4uF?editorMode=configuration).
The native record-created trigger, script inputs and existing secret were inspected before publication.

| Mapping | Source / destination |
| --- | --- |
| Amount | Amount Depreciated (`fld58fd0YHB0YRxC1`) |
| Date | Date (`fldQ299tE4wJB4SmH`), passed unchanged |
| Debit | 009.101 Depreciation Expense |
| Credit | 161.000 Accumulated Depreciation |
| Notes | Associated Asset (`fldLXqVZ4TUaxq8kF`) names and record IDs |

Inputs are `depreciationRecordId` from the trigger and the existing `ledgerWebhookUrl`;
the secret remains `Dual Ledger Webhook Secret`. The source and audit link identify the
depreciation record, with no payment or invoice identity. This category includes the
requested asset note; prepaid use-up separately includes Prepay Log text. A zero amount sends a no-op; signed amounts are preserved. Missing or nonfinite amounts fail before posting.
Run `node airtable/check-depreciation-created.cjs` for the native mock check.

Current cross-automation review: [infrastructure audit](../docs/automation-infrastructure-audit.md).

## Deployed automation ownership

| Automation | Source | Primary event | Categories |
| --- | --- | --- | --- |
| Payment Sent | payment-sent.js | Payments.Sent checked | PAY-01-05, PAY-07-13, PAY-15-25, PAY-27 |
| Payment Cancelled | payment-events.js | Payments.Cancel Payment checked | PAY-06 and PAY-12 |
| Payment Reconciled | payment-events.js | Payments.Reconciled checked | PAY-26 |
| Invoice Entry - Create Entry | invoice-entry.js | Invoices.Create Entry checked | INV-01/03/04/06/07/08/09/10 |
| Invoice Entry - Invoice Created | invoice-created.js | FIN Invoices record created | INV-05 |
| Expense - Invoice Create Entry | expense-entry.js | Invoices.Create Entry checked | EXP-01/03/05/06/07/09/12/13; benefits excluded |
| Invoice Full Paid | expense-fully-paid.js | Payment Invoice Status Fully Paid | EXP-02/11 |
| Expense - Depreciation Created | depreciation-created.js | Depreciation Table record created | EXP-10 |
| Expense - Pre-pay Amortization Created | prepay-created.js | Prepay Expenses Log record created | EXP-04 |

Expense ownership was refreshed from the live automation editors on 7 November 2026.
The old Expense - Invoice Created automation was deleted after moving prepaid bills to Create Entry.
See the [Expense audit](../docs/expense-audit.md) for exact current mappings and test scope.

The three payment automations and Invoice Created were observed ON on 4 November 2026.
Expense - Invoice Create Entry was observed ON on 5 November 2026, with one saved script action. Payment Sent has one script action. The former Invoice
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
- Row 5 uses 0 < Overpaid Amount <= 1 per payment, or 0 < Invoice Remaining Balance <= 5 once per invoice. The shortfall must reconcile to Amount To Pay minus Total Paid Amount. Both branches retain Dr 007.002 / Cr 121.100.
- Vendor refunds debit the selected payment account and credit AP 211.100.
- Reconciliation uses the signed discrepancy, Dr 007.002 / Cr payment bank. No AP/AR sign flip or
  undocumented $5 suspense threshold is applied.
- Payments.Amount supplies the payment movement. Previously agreed invoice allocation uses Amount
  To Pay and conserves signed cents. Negative source amounts remain negative on the chart-selected
  sides. Staff and loan/LOC line amounts instead sum by source account before posting.
- Vendor credits use full Credits Applied with distinct bill/source-credit invoice references.
  Card rebates use full Purchased Discounts & Rebate Total. They retain invoice-owned identities
  after consolidation, preventing a later payment from reposting the same invoice total.

## Explicitly not yet implemented

Category functions contain a comment and throw a **Not yet implemented** error when these written
filters match but their multiple-account split remains undefined:

| Sheet row / code | Category | Missing definition |
| --- | --- | --- |
| 11 / PAY-10 | Early vendor discount | Amount source is Discount Lines Total; bank versus discount credit scope/split is unclear |
| 24 / PAY-23 | Insurance payout | Bank versus recovery amounts; chart also marks account 122.100 unresolved |

PAY-15 is working but partial: staff line accounts 005.101/005.003/005.001/005.002 debit
241.100; payroll tax 005.006 debits 241.200; 401k 005.005 debits 241.400. Each credits the
selected bank. Benefits and wire/FX fees are excluded pending their source/mapping.

PAY-16 and PAY-18 read invoice lines for principal 232.100 / 231.200 and interest 007.003.
Staff and debt lines sum by source account into separate journals using entryKey, preserving
every source line ID and each invoice/branch reference. Lines retain four-decimal precision
until their grouped invoice/account subtotal rounds to cents. A partial payment currently posts
the chart's full line totals, not an inferred percentage of them. Ambiguous shared interest fails.
Other multi-account invoice-purpose splits remain blocked rather than inventing an allocation.

PAY-25 qualifies AR Non-Product invoices linked to Interest and Dividends 010.003. The signed
Invoice Amount posts once per invoice, debit Fidelity 112.200 and credit 010.003, on Payment Date.
PAY-14 payroll remains deferred and is not routed by guessed conditions.

The Payment workbook proposes daily 11 PM America/Chicago with the existing event checkboxes
inside Filters. That schedule is documentation only; native payment triggers remain unchanged.
See [Payment audit](../docs/payment-category-audit.md) for the current scope and remaining issues.

## Posting and validation

One consolidated Sent run prepares every category before the first webhook. It then sends one
payment-owned packet, followed by invoice-owned packets for shortfalls, credits, interest and rebates. Reads and
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

The 7 November chart review retains existing native automation triggers. Create Entry owns
rows 2/4/5/7/8/9/10/11 in `invoice-entry.js`; Invoice Created retains row 6 in
`invoice-created.js`. The workbook proposes daily 11 PM America/Chicago processing, but
that schedule and the per-category posted-invoice selector are deferred. No daily sweep runs.

| Row | Qualifying condition after AP/AR and vendor type | Amount | Debit / credit |
| --- | --- | --- | --- |
| 2 | AP Product, Total Received Not Yet Invoiced > 0 | Invoice Amount | 211.200 / 211.100 |
| 4 | AP Product, Related Purchase Order Status = Confirmed, Latest Purchase Order Received Date empty | Invoice Amount | 132.100 / 211.100 |
| 5 | AP Product | Freight | 131.100 / 211.100 |
| 6 | AP non-sales-tax expense, linked account 004.013 | Invoice Amount | 004.013 / 211.100 |
| 7 | AP sales-tax expense | Invoice Amount | 212.100 / 211.100 |
| 8 | AP Assets | Invoice Amount | 143.300 / 211.100 |
| 9 | AP Credit, Related Purchase Order present | Invoice Amount | 211.100 / 131.400 |
| 10 | AP Credit, Related Purchase Order empty | Invoice Amount | 211.100 / 004.010 |
| 11 | AR Non-Product, linked account 010.001 | Invoice Amount | 121.100 / 010.001 |

The two new PO fields are native invoice rollups from Related Purchase Order. Use their field
IDs rather than a guessed legacy PO alias. Row 6 uses only the AP expense/account filters, without any vendor-name restriction.
The chart row remains yellow for user review; its current mapping is implemented.
Rows 3 and 12 remain deferred. All applicable handlers run; the chart's broad product/freight
matches are retained. Invoice Date supplies the date and Invoices.Branch supplies nullable branch.

Amounts retain their source sign, including AP credits. No category-level ABS or account-side
swap is used. The generic Edge writer and signed-journal migration retain equal signed debit and
credit values on the supplied accounts. Zero is a no-op; missing/invalid amounts still fail.
No notes or Airtable record writes are added. The same source/rule replay identity remains;
changed financial data conflicts rather than rewriting a posted journal.

Run `node airtable/check-invoice-created.cjs` for both senders. Its fetches are mocked; the database
posting and report-read runners verify signed pairs and account-side filters in disposable databases.

## Expense automation implementation

`expense-entry.js` handles Create Entry categories. `expense-fully-paid.js` handles EXP-02 card
expenses and EXP-11 bank fees, using the existing invoice event `paid`. Both native inputs are
invoiceRecordId and ledgerWebhookUrl with the standard Dual Ledger Webhook Secret.

Utilities is 006.002 only. Prepaid bills moved to Create Entry. Tech Allowance uses Branch Employee;
other invoice categories use Branch. Bank fees moved out of Create Entry to Fully Paid.
The chart's AP expense spellings normalize to the live choice AP - Expenses (Non-Sales Tax), and
Credit Card Clearing is the live FIN account 231.100. Card expenses check the linked payment
account, not its Method. Bank fees require one consistent supported bank across linked payments:
FIN 112.100 -> ledger 112.100; FIN 0747 -> ledger 112.300.

CORE category functions own filters, UTILS caches reads/calculates/posts, HELPER formats logs.
All matching categories prepare before a single POST. Invoice Amount mappings remain one-to-one;
line amounts sum at four-decimal precision by invoice/account, round each subtotal to cents,
and produce a separate journal per account. All contributing line
IDs persist in airtable_record_ids. Missing/mixed account amounts never get an invented split.

W2 payroll posts salary 005.002 -> 241.100, payroll tax 005.006 -> 241.200 and 401k 005.005 ->
241.400, one journal per debit account with same-account lines summed. Employee benefits
241.600 are excluded for now, so the chart remains Partially implemented. PTO stays deferred.
Zero amounts are no-ops; signed amounts are preserved. Missing and nonfinite amounts fail. No live Test action or
historical financial record was retriggered for this update.

## Prepay Expenses Log Created

`prepay-created.js` uses prepayLogRecordId from the record-created trigger and the standard URL/secret.
Amount Deducted / Applied Date post Dr 007.011 / Cr 135.000; Notes is Prepay Log. The log owns the
journal and audit link. Linked invoice IDs are references, with every linked invoice retained in the invoice_ref array. Branch comes from linked Invoices.Branch; empty or mixed stays NULL.
No Monthly Amortization recalculation, schedule condition or additional checkbox filter is inferred.

## Receiver deployment dependency

Migration 20261106191953 adds source_entry_key and aggregated source-line refs. It was applied before
receiver publication. The published receiver accepts depreciationRecordId and prepayLogRecordId for
created events, and retains paid for invoice Fully Paid. Existing journals remain immutable; changed
event/grouping/branch packets can conflict and need review. See the webhook contract.

## Checks

```sh
node airtable/check.cjs
node airtable/check-invoice-settlement.cjs
node airtable/check-invoice-created.cjs
node airtable/check-expense-entry.cjs
node airtable/check-expense-fully-paid.cjs
node airtable/check-depreciation-created.cjs
node airtable/check-prepay-created.cjs
```

Native fetches are mocked. Receiver posting checks use the disposable local database only.
