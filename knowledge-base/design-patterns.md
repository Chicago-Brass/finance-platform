# Design patterns and invariants

## Layer boundaries

| Layer | Responsibility |
| --- | --- |
| Native Airtable trigger | Primary event and owning source record ID |
| Airtable CORE | Category filters, component amounts, final debit/credit pairs and results |
| Airtable UTILS | ID-based reads, batching/cache, dates/cents and HTTP transport |
| Airtable HELPER | Relevant, readable logs only |
| Edge HTTP handler | Shared-secret authentication, JSON boundary and safe HTTP errors |
| Edge posting service | Validation, account resolution, replay checks and one SQL transaction |
| Report application | Authorized reads, grouping, presentation and interactions |

Each category has a named handler that checks its own filters and loads required data on demand.
Evaluate every eligible category; do not use an exclusive first-match router. A matching unresolved
handler fails before its prepared packet is sent. Keep business intent visible instead of building
a generic predicate engine or wrapping every one-line expression in a helper.

## Accounting contracts

- Keep `Report` and `ReportLine` in `lib/reports/types.ts` stable.
- Sum invoice lines in four-decimal integer units per invoice/account, then round each total to
  integer cents. Store database money as `numeric(18,2)` and send signed decimal strings.
  Negative amounts retain the supplied debit and credit accounts.
- Display USD with two decimals, explicit `$0.00`, and parentheses for negative values. Missing
  data is distinct from zero; display rounding never changes financial totals.
- Allocation without explicit per-invoice amounts is proportional to Invoice Amount To Pay,
  deterministic in cents and conservative of the payment total.
- Never repeat a complete amount for every account in an unspecified split. Missing mappings fail
  explicitly. Zero components are no-ops; invalid required values fail.
- Statement display/search/collapse filters do not recompute financial totals. The Ledger footer
  shows a record range and the full filtered line count. Balance Sheet columns are snapshots,
  not additive periods.
- Account `active` is a label; `is_postable`, valid identities, balanced lines, period guards,
  authentication and approved-user access remain functional checks.

## Identity and replay

Record IDs establish identity; names are labels. Source system, table, record and rule identify a
journal. Exact replays return existing entries; changed financial payloads conflict instead of
editing posted data. Event type scopes event-category checks and is metadata, not a way to create
another journal for the same source/rule.

Invoice-owned postings retain invoice identity even when a payment triggers them. Audit links for
payment-triggered packets point to the triggering payment; invoice events point to the invoice.
Business reference columns store arrays, including single links as one-item arrays. Vendor,
client, staff, transaction, PO, invoice and state record IDs all persist. State codes remain a
separate optional two-letter value. Missing or mixed/unknown branch attribution remains NULL.
Airtable does not generate notes, while the receiver retains optional notes support.

Cancellation/return handlers post their supplied actual pairs. They do not automatically locate,
reverse or delete an earlier journal. Existing database reversal support is a separate capability.

## Backend and security

`index.ts` configures the runtime and verified-TLS connection. `handler.ts` authenticates and
returns safe responses. `ledger.ts` validates and persists generic pairs. `errors.ts` defines owned
errors. Use parameterized SQL and existing database guards. Do not add category-specific backend
accounting logic, disable TLS verification, bypass RLS or expose a server key to the frontend.

## UI and maintainability

Reuse shared controls, formatters, icons, drawers and request caches. Keep filter shells independent
of data loading. Preserve keyboard access, focus restoration, accessible names and reduced-motion
support. Render signed/negative analytics honestly; undefined ratios show N/A rather than invented
percentages. Use the navy/white/neutral palette and semantic type sizes, not blanket font changes.

Prefer a small readable `main()` and substantive functions. Remove unused code, preserve errors at
trust boundaries and add focused regression checks for new branching, money or security behavior.
