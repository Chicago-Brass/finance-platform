# Ledger automation infrastructure audit - 7 November 2026

## Scope and architecture

Reviewed all nine native FIN ledger automations, their saved script/input configuration, the three
T-Chart category sheets, current FIN field metadata and the deployed generic Edge receiver.
Private source snapshots remain outside this public repository. Current accounting filters are
preserved where the chart or an explicit decision leaves a known overlap.

All senders follow the same responsibilities:

1. Read the triggering native FIN record and only the linked records needed for qualification.
2. CORE category functions check filters, calculate components and append matches. Every eligible
   handler is evaluated; this is not first-match routing.
3. UTILS owns bounded linked-record reads, shared calculations and authenticated transport.
4. HELPER formats the match summary and receiver acknowledgements. Logging does not route entries.
5. The generic Edge Function validates and records the supplied final account pairs atomically per
   packet. It does not recategorize, infer accounting splits or call a posting database function.

## Native ownership

The current native events are retained. The workbook's proposed daily 11 PM Central processing
has not been activated; per-category processed-record selection is still deferred.

| Automation | Native trigger | T-Chart codes |
| --- | --- | --- |
| Payment Sent | Payments.Sent checked | PAY-01-05, PAY-07-13, PAY-15-25, PAY-27 |
| Payment Cancelled | Payments.Cancel Payment checked | PAY-06, PAY-12 |
| Payment Reconciled | Payments.Reconciled checked | PAY-26 |
| Invoice Entry - Create Entry | Invoices.Create Entry checked | INV-01/03/04/06/07/08/09/10 |
| Invoice Entry - Invoice Created | Invoices record created | INV-05 |
| Expense - Invoice Create Entry | Invoices.Create Entry checked | EXP-01/03/05/06/07/09/12/13 |
| Invoice Full Paid | Payment Invoice Status = Fully Paid | EXP-02/11 |
| Depreciation Created | Depreciation Table record created | EXP-10 |
| Prepaid Use Created | Prepay Expenses Log record created | EXP-04 |

Editor links and field identities are in the [automation reference](../knowledge-base/airtable-triggers.md).
Each automation has one script action. No migrated category remains in the old Invoice Created
sender. Invoice Paid, standalone Payment Returned and the old Expense Invoice Created sender are
retired. PAY-12 intentionally has two event paths: Cancel Payment, or Sent plus Return Payment (AP).
That is not an extra independent category; receiver identity prevents incompatible duplicate posting.

## Corrections

- All categories preserve signed source amounts. Expense, depreciation and prepaid-use no longer
  reject a valid negative source amount. Missing/invalid money still fails.
- All invoice-line categories sum four-decimal integer units per invoice/account, then round each
  subtotal to cents. Two 10.005 lines produce 20.01 in both accrual and settlement.
- Staff, debt, bank-transfer, income-tax and client-cancellation components produce separate keyed
  journals for different account pairs. Repeated lines for one account are combined; source line
  IDs and invoice references remain available.
- Prepaid-use linked-invoice reads are batched. Empty branch attribution is retained as unknown,
  so mixed known/unknown aggregates remain NULL rather than taking the known branch alone.
- Cancelled/Reconciled print the prepared match summary before transport and acknowledgements
  after successful posting, consistent with the other senders.
- Account active is a label only in both Edge validation and the database guard. Identity,
  is_postable, posted-line immutability, balance, period and authentication checks remain active.
- Existing vendor_ref, customer_ref, order_ref, po_ref, invoice_ref and employee_ref columns are
  now text arrays. state_ref is a text array. Singular and plural supplied references persist as
  sorted unique arrays; readers and strict retry comparison use the same contract.

Migrations 20261107022920 and 20261107023520 were applied to DUAL ENTRY and recorded in migration
history. The migration transaction verified unchanged journal/line counts and debit/credit totals,
and preserved every existing scalar reference as a one-item array. The deployed ledger.ts was
read back and exactly matched local source. Historical references previously dropped by the old
receiver were not inferred or backfilled.

## Implementation state

Across 51 chart categories: 38 Fully, seven working partial, two blocked partial and four deferred.
Working partial functions have an explicit comment. Blocked partial functions retain their known
filters and throw Not yet implemented before any prepared packet is sent.

| State | Sheet rows | Limit |
| --- | --- | --- |
| Working partial | Payment 4 | Credit movement works; overlap with original receipt remains a chart risk. |
| Working partial | Payment 7, 13 | Current cancellation/return entries work; future cancellation/delete workflow deferred. |
| Working partial | Payment 16 | Salary, payroll tax and 401k work; benefits and bank wire/FX fees excluded. |
| Working partial | Expense 7 | W2 salary, payroll tax and 401k work; employee benefits 241.600 excluded. |
| Working partial | Invoice Entry 6 | Account/AP filters work; vendor filter deferred. |
| Working partial | Invoice Entry 10 | Approved COGS 004.010 works; original-expense alternative not mapped. |
| Blocked partial | Payment 11 | Discount credit account mapping/split unresolved. |
| Blocked partial | Payment 24 | Insurance bank/recovery split unresolved; FIN 122.100 missing. |
| Deferred | Payment 15; Expense 9; Invoice Entry 3, 12 | No routed implementation. |

## Questions and remaining risks

- Expense row 3, Company credit-card purchase with NO vendor bill, does not identify the absence
  of an invoice accrual. Its AP expense/account/paid-by-card filters can also match Expense row 2
  Utilities, Expense row 4 prepaid bills, or Invoice Entry row 6 outbound freight. Those paths may
  record a second debit while leaving the first AP accrual uncleared. This is a possible filter
  overlap, not evidence of actual duplicate journals. Filters remain unchanged pending a decision.
- Expense rows 2 and 4 retain their explicitly approved shared match. Invoice Entry rows 2/4/5
  retain the chart's documented possible freight overlap.
- The chart still has no generic AP expense bank-payment settlement category. No new mapping was
  invented to cover that gap.
- Staff and debt payment categories post the chart's full invoice-line totals. Partial-payment
  allocation for these line-based categories has not been defined.
- Existing posted whole-category journals are not rewritten into account-keyed journals. Such
  replays, changed branches or changed financial packets can conflict and require review.
- The live Payment sheet still differs from the approved Payment Final workbook and explicit
  later decisions. Do not restore obsolete ABS, exclusive thresholds or old amount mappings from
  the older live cells. The daily schedule remains documentation only.

## Workbook correction

Invoice Entry I5 contained unrelated dictation. Its approved inbound-freight mapping was restored:
Freight / Invoice Date / Branch, Dr 131.100 and Cr 211.100, with the existing business references.
A fresh download confirmed only I5 changed across workbook cell values; J5 was preserved and
all three mapping section headings are bold. No other chart filters or mappings were edited.

## Verification

- Native checks: payment routing, 48 synthetic settlement checks, 21 Invoice Entry/Created checks,
  23 Expense Create Entry checks, 12 Fully Paid checks, seven depreciation and eight prepaid-use
  checks; the separate payment-line precision/allocation guard checks also pass.
- 35 disposable-database posting tests and 12 report-read/security tests pass.
- 16 focused HTTP and journal-detail checks pass; TypeScript and diff whitespace checks pass.
- Incomplete older settlement snapshots are reported separately and are not counted as successful
  end-to-end fixtures.
- No historical checkbox was retriggered and no hosted financial posting test was run. A temporary
  read-only lookup probe found no eligible Create Entry sample and did not execute; the proper
  Expense source was restored before publication.

Saved-source publication evidence is separate from these local checks. See
[current ledger status](ledger-current-status.md) for the final live publication state.
