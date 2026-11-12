# Invoice Entry rules

Source: [live T-Chart](https://chicagobrass.sharepoint.com/:x:/r/Intranet/_layouts/15/Doc.aspx?sourcedoc=%7BF609079B-B392-421C-A170-878D5E60CD60%7D&file=T-Chart.xlsx&action=default&mobileredirect=true), downloaded 13 November 2026.

The daily webhook owns discovery and named category handlers. Its external scheduler remains
unconfigured. Each rule keeps the existing stable code; deleted rows never reuse earlier codes.
Payment and Expense business rules are unchanged by this revision.

| Row | Code | Entry record | Final debit / credit | Status |
| --- | --- | --- | --- | --- |
| 2 | INV-12 | Invoices | AR 121.100 / Client Deposits 221.100 | Fully |
| 3 | INV-13 | Payments | Selected payment account / AR 121.100 | Fully |
| 4 | INV-14 | Shipping Records | Client Deposits 221.100 / Product Revenue 004.001 | Fully |
| 5 | INV-15 | Invoices | AR 121.100 / Product Revenue 004.001 | Fully |
| 6 | INV-16 | Payments | Selected payment account / AR 121.100 | Fully |
| 7 | INV-07 | Invoices | Linked asset account / AP 211.100 | Working partial |
| 8 | INV-17 | Payments | AP 211.100 / Selected payment account | Working partial |
| 9 | INV-08 | Invoices | AP 211.100 / Inventory - Pending Return Processing 131.400 | Fully |
| 10 | INV-09 | Deferred | Vendor price credit | Not yet |
| 11 | INV-10 | Invoices | AR 121.100 / Linked invoice account | Fully |
| 12 | INV-18 | Payments | Selected payment account / AR 121.100 | Fully |
| 13 | Excluded | Black customer-return row | No registered rule | Excluded |
| 14 | Excluded | Black price-variance row | No registered rule | Excluded |

## Filters and amounts

Vendor return credits (INV-08) require Invoice Type AP, Vendor Type AP - Credit and a linked
Related Purchase Order. Amount is **-Invoices.Invoice Amount**, preserving the inverse sign rather
than applying ABS. FIN normally stores credits as negative amounts; negation reduces AP and
inventory on the chart's stated pair. Date and branch come from the invoice. Its source owns all
reference arrays, journal writeback and reversal. Price-only credits without a PO remain deferred.

Deposit, Full and Balance rules require Invoice Type AR and Vendor Type AR - Product. Non-product
invoices use AR - Non-Product without a fixed linked-account filter. These scopes are separate.
Payments require Sent and use Payment Date. Deposit Paid (INV-13) and Full/Balance Paid (INV-16)
multiply the current Payments.Amount by Payment Proportion For Batch Allocation summed across
matching linked invoices. Whole-cent remainders are assigned consistently across Deposit,
Full/Balance and unmatched shares so combined allocations equal the payment. Non-product and
fixed-asset payments retain signed Payments.Amount. Each entry retains
only its qualifying invoice references. Invoice events use Invoice Amount and Invoice Date.
No absolute value or inferred final-payment selection is applied.

This resolves the duplicate whole-payment movement when one payment links both Deposit and
Full/Balance invoices without repeating cumulative paid totals on later payments. Company policy
requires repeated batch payments to link the same invoices with unchanged amounts. Product and
Non-Product invoices are paid separately. The existing
invoice proportion therefore remains valid for each payment. Missing/non-finite proportions or
a complete batch that does not total 100% fail before posting.

Both fixed-asset rules currently qualify only 143.300 and exclude Mark as Prepaid Asset? invoices,
which belong to Expense. The linked account supplies the debit. Additional asset accounts require
an approved chart update. FIN Coordination Fees Charged 004.002 is a matching revenue account in
the migration; non-product handlers resolve the actual selected account rather than substituting
Miscellaneous Income. FIN 525300 and 922000 also map to their ledger identities 525.300 and
922.000 when selected dynamically.

Shipping Records requires Ship Out and Ship Out Date, then follows the single Transaction's
Invoices to its single uncancelled AR Product Deposit Invoice. Records without a deposit skip
this category. Ambiguous transaction/deposit links fail before posting. The handler sums linked
MTAs.Extended Sell Price at four decimals before rounding, without multiplying by Quantity.

Positive releases are capped at the remaining posted credit-minus-debit balance of 221.100
referencing that deposit invoice. Signed negative source values remain signed. The original
uncapped cents and deposit ID form the entry key, so a changed source cannot masquerade as an
exact replay. The cap is rechecked under the same source lock as the funding invoice and recorded
inside the shared writer transaction. Different shipping records therefore share one budget.
Reversals restore the balance through the existing invoice references. Failed confirmed
writeback rolls back the new release; stale closed-period approvals cannot bypass the cap.

The current owning table is Shipping Records (`tblrnXm1HN9y6HPxY`), linked to Transactions and
MTAs. The removed deprecated table owned no journals when this contract was switched. Vendor,
client, staff and PO references come from the deposit invoice; transaction, MTA, state and branch
references come from the shipping graph.

## Source ownership and deployment

Shipping Record owns the same five ledger-link and reverse fields as the existing five source
tables. Its prepared events carry shippingRecordId and eventType created. The shared writer,
source lock, period review, journal writeback and dedicated reversal service recognize that source.
The native reversal script uses the new Shipping Records table and its own Reverse Ledger
checkbox and manual Reverse Date. No other record is reversed merely because it is referenced.

Rules INV-01, INV-03, INV-04, INV-05 and INV-06 are removed from worker discovery. Their historical
catalog rows and journals remain. Deferred rules have named throwing functions but are excluded
from ordinary runs. Catalog refreshes preserve functioning rules' enabled switches and explicitly
disable retired/deferred Invoice Entry rules. No scheduler or native posting cutover is enabled.

The Desktop workbook changes only Category - Invoice Entry. Expense, Payment and Other sheets
retain their original XML and values. Field, Other Field and Account mappings are separate columns;
section tags and actual account headings are bold, examples are regular text.

## Verification

Focused category/discovery checks: 117 passed. Boundary, source-identity and read-only tests:
29 passed. Disposable database posting/writeback/reversal checks: 91 passed. The native reversal
mock includes Shipping Record. Airtable accepted all nine functioning rule formulas; bounded
GET-only sampling prepared three source packets without database or Airtable writes. This is
not a full-population eligibility count or a hosted posting test.

The Invoice Entry catalog and Coordination Fees Charged account were applied to DUAL ENTRY.
The shared writer, reversal, period service and daily worker were published using their existing
secrets. Invoice Entry operational switches remain off; only the previously enabled Expense
rules remain enabled. The Shipping Record fields were created empty and independently read back.
No existing source values were changed. Native posting/reversal automation configurations were
not changed by this revision.


## Current finalization

Six full categories are enabled. Shipment recognition and both fixed-asset counterparts are
working partials and disabled. Vendor-credit rows 9/10 are red and disabled. Black rows 13/14
are excluded from the registry. Five deleted AP Invoice Entry routes and the two black routes
are removed from the catalog when no journal references them. Journal history is preserved.

The worker supports an exact source table/record ID and optional fromDate/toDate overrides.
The last-30-days window remains the default. Invoice Entry's two old native posting automations
are OFF; existing source-owned reversal automations remain ON. Shipping reversal is supported
by the endpoint and script template, but its native checkbox automation remains pending while
the category is disabled. Payment-sheet overlap concerns are retained in the workbook; those
Payment rules are not enabled by this revision.

Final verification: 152 focused tests and 93 disposable database tests passed. The live invoice,
line, prepaid, depreciation and payment reversal configurations use the same source-owned request
and permanent-date pattern. Invoice reversal's reviewed pending configuration was published.
The shared endpoint's updated source/date options were published as `ledger-daily` version 15;
all 27 downloaded runtime files matched local source. Remote metadata verified six full Invoice
Entry categories enabled and all partial/deferred Invoice categories disabled.

The targeted-source checkpoint compares source IDs and date bounds by value, not JSON object
key order, because PostgreSQL JSONB does not retain key order. Live first-run and retry calls
exercise this path. Callers performing database-heavy sync work can send `x-region: us-west-2`
to run beside DUAL ENTRY's Oregon database; this is optional request routing, not a new endpoint.

## Targeted live verification - 12 November 2026

All six fully implemented Invoice Entry categories were exercised alongside Expense using
source-scoped calls. Both production financial reports were compared with stored lines after
every posting batch. The earlier Deposit and Full/Balance payment mappings summed Total Paid
Amount from linked invoices matching that category. The mixed Deposit/Full payment posted its two
matching invoice totals without counting the whole payment twice. Live K3/K6 mappings retain
their formatting and reflect this amount source.

That cumulative mapping is superseded by current-payment proportional allocation. Two payments
against the same five invoices now produce only their respective payment totals. Local category
checks cover grouped proportions, signed payments, unmatched invoices and cent conservation; a
disposable database test posts both payments, verifies their bank/AR totals and deduplicates retries.
No additional business qualification filter was introduced. Negative Product invoices were previewed without posting;
the Expense row 4 issue asks whether they should belong to a separate category.

Native checkbox reversals exercised Invoice Entry invoice and payment owners, preserving all
originals, stored account pairs, references and branch values. The combined live validation
counts and current deployed versions are in [Ledger status](ledger-current-status.md).

Current-payment allocation is published as `ledger-daily` v20. Twenty-one focused category checks
and 95 disposable database checks passed, including two separate payments against the same five
invoices and exact replay. Six live GET-only previews matched an independent integer calculation;
the existing journal dataset and source metadata stayed unchanged. All 27 downloaded worker
runtime files matched local source. The live workbook amount mappings and catalog notes were aligned.
