# Ledger sync webhook plan

Updated 10 November 2026 from the downloaded live [T-Chart](https://chicagobrass.sharepoint.com/:x:/r/Intranet/_layouts/15/Doc.aspx?sourcedoc=%7BF609079B-B392-421C-A170-878D5E60CD60%7D&file=T-Chart.xlsx&action=default&mobileredirect=true) and native script source.

## Runtime

Airtable or Make invokes one authenticated webhook at any time. The caller owns scheduling.
A global run lock rejects overlapping new runs with HTTP 409 and returns the active run key.
An unfinished run resumes in bounded batches using the returned requestForResume.
The existing generic writer handles recording and closed-period review; reversal remains separate.
The webhook and private checkpoint migration were deployed to DUAL ENTRY on 10 November 2026.
No schedule, posting run or Airtable write was activated.

## Read-only webhook test

Send test:true using the original x-ledger-secret. The response returns proposed table, recordId,
rule/category, debit/credit account numbers, date and signed amount per posting pair. It does not
connect to Supabase or write checkpoints/Airtable. Submit requestForResume unchanged for later
batches; every continuation retains test:true. See the worker README for the complete contract.

## Scope

47 non-deferred categories over 49 query paths: 38 fully mapped, seven working partial, two blocked partial.
Four deferred rows are excluded. The partial discount and insurance categories retain their filters
but are reported as blocked while the accounting mapping is pending.

## Query and mapping registry

Direct predicates are pushed into Airtable. Linked-record predicates first query the owning
Invoices or Invoice Lines table; the category function validates comparisons and calculates amounts.
The official trigger, field/account mapping and clarification text are in
[chart.ts](../supabase/functions/ledger-daily/rules/chart.ts). The webhook caller replaces the
workbook's schedule; invoice Create Entry checks are not required.

### Category - Expenses

| Rule / row | Category | Status | Source | Discovery path |
| --- | --- | --- | --- | --- |
| EXP-01 / 2 | Enter an operating expense invoice (ex: Utilities) | Fully | Invoices | Invoices |
| EXP-02 / 3 | Company credit-card purchase with NO vendor bill | Fully | Invoices | Payments -> Invoices |
| EXP-03 / 4 | Prepaid expense bill (pay a year up front, e.g., insurance) | Fully | Invoices | Invoices |
| EXP-04 / 5 | Prepaid expense - monthly use-up (amortization) | Fully | Prepay Expenses Log | Prepay Expenses Log |
| EXP-05 / 6 | Employee Tech Allowance | Fully | Invoices | Invoice Lines -> Invoices |
| EXP-06 / 7 | Payroll - W2 payroll register (per pay date) | Partially | Invoices | Invoice Lines -> Invoices |
| EXP-07 / 8 | Payroll - offshore / 1099 / owner staff invoice | Fully | Invoices | Invoice Lines -> Invoices |
| EXP-08 / 9 | Month-end accrual - PTO liability | Not yet | - | Excluded |
| EXP-09 / 10 | Month-end accrual - bonus & commission earned | Fully | Invoices | Invoice Lines -> Invoices |
| EXP-10 / 11 | Monthly depreciation of equipment, vehicles, fixtures | Fully | Depreciation Table | Depreciation Table |
| EXP-11 / 12 | Bank fees and charges shown only on the bank statement | Fully | Invoices | Invoices |
| EXP-12 / 13 | Bad-debt reserve (allowance) - month-end | Fully | Invoices | Invoices |
| EXP-13 / 14 | Income tax accrual (quarterly) | Fully | Invoices | Invoices |

### Category - Invoice Entry

| Rule / row | Category | Status | Source | Discovery path |
| --- | --- | --- | --- | --- |
| INV-01 / 2 | Vendor PRODUCT invoice - goods already received | Fully | Invoices | Invoices |
| INV-02 / 3 | Vendor PRODUCT invoice - price is different from the PO | Not Yet | - | Excluded |
| INV-03 / 4 | Vendor DEPOSIT invoice - billed before the goods ship | Fully | Invoices | Invoices |
| INV-04 / 5 | Vendor invoice for inbound freight / handling on a PO | Fully | Invoices | Invoices |
| INV-05 / 6 | Carrier invoice for OUTBOUND shipping to clients | Partially | Invoices | Invoices |
| INV-06 / 7 | Sales tax remittance invoice (paying the state) | Fully | Invoices | Invoices |
| INV-07 / 8 | Fixed asset purchase invoice (vehicle, fixtures, software) | Fully | Invoices | Invoices |
| INV-08 / 9 | Vendor CREDIT MEMO - returned goods (RGA return for credit) | Fully | Invoices | Invoices |
| INV-09 / 10 | Vendor CREDIT MEMO - price credit, no goods returned | Partially | Invoices | Invoices |
| INV-10 / 11 | Customer invoice for a NON-product charge | Fully | Invoices | Invoices |
| INV-11 / 12 | Customer credit memo for a RETURN | Not Yet | - | Excluded |

### Category - Payment

| Rule / row | Category | Status | Source | Discovery path |
| --- | --- | --- | --- | --- |
| PAY-01 / 2 | CUSTOMER DEPOSIT RECEIVED (before the order is processed) | Fully | Payments | Payments |
| PAY-02 / 3 | Customer payment AFTER the order shipped (credit-terms clients) | Fully | Payments | Payments |
| PAY-03 / 4 | Client OVERPAYS or pays with no invoice to apply it to | Partially | Payments | Invoices -> Payments |
| PAY-04 / 5 | Small short-pay / rounding difference written off | Fully | Payments | Payments; Invoices |
| PAY-05 / 6 | Refund to a client - by bank / check | Fully | Payments | Invoices -> Payments |
| PAY-06 / 7 | Client payment voided / bounced | Partially | Payments | Payments |
| PAY-07 / 8 | Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise) | Fully | Payments | Payments |
| PAY-08 / 9 | Pay a vendor with the company credit card | Fully | Payments | Payments |
| PAY-09 / 10 | Pay the credit-card statement | Fully | Payments | Payments |
| PAY-10 / 11 | Early-payment discount taken when paying a vendor | Blocked partial | Invoices | Invoices |
| PAY-11 / 12 | Bill paid using vendor credits (no cash) | Fully | Invoices | Invoices |
| PAY-12 / 13 | Vendor payment cancelled / returned | Partially | Payments | Payments; Payments |
| PAY-13 / 14 | Vendor sends us a refund | Fully | Payments | Payments |
| PAY-14 / 15 | Payroll - pay employees and remit taxes/deductions | Not yet | - | Excluded |
| PAY-15 / 16 | Pay offshore / 1099 / owner staff (Wise, ACH) | Partially | Payments | Invoice Lines -> Invoices -> Payments |
| PAY-16 / 17 | Loan payment (principal + interest) | Fully | Payments | Invoice Lines -> Invoices -> Payments |
| PAY-17 / 18 | Line of credit - borrow (draw) | Fully | Payments | Invoices -> Payments |
| PAY-18 / 19 | Line of credit - repay | Fully | Payments | Invoice Lines -> Invoices -> Payments |
| PAY-19 / 20 | Move money between our own bank accounts | Fully | Payments | Invoices -> Payments |
| PAY-20 / 21 | Owner distribution paid | Fully | Payments | Invoices -> Payments |
| PAY-21 / 22 | Owner puts money into the company | Fully | Payments | Invoices -> Payments |
| PAY-22 / 23 | Income tax payment | Fully | Payments | Invoices -> Payments |
| PAY-23 / 24 | Insurance claim payout received | Blocked partial | Payments | Invoices -> Payments |
| PAY-24 / 25 | Security deposit paid (lease) | Fully | Payments | Invoices -> Payments |
| PAY-25 / 26 | Interest / dividends received (Fidelity) | Fully | Invoices | Invoices |
| PAY-26 / 27 | Bank reconciliation rounding difference | Fully | Payments | Payments |
| PAY-27 / 28 | Credit-card rebate earned (cash back) | Fully | Invoices | Invoices |

## Field and account mappings

### EXP-01 - Enter an operating expense invoice (ex: Utilities)

Category - Expenses, row 2.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 006.002
- Credit = 211.100

### EXP-02 - Company credit-card purchase with NO vendor bill

Category - Expenses, row 3.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = Invoices.Linked Chart of Accounts
- Credit = 231.100

### EXP-03 - Prepaid expense bill (pay a year up front, e.g., insurance)

Category - Expenses, row 4.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 135.000
- Credit = 211.100

### EXP-04 - Prepaid expense - monthly use-up (amortization)

Category - Expenses, row 5.

- Amount = Prepay Expenses Log.Amount Deducted
- Date = Prepay Expenses Log.Applied Date
- Branch = Prepay Expenses Log.Invoices.Branch
- Debit = 007.011
- Credit = 135.000
- Notes = Prepay Expenses Log.Prepay Log

### EXP-05 - Employee Tech Allowance

Category - Expenses, row 6.

- Amount = Sum of matching Invoice Lines.Line Amount per account
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch Employee
- Debit = 005.102
- Credit = 211.100

### EXP-06 - Payroll - W2 payroll register (per pay date)

Category - Expenses, row 7.

- Amount = Sum of matching Invoice Lines.Line Amount per account
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = Invoice Lines.Chart of Accounts
- Credit = 241.100 for 005.002
- Credit = 241.200 for 005.006
- Credit = 241.400 for 005.005

### EXP-07 - Payroll - offshore / 1099 / owner staff invoice

Category - Expenses, row 8.

- Amount = Sum of matching Invoice Lines.Line Amount per account
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = Invoice Lines.Chart of Accounts
- Credit = 241.100

### EXP-09 - Month-end accrual - bonus & commission earned

Category - Expenses, row 10.

- Amount = Sum of matching Invoice Lines.Line Amount per account
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 005.201
- Credit = 241.300

### EXP-10 - Monthly depreciation of equipment, vehicles, fixtures

Category - Expenses, row 11.

- Amount = Depreciation Table.Amount Depreciated
- Date = Depreciation Table.Date
- Branch = Blank
- Debit = 009.101
- Credit = 161.000
- Notes = Depreciation Table.Associated Asset

### EXP-11 - Bank fees and charges shown only on the bank statement

Category - Expenses, row 12.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 007.002
- Credit = Invoices.Linked Payments.Account to Pay/Receive

### EXP-12 - Bad-debt reserve (allowance) - month-end

Category - Expenses, row 13.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 007.005
- Credit = 121.900

### EXP-13 - Income tax accrual (quarterly)

Category - Expenses, row 14.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 011.001 for 242.100
- Debit = 011.002 for 242.200
- Credit = Invoices.Linked Chart of Accounts (242.100 or 242.200)

### INV-01 - Vendor PRODUCT invoice - goods already received

Category - Invoice Entry, row 2.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 211.200
- Credit = 211.100

### INV-03 - Vendor DEPOSIT invoice - billed before the goods ship

Category - Invoice Entry, row 4.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 132.100
- Credit = 211.100

### INV-04 - Vendor invoice for inbound freight / handling on a PO

Category - Invoice Entry, row 5.

- Amount = Invoices.Freight
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 131.100
- Credit = 211.100

### INV-05 - Carrier invoice for OUTBOUND shipping to clients

Category - Invoice Entry, row 6.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 004.013
- Credit = 211.100

### INV-06 - Sales tax remittance invoice (paying the state)

Category - Invoice Entry, row 7.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 212.100
- Credit = 211.100

### INV-07 - Fixed asset purchase invoice (vehicle, fixtures, software)

Category - Invoice Entry, row 8.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 143.300
- Credit = 211.100

### INV-08 - Vendor CREDIT MEMO - returned goods (RGA return for credit)

Category - Invoice Entry, row 9.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 211.100
- Credit = 131.400

### INV-09 - Vendor CREDIT MEMO - price credit, no goods returned

Category - Invoice Entry, row 10.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 211.100
- Credit = 004.010

### INV-10 - Customer invoice for a NON-product charge

Category - Invoice Entry, row 11.

- Amount = Invoices.Invoice Amount
- Date = Invoices.Invoice Date
- Branch = Invoices.Branch
- Debit = 121.100
- Credit = 010.001

### PAY-01 - CUSTOMER DEPOSIT RECEIVED (before the order is processed)

Category - Payment, row 2.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Payments.Account to Pay/Receive
- Credit = 221.100

### PAY-02 - Customer payment AFTER the order shipped (credit-terms clients)

Category - Payment, row 3.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Payments.Account to Pay/Receive
- Credit = 121.100

### PAY-03 - Client OVERPAYS or pays with no invoice to apply it to

Category - Payment, row 4.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Payments.Account to Pay/Receive
- Credit = 221.300

### PAY-04 - Small short-pay / rounding difference written off

Category - Payment, row 5.

- Amount = Payments.Overpaid Amount (overpaid) or Invoices.Invoice Remaining Balance (underpaid)
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 007.002
- Credit = 121.100

### PAY-05 - Refund to a client - by bank / check

Category - Payment, row 6.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 221.100
- Credit = Payments.Account to Pay/Receive

### PAY-06 - Client payment voided / bounced

Category - Payment, row 7.

- Amount = Payments.Amount
- Date = Payments.Payment Cancelled Date
- Branch = Invoices.Branch
- Debit = 221.100 when either date is empty or Payment Date <= first ship date, otherwise 121.100
- Credit = Payments.Account to Pay/Receive

### PAY-07 - Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise)

Category - Payment, row 8.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 211.100
- Credit = Payments.Account to Pay/Receive

### PAY-08 - Pay a vendor with the company credit card

Category - Payment, row 9.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 211.100
- Credit = 231.100

### PAY-09 - Pay the credit-card statement

Category - Payment, row 10.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 231.100
- Credit = Payments.Account to Pay/Receive

### PAY-10 - Early-payment discount taken when paying a vendor

Category - Payment, row 11.

- Amount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 211.100
- Credit = Pending

### PAY-11 - Bill paid using vendor credits (no cash)

Category - Payment, row 12.

- Amount = Invoices.Credits Applied
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 211.100 (bill)
- Credit = 211.100 (source credit invoice)

### PAY-12 - Vendor payment cancelled / returned

Category - Payment, row 13.

- Amount = Payments.Amount
- Date = Payments.Payment Cancelled Date (cancelled) or Payments.Payment Date (returned)
- Branch = blank
- Debit = 112.100
- Credit = 211.100

### PAY-13 - Vendor sends us a refund

Category - Payment, row 14.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Payments.Account to Pay/Receive
- Credit = 211.100

### PAY-15 - Pay offshore / 1099 / owner staff (Wise, ACH)

Category - Payment, row 16.

- Amount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 241.100 for line accounts 005.101 / 005.003 / 005.001 / 005.002
- Debit = 241.200 for line account 005.006
- Debit = 241.400 for line account 005.005
- Credit = Payments.Account to Pay/Receive

### PAY-16 - Loan payment (principal + interest)

Category - Payment, row 17.

- Amount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Invoice Lines.Chart of Accounts (232.100 or 007.003)
- Credit = Payments.Account to Pay/Receive

### PAY-17 - Line of credit - borrow (draw)

Category - Payment, row 18.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Payments.Account to Pay/Receive
- Credit = 231.200

### PAY-18 - Line of credit - repay

Category - Payment, row 19.

- Amount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Invoice Lines.Chart of Accounts (231.200 or 007.003)
- Credit = Payments.Account to Pay/Receive

### PAY-19 - Move money between our own bank accounts

Category - Payment, row 20.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Payments.Account to Pay/Receive
- Credit = Invoices.Linked Chart of Accounts

### PAY-20 - Owner distribution paid

Category - Payment, row 21.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 316.100
- Credit = Payments.Account to Pay/Receive

### PAY-21 - Owner puts money into the company

Category - Payment, row 22.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Payments.Account to Pay/Receive
- Credit = 311.200

### PAY-22 - Income tax payment

Category - Payment, row 23.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Invoices.Linked Chart of Accounts (242.100 or 242.200)
- Credit = Payments.Account to Pay/Receive

### PAY-23 - Insurance claim payout received

Category - Payment, row 24.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = Pending
- Credit = 122.100

### PAY-24 - Security deposit paid (lease)

Category - Payment, row 25.

- Amount = Payments.Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 143.200
- Credit = Payments.Account to Pay/Receive

### PAY-25 - Interest / dividends received (Fidelity)

Category - Payment, row 26.

- Amount = Invoices.Invoice Amount
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 112.200
- Credit = 010.003

### PAY-26 - Bank reconciliation rounding difference

Category - Payment, row 27.

- Amount = Payments.Reconciled Amount Discrepancy
- Date = Payments.Reconciliation Date - Combined
- Branch = blank
- Debit = 007.002
- Credit = Payments.Account to Pay/Receive

### PAY-27 - Credit-card rebate earned (cash back)

Category - Payment, row 28.

- Amount = Invoices.Purchased Discounts & Rebate Total
- Date = Payments.Payment Date
- Branch = Invoices.Branch
- Debit = 231.100
- Credit = 004.011

## Activation decisions and retained limits

- Choose the historical/go-live scope. Existing empty markers include historical data.
- Configure journal metadata on depreciation/prepaid tables or approve Supabase-only tracking. Those two tables currently remain preview-only.
- Resolve Payment row 11 discount credit and Payment row 24 insurance debit/account mapping, or leave them blocked.
- Confirm the latest-eligible-Sent-payment date for invoice-owned Payment rules PAY-04, PAY-11, PAY-25 and PAY-27.
- Existing overlapping chart categories remain possible; cross-category deduplication is not inferred.
- Payroll/loan partial payments still use the chart's full matching invoice-line totals. No new allocation was invented.
- An already-posted category does not automatically add new account components after source edits. Use the correction workflow.
- The checkpoint migration and webhook are deployed. Authorize scheduler activation and cut over old posting automations while retaining reversal.
- A single linked source graph must fit the per-call read budget.

See the [worker README](../supabase/functions/ledger-daily/README.md) for the request/resume contract and read-only inspection command.
