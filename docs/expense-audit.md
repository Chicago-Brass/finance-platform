# Expense category implementation

Updated 12 November 2026 against the current live T-Chart and FIN field schema. This review changes
Category - Expenses only. Payment and Invoice Entry category rules are preserved. Their known
cross-sheet overlaps are not resolved by this change.

## Worker ownership

[Expense definitions](../supabase/functions/ledger-daily/rules/expenses.ts) own discovery queries.
[Expense handlers](../supabase/functions/ledger-daily/categories/expenses.js) own final filters and
amounts. The generic writer records their supplied pairs. The caller owns scheduling; no scheduler
is enabled. The three old Expense posting automations and Invoice Full Paid are OFF; the shared webhook owns the current rules.

There are 26 current Expense codes: 21 fully implemented, one working partial and four red deferred. The black PTO definition is excluded. One functioning category
retains an explicit partial limit: Utilities-only operating expenses.

| Sheet row / rule | Category | Source owner | Status |
| --- | --- | --- | --- |
| 2 / EXP-01 | Operating expense invoice | Invoices | partial |
| 3 / EXP-14 | Operating expense payment | Payments | implemented |
| 4 / EXP-15 | Product invoice | Invoices | implemented |
| 5 / EXP-16 | Product payment | Payments | implemented |
| 6 / EXP-02 | Company credit-card purchase | Payments | implemented |
| 7 / EXP-03 | Prepaid expense invoice | Invoices | implemented |
| 8 / EXP-17 | Prepaid expense payment | Payments | implemented |
| 9 / EXP-04 | Prepaid monthly use-up | Prepay Expenses Log | implemented |
| 10 / EXP-05 | Employee tech allowance | Invoice Lines | implemented |
| 11 / EXP-18 | Tech allowance payment | Payments | implemented |
| 12 / EXP-06 | W2, owner and 1099 payroll | Invoice Lines | implemented |
| 13 / EXP-19 | W2, owner and 1099 payroll payment | Payments | implemented |
| 14 / EXP-07 | Offshore payroll | Invoice Lines | implemented |
| 15 / EXP-20 | Offshore payroll payment | Payments | implemented |
| 16 / EXP-09 | Bonus invoice | Invoice Lines | implemented |
| 17 / EXP-21 | Bonus payment | Payments | implemented |
| 19 / EXP-23 | 13th-month bonus payment | Payments | implemented |
| 20 / EXP-10 | Monthly depreciation | Depreciation Table | implemented |
| 21 / EXP-11 | Bank-fee invoice | Invoices | implemented |
| 22 / EXP-27 | Bank-fee payment | Payments | implemented |
| 26 / EXP-13 | Income-tax invoice | Invoice Lines | implemented |
| 27 / EXP-26 | Income-tax payment | Payments | implemented |

Deferred: row 18 / EXP-22 13th-month accrual; rows 23-25 / EXP-12,
EXP-24, EXP-25 bad debt. Their named functions throw Not yet implemented, and discovery excludes them.

## Accounting and mapping

- Invoice Amount categories post the full signed invoice amount. Each invoice has one linked account.
- Payments.Amount categories post the full signed payment amount once, without splitting it across
  linked invoice references. Date is Payment Date; bank/credit-card identity is Account to Pay/Receive.
- Card purchases require the linked invoice Mark as No Vendor Bill? checkbox and payment account 231.100.
- Ordinary Expense payment routes require Sent, exclude Cancel Payment and Return Payment (AP),
  and validate their linked invoice type/vendor/account conditions.
- Invoice-line accruals belong to each Invoice Line and use its Line Amount. They debit its matching
  expense account and credit AP 211.100. Different lines have distinct source-owned journals.
- W2 supports 005.001/005.002/005.003/005.005/005.006. Offshore uses 005.101; Tech Allowance
  uses 005.102; Bonus uses 005.201.
- Paid line categories require the linked invoice manual Invoice Status (AP) = Fully Paid, then
  create one journal per invoice/account. Each source line is rounded to cents first, matching the
  individual accrual journals; settlement sums those cent amounts so AP clears exactly.
- Income tax lines qualify on FIN 923100/923300 and map to Supabase 011.001/011.002, crediting AP.
  Their payment debits AP and credits the payment account.
- Product invoices debit COGS 004.010 and credit AP. Product payments debit AP and credit the payment account.
- Prepaid invoices use AP - Assets and Mark as Prepaid Asset?, debit 135.000 and credit AP.
  Monthly use-up debits the linked invoice expense account and credits 135.000.
- Invoice/line branches come from Invoices.Branch; Tech Allowance uses Branch Employee.
  Prepay uses its linked invoice branch; depreciation remains blank. Empty/mixed attribution stays NULL.
- Vendor/client/staff/transaction/PO/state references remain arrays. Parent invoice references are
  retained on line journals. Prepay Log and Associated Asset are the two explicitly mapped notes.

## Source links and reversal

Five fields now exist on Invoice Lines, Prepay Expenses Log and Depreciation Table: Ledger Postings,
Ledger Journal IDs, Reversal Journal IDs, Reverse Ledger and Reverse Date. Their empty creation
was authorized and independently read back. The generic posting/writeback/reversal services accept
all five source tables, including existing Payments/Invoices. Each source owns its metadata and audit URL.

All five source tables now have ON native reversal automations using the same source/date-only
sender. Supabase owns journal metadata writeback; Airtable stamps an empty Reverse Date once.
See the [reversal guide](ledger-reversal.md) for editor links and the immutable-history contract.

## Remaining issues

- Line-based payments assume one full payment per invoice, as confirmed by the user. Sent + Fully Paid
  is sufficient for this workflow; no partial-payment allocation or final-payment selector is added.
- Additional operating accounts beyond Utilities are not yet specified.
- The 13th-month accrual remains deferred.
- Old Payment/Invoice Entry rules can overlap the new Expense rules. Those sheets are expressly
  outside this change; do not activate a broad posting run before that review.
- Existing historical journals are not rewritten or moved to a new source owner.

## Earlier implementation verification

The focused synthetic worker/receiver checks passed. A GET-only live inspection covered all 22
active Expense query paths with at most one page and one sample per populated path: 99 Airtable
requests in 41.58 seconds, no query/calculation errors and no database or Airtable writes. Eleven
paths found candidates; eleven had none in the current 30-day window. Bounded discovery is not a full
population audit or proof of a successful hosted posting.

After the approved FIN tax identity correction, both tax queries were rechecked read-only with no
errors and no current-window candidates. Final checks passed: 138 focused synthetic tests,
86 disposable database tests, 10 native reversal mocks and TypeScript validation.

The Expense catalog migrations are applied. `ledger-daily` v8, `ledger-payment` v19 and
`ledger-reversal` v7 are ACTIVE; all 33 downloaded runtime files match the local source. The catalog
update asserted unchanged non-Expense metadata and journal contents; 219 headers and 480 lines
were preserved. No live posting/reversal, native trigger cutover or scheduler activation ran.

## Final live review - 12 November 2026

Each active Expense handler was compared with the latest live workbook. Every category has a named
handler, uses the shared reader/writer infrastructure, and retains its chart-defined source owner.
The live No Vendor Bill checkbox added during review is now required by EXP-02 in both discovery
and its handler. Its field ID/type were read from FIN, and checkbox-on/off regression cases pass.
No new category predicate was inferred.

Up to two eligible records per populated category were evaluated using GET-only Airtable access.
The prepared packets generated **21 journals / 42 lines from 19 samples across 10 categories** in a disposable
local database. Stored accounts, signed amounts, dates, branches, source ownership and reference
arrays matched the prepared packets. Every journal balanced; exact replays created no duplicates.
Airtable writeback was mocked for these tests. Hosted journals and Airtable record values were not changed.

| Expense row / rule | Category | Real source samples | Test journals |
| --- | --- | --- | --- |
| 2 / EXP-01 | Enter an operating expense invoice (ex: Utilities) | 2 | 2 |
| 3 / EXP-14 | When operating expenses are paid | 2 | 2 |
| 4 / EXP-15 | Everytime a product invoice is created | 2 | 2 |
| 5 / EXP-16 | Everytime a product invoice is paid | 2 | 2 |
| 6 / EXP-02 | Company credit-card purchase with NO vendor bill | 0 | 0 |
| 7 / EXP-03 | Prepaid expense bill (pay a year up front, e.g., insurance) - Invoice, not paid | 0 | 0 |
| 8 / EXP-17 | Prepaid Expense BILL (actually paid) | 0 | 0 |
| 9 / EXP-04 | Prepaid expense - monthly use-up (amortization) | 0 | 0 |
| 10 / EXP-05 | Employee Tech Allowance - Not Paid | 0 | 0 |
| 11 / EXP-18 | Employee Tech Allowance - Paid | 1 | 1 |
| 12 / EXP-06 | Payroll - W2 payroll register (per pay date), Owner | 2 | 2 |
| 13 / EXP-19 | Payroll - W2 payroll register (Paid) | 2 | 4 |
| 14 / EXP-07 | Payroll - offshore - unpaid | 2 | 2 |
| 15 / EXP-20 | Payroll - offshore - paid | 2 | 2 |
| 16 / EXP-09 | Payrol - Bonuses (Unpaid) | 0 | 0 |
| 17 / EXP-21 | Payrol - Bonuses (paid) | 0 | 0 |
| 19 / EXP-23 | Payroll - offshore - Month-end accrual Bonus (Paid) | 0 | 0 |
| 20 / EXP-10 | Monthly depreciation of equipment, vehicles, fixtures | 2 | 2 |
| 21 / EXP-11 | Bank fees and charges shown only on the bank statement (Unpaid) | 0 | 0 |
| 22 / EXP-27 | Bank fees and charges shown only on the bank statement (Paid) | 0 | 0 |
| 26 / EXP-13 | Income tax accrual (quarterly) | 0 | 0 |
| 27 / EXP-26 | Income tax accrual (Paid) | 0 | 0 |

Zero samples means no eligible record in the current 30-day window, not a missing handler. These
categories retain the focused synthetic tests. The earlier broader EXP-02 sample was excluded
after the new checkbox condition; no source record was retrofitted to qualify.

The live workbook now has **21 Fully, 1 Partially and 5 Not yet** Expense rows. Resolved allocation,
rounding, source-field and account-mapping questions were removed. Remaining issues are operating
account scope and the recorded overlaps with unchanged Payment/Invoice Entry rules.
The row 6 stale Invoice Entry reference was corrected to row 6. All 186 section tags in Expense
development cells are bold. A fresh download verified all 53 intended cell values, completed-row
white fills and unchanged values/styles on the other sheets. The reviewed copy is also saved on Desktop.

Final automated checks: 138 focused worker/HTTP checks, 86 disposable database checks and focused
TypeScript validation passed. Native automation cutover, scheduler activation, hosted financial
posting tests and new line/log reversal automation wiring remain outside this review.

The row 6 metadata migration is applied and `ledger-daily` v9 is ACTIVE. All 33 downloaded runtime
files match local source; invalid authentication returns HTTP 401. Payment/Invoice Entry category
code and chart snapshots remain unchanged.


## W2 completion and note cleanup

The W2 category is fully implemented for the five mapped accounts, all credited to AP 211.100.
Only Utilities account scope remains partially implemented. Live status is 21 Fully, one Partially
and five Not yet. Removed the obsolete W2 scope comment and the worksheet's rounding/liability
explanations. Row 20 still debits 241.300 and credits the payment account; no balance prerequisite
or original-accrual check was added. Monetary calculations and the No Vendor Bill qualifier are unchanged.

A fresh download verified all eight targeted cell values, bold labels, row 12's white fill and no
unrelated value/style changes. The Desktop copy matches that download. Forty-six focused tests and
TypeScript validation passed. The deployed ledger-daily v10 runtime matches all 33 local modules.

## Reference and branch review

A fresh FIN Meta API read confirmed all 45 selected Expense source fields and their types.
Business references come from the qualifying parent invoices, including for line-owned entries
and payments. The writer preserves sorted, unique ID arrays on both journal lines:

| Invoice source field | Journal-line field |
| --- | --- |
| Linked Vendors | vendor_ref |
| Linked Client | customer_ref |
| Linked Staff | employee_ref |
| Linked Transaction | order_ref |
| Related Purchase Order | po_ref |
| States & Sales Tax Rates | state_ref |

Invoice-line entries retain their parent invoice in invoice_ref while the line owns the source,
audit URL and journal writeback. Payment entries retain payment ownership and Payment Date;
invoice and line entries use Invoice Date. Prepay and depreciation use their recorded dates.
Only Prepay Log and Associated Asset supply the explicitly mapped Expense notes.

Fixed aggregate branch attribution: if any qualifying invoice has no branch, the whole-payment
component remains unassigned. Chicago plus a blank branch no longer becomes Chicago. Matching
known branches retain that branch; distinct known branches remain unassigned in the writer.
Tech Allowance still uses Branch Employee, other invoice-backed categories use Branch, and
depreciation remains unassigned. No category filter or amount calculation changed.

The regression failed before the fix. All 46 focused Expense, adapter and source-ownership checks
then passed, including known-plus-blank, matching known, mixed known and single blank branches.
This mapping review used schema reads and synthetic tests; it made no hosted financial or
Airtable record writes.

## Reversal configuration verification

The five saved Airtable reversal scripts were independently read after reload and exactly matched
`airtable/ledger-reversal.js`. Each automation is ON, uses its owning table and trigger record ID,
requires Reverse Ledger checked, and reuses Dual Ledger Webhook Secret. No native Test action
or source checkbox was executed.

`ledger-reversal` v8, `ledger-periods` v2 and `ledger-daily` v11 are ACTIVE. All 42 downloaded
runtime files match local source; period management retains JWT verification. This also publishes
the branch attribution fix above and removes stale two-source reversal code from period approvals.
Eleven native mocks, 87 disposable database checks, 43 focused Expense/query checks and Edge
TypeScript validation pass. Additional isolated checks covered closed-period reversal approval,
writeback and duplicate retries for all five source tables. No hosted financial records changed.
The external scheduler remains unconfigured.

## Live Expense posting and reversal validation

The approved real-source test covered 62 records across 15 functioning Expense categories. The
current evaluator prepared 66 journals; the hosted generic receiver saved all 66 with 132 lines.
Independent raw-source checks verified account pairs, amounts, grouping, dates, branches and
reference arrays. All source-owned original metadata writebacks were independently read back.
Four W2 payments each created two distinct account-component journals. An exact two-journal
replay created none; a new posting under a disabled Payment rule was rejected.

Reverse Ledger was then checked on each approved source individually. Native automations created
66 opposite journals and verified all 62 reversal writebacks. Every stored reversal preserved
source ownership, account identity, references and branch, swapped the stored debit/credit legs,
and retained its original journal. Final history contains 132 headers and 264 lines.

The live reporting RPCs and actual frontend report builders reconciled five date windows and
four branch filters to stored posted lines. All-date account balances returned to zero. Prior-year
originals reversed on the current date correctly shift income between years; a current-year
Income Statement need not be zero even when the as-of Balance Sheet is zero.

Live samples were not found for EXP-02, EXP-03, EXP-04, EXP-13, EXP-17 or EXP-26 in the bounded
search. EXP-23 candidates were in an accounting month that does not exist; no period was opened
for this test. These seven rules retain synthetic coverage, and five deferred rules stay disabled.
No negative source amount appeared in the selected live samples; signed-negative behavior remains
covered by isolated tests. No old source values were changed to make a category qualify.

The test used category-filtered evaluation plus the hosted writer and native reversals. It did
not activate an external schedule or replace native posting triggers. The tested checkboxes stay
checked; restoration remains deferred. Unselected Airtable metadata was not cleared when the
user requested deleting the earlier Supabase test journals, so stale unselected markers remain.
Temporary test senders were removed.

Current deployment: ledger-payment v20, ledger-reversal v8, ledger-periods v3 and ledger-daily
v12. All 42 downloaded runtime files matched local source. Checks passed: 91 disposable database
tests, 56 focused Expense/runner checks, 17 reporting checks, native reversal mocks and TypeScript.
Earlier validation enabled 22 functioning Expense rules. The current finalization enables only the 21 fully implemented rules.


## Current finalization

Only the 21 fully implemented Expense rules are enabled. Utilities-only EXP-01 is a working
partial and disabled. The four red definitions remain deferred/disabled, and the black PTO
EXP-08 definition is removed. Prior validation sections above are dated evidence, not current
switch settings. Current source filters and mappings are in rules/chart.ts.

Expense rows 2/3/21/22 now exclude Invoices.Mark as No Vendor Bill? so row 6 alone handles those
card purchases. This applies to both invoice accruals and their payment counterparts. Old overlap
notes against the removed AP Invoice Entry routes and prepaid/fixed-asset rules are cleared.
Payment-sheet overlap notes remain because that sheet has not been revised and stays disabled.
Operating payment row 3 remains enabled while its partial invoice counterpart row 2 is disabled.

The workbook keeps red/black rows, makes partials yellow, and separates Field, Other Field and
Account mappings. Tags, mapping labels and actual account-source headings are bold. No field
values, Sent flags, amounts or dates were changed during this finalization.
