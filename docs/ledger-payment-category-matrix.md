# Payment category posting matrix

Current source contract for the revised T-Chart Actual Triggers and Amount sections. This matrix
describes the local implementation, not proof of saved Airtable source or a deployed function.
See the [webhook contract](ledger-webhook-contract.md) for persistence and duplicate rules.

Every implemented category supplies actual account pairs. Cancelled/Returned event names do not
request an automatic reversal. Payment-owned components use current Payments.Amount unless a
different amount is listed. bank means the payment-linked account; card means 231.100.

| Code | Primary / sender | Category | Debit | Credit | Amount and qualification |
| --- | --- | --- | --- | --- | --- |
| PAY-01 | Sent / payment | Customer deposit | bank | 221.100 | Payment.Amount share; AR Product, first shipment blank or payment on/before shipment. |
| PAY-02 | Sent / payment | Customer payment after shipment | bank | 121.100 | Payment.Amount share; AR Product, payment after first shipment. |
| PAY-03 | Sent / payment | Client overpayment moved to credit | bank | 221.300 | New AR Refund/Credit payment Amount; linked Method of Application Credit to Another Order. No Overpaid Amount gate. |
| PAY-04 | Sent / payment or invoice | Small excess / rounding | 007.002 | 121.100 | 0 < Overpaid Amount <= 1 per payment, or 0 < verified Invoice Remaining Balance <= 5 once per invoice. |
| PAY-05 | Sent / payment | Client cash refund | 221.100 | bank | Payment.Amount share; AR Refund/Credit, Cash Refund. |
| PAY-06 | Cancel / events | Client payment cancelled | 221.100 or 121.100 | bank | Current Amount share, grouped into separate deposit and AR journals; AR Product. Blank payment/ship date or payment on/before shipment selects deposit, otherwise AR. No Sent requirement. |
| PAY-07 | Sent / payment | Vendor bank payment | 211.100 | bank | Payment.Amount share; AP Product, Regular Payment, approved bank method and linked PO or vendor. |
| PAY-08 | Sent / payment | Vendor card payment | 211.100 | card | Payment.Amount share; AP Product, Regular Payment, payment account 231.100 and linked PO or vendor. |
| PAY-09 | Sent / payment | Card statement payment | card | bank | Parent Payment.Amount; CC Batch Payment and linked mini-payments. Mini amounts weight the card split. |
| PAY-10 | Sent / blocked | Early vendor discount | 211.100 | pending | AP, computed Fully Paid, Discount Lines Total nonzero; nonexpired Discount lines grouped by account. Credit mapping remains pending. |
| PAY-11 | Sent / invoice | Bill paid using vendor credits | 211.100 on bill | 211.100 on credit memo | Full Credits Applied; AP, computed Fully Paid, nonzero, reciprocal source credits. |
| PAY-12 | Cancel or Sent + Return Payment (AP) | Vendor cancelled/returned payment | 112.100 | 211.100 | Signed current Payment.Amount; AP. Actual entry, no original-journal lookup. |
| PAY-13 | Sent | Vendor cash refund | bank | 211.100 | Signed Payment.Amount share; AP Credit. No extra bank-only qualifier. |
| PAY-14 | Undefined | Payroll/remittances | - | - | Actual Triggers and Amount remain blank; no routed handler. |
| PAY-15 | Sent / payment, partial | Staff payroll liabilities | 241.100 / 241.200 / 241.400 | bank | Signed line totals per source account: wages 005.101/003/001/002 -> 241.100, tax 005.006 -> 241.200, 401k 005.005 -> 241.400. Fees and benefits excluded. |
| PAY-16 | Sent / payment | Auto-loan payment | line account 232.100 or 007.003 | bank | Requires a 232.100 principal line. Signed Line Amount summed by account into separate journals. |
| PAY-17 | Sent / payment | LOC draw | bank | 231.200 | Payment.Amount purpose share; AR Non-Product and account 231.200. |
| PAY-18 | Sent / payment | LOC repayment | line account 231.200 or 007.003 | bank | Requires a 231.200 principal line. Signed Line Amount summed by account into separate journals. |
| PAY-19 | Sent / payment | Bank transfer | payment-linked bank | invoice-linked bank | Payment.Amount purpose share; AP expense, both sides bank accounts; separate journal per invoice bank. |
| PAY-20 | Sent / payment | Owner distribution | 316.100 | bank | Payment.Amount purpose share; AP expense and account 316.100. |
| PAY-21 | Sent / payment | Owner contribution | bank | 311.200 | Payment.Amount purpose share; AR Non-Product and account 311.200. |
| PAY-22 | Sent / payment | Income tax | 242.100; 242.200 | bank | Payment.Amount purpose shares; separate journals for federal and state accounts. |
| PAY-23 | Sent / blocked | Insurance payout | pending | 122.100 | Bank/recovery debit mapping undefined; account 122.100 is missing from FIN. |
| PAY-24 | Sent / payment | Security deposit | 143.200 | bank | Payment.Amount purpose share; AP expense and account 143.200. |
| PAY-25 | Sent / invoice | Fidelity interest/dividends | 112.200 | 010.003 | Full signed Invoice Amount; AR Non-Product and invoice account 010.003. One posting per invoice. |
| PAY-26 | Reconciled | Bank discrepancy | 007.002 | bank | Signed discrepancy; no AP/AR flip or uncharted suspense threshold. |
| PAY-27 | Sent / invoice | Card rebate | card | 004.011 | Full signed Purchased Discounts & Rebate Total; AR Non-Product, invoice account 004.011, computed Fully Paid, nonzero. |

## Source ownership and totals

payment-sent.js owns all Sent categories, including invoice-owned PAY-04 shortfalls and PAY-10/11/25/27. It prepares payment-owned
and invoice-owned packets in one script. payment-events.js owns Cancel and Reconciled categories.
The separate Invoice Paid and Payment Returned automations were deleted after consolidation.

Payment shares preserve one signed current payment total. Multi-invoice shares use Invoice Amount To Pay;
multi-account purpose shares are blocked until defined in the chart. Mixed-sign or missing allocations fail.
Card-statement parent and child values are not combined into another bank movement.

Shortfall, interest, vendor-credit and rebate totals are invoice snapshots. Invoice identity, not triggering payment identity, prevents the
same category total from posting again. Credits retain separate debit bill and
credit memo references. Their source-credit weights allocate the authoritative Credits Applied total
in cents using the verified common bill proportion.

## Boundaries

All same-base data reads are native and ID-based. Multiple distinct source Vendor Types fail before
routing. Required dates, money, links and accounts must be available; no old-data compatibility
fallback is invented. Zero components are no-ops.

Unclear discount, insurance and invoice-purpose multi-account components throw Not yet implemented.
Staff and debt categories use one keyed journal per source line account; same-account amounts sum.
Each matched line needs one account and reciprocal invoice ownership. Ambiguous shared interest throws;
interest alone does not select a category. Unmapped 232.200/232.300 loan types remain outside these filters.
Full line totals are used even for a partial payment; no unspecified proration is inferred.
The row 15 payroll category remains deferred. No automatic deletion, reversal, correction
or incremental-credit workflow is implemented. An identical retry deduplicates; changed financial
data conflicts and requires review. No live posting or deployment is asserted by this document.

Variable-account bank transfers, income-tax payments and client cancellations also produce separate
account-keyed journals. Existing whole-category journals are not rewritten; incompatible replays conflict.
