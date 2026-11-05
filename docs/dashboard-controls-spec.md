# Dashboard controls and stable loading

Status: implemented and independently source-reviewed. Base: `develop`. Browser verification pending.

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

## Review results

| Review | Confirmed issue | Resolution |
| --- | --- | --- |
| Correctness | Rapid pending account/side/date changes could overwrite earlier filters | Latest requested scope is merged optimistically; stale responses and browser Back are covered |
| UI and accessibility | Combobox popup was outside the drawer's modal subtree | Popup targets the nearest dialog; keyboard and portal regression tests added |
| UI and loading | Drawer and statement error states changed panel geometry | Fixed summary space and two-column statement errors preserve the surrounding layout |
| Layout and print | Screen typography overrode print sizes; short loading panes and signed chart legends changed height | Screen-only font rules, flexible data loaders and reserved legend slots |
| Screenshot follow-up | A broad input selector added a second border and padding inside search controls and overrode combobox padding | Removed the blanket input decoration; each control owns its border, padding and focus treatment |

The follow-up tightens heading/filter spacing, puts period/year labels on one header line and
groups Trial Balance date controls on the left and display controls on the right. Its zero-activity
option includes unused accounts; accounts with settled debit/credit activity remain visible.

The subsequent runtime review found a client-only General Ledger crash: the RSC-delivered
account metadata promise has a non-chainable `.then()`, so `.then(...).catch(...)` dereferenced
`undefined` during hydration. It now subscribes with success and failure callbacks in one `.then()`.
A regression uses a non-chainable thenable rather than the native Promise used by earlier mocks.
This explains why the successful authenticated HTTP reads did not catch the failure.

`FilterControls.tsx` owns the shared bar, labeled field, search and segmented-switch components.
Dropdowns use the same labeled-field wrapper. Labels sit above controls with a 3px gap. Controls
are 32px tall, and the labeled bar has a 64px minimum height, wrapping when necessary. Page-specific
search/switch implementations and their competing style rules have been removed.

The route-level loading page and its temporary filter bar have been removed. Navigation retains
the mounted page until the destination shell arrives, then its existing data-only Suspense handles
financial loading. Navbar destination/progress feedback remains immediate; cold URL commits still
wait for the middleware and lightweight shell response. Navigation links do not prefetch full reports.

Protected middleware now runs live user validation and the allowlist query concurrently and still
requires both to pass. Financial reads were already parallel. The Income Statement strips unrelated
asset, liability and equity accounts before streaming data; all six View/Display combinations and
analytics retain the same financial results.

Live authenticated backend samples on 2026-11-06 measured sequential access checks at 444-781ms
and parallel checks at 239-254ms (two samples each). The 12-period account JSON was 143,482 bytes
before filtering and 64,862 afterward. These are backend/payload measurements, not browser render,
navigation-cache or layout-shift benchmarks. Local authenticated responses rendered all five pages.
Actual browser console, screenshots, responsive geometry and cache timing remain unverified.

Authenticated HTTP reads on localhost rendered all five pages. General Ledger default, search,
second-page, account/offset/side filters, literal punctuation and reversed-date empty states all
returned successfully; its preview default also rendered 100 records. The reported unavailable
state was not reproduced by these checks, which do not exercise client-side browser interactions.

The new `20261105150253_add_ledger_search.sql` migration adds an invoker read function. It is applied
to DUAL ENTRY; the applied initial migration remains unchanged. Disposable database checks cover
search beyond page one, literal punctuation, filters, pagination, exact rows and caller RLS.

Native browser checks could not run because the browser-access host is unavailable. A reconnect
and runtime reset still failed; native Chrome capture also returned capture-service error -3811.
The PR remains a draft for desktop/narrow visual and interactive verification. No browser
screenshots were created.
