# Statement grouping reference

Compared against `mae/testing` commit `e6c2956` on 2026-11-06. The source files
`lib/reports/income-statement.ts` and `lib/reports/balance-sheet.ts` define the reference table.
That branch uses workbook data and older P&L account codes. This app uses the live ledger
catalog and posted balances; it does not copy workbook amounts or restore branch/forecast data.

| Area | Aligned presentation |
| --- | --- |
| Income Statement | Revenue, cost of goods sold, gross profit, operating expenses, operating income, other income (expense), pretax income |
| Operating expenses | Personnel, Occupancy, Finance and administrative, Technology, General operating |
| Other income (expense) | One net group for other revenue, interest expense and other-expense accounts; expense debits reduce the total |
| Current assets | Cash, trade receivables net of allowance, other receivables, inventory, prepayments |
| Property and equipment | Separate cost and accumulated-depreciation groups, followed by the net subtotal |
| Other assets | Deposits and remaining asset accounts |
| Liabilities | Current and long-term blocks with subtotals; 231.200 is current and 232.* follows the reference's long-term grouping |
| Current liabilities | Payables, customer funds, sales taxes, accrued payroll, other current liabilities including cards and income-tax accruals |
| Equity | Equity accounts, prior unclosed earnings, current-year earnings, total equity and total liabilities plus equity |

The current app retains income taxes and net income below pretax income. The reference stops at
pretax income because its workbook has no tax provision. Current-year earnings remain net income,
and prior unclosed earnings remain explicit, so the live Balance Sheet keeps its existing tie-out.

No account or amount is removed. Unknown account families retain fallback groups. The current
catalog calls 999.999 an asset; it stays in assets even though the older reference placed suspense
under liabilities. Catalog types remain authoritative. Loan maturity is not inferred from dates;
232.* follows the reference presentation without splitting a current portion.

Detail and Summary use the same cents totals. Grouping regression checks verify section order,
contra signs, loan and tax placement, preservation of a real imbalance, and exactly one occurrence
of every reference-catalog account across the two detailed statements.

Browser visual comparison remains pending because Chrome's browser access host was unavailable.
