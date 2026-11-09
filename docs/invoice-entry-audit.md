# Invoice Entry review - 7 November 2026

The current T-Chart Actual Trigger and Mapping columns plus the user's refinements define this update.
The downloaded workbook is a private local artifact and is not committed to this public repository.

| Row | Implementation change |
| --- | --- |
| 2 | Keep AP Product and received-not-invoiced > 0; post Invoice Amount |
| 3 | Deferred; no guessed price-variance split |
| 4 | Replace received rollup = 0 with Related Purchase Order Status = Confirmed and Latest Purchase Order Received Date empty |
| 5 | Replace Invoice Amount with Freight |
| 6 | AP, AP - Expenses (Non-Sales Tax), linked account 004.013 only; remove vendor blocker; post Invoice Amount |
| 7 | Keep sales-tax Invoice Amount mapping |
| 8 | Keep asset Invoice Amount mapping |
| 9 | Remove credit ABS; preserve source sign |
| 10 | Replace missing-account error with AP / COGS 004.010, preserving sign |
| 11 | Keep AR Non-Product and linked account 010.001 |
| 12 | Deferred; no guessed return-credit split |

Create Entry and Invoice Created remain the native triggers. Daily 11 PM America/Chicago is
an Excel specification only, pending the per-category posted-record selection/backlink design.
No nightly sweep or historical retrigger was added. Existing script inputs and the shared secret remain.

The two new PO rollups are native invoice fields fldQy8xHW49sFGnJY and flduniMtBFi84pUsc.
Account 004.013 is FIN Freight Cost. Its linked vendors do not restrict row 6.
Rows 2/4/5 may still overlap under the chart's independent filters. If Invoice Amount includes
Freight, the row 5 component needs accounting review; the workbook retains that risk note.

Signed amounts retain the chart's account sides. The generic Edge receiver and migration
20261107000900_signed_journal_amounts permit signed debit/credit values while preserving exactly
one populated side per line, exact journal balance, period guards, RLS, posted immutability and
strict replay checks. The migration also updates ledger offsetting-account and side queries.
Existing journal data is untouched; replaying an old ABS-normalized credit with a new sign can
conflict and must be reviewed rather than rewritten automatically.

The related Expense W2 handler now posts salary 005.002/241.100, payroll tax 005.006/241.200,
and 401k 005.005/241.400. Employee benefits 241.600 are excluded. Repeated same-account lines
sum into one pair/journal; different accounts have separate entryKey values and journals.

Focused verification: 21 Invoice Entry native checks, 22 Expense Create Entry checks, 11 Fully
Paid checks, 6 depreciation checks, 6 prepaid-use checks, 34 real disposable database posting
checks, 12 report/filter checks, and 10 HTTP/auth checks. No hosted financial sample was posted.
