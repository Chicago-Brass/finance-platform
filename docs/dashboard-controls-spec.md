# Dashboard controls and stable loading

Status: implementation and review in progress. Base: `develop`.

## Outcome

Keep the approved navy financial-report design. Every report has a stable page header with exports,
one compact control bar, and data panels below it. Filters remain available during reads; tables
contain their column headers, rows and totals, without a second toolbar inside the table panel.

```text
Logo | report navigation                                      Refresh | Account
Report title | entity                                         Excel | PDF
Period | View | Display | Accounts / Category | Search | More / Reset
Table column headers and rows                         Position / Movement
Table totals / pagination                             Fixed-height analytics
```

## Design and controls

- Retain navy `#173553`, steel `#31536f`, ink `#253247`, muted `#5d6879`, border `#dce0e5`, white.
- Preserve the current report font family. Use 12px controls/table text and 10-11px chart labels;
  keep title hierarchy and money readability. Buttons keep usable hit areas and visible focus rings.
- Use segmented buttons for two to four mutually exclusive modes. Use a searchable single-select
  for larger option sets. Keep low-frequency actions together in a small More menu when necessary.
- Period controls, grain/display modes, search, zero-account toggles, side/category/account filters
  and collapse/reset actions belong in the control bar. Do not duplicate these inside table panels.
- Prefer one desktop row. Compact controls adapt at narrower widths; wrapping is preferable to
  clipped or unreachable controls. Popup menus must not be clipped by scrolling table containers.
- Searchable selects support labels, selected/active options, grouped choices, disabled state,
  no matches, Arrow keys, Home/End, Enter, Escape, Tab and outside click. No new UI dependency.

## Loading and state

- Build report shells from URL/options immediately. Place Suspense or loading indicators around
  financial data only, not around controls or the entire page. Keep query/display state explicit.
- Date changes reload relevant data panels; mode/display/search-only transformations stay local
  when all needed data is already loaded. Refresh must invalidate report-scoped drawer caches.
- Remove the full-page pending overlay that currently obscures and disables controls.
- Reserve table and analytics geometry during loading. Use a restrained centered loading indicator
  in sidebar/chart areas instead of replacing the entire layout with differently sized skeletons.
- Hide scrollbar chrome while preserving wheel, touch and keyboard scrolling. Set overscroll
  containment/none on the actual scroll containers so scrolling does not bounce beyond panel edges.
- Preserve accessible pending, error, retry and empty states; never show false zero financial values.

## General Ledger search

- Search applies to all matching posted records in the date/account/side scope before pagination.
- Commit a search on Enter, Apply/Search, or blur; typing alone must not send a request per key.
- Search text, dates, side and account/offset filters persist in the URL and through pagination.
- A changed search/filter resets page one. Display filters must not silently become page-only.
- Bind database search input as values, escape literal wildcard characters, retain RLS and stable
  date/entry/line ordering. Keep page totals labeled as page totals.

## Work areas

1. Shared controls: reusable searchable select and shared compact control styles.
2. Statements: persistent IS/BS shells, consolidated controls, table-only ReportView data rendering.
3. Ledger/rules: persistent TB/GL/T-Chart shells, consolidated controls and server-wide search UI.
4. Ledger query: validated search/side parameters, paged read query and focused database tests.
5. Root integration: navigation/loading infrastructure, chart/drawer density, docs and PR.
6. Independent audit/review: loading geometry, accessibility, correctness and scope checks.

## Verification and release

- Run directly affected unit/component tests, TypeScript, production build and database checks for
  changed read behavior. Compare financial results and preserve the applied initial migration.
- Review the integrated change in separate correctness and UI/accessibility passes. Fix confirmed
  issues before marking the PR ready.
- Use Jeric's Chrome profile for desktop/narrow checks, keyboard paths, slow-response loading and
  ledger search beyond page one. Report a connection blocker honestly if browser access fails.
- No Airtable changes, live posting tests, journal edits, auth weakening or automatic main merge.
