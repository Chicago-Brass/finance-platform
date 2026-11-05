# Dashboard controls and data loading

Current implementation: 2026-11-06, draft PR #1 against develop.

## Goal

A destination's header and filters appear immediately when navigating. Table/analytics data loads
separately. The previous report's filters must not remain visible while a server response arrives.
Shared controls keep label spacing, search, dropdowns, switches and keyboard behavior consistent.

## Rendering and request flow

1. The shared report layout renders `ReportApplication`. The five financial page files provide
   metadata and return null; their visible workspace belongs to the layout.
2. First-load SSR includes the header, URL-based filters and a data indicator, without financial
   records or streamed financial promises.
3. Financial links update history using Next's supported native-history integration. URL hooks
   select the destination immediately. Each destination is keyed by pathname, clearing prior-page
   local display and drawer state. Non-financial links retain normal Next routing.
4. `useReportQuery` fetches `/api/reports/data` after mounting. Only the active report is requested.
   General Ledger account choices use a separate parallel request and do not block the table.
5. `ReportDataPanel` renders loading, errors, retry or financial content. Controls stay available;
   exports wait for ready data. There is no duplicate placeholder filter shell.

The URL preserves dates, view, detail level and Ledger account/offset/side/search/page filters.
Back/Forward restores URL-derived state. Search commits on Enter, Search or blur, not each key.

## Shared controls and layout

- `FilterControls.tsx` owns the bar, labeled field, search and segmented switches. SearchableSelect
  reuses its labeled-field wrapper. All reports and the account drawer use these controls.
- Labels sit above 32px controls with a 3px gap. Bars have a 64px minimum height and wrap when
  necessary. Old per-page search/switch styling is removed.
- Standard text is 13px, section/navigation labels 14px, supporting labels 11-12px and page titles
  22px. Sidebar headline amounts are 20px. Screen and print typography remain separate.
- Financial table period/year headings share one thin row. Scrollbar chrome is hidden while
  named table/sidebar regions retain keyboard, wheel and touch scrolling with contained overscroll.
- Dropdowns support grouped searchable choices, Arrow/Home/End, Enter, Escape, Tab and disabled
  states. Popups stay in the nearest modal's accessible subtree when inside the drawer.

## Data contract and cache

- One JSON request loads the active financial data key. Shared `parseReportScreen` normalizes
  options for both the client shell and the API endpoint.
- Statement View/Display keys are excluded from the data key: all required aggregates are already
  loaded for the selected year/month window or as-of date. Display switches make no data request.
- Income Statement sends only revenue/expense account balances. Balance Sheet retains the
  snapshots and year baselines needed for every view. Monetary math remains integer cents.
- Ledger search/side/account/date filters apply before pagination. The server reads 100 rows plus
  one internal lookahead, returns 100, and retains stable date/entry/line ordering.
- Successful responses are cached privately in the verified user's mounted layout for five minutes,
  capped at 32 ready keys. Identical pending requests share one fetch, including StrictMode replay.
- Refresh invalidates this cache. Old in-flight responses cannot replace newer entries. Failures
  are not cached. Sign-out/account switches clear the cache; nothing is stored in local storage.
- Financial API reads verify identity and run through RLS. Middleware checks live user and allowlist
  concurrently, requiring both. API auth failures return JSON 401/403, followed by client redirect.
- Server financial reads remain uncached. The existing read RPCs/views are unchanged.

## Important fixes included

| Finding | Resolution |
| --- | --- |
| Route/filter replacement and retained old filters | Layout-owned client workspace; immediate financial history change; separate JSON requests |
| Chained catch on a non-chainable React stream promise | No financial promises cross the server/client boundary |
| Broad input rules adding a second search border | Shared compound search owns its outer border and focus treatment |
| Pending filter races | Latest requested Ledger scope is merged; stale query responses cannot replace the current key |
| Modal dropdown popup outside the dialog | Portal targets the nearest dialog |
| Loader/sidebar/legend and print geometry changes | Reserved geometry, data-only indicators and screen-only typography |
| Sequential access checks | Both mandatory checks start together |

## Verification and measurements

126 frontend/HTTP checks, TypeScript and production build passed. Independent source review found
no remaining confirmed correctness/security defect. Existing database read/search tests remain the
proof for the unchanged SQL; no schema or journal writes are part of this change.

Authenticated localhost HTTP checks confirmed correct headers/controls on all five initial pages,
zero financial rows in those SSR responses, successful separate JSON reads, and anonymous API 401.
For 2026-01-01 through 2026-11-05, Ledger returned 100 lines on page one and 72 on page two.

Production-mode localhost:3011 measurements use real authenticated requests, with compilation/HMR
excluded. They are HTTP/API measurements, not browser render or cache-hit timings:

| Request | Total response | Report handler timing | Result |
| --- | --- | --- | --- |
| Initial Ledger shell | 873ms | n/a | Header/controls, 0 financial rows, 37,252 bytes |
| First Ledger JSON read | 642ms | 361ms | 100 lines, 48,386 bytes |
| Three repeated fresh JSON reads | 466-951ms, median 542ms | 239-696ms | 100 lines each; client cache bypassed by the benchmark |
| Ledger page two | 458ms | 237ms | 72 lines, no next page |
| Account choices | 455ms | 216ms | 61 account metadata records |

Earlier paired backend samples measured serial access checks at 444-781ms versus 239-254ms in
parallel. Filtering the default 12-period income account arrays reduced JSON from 143,482 to
64,862 bytes without changing any financial view/analytics result.

Chrome host access is unavailable. Actual browser console, hydration/history behavior, screenshots,
responsive geometry, cached revisits and end-to-end timing remain pending. Keep the PR draft until
those checks can run. Earlier visual checks of the baseline do not certify this implementation.
