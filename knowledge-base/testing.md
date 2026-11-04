# Focused testing and publication boundaries

## Frontend and access

```sh
node --test app/landing.test.cjs components/*.test.cjs lib/reports/*.test.cjs
npm run typecheck
git diff --check
```

The 2026-11-04 cohort has 49 passing focused checks. Coverage includes report amounts/signs,
per-year Balance Sheet earnings, compact period headers, analytics, exports, cache session isolation,
pagination, display filters and landing/auth routing. These are mostly pure or mocked checks,
not hosted accounting data reconciliation.

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

See [supabase/tests/README.md](../supabase/tests/README.md). The existing runner:

```sh
sh supabase/tests/check-payment-posting.sh
```

creates and removes its own disposable PostgreSQL container bound to loopback. It uses a core-schema
fixture plus tracked extensions and synthetic journals, not hosted credentials or a production reset.
It proves the generic writer works without the legacy posting/reversal RPCs. Use it when changing
the writer or database financial behavior; it is not required for every presentation-only change.

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
