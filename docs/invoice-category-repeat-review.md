# Invoice category repeat and overlap review

Reviewed 7 November 2026 against the final Expense / Invoice Entry workbook and current handlers.
This is a rule review with seven synthetic native-script scenarios, not a historical run audit.

## Categories that can become eligible later

| Category | Later change |
| --- | --- |
| Invoice Entry row 4 to row 2 | A confirmed, unreceived PO later has receipts and Total Received Not Yet Invoiced becomes positive. Receipt alone does not guarantee the second condition. |
| Expense row 3 | Payment Invoice Status becomes Fully Paid and linked payments include credit-card clearing 231.100. |
| Expense row 12 | Bank-fee invoice becomes Fully Paid and linked payments identify a supported bank. |
| Expense rows 6/7/8/10 | New staff invoice lines can add a category or an account component after an earlier evaluation. Finalization before first posting limits this case. |

## Simultaneous matches

- Invoice Entry row 2 or row 4 can match alongside row 5 freight.
- W2 payroll and bonus lines can match Expense rows 7 and 10 together.
- W2 salary, payroll tax and 401k create separate account journals within Expense row 7.
- Prepaid Utilities can match Expense rows 2 and 4.
- A carrier invoice can match Invoice Entry row 6 and Expense row 3 once fully paid by card.

## Accounting and lifecycle questions retained for later

- Multiple filter matches do not automatically establish distinct financial events. Product amounts
  may already include the Freight amount posted separately by Invoice Entry row 5.
- Carrier Invoice Entry row 6 and Expense row 3 can both debit freight expense for Invoice Amount.
  Confirm whether that combination is intended before broad automatic reposting.
- An AP credit gaining a PO link changes its classification from Invoice Entry row 10 to row 9.
  This can be a correction rather than a second financial event.
- A completed category can gain another account component if lines are added later. A single
  invoice-level or category-level processed checkbox cannot safely represent every such change.
- Stable invoice IDs, category codes and account component keys establish journal identity.
- Most remaining categories are classification-based and do not become eligible merely because
  another day passes. Recurring monthly/quarterly labels do not authorize reposting the same invoice.

## Scope

No production records or category definitions were changed by this review. A nightly scheduler,
change queue, cancellation/reversal policy and processed-state design remain proposals.
