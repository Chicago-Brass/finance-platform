# Ledger-backed financial reports

Income Statement and Balance Sheet on `main` use authenticated server-side Supabase reads.
The existing Report/ReportLine contract, report renderer and exports remain shared. They no longer
import PL_2026 or BS_BALANCES. Those historical workbook files are retained as references, not runtime sources.

Current testing checks that all report pages represent the existing database records correctly:
queries, field mappings, account groupings, totals and filters. Airtable synchronization and
reconciling the database to the company's complete books are outside this work.

## Report workspace

The local redesign keeps the horizontal header, date filters and view controls visible in a
full-viewport desktop layout. The table scrolls inside its card, with fixed column headings and
account labels. The dark analytics sidebar fills the remaining workspace height and scrolls
independently. Narrow layouts stack the report and analytics; print returns to document flow.

Date presets and custom periods retain GET query parameters. Column modes and Summary/Details
are separate from the date filters and Excel/PDF actions. Account search, zero-row visibility and
collapse controls affect the visible rows; financial totals and sidebar calculations still describe
the selected report period.

The dark sidebar has Position and Movement tabs:

- Balance Sheet Position shows total assets, liabilities/equity funding mix and cash as a share of
  assets. Income Statement Position shows revenue, operating-expense composition and net margin.
- Composition charts require nonnegative values and a positive total. Signed or empty balances
  remain visible as values instead of misleading chart slices. A zero denominator shows `N/A`.
- Balance Sheet Movement compares assets, liabilities and equity with the previous quarter-end.
  Income Statement Movement compares revenue, operating expenses and net income with the same
  selected months in the previous year. Trends use the report's dated snapshots or periods.

## Account drill-down drawer

Clicking an account row on the Income Statement or Balance Sheet opens a
slide-over drawer above the page. It is separate from the analytics sidebar and closes with
Escape, its close button or a click on the dimmed backdrop; focus returns to the row. The drawer
holds no URL state, so View/Display parameters are unaffected. Statement drawers step to the
previous or next account in report order.

The `/api/reports/account-activity` GET endpoint runs as the signed-in user. The browser requests
`section=summary` and `section=lines` concurrently; either can render before the other. Totals use
one batched trial-balance call for current/prior dates. Lines read account-filtered `v_ledger` in
500-row pages, up to the existing 2,000-line cap. Each section has its own loading indicator and retry.
The owning report caches successful sections until refresh/data or range changes; errors and
aborted results are not cached. Totals always cover every line; a capped list says so. Ranges:

- Income Statement and General Ledger use the selected dates (`period` mode). The comparison is
  the same dates one year earlier.
- Balance Sheet uses January 1 of the as-of year through the as-of date (`balance` mode), with the
  cumulative opening balance at the previous day and the resulting closing balance.

Amounts in the drawer follow the account's normal balance (debit-normal accounts count debits as
positive), with debits and credits shown separately. A statement can present the same account
with a different sign, such as interest below operating income. The analytics show the monthly net and
the offsetting-account mix. Search, month, offsetting-account and debit/credit filters apply to the
loaded lines, and the footer totals the filtered lines. "Lines tie to the trial balance" appears
only when the unfiltered lines add up to the trial-balance debits and credits.

All report headings use one row for the title, divider and entity description. Date filters carry
the dates without duplicate Trial Balance or General Ledger captions. Monthly/quarterly/annual
statement columns use month names, Q1-Q4, or years; partial Balance Sheet snapshots retain their
exact as-of date inline in the compact heading. Analytics use compact, right-aligned values.

Financial links and GET filters update the URL through Next's native history integration. One
persistent client report application selects the destination header and controls immediately,
then fetches its financial data from `/api/reports/data`. SSR sends controls and a data indicator;
financial page files contain metadata, not pending financial reads. Non-financial routes continue
using the Next router. Only table/analytics panels load, and exports wait for ready data.

View (Monthly/Quarterly/Annual/As of) and Display (Summary/Details) switches reuse loaded statement
data. Their request keys exclude display choices. Dates and Ledger account/offset/side/search/page
choices change the JSON request key. Search commits on Enter or blur, not per keystroke; the Ledger has no separate Search button.
Period, Filters and account menus dismiss on outside pointer or focus and on Escape. Searchable
popups stay inside their owning menu or drawer so selecting an option does not dismiss its parent.

Successful responses live in a private per-user/layout cache for five minutes, up to 32 ready keys.
In-flight reads are shared. Refresh data invalidates that cache; sign-out or account changes clear
it. API/ledger reads are not cached on the server, so cache misses read fresh posted data. The
Ledger account-choice request runs independently in parallel and is reused across filter changes.
All API reads require session validation, the allowlist and RLS. Failed requests are not cached.

Both reports and their Excel/PDF outputs show currency symbols, two decimal places, `$0.00` zeros
and parentheses for negative amounts. Missing values remain distinct from zero. General Ledger
and Trial Balance use the same cents formatter and combine account codes/names in pills. Exports use the currently visible
rows; print hides the navigation, filters, view controls and analytics sidebar.

The earlier UI baseline was consolidated on main and visually reviewed in the Jeric Chrome profile.
Those checks precede the current shared-control changes, whose browser verification is pending.
Desktop checks at 1920x1080, 1710x895 and 1440x900 verified viewport fit and
independent table/sidebar scrolling. A 390x844 check verified the stacked narrow layout without
page overflow. Print media expands the table and hides the sidebar instead of clipping content.

## Data and periods

Statement loaders (`lib/reports/statement-loaders.ts`) make one batched trial-balance call and one
posted-entry count per data window. `get_trial_balances` materializes posted activity once and
aggregates all requested ranges from it. Its results are regression-checked against individual
`get_trial_balance` calls. On older databases without the batched function, the app falls back to one
`get_trial_balance` call per range.

The report shell and data fetch have separate lifecycles. There is no placeholder route shell
and no retained previous-page controls. `ReportApplication` keys each destination by pathname;
`ReportDataPanel` owns loading, error and retry UI. Shared filter components place labels just
above their controls. Cold financial navigation needs no server route/RSC request; it fetches only
the active data key if that key is missing from the private cache.
General Ledger's date/account filters share one desktop row; quick dates are inside its period picker.
Account dropdown choices read `accounts` metadata without calculating a cumulative trial balance.
The header uses the tightly cropped 250 x 78 official site logo at 2x display density.

`vercel.json` places server functions in `pdx1`, matching the database's Oregon (`us-west-2`) region.
Middleware runs live `getUser` and allowlist validation concurrently and requires both. Report reads verify the JWT using
`getClaims`, whose signing-key cache avoids the duplicate Auth lookup. RLS remains active.

Read-only `EXPLAIN ANALYZE` samples as an approved authenticated user on 2026-11-05:

| Query | Previous | Optimized |
| --- | --- | --- |
| 12 statement periods | 26.5 ms | 16.0 ms |
| One account's ledger page | 8.8 ms | 5.0 ms |

These are SQL execution samples on the current small dataset, not end-to-end browser timings.
Before/after digests of all visible ledger rows and selected statement snapshots match exactly.
The migration changes read plans only; no journal records, amounts or permissions are rewritten.

- Income Statement reads one trial balance per calendar month in the selected range, plus the
  prior-year comparison period, all in a single `get_trial_balances` call. Quarterly and annual columns, and the Total column, are sums of those
  disjoint months in integer cents, built in the browser (`lib/reports/statement-data.ts`).
- The default is the current Chicago calendar year, January through the current calendar month.
  Month selections include the whole selected month. Past/future years and different ranges are explicit choices.
- Every amount is a posted ledger actual. There is no September cutoff or implied forecast.
- Balance Sheet reads, once per as-of date, every cumulative snapshot any View needs: year-to-date
  month ends, the selected date, the three prior December 31 baselines and the analytics comparison
  and trend dates, in a single `get_trial_balances` call. Each View then selects its columns from
  that set in the browser. Columns end
  exactly on the selected date. Its default as-of date is today in Chicago.
- Annual Balance Sheet displays the preceding two December 31 snapshots and the exact selected
  as-of date. Columns are independent balances, never summed. Each column uses its own previous
  December 31 earnings baseline, so annual comparisons do not share an incorrect current-year baseline.
- Prior-year unclosed earnings are the revenue/expense balances at the previous December 31.
  Current-year earnings are their movement since that date. Existing posted equity is included separately.
- Report builders aggregate integer cents and only convert to dollar numbers for the renderer/export contract.
  Database amounts remain numeric; display formatting does not change stored amounts.
- Counts and trial-balance errors fail the request rather than being shown as valid zero totals.

## Income Statement mapping

Account codes/names come from the live chart of accounts. Accounts are not filtered by the active label.

| Accounts | Report group | Amount direction |
| --- | --- | --- |
| Revenue, except other_income | Revenue | Credits minus debits; returns reduce revenue |
| Expense subtype cogs or contra_cogs | Cost of goods sold | Debits minus credits; purchase discounts reduce cost |
| Expense subtype payroll | Personnel | Debits minus credits |
| Other operating expense codes 006.* | Occupancy | Debits minus credits |
| Other operating expense codes 007.*, except 007.003 | Finance and administrative | Debits minus credits |
| Other operating expense codes 008.* | Technology | Debits minus credits |
| Remaining operating expenses, including depreciation | General operating | Debits minus credits |
| Revenue subtype other_income | Other income (expense) | Credits minus debits |
| 007.003 Interest Expense and expense subtype other_expense | Other income (expense), below operating income | Credits minus debits, shown as a reduction |
| Expense subtype income_tax | Income taxes | Debits minus credits |

Gross profit = net revenue - net COGS. Operating income subtracts operating expenses.
Pretax income adds net other income (expense), including signed interest expense. Net income subtracts income taxes.
Unknown subtypes remain in the relevant broad account-type group rather than being omitted.

## Balance Sheet mapping

| Live accounts | Report group |
| --- | --- |
| Asset subtype bank, plus 121.200 payments in transit | Current assets / Cash and cash equivalents |
| Asset subtype receivable, plus 121.900, excluding 122.* | Current assets / Accounts receivable, net |
| Asset 122.* | Current assets / Other receivables |
| Asset subtype inventory | Current assets / Inventory |
| Asset subtype prepaid | Current assets / Prepaid expenses and deposits |
| Asset subtype fixed_asset | Property and equipment / At cost |
| Asset 161.000 | Property and equipment / Accumulated depreciation |
| Asset 143.200 security deposits | Other assets / Deposits |
| Remaining assets, including suspense | Other assets / Other asset accounts |
| Liability subtype payable | Current liabilities / Accounts payable |
| Liability subtype customer_funds | Current liabilities / Customer deposits and credits |
| Liability subtype tax_payable, excluding 242.* | Current liabilities / Sales tax payable |
| Liability subtype accrued_payroll | Current liabilities / Accrued payroll and benefits |
| Liability subtype credit_card, 231.200 and 242.* | Current liabilities / Other current liabilities |
| Liability 232.* | Long-term liabilities / Notes and loans payable |
| Remaining liabilities | Other liabilities, outside the maturity subtotals |
| All equity accounts | Stockholders' equity / Equity accounts |

Assets use debits minus credits, so allowances/depreciation reduce them. Liabilities/equity use
credits minus debits, so shareholder distributions reduce equity. These blocks follow the
`mae/testing` account-family presentation; 232.* is shown as long-term rather than calculating a
current portion. Maturity dates are not supplied by the schema. Unrecognized liability families
stay visible outside the maturity subtotals. Each account is included once, and both sides
reconcile in cents, including the separate prior/current earnings lines.

See [reference grouping review](statement-grouping-review.md) for the comparison with `mae/testing`.

## Full journal entry drawer

Clicking any General Ledger row opens its complete posted journal entry. Enter and Space on a
focused row do the same; the audit link opens its source independently. Trial Balance account
links still navigate to the account-filtered Ledger. T-Chart account pills are plain references.

`/api/reports/journal-entry?entry=<number>` validates a positive safe entry number and uses the
signed-in user's RLS session. It reads one posted `journal_entries` header and every associated
`journal_lines` record in line order, in 500-line pages. Account names come from the account FK.
The query applies no report date, account, side or search filter. No schema change is required.

The drawer uses a single-row header with an icon source link, followed by Entry details, Journal
lines and Posting information. Entry details contains source system, source table/record, date
and transaction type. Posting information contains rule, created/posted timestamps and journal ID.
Event/user labels and separators between sections are hidden. The header divider and table
borders remain visible. The line table shows only Account, Debit, Credit and an icon source link. Detailed line reference
fields remain in the read data but are hidden in this view. The journal drawer inherits the same
640px responsive width as the statement account drawer.
Long cells clamp to two visible lines with full values retained in text/tooltips. The selected
line stays highlighted; normal balanced entries have no extra balance caption. Only a real totals
mismatch shows a warning. Vertical scrolling over the table chains to the drawer; horizontal
scrolling stays inside the table. The existing private report cache shares successful reads for five
minutes and clears them on refresh/sign-out/account change. Both journal and account drawers use
`DetailDrawer` for outside-pointer/Escape dismissal, focus trapping and focus restoration.

## Deferred branch attribution

The initial baseline includes nullable text journal_lines.branch,
with no default or backfill. All 192 existing lines remained NULL after application. The Edge
writer and UI do not assign, filter or populate branches yet. Existing RLS and financial guards
are unchanged. Report readers include accounts regardless of their active label. Branch metadata
does not change posting behavior.

## Verification and limits

Run `node --test components/*.test.cjs lib/reports/*.test.cjs` and `npm run typecheck`.
The focused checks cover report grouping and signs, cents and exports, prior/current earnings,
annual snapshots, analytics comparisons, signed-chart fallbacks, date presets, query preservation,
and visible-row filtering. Browser layout and interaction checks are separate from these tests.
The 41 focused checks and TypeScript check pass. Live browser checks also cover analytics tabs,
search and zero-row filtering without changing totals, annual Balance Sheet reconciliation and
preserved date/view selections. The browser Excel download timed out; workbook contents and
currency formats are covered by the export test. The native PDF dialog was not exercised.

General Ledger reads posted lines from v_ledger within the inclusive selected date range,
100 records per page with a single lookahead record to determine Next availability. Sorting by
date, entry number and line number gives stable page ordering. Date changes reset to page one.
Account, offset, search and side filters are URL parameters (`account`, `offset`, `q`, `side`)
applied before pagination. Search commits on Enter or blur, rather than every keystroke.
`search_ledger` uses bound literal substring matching, including punctuation; `%` and `_` are not
wildcards. Date changes and pagination preserve scope. Rapid changes merge with the latest pending
scope, so an earlier response cannot discard a newer selection. The offsetting filter excludes
entries split across several offsetting accounts. Totals include the loaded page, not the whole
date range. Trial Balance reads cumulative get_trial_balance
through the selected as-of date. T-Chart displays v_t_chart rule metadata rather than journal activity: one table grouped by
category, with client-side category and text filters. An exact `Name (000.000)` debit/credit
reference becomes an account link into the General Ledger; alternatives and descriptions stay
as written. Trial Balance account pills link to the General Ledger the same way.

Validation uses the current database dataset. Importing history, changing posting rules and
reconciling Airtable records are not prerequisites or next steps for this frontend work.
