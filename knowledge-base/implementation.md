# Application and integration architecture

## Data flow

```text
FIN native event -> category handlers -> posting pairs + references
    -> ledger-payment Edge Function -> atomic journal_entries + journal_lines
    -> user-scoped report reads -> report builders -> tables, analytics and drawers
```

Airtable owns classification, account pairs and component calculations. The Edge Function is a
generic authenticated writer. The frontend reads posted data and never repairs source records.

## Runtime and source map

The app uses Next.js App Router, React, TypeScript and Supabase SSR clients. Vercel serves the app;
`vercel.json` selects `pdx1`. `package.json` and the lockfile define dependency versions.

| Source | Responsibility |
| --- | --- |
| `airtable/*.js` | Native automation scripts, category handlers, reads and webhook transport |
| `supabase/functions/ledger-payment/` | HTTP authorization, validation and transactional persistence |
| `supabase/migrations/`, `supabase/seed.sql` | Schema history and reference catalogs |
| `middleware.ts`, `lib/supabase/` | Session validation, approved-user access and scoped clients |
| `lib/reports/report-session.ts` | Request-scoped verified JWT context and fresh RLS reads |
| `components/ReportApplication.tsx` | URL-driven selection of the active report workspace |
| `components/ReportNavigation.tsx` | Financial navigation, refresh and progress |
| `lib/reports/report-routes.ts` | Validated options and canonical JSON request keys |
| `components/ReportData.tsx`, `lib/reports/report-data-client.ts` | Private per-user cache and shared requests |
| `lib/reports/statement-loaders.ts`, `statement-data.ts` | Batched reads and local view construction |
| `lib/reports/income-statement.ts`, `balance-sheet.ts`, `analytics.ts` | Grouping, totals and comparisons |
| `components/StatementWorkspace.tsx`, `LedgerWorkspaces.tsx` | Headers, controls, loading and report panels |
| `components/ReportView.tsx`, `LedgerTable.tsx`, `PostingRulesTable.tsx` | Tables and exports |
| `components/FilterControls.tsx`, `SearchableSelect.tsx`, `DismissibleMenu.tsx` | Shared accessible controls |
| `components/AccountDrawer.tsx`, `DetailDrawer.tsx`, `JournalEntryDrawer.tsx` | Account activity and full journals |
| `lib/reports/export-excel.ts`, `lib/format.ts` | Export and currency formatting |

## Routes and access

`/` is the public sign-in landing; authenticated visitors continue to `/income-statement`.
`/login` redirects to `/`. Microsoft sign-in is configuration-controlled. Signup and custom
attempt/cooldown rules are not implemented. `/account` contains password changes.

Protected report routes are `/income-statement`, `/balance-sheet`, `/trial-balance`,
`/general-ledger` and `/t-chart`. Middleware validates the live user and `current_app_role` in
parallel; both must succeed. Report reads also verify JWT claims and execute with the user's RLS
context. No server/service secret is used by report clients.

## Rendering and requests

The report layout owns one persistent client application. Financial page files provide metadata
and return null. Initial rendering supplies headers, controls and a loading indicator; financial
rows are fetched separately. Financial links use Next's patched native history so the URL and
destination controls change without waiting for report data. Other routes use the Next router.

| Endpoint | Read |
| --- | --- |
| `/api/reports/data` | Income, balance, trial, ledger, rules or account metadata |
| `/api/reports/account-activity` | Independent summary and lines for a selected account/range |
| `/api/reports/journal-entry?entry=<number>` | One posted entry and every associated journal line |

APIs authenticate before reads, return sanitized errors and use `private, no-store`. Successful
report JSON lives in a private layout cache for five minutes, up to 32 ready keys. In-flight reads
are shared; errors are not cached. Refresh, sign-out and account changes invalidate the cache.
Server financial reads remain uncached. Stale responses cannot overwrite newer filter state.

View and Summary/Details changes build from the loaded statement window without another read.
Date, Ledger account/offset/side/search and page parameters change the request key. Ledger search
commits on Enter or blur. Account-choice metadata loads independently of Ledger lines.

## Reports and interaction

The report header uses the shared navy with light navigation, refresh and account controls. Its
active-route underline sits below the link text. The header's white transparent logo preserves the
official mark's alpha exactly; exports retain the original dark logo for white pages.

- Income Statement uses selected full months and monthly, quarterly or annual columns. It includes
  revenue, COGS, gross profit, operating groups, net other income/expense, taxes and net income.
- Balance Sheet uses cumulative snapshots and classified asset/liability blocks. Each column has
  its own prior-year earnings baseline. Annual columns are snapshots, never summed.
- Trial Balance preserves all-account totals while filtering visible account rows.
- General Ledger uses 100 lines per page and one lookahead, sorted by date, entry and line number.
  `filter_ledger` applies global search, account/offset, side, account type, T-Chart rule and inclusive
  line-amount limits before pagination. The thin footer shows the displayed range and the full
  matching line count. `count_ledger` runs independently with the same filters; its private client
  cache key excludes page number. Search includes journal entry numbers. Account/category metadata
  loads independently; the Filters menu owns transaction category and minimum/maximum amounts.
  URLs and pagination preserve every active scope. Split offsets render one account pill per line
  using the returned offset codes and existing account catalog, without another data request.
  Account names stay on one line with ellipsis and a full-name hover title.
- T-Chart renders reference rules and plain account pills. Trial Balance accounts link to Ledger.

Search comes first, followed by period/as-of, account type where available, account/offset and
view controls. General Ledger keeps entry side last. Trial Balance always includes zero accounts
and has no activity toggle. Date menus share a responsive width, one row of quick presets above
the date fields, and consistent input spacing. Filters sit together at the left; centered reset
actions sit at the right. Statements have a
text-only Filters menu beside Reset. Outside pointer/focus and Escape dismiss menus. Searchable
lists remain inside their owning menu or modal. Table and analytics scrolling stay inside the
viewport; narrow layouts wrap/stack and print expands tables into document flow.
The statement analytics sidebar collapses to a thin rail using its top left-border toggle. The
table takes the freed width; expanding restores the selected Position or Movement tab.

Statement accounts open account activity: summary/lines start in parallel, with independent errors
and an owning-report cache. Lines are capped at 2,000 and disclose truncation; totals cover the
whole range. Ledger rows instead open the complete journal entry, unaffected by report filters.
Both drawers inherit the shared responsive 640px width and modal focus/dismissal behavior.

The journal drawer contains Entry details (source, table, record, date, transaction type), Journal
lines (account, debit, credit, source icon) and Posting information (rule, created/posted dates,
journal ID). Detailed line references remain in read data but are hidden. Header/table borders
remain; section separators and routine balanced captions are absent. Vertical wheel movement over
the table chains into the drawer; horizontal movement stays in the table.

## Local setup

Run `npm ci`, then `npm run dev -- --port 3010`; use `http://localhost:3010`.
`npm run build` and `npm start -- --port 3011` provide production-mode verification. Build in an
isolated directory or stop the owning dev process first: concurrent builds must not replace its
`.next` output. Keep credentials in approved local/runtime storage, never committed files.

`lib/supabase/config.ts` defines public defaults and these overrides:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN`, `NEXT_PUBLIC_ENABLE_MICROSOFT_LOGIN`.
Public configuration does not bypass authentication, the allowlist or RLS.
