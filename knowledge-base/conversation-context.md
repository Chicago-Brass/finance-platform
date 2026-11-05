# Conversation context and decisions

This is a technical summary of the finance conversation through 2026-11-04, not a transcript or
proof of today's live financial values. The original local session is linked in
[session-handoff.md](session-handoff.md). Current user instructions and current source supersede
older suggestions recorded below.

## 1. Earlier Airtable reconciliation work

The earlier task was to align old AR/AP invoices and their payments with the new FIN master
tables. Invoice numbers, names and AP/AR classifications changed, so matching could not depend
on a name or a transferred checkbox. Full payment/invoice link graphs, source record IDs and
field mappings were required. Zero invoices and payments, credits and backfilled historical
payments needed separate handling. Existing corrected payment amounts were not to be overwritten.

The user wanted discrepancy-only tables separated into AR/AP, with invoice names, an Issue column
and a clear resolution instruction. New-only records, deleted old records and test records were
also reviewed, but deletion authority covered only specifically named invoices and not related
projects, clients or transactions. Those historical approvals are not permission for new cleanup.

Other historical reviews covered open invoices/credits/claims, standard purchase orders, batch
payment families and sales-tax MTA invoice links. Batch calculations had to traverse both directions
of the many-to-many graph and count payments once. Sales-tax reconciliation used Shipped Out Date,
not Created Time. Old numerical findings must be re-queried before reuse.

## 2. Amount and status formula work

Invoice Amount To Pay incorporates applied credits; cash paid is compared against that amount.
Balance and percent-paid precision were separated from operational status tolerance. Zero-value
invoice/payment cases use the presence of a Paid Date to distinguish completed zero payment from
an unpaid record. Overpayment percentages above 100% remain meaningful. Discussion explored small
rounding tolerances and a larger status-only shortfall allowance; do not assume every intermediate
formula is still the live one.

The later ledger/report work uses cents and explicit source amounts. It does not infer journal
amounts from a Fully Paid label or reuse a historical status tolerance as accounting rounding.

## 3. T-Chart discovery and note cleanup

The user built a T-Chart workbook for Payments, Invoice Entry and Expenses. Trigger filters had
to refer to actual Airtable fields/options and linked accounts. Uncertain rows stayed unresolved,
rather than being hidden or given guessed mappings. Later the workbook was split into Actual Trigger,
Field/Account Mapping, Clarification and Done columns. The exact compact format is in the trigger guide.

Only authorized note columns were to change. Earlier workbook copies and downloads were compared
to detect accidental changes elsewhere. The latest official Actual Triggers, Debit and Credit
columns became the source of truth. Historical DEV/FIN explanations cannot silently add behavior.

## 4. Airtable infrastructure decisions

The scripts first logged category matches; webhook posting was added later. Several refactors
settled on readable main functions and isolated category handlers with their filters inside the
handler. Each handler pushes a result object. All applicable categories run, since one source can
legitimately contain cash settlement and credit/discount components.

CORE contains category behavior, UTILS contains shared functional code, and HELPER formats logs.
Native FIN reads use IDs, are cached/batched and load linked data needed for the category. Logging
uses section separators and one label/value per line, with only relevant payment/invoice references.
Later fixes made match summaries appear before POST and acknowledgements print immediately, so
a later failed packet does not hide earlier committed journal IDs.

Shipment comparison now uses Invoices.First Ship Out Date. Blank or same-day shipment counts as
deposit; later payment is post-shipment settlement. Clear to Purchase was removed. Payment Type
and Vendor Type now come from Payments. Multiple distinct Vendor Types fail explicitly.

## 5. Generic Edge recording

The user explicitly chose an Edge Function rather than a new stored database posting function.
Airtable performs categorization and calculates final component amounts and debit/credit account
pairs. The Edge Function is generic: authenticate, validate, resolve account identity, persist
balanced pairs. A free-text transaction/category title is stored as metadata.

The backend remains layered and readable. It uses a shared webhook secret, direct parameterized
SQL and a transaction per source packet. Legacy database posting functions still exist but are
outside the new writer. Existing DB constraints and financial guards stay in place.

Exact replay deduplication was implemented after earlier conversations about checkbox retriggers.
Do not repeat the older blanket statement that every retrigger creates a duplicate. A changed
financial payload conflicts; historical journals are not automatically rewritten or reversed.

Cancellation/return categories create new actual entries from their supplied current amount.
The user rejected an automatic reversal subsystem for this phase. Notes generation was removed
from Airtable; the receiver still supports optional notes. Payment-triggered audit links now open
payments, with separate invoice references. Branch storage/reporting attribution remains deferred.

## 6. Consolidation and tests

Invoice-owned settlement categories were consolidated into Payment Sent while preserving invoice
identity. The separate Invoice Paid and legacy Payment Returned senders were retired. AP returns
are a Sent branch with Return Payment (AP) checked. Other native cancellation and reconciliation
triggers still use the common event script.

Historical live tests deliberately used Payment Date, preferring 2025 and then January-July 2026.
Only explicitly authorized Sent checkboxes were toggled, with limited samples per category. The
user allowed multiple categories for a source and did not want legacy data retrofitted to fit new
conditions. Local mocks and disposable database tests cover more cases than those live samples.
Never treat old toggle/delete approvals as authority to repeat hosted financial tests now.

Invoice Entry rows moved from record creation to Create Entry. Expense Create Entry uses Invoice
Date and line/account amounts. Prepaid expense remains a separate Invoice Created category.
Known unresolved functions throw Not yet implemented rather than disappearing from the code.

## 7. Git and frontend integration

The repository is Chicago-Brass/finance-platform. Work originally used feature/data-upload, then
branches were consolidated into develop. The Nov 4 request committed current work there and removed
the merged feature branch. On Nov 5, Jeric authorized consolidating the latest develop into main,
aligning Supabase with one verified initial migration, and deleting develop. Preserve mae/testing,
the separate UI/testing branch. Repository visibility was found public during the final handoff;
the user clarified that only a summary and local conversation path should be committed.

Jeric then recreated develop from the consolidated main for request/query performance work and
deleted the merged ram/ledger-test branch. The performance changes stay on develop. Report routes
stream loading boundaries; drawer totals/lines use independent GET requests with report-scoped
caching. A forward read-query migration preserves financial results and leaves the applied initial
baseline intact. Middleware still validates live sessions and application membership.

The frontend objective changed explicitly to validating pages against the existing database.
Making the database a complete mirror of Airtable is outside this phase. Income Statement and
Balance Sheet now use posted ledger reads, with corrected groupings/signs and prior/current-year
earnings. The account active flag is a label; nullable branch exists but is not populated or filtered.

## 8. Approved visual direction and implementation

After several image concept rounds, the user selected compact navy/white report tables with a
horizontal header, clear date filters, separate view/export controls and a dark Position/Movement
sidebar. The dashboard fills the viewport, with independent table/sidebar scrolling. Truthful
signed-value charts, readable dates and USD cents are required. General Ledger was changed to a
record table with 100-row pagination, not infinite scroll.

Later refinements added month/Q1-Q4/year headings, session-scoped short caching, immediate skeleton/
spinner loading and compact right-aligned analytics. All report headings became one row: title,
divider, description. Repeated Trial Balance/General Ledger date captions were removed.

For the sign-in landing, the user rejected split panels and selected a continuous white canvas,
navy/brass tide background and sculptural brass artwork. Concept 2's architectural serif direction
was implemented. The logo and separate Finance word were removed. The brand is now Chicago Brass,
then Financial reporting, in one place. The form remains live HTML with local fonts, input icons,
password visibility and busy/error states. The old login screen is a redirect, and existing sessions
automatically enter reports. Signup and custom cooldown rules were explicitly deferred.

## Open/deferred work

- Resolve chart account/amount blockers and intentional-versus-unintended category overlaps before
  changing handlers. See [the current source-based blocker list](airtable-triggers.md).
- Income Statement account-detail sidebar was proposed but deferred.
- Branch attribution/report filters, future notes mapping, signup/cooldowns and financial correction/
  reversal workflows were not added.
- Re-read deployed Airtable/Edge state when publication work resumes. Local source and tests do not
  establish current live automation state.
- Do not use this summary to claim that old AR/AP migrations or the live ledger are fully reconciled.
