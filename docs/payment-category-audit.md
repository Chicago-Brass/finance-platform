# Payment category implementation

The live Payment sheet, FIN schema and all three payment automation sources were read on
7 November 2026. The current native events remain Sent, Cancel Payment and Reconciled.
The workbook's daily 11 PM America/Chicago primary is a future design; no scheduled sweep or
posted-category backlink was added. The invoice repeat-category review is saved separately in
[invoice-category-repeat-review.md](invoice-category-repeat-review.md).

## Changes

| Sheet row / code | Implementation |
| --- | --- |
| 4 / PAY-03 | Credit payment Amount retains its sign |
| 5 / PAY-04 | Overpaid > 0 and <= 1 per payment; verified invoice remaining > 0 and <= 5 once per invoice; Dr 007.002 / Cr 121.100 |
| 9 / PAY-08 | Qualifies by payment account 231.100 instead of a card-method label |
| 11 / PAY-10 | Known paid-status, discount total and nonexpired discount-line filters retained; pending credit mapping throws |
| 12 / PAY-11 | Signed Credits Applied retained, with reciprocal source-credit identity and capacity checks |
| 14 / PAY-13 | Selected payment account debit / AP 211.100 credit; no extra bank-only qualifier |
| 16 / PAY-15 | Staff lines clear their original payroll liabilities; salary 005.101/003/001/002 -> 241.100, tax 005.006 -> 241.200, 401k 005.005 -> 241.400 |
| 17 / PAY-16 | Principal 232.100 and interest 007.003 from invoice lines, grouped by source account |
| 19 / PAY-18 | Principal 231.200 and interest 007.003 from invoice lines, grouped by source account |
| 26 / PAY-25 | AR Non-Product invoice linked to 010.003; signed Invoice Amount; Dr 112.200 / Cr 010.003 once per invoice |
| 27 / PAY-26 | Signed reconciliation discrepancy retained |
| 28 / PAY-27 | Explicit invoice account 004.011 filter; signed rebate total retained |

All payment movements, cancellation/return amounts and discrepancy amounts retain their source
sign. Generic rounding and weight normalization do not convert posting amounts to magnitudes.
Same-day shipment payments remain deposits. AP return and outgoing-bank exclusions remain as
specified by the chart. No historical source records were changed to fit the new rules.

Line categories use four-decimal integer totals, round each invoice/account subtotal to cents and
send one keyed journal per source account. Contributing line IDs and invoice/branch references
are retained. Separate accounts never receive the same undivided line amount. A line with ambiguous
accounts or nonreciprocal invoice ownership fails before posting. Shared interest must identify
which principal it settles. No proportional partial-payment allocation is inferred for line totals.

The generic receiver already supports signed pairs and account entry keys. Its financial replay
guards remain intact: an older unkeyed journal is not silently split, and changed posted amounts
are not overwritten. Invoice-owned shortfalls, credits, interest and rebates keep invoice identity;
their audit URL still identifies the triggering payment.

## Remaining scope

- Row 15 / PAY-14 is deferred.
- Row 11 / PAY-10 and row 24 / PAY-23 remain partially implemented and throw on unresolved matches.
- Row 16 works for the mapped payroll components; bank wire/FX fees and employee benefits are excluded.
- Yellow rows 4, 7 and 13 retain their working mappings and the chart's unresolved workflow/risk notes.
- Row 24's 122.100 is still absent from FIN Chart of Accounts.
- Staff and debt partial-payment allocation requires confirmation if full invoice-line totals are unsuitable.

The output workbook changes only Payment Dev Notes (F), Actual Triggers (H), Mapping (I),
Clarifications (J) and Done (K). It preserves Finance Notes (G), original account columns and all
other sheets. Section tags are bold; row 16 development cells are yellow and row 26 development
cells are white. Status totals are 20 Fully, 6 Partially and 1 Not yet. These counts describe
the documented implementation scope, not accounting approval or a live posting test.

## Verification

- `node airtable/check.cjs`: native payment routing, filters, signs, keyed line groups, inclusive bounds and errors.
- `node airtable/check-payment-lines.cjs`: signed cent conservation, line ownership/account guards, shortfall arithmetic and cancellation allocation.
- `node airtable/check-invoice-settlement.cjs`: 48 synthetic checks; incomplete older snapshots are reported separately because they lack invoice lines.
- `sh supabase/tests/check-payment-posting.sh`: 35 checks in a disposable local database, including signed entries, account keys, replay and rollback.
- The small positive AR remaining balances were read through a filtered query and independently compared with Amount To Pay minus Total Paid Amount.
- Workbook values, bold tags, row statuses, unchanged cells/styles and untouched workbook parts were checked; representative payment rows were rendered and inspected.

Payment Sent, Payment Cancelled and Payment Reconciled were published and reloaded. All three
saved sources exactly match the local files; no editor errors were shown. Native event conditions,
inputs, secret configuration and ON states were retained. No live Test action, historical checkbox
retrigger or journal write was performed for verification.

The shared infrastructure review additionally groups bank transfers, income-tax payments and client
cancellations by their supplied account pair. Business reference arrays now persist in Supabase;
missing or mixed branch attribution stays NULL. See the [infrastructure audit](automation-infrastructure-audit.md).
