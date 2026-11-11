# Invoice Entry rules

Source: [live T-Chart](https://chicagobrass.sharepoint.com/:x:/r/Intranet/_layouts/15/Doc.aspx?sourcedoc=%7BF609079B-B392-421C-A170-878D5E60CD60%7D&file=T-Chart.xlsx&action=default&mobileredirect=true), downloaded 12 November 2026.

The daily webhook owns discovery and named category handlers. Its external scheduler remains
unconfigured. Each rule keeps the existing stable code; deleted rows never reuse earlier codes.
Payment and Expense business rules are unchanged by this revision.

| Row | Code | Entry record | Final debit / credit | Status |
| --- | --- | --- | --- | --- |
| 2 | INV-12 | Invoices | AR 121.100 / Client Deposits 221.100 | Fully |
| 3 | INV-13 | Payments | Selected payment account / AR 121.100 | Fully |
| 4 | INV-14 | Shipping Record | Client Deposits 221.100 / Product Revenue 004.001 | Working partial |
| 5 | INV-15 | Invoices | AR 121.100 / Product Revenue 004.001 | Fully |
| 6 | INV-16 | Payments | Selected payment account / AR 121.100 | Fully |
| 7 | Excluded | Black price-variance row | No registered rule | Excluded |
| 8 | INV-07 | Invoices | Linked asset account / AP 211.100 | Working partial |
| 9 | INV-17 | Payments | AP 211.100 / Selected payment account | Working partial |
| 10 | INV-08 | Deferred | Vendor return credit | Not yet |
| 11 | INV-09 | Deferred | Vendor price credit | Not yet |
| 12 | INV-10 | Invoices | AR 121.100 / Linked invoice account | Fully |
| 13 | INV-18 | Payments | Selected payment account / AR 121.100 | Fully |
| 14 | Excluded | Black customer-return row | No registered rule | Excluded |

## Filters and amounts

Deposit, Full and Balance rules require Invoice Type AR and Vendor Type AR - Product. Non-product
invoices use AR - Non-Product without a fixed linked-account filter. These scopes are separate.
Payments require Sent, use Payment Date, and post the full signed Payments.Amount once with all
qualifying invoice references. Invoice events use Invoice Amount and Invoice Date. No absolute
value, line allocation or inferred final-payment selection is applied.

Both fixed-asset rules currently qualify only 143.300 and exclude Mark as Prepaid Asset? invoices,
which belong to Expense. The linked account supplies the debit. Additional asset accounts require
an approved chart update. FIN Coordination Fees Charged 004.002 is a matching revenue account in
the migration; non-product handlers resolve the actual selected account rather than substituting
Miscellaneous Income.

Shipping requires Ship Out and Ship Out Date. It sums linked MTAs.Extended Sell Price in checked
four-decimal units, then rounds the total to cents. This field is already extended; multiplying by
Quantity would overstate it. Missing valuations fail before posting. The cap against the paid
deposit is explicitly deferred, so this working partial can recognize more than the deposit.

Shipping Record currently links to MTAs (Deprecated) and Transactions (Deprecated). The worker
uses those actual FIN link targets. Transaction and state references retain their actual source
IDs. Branch comes from linked MTAs; missing attribution stays empty. Replacement tables and the
deposit linkage must be resolved before imposing a cap.

## Source ownership and deployment

Shipping Record owns the same five ledger-link and reverse fields as the existing five source
tables. Its prepared events carry shippingRecordId and eventType created. The shared writer,
source lock, period review, journal writeback and dedicated reversal service recognize that source.
The native reversal script template accepts the Shipping Record table ID. Creating or publishing
a separate native checkbox automation is a distinct deployment step.

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
working partials and disabled. Vendor-credit rows 10/11 are red and disabled. Black rows 7/14
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
