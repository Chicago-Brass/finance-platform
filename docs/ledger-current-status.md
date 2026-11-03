# Ledger status - 4 November 2026

This page summarizes the latest verified state. The [webhook contract](ledger-webhook-contract.md),
[category matrix](ledger-payment-category-matrix.md) and actual source describe behavior.
The [initial rollout](ledger-rollout-2026-10-30.md) is historical evidence, not current deployment state.

## Logging fixes - 4 November

Payment Sent prints its match summary before the first webhook. Its shared sender prints each
acknowledgement immediately, including journal IDs, before moving to another invoice packet.
Responses are no longer buffered until the whole run succeeds. A later failure still fails the
run; already acknowledged packets remain visible in the console. Posting payloads and retries
are unchanged.

ledger-payment version 7 is ACTIVE. Unexpected service failures log a sanitized error code and
the valid FIN source record ID, when present. Raw error messages, stacks, credentials, headers
and payloads are not logged. Client responses and the posting service are unchanged.

Forty-eight Sent/settlement checks, seventeen fixture payment replays, the existing payment
checks and nine HTTP checks passed. New regressions cover a later failed cash/credit or invoice
request and safe server logging. The deployed Edge sources match the four local modules.
No financial records were changed or production failures triggered for testing.

## Invoice Entry trigger migration - 4 November

T-chart notes were updated first and downloaded for verification: ten H/I cells changed.
After implementation K2/K4 were marked Fully. Final comparison found only these twelve
meaningful value changes, plus trailing whitespace in H6, with no out-of-scope style changes.
Rows 2/4/5/7/8/9/10/11 now use Create Entry checked.
The new invoice-entry.js uses automation wflGhhBFp5RFocKAC, action wacOwcm9tAerUy2NA.
Inputs are native trigger invoiceRecordId and ledgerWebhookUrl, with the existing secret.
The source uses invoice-owned entry_requested packets, supported by the existing receiver.
Saved source, inputs, secret and OFF state were read back. The old ON script also matched local
after removal. The live catalog contains INV-01/03 and active/postable 132.100/211.100/211.200.

Rows 2 and 4 are implemented with the native currency rollup Total Received Not Yet Invoiced
(fldUFz9w6y184Sn7h), > 0 / = 0 respectively. Amount is Invoice Amount, date is Invoice Date;
accounts are Dr 211.200 / Cr 211.100 and Dr 132.100 / Cr 211.100. Row 5 retains the chart's
AP Product filter and may match alongside either row; no freight-only filter was invented.
Row 10 retains its known filters and explicit unresolved credit-account error.

The old Invoice Created source now contains only row 6's unresolved outbound-shipping handler.
Rows 3/12 remain unmapped. Nineteen focused native mock checks and eight receiver HTTP checks
passed. No invoice checkbox was toggled and no hosted journal was posted for testing.
Historical created-event INV entries may conflict if re-requested under entry_requested;
source/rule identity is retained and historical journals were not changed.

## Expense Create Entry - 4 November

The user-approved first phase covers only Invoices.Create Entry, in automation
`wfljsMLxiID5vnmsg`, action `wac4oanK56ColQUF7` (Expense | Invoice Create Entry).
`airtable/expense-entry.js` contains eight isolated CORE category handlers, cached native FIN reads,
one supplied-pair webhook sender and display-only HELPER functions. Invoice Date supplies the entry
date for every category. Invoice IDs and line/account joins use fresh verified field IDs.

Rows 8 and 10 implement EXP-07 offshore/1099/owner payroll and EXP-09 bonus/commission, using each
matching line amount and source-line reference. Rows 2/6/7/12/13/14 have explicit Not yet implemented
errors for their chart clarifications. All category preparation finishes before POST, so a matching
blocker cannot leave a partially posted invoice. Rows 3/4 use different primary events and are deferred.

ledger-payment version 6 is ACTIVE and accepts the invoice-owned entry_requested event. Downloaded
deployed sources match all four local runtime files. This is a generic invoice event extension;
there is no new accounting router, database posting function, schema change or catalog write.
The EXP catalog rules already exist. Only 005.102 is absent in the hosted account catalog; FIN's
missing-account clarifications remain blocked as requested even where the ledger account exists.

Thirteen new sender checks, the existing thirteen invoice-created checks, eight HTTP checks and
twenty-six disposable database checks passed. The database test proves created and entry_requested
can coexist on one invoice with independent category sets, exact retries, concurrent deduplication,
source validation, line refs, invoice audit URLs and no generated notes.

All four pre-existing automation scripts were read through their browser editors and matched the
local sources. Their source code was not replaced. The payment automations and Invoice Created were
observed ON; the new Expense Create Entry automation remains OFF. No financial record, checkbox or
hosted journal was changed or posted for testing. Evidence is under
`scripts/outputs/expense-ledger-implementation-2026-11-04/`.

## Runtime and automation ownership

The following runtime and installation details describe the preceding October rollout; the
expense section above and the current Airtable state supersede its version/state statements.

DUAL ENTRY is Supabase project inzobaubbikyiekcfarj. ledger-payment version 5 is ACTIVE. The
downloaded deployment matched all four local runtime files after publication. It authenticates
with the existing shared webhook secret, validates supplied pairs and writes directly in one
transaction. No new posting RPC, automatic reversal or category router is involved.

| Automation | Source | Primary trigger | State at latest saved-source verification |
| --- | --- | --- | --- |
| Payment Sent | airtable/payment-sent.js | Sent checked | ON, one script action |
| Payment Cancelled | airtable/payment-events.js | Cancel Payment checked; eventType cancelled | ON, one script action |
| Payment Reconciled | airtable/payment-events.js | Reconciled checked; eventType reconciled | ON, one script action |
| Invoice Entry Create Entry | airtable/invoice-entry.js | Create Entry checked | OFF, saved source verified |
| Invoice Created | airtable/invoice-created.js | Invoices record created | ON; row 6 blocked |

Invoice Paid and the standalone Payment Returned automations were deleted after consolidation.
Sent owns payment movements and invoice-owned credit/rebate totals. AP returns use Sent plus
Return Payment (AP). The event script rejects unsupported eventType inputs; returned remains valid
metadata at the generic receiver boundary, but has no separate active automation.

All scripts retain CORE category handlers, UTILS for reads/calculations/transport and HELPER for
logs. The senders use native FIN reads only, select stable field IDs and do not write Airtable records.

## Names, notes and audit links

Invoice and source-credit queries select Invoice ID, the primary display field fldMZyzqDidRujeZS.
A native read-only probe reproduced Unnamed record without that field and returned the correct
names with it for all four vendor-credit invoices from the live test. Mock checks reproduce the
same selection dependency. This affects new descriptions and invoice/source-credit logs;
existing posted descriptions remain unchanged on replay.

Airtable does not generate or send notes. Supabase retains optional header/line notes support.
Structured reference IDs and plural arrays remain in the payload. Current journal reference
columns store singular IDs; plural-reference and branch persistence are still deferred.

Every payment-triggered journal header and line audit URL opens the triggering FIN payment. Invoice references
and invoice-owned duplicate identity remain separate. Audit URLs do not affect replay equality;
retries retain their original stored URLs and descriptions. Posted journals are not backfilled.

## Invoice-entry implementation - 31 October (historical; superseded above)

The current chart resolves sheet rows 5/7/8/9/11: INV-04/06/07/08/10. They use Invoice Amount
(absolute value for row 9) and Invoice Date. Each category owns its filters, native reads use FIN
field/table IDs, and the generic Edge writer receives the final account pairs. Invoice-created
events identify invoiceRecordId, have eventType created and open the invoice as their audit link;
they never supply a fabricated payment ID. Payment-triggered invoice totals retain payment links.
No database schema, catalog, payment script or Airtable financial record was changed.

Invoice Created automation wflau6oB4awz7O23T has one action wacuGxuK7B716rxgH, with dynamic
invoiceRecordId, the existing webhook URL and Dual Ledger Webhook Secret. The saved code exactly
matches local source. It remains OFF. Row 6 throws until its freight-cost source is specified.
Row 10 has its AP Credit plus empty Related Purchase Order filter and a TODO, then throws until
the COGS/original-expense account choice is defined. Rows 2-4 and 12 remain unmapped.

Thirteen mocked native-script checks and 25 disposable-database tests passed, including all five
resolved invoice pairs, zero/no-op behavior, source validation, strict changed replay conflicts,
invoice audit attribution, concurrent duplicate delivery and existing payment cases. The HTTP
layer's eight checks and existing payment sender checks passed. No live invoice was posted.
No existing AP Assets or Related Purchase Order-linked AP Credit samples matched the fresh
bounded read. Record-created triggers can include initially empty invoices; the script evaluates
current fields once and does not re-run on later completion edits.

Evidence: scripts/outputs/invoice-entry-implementation-2026-10-31/, including the latest workbook,
live schema/catalog, saved Airtable code, automation screenshot and downloaded Edge sources.

## Latest live Sent test

The approved reset deleted the backed-up 24 old journals and 58 lines. Exact source IDs were
checked under a database lock before clearing both journal tables. Accounts, rules, periods,
schema, sequences and guard triggers were preserved.

Category-filtered discovery selected 25 unique payments using Payment Date: 22 from 2025 and
three from January-April 2026. No sample was later than July 31, 2026. Only Sent was toggled off/on.
Every flag was restored and financial dates, amounts and links were independently read back unchanged.

All 28 webhook requests returned HTTP 200 on version 4, with no runtime errors recorded. All
27 expected unique journals and 72 lines were verified against the current sender calculation,
including accounts, exact cents, date, scalar references, payment audit URLs, posted status,
balance and null notes. An invoice-owned credit correctly deduplicated across sample payments.

| Category | Payment samples | Unique journals |
| --- | ---: | ---: |
| PAY-01 Customer deposit | 3 | 3 |
| PAY-02 Payment after shipment | 3 | 3 |
| PAY-05 Client refund | 3 | 3 |
| PAY-07 Vendor bank payment | 3 | 3 |
| PAY-08 Vendor card payment | 3 | 3 |
| PAY-09 Card statement payment | 3 | 3 |
| PAY-11 Vendor credits applied | 3 | 4 |
| PAY-13 Vendor refund | 2 | 2 |
| PAY-16 Loan principal/interest | 3 | 3 |

Ashley Norton's payment rec4pItWiy8vpw9IO matched PAY-07 and PAY-11. It posted $1,115.73 of bank
settlement and separate credits of $29.33 and $48.79, without another bank movement for those credits.

These tests preceded the invoice-name selection fix. The name fix has a separate native read-only
probe and mock regression coverage; it did not retrigger payments or rewrite the 27 posted journals.

## Blockers and untested scope

| Categories | Current boundary |
| --- | --- |
| PAY-10 | Discount Lines Total is known; bank/discount credit scope and split remain undefined. |
| PAY-15 | Salary/fee split remains undefined. |
| PAY-23 | Bank/recovery account selection remains undefined; FIN account 122.100 was missing when checked. |
| PAY-14 / PAY-25 | Payroll/Fidelity primary trigger and amount mappings remain undefined; handlers are not routed. |
| PAY-16 / PAY-18 | Implemented for separate single-account principal/interest invoices. Multiple accounts or shared interest between both principal types fail explicitly. |

No qualifying sample was found in the bounded date/category searches for PAY-03, PAY-04, PAY-12,
PAY-17, PAY-18, PAY-19, PAY-20, PAY-21, PAY-22, PAY-24 or PAY-27. This is a coverage limit, not proof
that those categories have no records anywhere. PAY-13 had only two usable samples. Cancelled
and Reconciled were intentionally not triggered in this run.

A matching blocked category aborts the run before posting. Category preparation precedes the first
webhook, but a later packet/network failure can occur after an earlier packet committed. Exact
retries deduplicate; financial changes require review. No correction policy is implemented.

## Verification evidence

Evidence is under the scripts workspace at /Users/jeric/Documents/GitHub/scripts/outputs/:

- ledger-payment-audit-link-2026-10-30/: version-4 download comparison, 23 database checks,
  eight HTTP checks and TypeScript checking.
- ledger-clean-retest-2026-10-30/: reset backup, selected-payments.csv, execution manifest,
  Sent write/readback logs, per-journal verification, Supabase invocation metadata and run history.
- ledger-invoice-name-fix-2026-10-30/: primary-field schema, four fresh invoice names,
  native before/after name probe and saved-source readbacks.

Local checks: node airtable/check.cjs and node airtable/check-invoice-settlement.cjs. The latter
has 46 behavior checks and replays 17 historical fixtures through a mocked fetch. No local check
posts to the hosted function. Live state must be reread before later changes.

## Prepaid expense creation - 4 November 2026

Expense | Invoice Created (wflkMzEKAzYbWQtMt) now runs expense-created.js and is ON. Its native trigger
is a new FIN Invoice; the category qualifies AP + AP - Expenses (Non-Sales Tax) + Mark as Prepaid
Expense? checked. Row 4 / EXP-03 posts Invoice Amount, Dr 135.000 / Cr 211.100, dated Invoice Date.
The input uses the native trigger record ID and the existing ledger URL/shared secret. The generic
receiver and active account/rule catalog already support this path; no Supabase changes were needed.

Six focused mocked checks passed, and saved source/input/secret/ON configuration was read back.
No live financial posting test was run. Chart H4/I4 already matched; the obsolete J4 missing-FIN-account
clarification was cleared because fixed ledger codes do not require FIN account links. Original A:G
notes remain unchanged. Evidence: scripts/outputs/prepaid-expense-implementation-2026-11-04/.

The separate ON Invoice Entry created automation still has its unresolved row 6 freight-cost handler
matching AP expense invoices. That independent handler was not changed by this prepaid installation.
