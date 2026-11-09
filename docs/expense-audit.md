# Expense category audit - 7 November 2026

## Evidence

The fresh T-Chart (100) workbook was downloaded through Codex browser use in the Jeric Chrome
profile. Category - Expenses rows 2-14 were compared with live FIN field choices/accounts and
saved native automation triggers/scripts. Private source snapshots and old deployed scripts
remain outside the repository. The workbook Dev Notes and Done cells were aligned with this audit, including Date/Branch/Notes and source references.

## Category ownership

| Row / code | Primary event | Handler and mapping |
| --- | --- | --- |
| 2 / EXP-01 | Invoices.Create Entry | Utilities 006.002 only; Invoice Amount; 006.002 -> 211.100. |
| 3 / EXP-02 | Payment Invoice Status Fully Paid | AP expense, invoice account nonempty, linked payment account 231.100. Invoice Amount; selected single expense account -> 231.100. |
| 4 / EXP-03 | Invoices.Create Entry | AP expense + prepaid checkbox. Invoice Amount; 135.000 -> 211.100. Removed from the old Invoice Created automation. |
| 5 / EXP-04 | Prepay Expenses Log created | Amount Deducted / Applied Date; 007.011 -> 135.000; Prepay Log note. |
| 6 / EXP-05 | Invoices.Create Entry | AP Staff, 005.102 Line Amount -> 211.100; Branch Employee. |
| 7 / EXP-06 | Invoices.Create Entry | Working partial: salary 005.002 -> 241.100, payroll tax 005.006 -> 241.200, 401k 005.005 -> 241.400. Benefits 241.600 excluded. |
| 8 / EXP-07 | Invoices.Create Entry | 005.101/005.003/005.001 Line Amount -> 241.100. |
| 9 / EXP-08 | Deferred | Red PTO row intentionally not routed. |
| 10 / EXP-09 | Invoices.Create Entry | 005.201 Line Amount -> 241.300. |
| 11 / EXP-10 | Depreciation Table created | Amount Depreciated / Date; 009.101 -> 161.000; Associated Asset note. |
| 12 / EXP-11 | Payment Invoice Status Fully Paid | AP expense + 007.002. Invoice Amount; 007.002 -> linked payments' single consistent bank. |
| 13 / EXP-12 | Invoices.Create Entry | AP expense + 007.005. Invoice Amount; 007.005 -> 121.900. |
| 14 / EXP-13 | Invoices.Create Entry | AP expense, exactly one tax liability: Invoice Amount; 011.001 -> 242.100 or 011.002 -> 242.200. |

Invoice dates use Invoice Date. Invoice branches use Branch, except Tech Allowance uses Branch
Employee. Prepay branches come from linked invoices; missing or mixed branches remain NULL.
Depreciation has no branch field and remains NULL. Same-account lines sum into one pair/journal;
different accounts produce separate journals. Aggregated source-line IDs persist in
journal_lines.airtable_record_ids. Invoice Amount mappings remain one-to-one.

## Workbook corrections applied

- H3/H12/H13 vendor type should use the actual option AP - Expenses (Non-Sales Tax).
- H3 Credit Card Clearing account is 231.100, not nonexistent 231.000.
- H5 record creation belongs under [Primary], not [Filters].
- I5/I11 need the approved log/depreciation mappings, notes and source identity.
- Add Branch below Date in each mapping, including the Employee Branch exception.
- Remove resolved missing-account questions for Travel, Subscription and Tech Allowance.
- Row 7 retains only salary, payroll tax and 401k; the benefits component is excluded.

No FIN account metadata was changed. FIN 241.600 currently has no Type and an Income Statement
label, while the ledger correctly classifies it as a liability.

## Receiver and replay

The source_entry_key/airtable_record_ids migration was applied through the DUAL ENTRY SQL editor
and independently read back with its migration-history row. Accounts 009.002 Travel, 009.006 Dues &
Organization Subscription and 005.102 Tech Allowance were created and verified with FIN identities.
The generic receiver was published through the dashboard and both saved files matched local code.
The existing invoice event name paid is preserved for the Fully Paid sender.

Existing posted journals are never rewritten. Changing an old whole-category journal to account-keyed
entries, moving its event, or supplying a branch where its posted branch was NULL can produce a
reviewable replay conflict. No historical journal or Airtable financial record was modified or retriggered.

## Checks

23 native Create Entry checks, 12 Fully Paid checks, 7 depreciation checks, 8 prepaid-use checks,
10 HTTP boundary checks and 35 disposable database posting tests pass. No live posting test was run.
Saved Airtable source/input/publication verification is recorded separately from these local tests.

## Approved overlap and deferred payroll

The user approved retaining both rows 2 and 4 as written, including their possible shared
prepaid-Utilities match. No exclusion was added. W2 row 7 remains Partially implemented but works for salary,
payroll tax and 401k; benefits are excluded. PTO row 9 is Not yet.

## Workbook publication verification

Category - Expenses H/I/J/K cells were updated individually through browser use in a separate
working tab. A fresh download matched all 36 targeted values. No other Expense cell values or
cell styles changed. Expense row heights were fitted to the expanded mapping text. Statuses are
11 Fully, row 7 Partially, and row 9 Not yet. Concurrent Invoice Entry changes were preserved.

## 7 November final refinement

The W2 handler now posts the approved three groups: 005.002/241.100 salary,
005.006/241.200 payroll tax, and 005.005/241.400 401k. Employee benefits 241.600 are
excluded, not a blocker for those three groups. The existing accountEntries helper creates
one journal per debit account and sums repeated lines. The chart remains Partially implemented
for the excluded benefit component; PTO remains Not yet. Daily 11 PM Central is documented only.
The existing native automation triggers are retained until the posted-record selector is defined.

## Shared infrastructure review

Signed source amounts are preserved. Line amounts sum at four-decimal precision by invoice and
account, then round once to cents. Business references persist as arrays. See the
[infrastructure audit](automation-infrastructure-audit.md) for publication evidence and the
card-expense overlap question, which leaves the current filters unchanged.
