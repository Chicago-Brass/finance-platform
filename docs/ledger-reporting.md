# Ledger-backed financial reports

Income Statement and Balance Sheet on `develop` use authenticated server-side Supabase reads.
The existing Report/ReportLine contract, report renderer and exports remain shared. They no longer
import PL_2026 or BS_BALANCES. Those historical workbook files are retained as references, not runtime sources.

Current testing checks that all report pages represent the existing database records correctly:
queries, field mappings, account groupings, totals and filters. Airtable synchronization and
reconciling the database to the company's complete books are outside this work.

## Data and periods

- Income Statement reads get_trial_balance for each requested calendar month, quarter or year.
  At most twelve period reads run in parallel. Monthly/quarterly Total columns sum those disjoint periods.
- The default is the current Chicago calendar year, January through the current calendar month.
  Month selections include the whole selected month. Past/future years and different ranges are explicit choices.
- Every amount is a posted ledger actual. There is no September cutoff or implied forecast.
- Balance Sheet reads cumulative trial balances at the as-of date, or each selected year-to-date
  month/quarter end, ending exactly on the selected date. Its default as-of date is today in Chicago.
- Prior-year unclosed earnings are the revenue/expense balances at the previous December 31.
  Current-year earnings are their movement since that date. Existing posted equity is included separately.
- Report builders aggregate integer cents and only convert to dollar numbers for the renderer/export contract.
  Database amounts remain numeric. Whole-dollar screen formatting does not change the underlying report amounts.
- Counts and trial-balance errors fail the request rather than being shown as valid zero totals.

## Income Statement mapping

Account codes/names come from the live chart of accounts. Accounts are not filtered by the active label.

| Accounts | Report group | Amount direction |
| --- | --- | --- |
| Revenue, except other_income | Revenue | Credits minus debits; returns reduce revenue |
| Expense subtype cogs or contra_cogs | Cost of goods sold | Debits minus credits; purchase discounts reduce cost |
| Expense subtype payroll | Personnel | Debits minus credits |
| Other operating expense codes 006.* | Occupancy | Debits minus credits |
| Other operating expense codes 007.*, except 007.003 | Finance and administration | Debits minus credits |
| Other operating expense codes 008.* | Technology | Debits minus credits |
| Remaining operating expenses, including depreciation | Other operating expenses | Debits minus credits |
| Revenue subtype other_income | Other income | Credits minus debits |
| 007.003 Interest Expense | Interest expense below operating income | Credits minus debits, shown as a reduction |
| Expense subtype income_tax | Income taxes | Debits minus credits |

Gross profit = net revenue - net COGS. Operating income subtracts operating expenses.
Pretax income adds other income and signed interest expense. Net income subtracts income taxes.
Unknown subtypes remain in the relevant broad account-type group rather than being omitted.

## Balance Sheet mapping

| Live accounts | Report group |
| --- | --- |
| Asset subtype bank | Cash and cash equivalents |
| Asset subtype receivable, plus 121.900 | Receivables, net |
| Asset subtype inventory | Inventory |
| Asset subtype prepaid | Prepayments and vendor deposits |
| Asset subtype fixed_asset, plus 161.000 | Property and equipment, net |
| Remaining assets, including suspense | Other assets |
| Liability subtype payable | Accounts payable |
| Liability subtype customer_funds | Customer deposits and credits |
| Liability subtype tax_payable | Taxes payable |
| Liability subtype accrued_payroll | Accrued payroll and benefits |
| Liability subtype credit_card | Credit card payable |
| Liability subtype debt | Loans and credit facilities |
| Remaining liabilities | Other liabilities |
| All equity accounts | Equity accounts |

Assets use debits minus credits, so allowances/depreciation reduce them. Liabilities/equity use
credits minus debits, so shareholder distributions reduce equity. Debt maturity is not supplied
by the schema, so the report does not invent current-versus-long-term allocations. Both sides
reconcile in cents, including the separate prior/current earnings lines.

## Deferred branch attribution

The live migration 20261103214849_add_journal_line_branch adds nullable text journal_lines.branch,
with no default or backfill. All 192 existing lines remained NULL after application. The Edge
writer and UI do not assign, filter or populate branches yet. Existing RLS and financial guards
are unchanged. Report readers include accounts regardless of their active label. Branch metadata
does not change posting behavior.

## Verification and limits

Run `node --test lib/reports/reporting.test.cjs` and `npm run typecheck`.
The focused checks cover contra accounts, signs, cents, totals, unknown-account coverage,
prior/current earnings, date defaults, leap years and partial periods. Live verification compares
report-builder outputs against independent journal-line SQL and the authenticated local pages.
Browser comparisons also matched all 61 Trial Balance accounts at two as-of dates, all 64/128
General Ledger lines for 2025/2026, and all 58 T-Chart rules and their displayed fields.

General Ledger reads posted lines from v_ledger within the inclusive selected date range,
limited to the 1,000 lines stated on the page. Trial Balance reads cumulative get_trial_balance
through the selected as-of date. T-Chart displays v_t_chart rule metadata rather than journal activity.

Validation uses the current database dataset. Importing history, changing posting rules and
reconciling Airtable records are not prerequisites or next steps for this frontend work.
