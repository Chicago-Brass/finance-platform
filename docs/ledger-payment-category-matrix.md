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
| PAY-04 | Sent | Small excess / rounding | 007.002 | 121.100 | Raw Overpaid Amount > 0 and < 5; posted amount rounded to cents. Literal chart pair. |
| PAY-05 | Sent / payment | Client cash refund | 221.100 | bank | Payment.Amount share; AR Refund/Credit, Cash Refund. |
| PAY-06 | Cancel / events | Client payment cancelled | 221.100 or 121.100 | bank | Current Amount share; AR Product. Blank payment/ship date or payment on/before shipment selects deposit, otherwise AR. No Sent requirement. |
| PAY-07 | Sent / payment | Vendor bank payment | 211.100 | bank | Payment.Amount share; AP Product, Regular Payment, approved bank method and linked PO or vendor. |
| PAY-08 | Sent / payment | Vendor card payment | 211.100 | card | Payment.Amount share; AP Product, Regular Payment, Amex/Visa and linked PO or vendor. |
| PAY-09 | Sent / payment | Card statement payment | card | bank | Parent Payment.Amount; CC Batch Payment and linked mini-payments. Mini amounts weight the card split. |
| PAY-10 | Sent / blocked | Early vendor discount | 211.100 | bank / 004.011 unresolved | Not yet implemented: Discount Lines Total is known, but the multi-credit split/scope is undefined. |
| PAY-11 | Sent / invoice | Bill paid using vendor credits | 211.100 on bill | 211.100 on credit memo | Full Credits Applied; AP, computed Fully Paid, nonzero, reciprocal source credits. |
| PAY-12 | Cancel or Sent + Return Payment (AP) | Vendor cancelled/returned payment | 112.100 | 211.100 | Current Payment.Amount magnitude; AP. Actual entry, no original-journal lookup. |
| PAY-13 | Sent | Vendor cash refund | 112.100 | 211.100 | Payment.Amount share; AP Credit and allowed payment bank. Debit remains Fifth Third as charted. |
| PAY-14 | Undefined | Payroll/remittances | - | - | Actual Triggers and Amount remain blank; no routed handler. |
| PAY-15 | Sent / blocked | Offshore/1099/owner staff | 241.100; 007.002 | bank | Not yet implemented: salary/fee amounts are undefined in Actual Triggers. |
| PAY-16 | Sent / payment | Auto-loan payment | invoice-selected 232.100 or 007.003 | bank | Requires a linked 232.100 principal invoice. Separate single-account principal/interest invoices receive Payment.Amount shares weighted by Amount To Pay. |
| PAY-17 | Sent / payment | LOC draw | bank | 231.200 | Payment.Amount purpose share; AR Non-Product and account 231.200. |
| PAY-18 | Sent / payment | LOC repayment | invoice-selected 231.200 or 007.003 | bank | Requires a linked 231.200 principal invoice. Separate single-account principal/interest invoices receive Payment.Amount shares weighted by Amount To Pay. |
| PAY-19 | Sent / payment | Bank transfer | payment-linked bank | invoice-linked bank | Payment.Amount purpose share; AP expense, both sides bank accounts. |
| PAY-20 | Sent / payment | Owner distribution | 316.100 | bank | Payment.Amount purpose share; AP expense and account 316.100. |
| PAY-21 | Sent / payment | Owner contribution | bank | 311.200 | Payment.Amount purpose share; AR Non-Product and account 311.200. |
| PAY-22 | Sent / payment | Income tax | 242.100; 242.200 | bank | Payment.Amount for one mapped tax account; multiple account splits are blocked. |
| PAY-23 | Sent / blocked | Insurance payout | bank; 004.004 | 122.100 | Not yet implemented: bank/recovery split undefined; account is marked unresolved in the chart. |
| PAY-24 | Sent / payment | Security deposit | 143.200 | bank | Payment.Amount purpose share; AP expense and account 143.200. |
| PAY-25 | Undefined | Fidelity interest/dividends | - | - | Actual Triggers and Amount remain blank; no routed handler. |
| PAY-26 | Reconciled | Bank discrepancy | 007.002 | bank | Discrepancy magnitude; no AP/AR flip or uncharted suspense threshold. |
| PAY-27 | Sent / invoice | Card rebate | card | 004.011 | Full Purchased Discounts & Rebate Total; AR Non-Product, computed Fully Paid, nonzero. No payment proration. |

## Source ownership and totals

payment-sent.js owns all Sent categories, including PAY-10/PAY-11/PAY-27. It prepares payment-owned
and invoice-owned packets in one script. payment-events.js owns Cancel and Reconciled categories.
The separate Invoice Paid and Payment Returned automations were deleted after consolidation.

Payment shares preserve one current payment total. Multi-invoice shares use Invoice Amount To Pay;
multi-account purpose shares are blocked until defined in the chart. Mixed-sign or missing allocations fail.
Card-statement parent and child values are not combined into another bank movement.

Vendor-credit and rebate totals are final snapshots. Invoice identity, not triggering payment identity, prevents the
same cumulative discount/credit/rebate from posting again. Credits retain separate debit bill and
credit memo references. Their source-credit weights allocate the authoritative Credits Applied total
in cents using the verified common bill proportion.

## Boundaries

All same-base data reads are native and ID-based. Multiple distinct source Vendor Types fail before
routing. Required dates, money, links and accounts must be available; no old-data compatibility
fallback is invented. Zero components are no-ops.

Unclear discount, staff, insurance and multi-account components throw Not yet implemented.
Loan/LOC invoices must each identify one account. Shared interest with both principal types throws;
interest alone does not select a category. Unmapped 232.200/232.300 loan types remain outside these filters.
Blank payroll and Fidelity categories remain unresolved. No automatic deletion, reversal, correction
or incremental-credit workflow is implemented. An identical retry deduplicates; changed financial
data conflicts and requires review. No live posting or deployment is asserted by this document.
