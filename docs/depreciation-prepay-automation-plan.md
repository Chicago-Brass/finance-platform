# Depreciation and prepaid-use automations

Both record-created senders and the generic receiver were published on 7 November 2026 through
the Jeric Chrome profile. No live financial records were created, changed or retriggered for testing.

| Setting | Depreciation | Prepaid use-up |
| --- | --- | --- |
| Automation | [Depreciation Created](https://airtable.com/app0Q1UMEdUeWl538/wflncSEohUJfvRn8m/wacJduHfXZZAbR4uF?editorMode=configuration) | [Pre-pay Amortization Created](https://airtable.com/app0Q1UMEdUeWl538/wflknpQ6mJixShE5w/wacwerzCdBCGBAAgY) |
| Source | Depreciation Table tblC0dbO5UMXzHma9 | Prepay Expenses Log tbl1LgiUYt7Gc492d |
| Script | airtable/depreciation-created.js | airtable/prepay-created.js |
| Record input | depreciationRecordId | prepayLogRecordId |
| Rule | EXP-10 / Expense row 11 | EXP-04 / Expense row 5 |
| Amount | Amount Depreciated | Amount Deducted |
| Date | Date, unchanged | Applied Date, unchanged |
| Branch | Empty; no source field exists | Linked Invoices.Branch; empty/mixed stays NULL |
| Debit | 009.101 Depreciation Expense | 007.011 General Insurance |
| Credit | 161.000 Accumulated Depreciation | 135.000 Prepaid Expenses |
| Notes | Associated Asset names and IDs | Prepay Log text |
| Audit link | Triggering depreciation record | Triggering prepay log record |

Both use the existing ledgerWebhookUrl and Dual Ledger Webhook Secret. CORE prepares a category,
UTILS performs native reads and one authenticated POST, HELPER formats the logs. There is no PAT,
Airtable record write, schedule condition or amount recalculation. Missing/negative/nonfinite or
unsafe money fails; zero is a category no-op. Missing dates fail. Record creation posts immediately,
including future financial dates. No created owner is replaced with a fabricated invoice/payment.

The receiver accepts either record source through the same balanced-pair writer, atomic transaction,
source lock and immutable exact-replay checks. It rejects mixed owner identities. Linked prepay
invoices are references only; one invoice_ref is supplied when exactly one invoice is linked.

Six native depreciation checks and six prepaid-use checks pass. The 33 disposable database checks
cover both sources, duplicates, changed packets, invalid identity and rollback. HTTP boundary tests
also pass. Saved source/input/secret/ON-state readbacks are separate from these local checks.
