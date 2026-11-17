# Payment category realignment plan

Review date: 17 November 2026. This records the pre-implementation review. The current
implementation and resolved sign choices are in [Payment category implementation](ledger-payment-category-matrix.md).

Scope: Category - Payment, using the live workbook and the revised Payment draft. Preserve the
completed Expense and Invoice Entry rules unless an explicitly listed overlap decision requires
a coordinated change. Do not add filters or change amount signs without the chart or approval.

## Verified current state

- The [live T-Chart](https://chicagobrass.sharepoint.com/:x:/r/Intranet/_layouts/15/Doc.aspx?sourcedoc=%7BF609079B-B392-421C-A170-878D5E60CD60%7D&file=T-Chart.xlsx&action=default&mobileredirect=true)
  has 32 Payment rows: 18 retained at rows 2-19, followed by 14 retired black rows at rows
  20-33. All row references below use this reordered live sheet.
- The deployed `ledger-daily`, `ledger-payment`, and `ledger-reversal` source exports match local
  source: 44 files across 34 distinct runtime modules, with no differences.
- The live catalog has 71 rules, with 30 enabled. All 27 existing PAY rules are disabled.
- The live database has no PAY journal entries and no PAY references in pending/approved/rejected
  posting-review requests. Recheck these conditions inside any eventual catalog deletion.
- A filtered Airtable audit found stale PAY markers on 81 Payments and three Invoices. None of
  those 84 sources has any current journal in Supabase. No Invoice Line has a PAY marker. Their
  cached posting/ID fields need an authorized cleanup before enabling revised categories.
- Payment Sent, Payment Cancelled and Payment Reconciled native posting automations are OFF.
  Their saved scripts still contain the old routing and mappings.
- Payment, Invoice and Invoice Line Reverse Ledger automations are ON. Their inputs use their
  own table, dynamic trigger record ID, the existing reversal endpoint and the shared secret.
- The prior read-only review checked 23 source samples across nine retained rows. Nine rows had
  no qualifying source in their bounded searches. Empty samples do not establish a broken rule.

No records, automation settings, rule switches, journals or deployed code were changed for this review.

## Implementation shape

Keep the existing endpoint and transport:

1. External daily caller or Dashboard Sync calls `ledger-daily` with the existing shared secret.
2. A full run discovers eligible sources. A targeted run uses `source: {tableId, recordId}` and
   evaluates only rules owned by that table and record.
3. Each named category function checks its chart filters and supplies final amount, date, branch,
   accounts and references. Invoice and invoice-line owners do not require a payment unless the
   category explicitly qualifies through one.
4. The generic writer records the supplied pair atomically. The existing source lock, replay
   protection, period review and verified source writeback remain in place.
5. Reverse Ledger calls the separate reversal endpoint. It reverses stored journals for the
   owning source, not a fresh calculation of its related invoices or payments.

Use one Payment rules file and one Payment category module, following Expense's existing named
handler pattern. No new orchestration service, webhook secret, scheduler or posting engine is needed.

## Retire the black routes

Remove these definitions from discovery, handlers and the active rule catalog. Remove unused
native implementations after deleting their OFF automations at cutover. Keep existing Expense
and Invoice Entry implementations intact.

| Live row | Current code | Remove | Replacement or disposition |
| --- | --- | --- | --- |
| 20 | PAY-01 | Receipt classified as a deposit by shipment date | Invoice Entry rows 2/3 now record the deposit invoice and its payment. |
| 21 | PAY-02 | Receipt classified as AR by shipment date | Invoice Entry rows 5/6 handle Full/Balance invoices and their payments. |
| 22 | PAY-04 | Small overpayment and invoice shortfall routes | Retired: remove both discovery definitions and both calculations. No new write-off route is proposed. |
| 23 | PAY-05 | Refund from Deposits Held 221.100 | New row 4 refunds Client Credits 221.300. Give that changed category a new code. |
| 24 | PAY-06 | Client cancellation posting | Retired: remove. Reverse Ledger remains an explicit, separate action; do not silently make Cancel Payment a reversal trigger. |
| 25 | PAY-07 | Dedicated product bank-payment route | Expense row 5 already handles product payments. |
| 26 | PAY-15 | Staff payment against old accrued-liability mappings | Expense payment rows 11/13/15/17/19 cover the current allowance, payroll and bonus flows. |
| 27 | PAY-17 | Dedicated LOC draw route | Retired: remove. The AR Non-Product invoice/payment flow can represent this through Invoice Entry rows 11/12. |
| 28 | PAY-18 | Dedicated LOC repayment route | Retired: remove. Do not invent a replacement principal-payment rule. |
| 29 | PAY-19 | Bank-transfer route | Retired: remove. No new transfer route is proposed. |
| 30 | PAY-22 | Income-tax payment against 242.100/242.200 | Expense row 27 uses the updated AP settlement flow. |
| 31 | PAY-25 | Dedicated Fidelity interest/dividend route | Invoice Entry rows 11/12 provide the AR Non-Product invoice/payment flow. |
| 32 | PAY-26 | Reconciliation discrepancy posting | Retired: remove. Do not convert discrepancies into bank fees automatically. |
| 33 | PAY-14 | Deferred payroll-disbursement stub | Black: remove the stub and catalog entry. |

Do not delete `ledger-payment`, `ledger-reversal`, `ledger-periods`, or their database guards.
Deleting a catalog rule must not delete a journal. `ledger_rule_lines` already cascades with its
parent rule; journal references prevent an unsafe parent deletion. Preserve a historical rule
disabled if references appear before execution.

## Retained category work, one row at a time

New codes below are proposed. PAY-28 through PAY-32 are currently unused. Reuse retained existing
codes, and update their live row metadata instead of treating spreadsheet row numbers as IDs.

| Live row | Code | Owning record | Implementation change | Unresolved decision |
| --- | --- | --- | --- | --- |
| 2 | PAY-03 | Invoice | Replace the payment-owned credit route with an AR Refund/Credit invoice handler. Any Method of Application qualifies. Read Invoice Date, Branch and invoice references directly. | Funding debit and signed Invoice Amount direction. Do not debit already-recorded cash a second time. |
| 3 | New PAY-28 | Invoice receiving credit | Query AR invoices where Credits Applied is populated and nonzero. Read their source credit invoices and confirm Method of Application = Credit to Another Order. Dr 221.300 / Cr 121.100, using Credits Applied and Invoice Date. | Native Credits Applied is negative. Confirm the intended amount direction before enabling. |
| 4 | New PAY-29 | Payment | Sent payment linked to an AR Refund/Credit invoice with Method of Application = Cash Refund. Dr 221.300 / Cr selected payment account. Use Payment Amount and Payment Date. Remove the proposed client-wide open-invoice check. | Native refund payments can be negative; amount direction remains a finance decision. |
| 5 | PAY-08 | Payment | Sent + linked AP Product invoice + selected account 231.100. Dr AP / Cr card clearing. Remove old PO/vendor-presence and payment-method conditions. | Expense row 5 now excludes 231.100; this category owns product credit-card settlements. |
| 6 | PAY-09 | CC batch payment | Sent + Payment Record Type = CC Batch Payment. Dr 231.100 / Cr selected payment account, using the batch amount/date. Mini-payments supply invoice context, not extra eligibility restrictions. | No additional accounting decision identified. |
| 7 | PAY-10 | Invoice Line | Qualify AP, fully paid, linked Sent payment, Discount line and non-expired status. Own the journal on the line and use the linked payment's date. | Use negated Line Amount, debit AP 211.100 and credit 004.011. Expense row 4 accrues Invoice Amount minus Discount Lines Total; the payment category records cash separately. |
| 8 | PAY-11 | Payment | Change invoice ownership to payment ownership. Sent + linked fully paid AP invoice + nonzero Credits Applied. Post the credit component only, with separate bill/source-credit AP references. | Signed Credits Applied direction. Zero-cash payments and missing bank selection must be allowed because this pair has no bank leg. |
| 9 | PAY-12 | Payment | Sent + AP + Payment Record Type = Return Payment. Negate Payment Amount; use Payment Date and Dr 112.100 / Cr 211.100. | None. |
| 10 | PAY-30 | Replacement payment | Sent + AP + Payment Record Type = Repayment. Use Payment Date and Amount, with Dr AP / Cr Fifth Third. | None. |
| 11 | PAY-13 | Payment | Change the old AP Credit qualification to AP Refund. Sent payment + linked AP invoice whose Vendor Type is AP - Refund. Dr selected payment account / Cr AP. | Negative refund direction. No new-type live sample was found. |
| 12 | New PAY-31 | Loan invoice | AR Non-Product invoice linked to its Loan Record. Read Invoice Amount/Date and its selected loan account. | Bank timing, eligible loan accounts, and ownership versus generic AR Non-Product Invoice Entry. |
| 13 | PAY-16 | Payment | Replace the AP Expense/invoice-line assumption with the new loan-invoice flow. One principal journal and one interest journal when both accounts apply. | Monthly versus original invoice link, principal/interest source, and separation from generic AR cash receipts. |
| 14 | PAY-20 | Payment | Keep the direct distribution pair: linked AP Expense invoice account 316.100, Dr 316.100 / Cr selected payment account. Use payment amount/date. | No new accounting gap identified; no eligible Sent sample was found. |
| 15 | PAY-21 | Payment | Keep the chart's direct contribution pair: AR Non-Product invoice account 311.200, Dr payment account / Cr 311.200. | Invoice Entry rows 11/12 already handle the same invoice/payment. Select one flow before enabling. |
| 16 | PAY-23 | Payment | Replace the obsolete multi-debit block with Dr Fifth Third 112.100 / Cr 122.100. Qualify through the invoice's insurance account. | Missing FIN 122.100 account and overlap with Invoice Entry rows 11/12. |
| 17 | New PAY-32 | Invoice | AP Asset invoice with linked account 143.200. Dr Security Deposits / Cr AP, using invoice amount/date. | No new accounting gap identified; no eligible sample was found. |
| 18 | PAY-24 | Payment | Change qualification from AP Expenses to AP Assets linked to 143.200. Change debit from 143.200 to AP 211.100; credit the selected payment account. | No new accounting gap identified; no eligible Sent sample was found. |
| 19 | PAY-27 | Payment | Sent Regular Payment through 231.100 linked to a Fully Paid AR Non-Product invoice account 004.011. Own the journal on the payment; use its full Amount and Payment Date once. Dr 231.100 / Cr 004.011. | Generic Invoice Entry rows 11/12 exclude 004.011. |

The global amount policy is to preserve the selected source sign. Do not silently add ABS,
negation, bank-side swaps or allocations to resolve the finance issues above. Matched unresolved
categories retain their known filters and named function, but fail with `Not yet implemented`
before posting. Do not label these fully implemented or enable them prematurely.

## Exact code changes

| Location | Planned work |
| --- | --- |
| `ledger-daily/rules/payments.ts` | Replace 29 legacy discovery definitions with the retained 18-category map: 13 retained codes and five new codes. Remove both PAY-04 branches and the PAY-12 cancellation branch. Keep category switches off until reviewed. |
| `ledger-daily/categories/payment-sent.js` | Replace the legacy sender-shaped module with the same source-aware category pattern used by Expense. Keep one named handler per retained category, with shared bounded linked-record reads. Remove retired handlers and unused helpers. |
| `ledger-daily/categories/payment-events.js` | Delete after cancelling/reconciliation routes have no remaining registered callers. Returned-payment handling lives with retained Payment categories. |
| `ledger-daily/categories/index.ts` | Remove the assumption that every PAY code is evaluated from a payment or a latest linked payment. Dispatch by category module and actual owning table. Emit invoiceRecordId / invoiceLineRecordId / paymentRecordId as appropriate. |
| `ledger-daily/definitions.ts` | Add existing Invoice Type/Vendor Type AR/AP, Invoice Date, Original Payment, Repay/Repayment and loan-link IDs to the source-aware Payment field map. Keep only fields still read. Never rename or create FIN fields merely to match old code. |
| `ledger-daily/queries.ts` | Exempt row 8/PAY-11 from the payment-amount-nonzero guard. Its amount is Credits Applied. Keep existing posted/reversed/cancelled source protections and preserve Expense behavior. |
| `ledger-daily/scope.ts` and related definitions | Invoice-owned rules use Invoice Date. Line rules dated by a Sent payment must discover through payment-date bounds, not parent Invoice Date; otherwise an older invoice paid today is missed. |
| `ledger-daily/rules/chart.ts` | Add current Payment row identity, source ownership, filters, mapping, readiness and useful issues. Avoid stale numeric row references in logs/catalog notes. |
| New catalog migration and `supabase/seed.sql` | Remove eligible retired PAY rules/lines, insert the five new codes, and update the retained rule metadata and structured debit/credit lines. Keep unresolved switches disabled and every supported category reversible. Do not rewrite old migration files. |
| Tests and docs | Replace native-versus-old-Payment parity expectations with current category contracts. Update worker, source, enablement and reversal docs. Preserve meaningful coverage of sign, rounding, references, zero-cash credit settlement and replay. |

Use the existing one-hop/two-hop discovery support instead of adding Airtable lookups solely for
API filtering. For example, line-owned discount categories can discover Sent payments in
the date range, read their invoices' line links, then query those candidate lines. The category
handler verifies parent invoice status/type. Targeted line calls read only that line's graph.

The generic writer, its source contracts, verified writeback and reversal engine need no redesign.
Invoice-line packets already support `entry_requested`; invoice packets use the appropriate
invoice identity/event; payment packets use `sent`. Daily timing is not the journal's source type.

## Airtable automation plan

| Automation | Current state | Planned action |
| --- | --- | --- |
| [Payment Sent](https://airtable.com/app0Q1UMEdUeWl538/wflne8pBqyMXeoYI4) | OFF; old category script remains | Delete after the revised daily worker is deployed and tested. Do not enable this legacy sender in parallel. |
| [Payment Cancelled](https://airtable.com/app0Q1UMEdUeWl538/wfluW7C3S57rkjJtx) | OFF; PAY-06 and PAY-12 cancellation | Delete after removing those routes. No replacement cancellation posting is proposed. |
| [Payment Reconciled](https://airtable.com/app0Q1UMEdUeWl538/wflpe86TWSqVn68YP) | OFF; PAY-26 | Delete after retiring the black reconciliation category. |
| [Payment Reverse Ledger](https://airtable.com/app0Q1UMEdUeWl538/wflOy11pXjH4HRsEB) | ON | Keep. Covers payment-owned categories, including multiple journals on one payment. |
| [Invoice Reverse Ledger](https://airtable.com/app0Q1UMEdUeWl538/wflu0qz8LtuOivu4q) | ON | Keep. Covers new invoice-owned credit, loan and security-deposit categories. |
| [Invoice Line Reverse Ledger](https://airtable.com/app0Q1UMEdUeWl538/wfllk4vGHSWhiJYjX) | ON | Keep. Covers line-owned discounts. |

Preserve the other three source reversal automations and completed Expense/Invoice Entry
automations. An optional Airtable manual-sync action should only send source table/record ID to
`ledger-daily`; it must not repeat filters or accounting math. No new category-specific automation
or scheduler activation is required for this realignment.

After the old native posting automations are deleted, remove their `airtable/payment-sent.js`
and `airtable/payment-events.js` files and update their callers/tests/docs. Do not retain a second
executable Payment accounting implementation as a fallback.

## Airtable fields and account records

| Area | Existing fields or records | Required action |
| --- | --- | --- |
| Posting/reversal metadata | Payments, Invoices and Invoice Lines each already have Ledger Postings, Ledger Journal IDs, Reversal Journal IDs, Reverse Ledger and Reverse Date. All 15 field IDs/types were verified. | No new ledger fields. Write all metadata to the category's actual owner. Do not move or copy unrelated source histories. |
| Stale test posting markers | 81 Payments and three Invoices retain PAY markers, but none has a current journal in Supabase. | After exact-write confirmation and a fresh database check, set only Ledger Postings, Ledger Journal IDs and Reversal Journal IDs to the JSON text `[]` on those affected sources. Preserve Reverse Ledger, Reverse Date and all business fields. If a source gains journals before cleanup, reconstruct its complete metadata instead of clearing it. |
| Client credit/refund | Invoice Method of Application already offers Cash Refund, Credit to Another Order and Pending. Credits Applied and source/recipient credit links exist. | Read these fields. No new Store Credit choice, no client-wide open-invoice field and no new payment checkbox. |
| Vendor refund | Vendor Type (AP) already contains AP - Refund. | Change the code's qualification; no new choice is required. |
| Repayment | Repay, Repayment, Original Payment and its reciprocal link exist. | Resolve which record owns row 10. If the positive replacement needs a marker, reuse the existing Repayment field and update the creating automation after approval. Do not backfill historical values to force a sample. |
| Loans | Loan Records, AR Loan Invoice Received (Source), Linked Monthly Invoices, invoice Loan Records/Loan Records 2, and Debt Amortization Principal/Interest/Linked Payment exist. | Choose the intended links/amount source first. No new loan fields are justified yet. |
| Insurance | Supabase account 122.100 exists; FIN account 122.100 does not. | After the ownership decision, create the missing FIN Chart of Accounts record or identify the actual intended FIN account. Link its mapping to existing Supabase 122.100; do not duplicate the ledger account. This is an account-record write, not a schema change. |
| Branch and references | Invoice Branch, vendor/client/staff/transaction/PO/state links, and CC batch mini-payment invoice links exist. | Reuse these fields. Empty attribution stays empty; mixed batch branches use the existing nullable handling. No new notes or duplicated audit-link fields. |

No Airtable field deletion is needed. In particular, do not delete Sent, Return Payment, Cancel
Payment, Reconciled, Repay, Repayment or Create Entry: operational automations outside this
ledger migration may still use them. No new Supabase columns are required.

The existing metadata helper intentionally returns without writing when a source has no journals.
Calling normal sync/reversal therefore will not clear these orphan markers. Use a bounded,
explicitly authorized one-time cleanup, not a new runtime repair workflow or a new webhook flag.
The filtered source IDs and existing values are held outside the public repository for the
eventual write proposal; re-read them before execution.

## Reversal and cutover verification

The current shared reversal path already handles all three retained owner tables. Keep it
unchanged unless a focused test exposes a defect:

- One source with several journals reverses every owned journal atomically.
- Debit/credit swap preserves the stored sign, accounts, references and branch.
- Invoice reversal does not reverse its linked payment, and line reversal does not reverse its
  parent invoice or sibling lines.
- Same source/date retry returns existing reversals. A different date conflicts.
- Disabled or retired posting routes do not invalidate already-existing journal reversals.
- Source metadata retains original postings and original/reversal ID arrays.
- Closed-period review and the uncheck-does-not-restore behavior remain unchanged.

Today's checks on the unchanged deployed source passed 11 native reversal checks, two reversal
endpoint checks, 102 disposable database checks, and 31 existing Payment-handler checks. These
prove the current infrastructure, not the unimplemented revised categories.

Implementation sequence:

1. Resolve the financial decisions in the retained-row table. Keep only affected categories
   blocked; implement known filters and source reads meanwhile.
2. Build the 18-category source-aware Payment module and current catalog metadata. Preserve the
   completed Expense/Invoice Entry definitions unless an overlap change is explicitly approved.
   Include the authorized stale-marker cleanup before enabling any affected source category.
3. Add focused new-rule tests. Include zero-cash credit payments without a bank, returned-only
   matching, new refund type, positive replacement identity, and old invoices paid in the current
   date window. Keep amount signs literal until approved otherwise.
4. Preview targeted real sources with `test:true`. Verify returned source, rule, date, pair,
   amount and references. Repeat previews to establish that no source fields/journals change.
5. Test new-rule posting, source writeback, replay and reversal in the disposable database.
   Select live source IDs/date/write values explicitly before any native checkbox test.
6. Deploy the revised worker and catalog with the existing secret. Enable only resolved rules.
   Leave the external scheduler off unless separately requested.
7. Delete the three OFF native Payment posting automations and their obsolete source files.
   Re-read the deployed source/catalog and retained reversal settings after cutover.

Plan only: no deletions, enablement changes, deployments or live financial tests have occurred.
