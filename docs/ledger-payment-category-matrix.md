# Payment category implementation

The reordered live Category - Payment sheet is the accounting source of truth. `ledger-daily`
uses one named handler per retained category in `categories/payments.js`; `rules/payments.ts`
owns filtered discovery. The shared writer, verified source writeback and dedicated reversal
endpoint are unchanged. Production runs the private daily dispatcher; develop stays unscheduled.

Sixteen fully implemented Payment rules are enabled in production. The two remaining loan rules
are disabled and throw `Not yet implemented` before preparing journals. See
[environments](../knowledge-base/environments.md) for the operational enablement selection. Black rows 20-33 are retired from
discovery; unreferenced catalog records are removed and referenced history remains disabled.

| Row | Rule | Source | Status | Mapping or blocker |
| --- | --- | --- | --- | --- |
| 2 | PAY-03 | Invoice | Fully | Negated credit Invoice Amount; debit the single account from Linked Payments, credit 221.300. No Sent filter. |
| 3 | PAY-28 | Invoice | Fully | Negated Credits Applied; debit 221.300, credit 121.100. Source credit Method of Application qualifies. |
| 4 | PAY-29 | Payment | Fully | Cash Refund invoice; negated Payment Amount, debit 221.300, credit selected account. |
| 5 | PAY-08 | Payment | Fully | AP Product paid by 231.100; debit AP, credit 231.100. Expense row 5 excludes this clearing account. |
| 6 | PAY-09 | Payment | Fully | CC Batch Payment; debit 231.100, credit selected account. Mini-payment invoices supply references and branch only. |
| 7 | PAY-10 | Invoice Line | Fully | Negated Discount Line Amount; debit AP 211.100, credit 004.011. Expense row 4 accrues Invoice Amount minus Discount Lines Total. |
| 8 | PAY-11 | Payment | Fully | Negated bill Credits Applied; debit bill AP, credit source-credit AP. Zero-cash payments qualify without a bank. |
| 9 | PAY-12 | Payment | Fully | Sent AP Payment Record Type = Return Payment; negate Payment Amount, debit 112.100, credit AP, blank branch. |
| 10 | PAY-30 | Payment | Fully | Sent AP Payment Record Type = Repayment; retain Payment Amount, debit AP, credit Fifth Third. |
| 11 | PAY-13 | Payment | Fully | AP Refund invoice; negated Payment Amount, debit selected account, credit AP. |
| 12 | PAY-31 | Invoice | Blocked partial | Loan accounts, cash timing and overlap ownership unresolved. |
| 13 | PAY-16 | Payment | Blocked partial | Monthly invoice link and principal/interest source unresolved. |
| 14 | PAY-20 | Payment | Fully | AP expense invoice account 316.100; debit 316.100, credit selected account. |
| 15 | PAY-21 | Payment | Fully | AR Non-Product account 311.200; debit selected account, credit 311.200. Invoice Entry rows 11/12 exclude 311.200. |
| 16 | PAY-23 | Payment | Fully | AR Non-Product invoice account 004.004; Payment Amount, debit Fifth Third 112.100, credit 004.004. Invoice Entry rows 11/12 exclude 004.004. |
| 17 | PAY-32 | Invoice | Fully | AP Asset account 143.200; debit 143.200, credit AP. |
| 18 | PAY-24 | Payment | Fully | Pay the AP Asset 143.200 invoice; debit AP, credit selected account. |
| 19 | PAY-27 | Payment | Fully | Sent Regular Payment through 231.100, linked to a Fully Paid AR Non-Product invoice account 004.011; use full Payment Amount and Payment Date once. Debit 231.100, credit 004.011. Invoice Entry rows 11/12 exclude 004.011. |

## Amounts, references and reversal

The explicit approved negations apply only to rows 3, 4, 8 and 11. Other functioning rows preserve
signed source amounts. Each line-owned category uses that line's amount and the latest eligible
linked Sent payment's date. Linked-payment discovery uses Payment Date, so an older invoice paid
in the current window is not missed.

Invoice-owned rules use Invoice Date and Branch. Payment-owned rules use Payment Date and
matching invoice references/branches. The CC batch reads its mini-payments' invoice contexts.
Vendor, client, staff, transaction, PO and state references remain arrays. No notes are pushed.
Vendor-credit settlement retains separate debit bill and credit memo invoice references; source
credit amounts determine allocation, summed before rounding, with deterministic cent remainders.

The source owns Ledger Postings, Ledger Journal IDs and Reversal Journal IDs. Invoice, Invoice
Line and Payment Reverse Ledger automations call the existing dedicated endpoint. Reversal uses
stored journals and amounts, including negative amounts; it does not rerun category calculations.
Exact retries reuse journals and reversals. Unchecking Reverse Ledger does not restore them.

Native Payment Sent/Cancelled/Reconciled posting automations remain OFF. Their local files are
historical deployment copies, not an alternative posting engine; do not re-enable them.

## Row 2 finalization

PAY-03 is fully implemented and enabled. It owns the AR Refund/Credit invoice, uses its Invoice
Date and Branch, negates Invoice Amount, debits the single account identified by Linked Payments
and credits 221.300. It does not require Sent. Missing or conflicting payment-account links fail
that source rather than infer a bank. Zero credit amounts are a no-op. The existing invoice-owned
writeback, exact-replay protection and stored-journal reversal apply unchanged.

## Verification

`node --test supabase/functions/ledger-daily/*.test.mjs supabase/functions/ledger-daily/categories/*.test.mjs`
checks the current handlers, discovery and worker boundaries. `sh supabase/tests/check-payment-posting.sh`
uses a disposable database to verify the catalog, actual category packets, replay, writeback,
rollback, period review and reversal. Bounded live Airtable previews are read-only; no source
amount, status or account is adjusted to manufacture a sample.

Verified publication on 17 November 2026: all 28 downloaded `ledger-daily` runtime files matched
local source. The hosted catalog contains the 18 retained enabled/reversible rules and 36 current
mapping lines; all category metadata matched the live chart. Migration history contains the exact
local `20261117004333_realign_payment_categories.sql` text. Checks passed: 137 worker cases,
116 disposable database cases, and six deployed no-write previews with matching account/amount
pairs. Twelve functioning category packets were posted, replayed and reversed in the disposable
database. No hosted journals were posted or reversed during this task. The approved stale-marker
cleanup changed and verified only the three ledger metadata fields on 81 Payments and three
Invoices with no hosted journals.
