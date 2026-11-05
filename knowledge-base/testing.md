# Focused testing and publication boundaries

## Frontend and access

```sh
node --test app/landing.test.cjs components/*.test.cjs lib/reports/*.test.cjs
npm run typecheck
git diff --check
```

The 2026-11-05 dashboard-controls follow-up has 99 frontend/HTTP tests passing. Coverage includes report amounts/signs,
per-year Balance Sheet earnings, compact period headers, analytics, exports, cache session isolation,
pagination, display filters and landing/auth routing. These are mostly pure or mocked checks,
not hosted accounting data reconciliation.

The performance cohort also checks parallel drawer sections, report-scoped cache reuse, abort/error
handling, input validation, metadata-only dropdown reads, immediate route Suspense boundaries and
data-only loading, independent errors, static controls and modal dropdown keyboard behavior. Native browser verification is pending: the browser access host remained
unavailable after Jeric reconnected and the browser runtime was reset. Do not claim measured
end-to-end navigation or visual validation from these unit checks.

Browser review used Jeric Chrome for desktop and narrow layouts, native date filters, display filters,
independent table/sidebar scrolling, analytics tabs, General Ledger first/final pages, landing input
behavior and authenticated root redirect. An anonymous loopback host allowed visual review without
clearing the normal signed-in browser session. Preserve user sessions and tabs.

The native PDF dialog and a fresh live password submission were not exercised in the final landing
pass. The browser Excel download timed out during report work; raw workbook values/formats were
validated by the export test. Do not turn those limited checks into an end-to-end claim.

## Airtable native script checks

```sh
node airtable/check.cjs
node airtable/check-invoice-settlement.cjs
node airtable/check-invoice-created.cjs
node airtable/check-expense-entry.cjs
node airtable/check-expense-created.cjs
```

These run mocked native record reads and HTTP calls. They do not toggle Sent/Create Entry, mutate
Airtable records or post to the hosted ledger. The settlement check now targets the consolidated
Sent source; it is not evidence that a separate Invoice Paid automation still exists.

## Edge/database integration

See [supabase/tests/README.md](../supabase/tests/README.md). The runners:

```sh
sh supabase/tests/check-payment-posting.sh
sh supabase/tests/check-report-reads.sh
```

each create and remove their own disposable PostgreSQL container bound to loopback. They use a
complete initial migration, reference seed and synthetic journals, not hosted credentials or a
production reset. The payment runner has 26 tests and proves the generic writer works without the legacy
posting/reversal RPCs; the report runner proves `get_trial_balances` equals per-period
`get_trial_balance` reads and respects grants, RLS and future-object defaults. A sixth test compares
the optimized ledger view to the initial view for full rows, account/date/offset filters, split
entries and explicit offsets. Use them when changing the writer, report
reads or database financial behavior; they are not required for every presentation-only change.

## Live state and changes

A local source hash, a saved Airtable editor, a published automation and a deployed Edge version
are distinct. Before changing a live script, read its native trigger, inputs, secret and saved source.
After an authorized publication, read back the deployed source/configuration. Recheck current ON/OFF
state rather than inheriting a dated report.

Airtable Test can execute real actions. Checkbox retriggers and webhook tests create financial effects
even if the script does not write back into Airtable. Hosted journal deletion, live sample toggles,
email sends, schema changes and releases need explicit task scope. Do not repeat earlier approvals
from this long conversation as though they authorize a new financial test run.

When test samples are authorized, search with filters and use Payment Date, not Created Time. Do not
change old source data merely to obtain samples. Report missing/untested categories separately from
implemented failures and expected Not yet implemented blockers.

## Dashboard controls review

The draft PR spec is [dashboard controls](../docs/dashboard-controls-spec.md). Three independent
source review passes covered correctness, UI/accessibility and loading/print geometry. Confirmed
pending-filter, modal-popup, loader-size and print/legend issues were fixed and regression-tested.
The read database runner also includes two global ledger-search tests: search before pagination,
literal punctuation, all scope filters, draft exclusion and caller RLS. There are eight database
read tests. Browser interaction and computed responsive geometry remain unverified because the
browser-access host is unavailable.

The input/header follow-up also passed TypeScript and a production build. Authenticated localhost
HTTP reads rendered all five pages; ledger search, second page, account/offset/side filters,
literal punctuation and reversed-date empty states passed. The preview default ledger rendered
100 records. These checks did not reproduce the reported unavailable state and are not browser
interaction proof. Retrying the browser connection/reset failed, as did native Chrome capture
with capture-service error -3811. Desktop/narrow screenshots remain pending.
