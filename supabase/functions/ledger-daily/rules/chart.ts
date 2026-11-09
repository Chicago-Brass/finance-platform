// Official workbook snapshot downloaded 2026-11-10. Scheduling is owned by the webhook caller.
export const CHART = {
  "EXP-01": {
    "sheet": "Category - Expenses",
    "row": 2,
    "name": "Enter an operating expense invoice (ex: Utilities)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"006.002: Utilities\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 006.002\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n006.002: Utilities -> Supabase 006.002\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Clarification]\n- [Risk] Possible duplicate posting with Category - Expenses row 3 when a Utilities invoice is fully paid by card.\n\n- [Risk] Also matches Category - Expenses row 4 when the Utilities invoice is marked prepaid."
  },
  "EXP-02": {
    "sheet": "Category - Expenses",
    "row": 3,
    "name": "Company credit-card purchase with NO vendor bill",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts is not empty\nInvoices.Linked Payments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching account\n009.002: Travel -> Supabase 009.002\n009.006: Dues & Organization Subscription -> Supabase 009.006\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": "[Clarification]\n- [Risk] Possible duplicate posting with Category - Expenses rows 2 or 4, or Category - Invoice Entry row 6, when those invoices are fully paid by card.\n\n- How do we identify a card purchase with no vendor bill?"
  },
  "EXP-03": {
    "sheet": "Category - Expenses",
    "row": 4,
    "name": "Prepaid expense bill (pay a year up front, e.g., insurance)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as Prepaid Expense? = checked",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 135.000\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n135.000: Prepaid Expenses -> Supabase 135.000\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Clarification]\n- [Risk] Also matches Category - Expenses row 2 for prepaid Utilities.\n\n- [Risk] Possible duplicate posting with Category - Expenses row 3 when the prepaid bill is fully paid by card."
  },
  "EXP-04": {
    "sheet": "Category - Expenses",
    "row": 5,
    "name": "Prepaid expense - monthly use-up (amortization)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT",
    "mapping": "[Field Mapping]\nAmount = Prepay Expenses Log.Amount Deducted\nDate = Prepay Expenses Log.Applied Date\nBranch = Prepay Expenses Log.Invoices.Branch\nDebit = 007.011\nCredit = 135.000\nNotes = Prepay Expenses Log.Prepay Log\n\n[Account Mapping]\n007.011: General Insurance -> Supabase 007.011\n135.000: Prepaid Expenses -> Supabase 135.000",
    "clarification": ""
  },
  "EXP-05": {
    "sheet": "Category - Expenses",
    "row": 6,
    "name": "Employee Tech Allowance",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per account\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch Employee\nDebit = 005.102\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.102: Tech Allowance -> Supabase 005.102\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-06": {
    "sheet": "Category - Expenses",
    "row": 7,
    "name": "Payroll - W2 payroll register (per pay date)",
    "status": "Partially",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes any of \"005.002: Salary - W2\", \"005.005: 401K\", \"005.006: Payroll Taxes\"",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per account\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 241.100 for 005.002\nCredit = 241.200 for 005.006\nCredit = 241.400 for 005.005\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.002: Salary - W2 -> Supabase 005.002\n005.006: Payroll Taxes -> Supabase 005.006\n005.005: 401K -> Supabase 005.005\n241.100: Accrued, unpaid salary -> Supabase 241.100\n241.200: Accrued, unpaid payroll taxes -> Supabase 241.200\n241.400: Accrued, unpaid 401k -> Supabase 241.400",
    "clarification": "[Clarification]\n- Which debit account should offset employee benefits 241.600? Benefits are excluded for now."
  },
  "EXP-07": {
    "sheet": "Category - Expenses",
    "row": 8,
    "name": "Payroll - offshore / 1099 / owner staff invoice",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes any of \"005.101: Salary - Offshore\", \"005.003: Salary - 1099\", \"005.001: Salary - Owners\"",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per account\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 241.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.101: Salary - Offshore -> Supabase 005.101\n005.003: Salary - 1099 -> Supabase 005.003\n005.001: Salary - Owners -> Supabase 005.001\n241.100: Accrued, unpaid salary -> Supabase 241.100",
    "clarification": ""
  },
  "EXP-08": {
    "sheet": "Category - Expenses",
    "row": 9,
    "name": "Month-end accrual - PTO liability",
    "status": "Not yet",
    "trigger": "",
    "mapping": "",
    "clarification": "[Clarification]\n- Deferred: the PTO trigger, amount and account mapping are not defined."
  },
  "EXP-09": {
    "sheet": "Category - Expenses",
    "row": 10,
    "name": "Month-end accrual - bonus & commission earned",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per account\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.201\nCredit = 241.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.201: Bonus -> Supabase 005.201\n241.300: Accrued, unpaid bonus -> Supabase 241.300",
    "clarification": ""
  },
  "EXP-10": {
    "sheet": "Category - Expenses",
    "row": 11,
    "name": "Monthly depreciation of equipment, vehicles, fixtures",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT",
    "mapping": "[Field Mapping]\nAmount = Depreciation Table.Amount Depreciated\nDate = Depreciation Table.Date\nBranch = Blank\nDebit = 009.101\nCredit = 161.000\nNotes = Depreciation Table.Associated Asset\n\n[Account Mapping]\n009.101: Depreciation -> Supabase 009.101\n161.000: Accumulated Depreciation -> Supabase 161.000",
    "clarification": ""
  },
  "EXP-11": {
    "sheet": "Category - Expenses",
    "row": 12,
    "name": "Bank fees and charges shown only on the bank statement",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.002\nCredit = Invoices.Linked Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.002: Bank / Misc. Service Charges -> Supabase 007.002\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300",
    "clarification": ""
  },
  "EXP-12": {
    "sheet": "Category - Expenses",
    "row": 13,
    "name": "Bad-debt reserve (allowance) - month-end",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"007.005: Bad Debt\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.005\nCredit = 121.900\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.005: Bad Debt -> Supabase 007.005\n121.900: Allowance for Doubtful Accounts -> Supabase 121.900",
    "clarification": ""
  },
  "EXP-13": {
    "sheet": "Category - Expenses",
    "row": 14,
    "name": "Income tax accrual (quarterly)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes exactly one of \"242.100: Accrued Federal Income Taxes\", \"242.200: Accrued State Income Taxes\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 011.001 for 242.100\nDebit = 011.002 for 242.200\nCredit = Invoices.Linked Chart of Accounts (242.100 or 242.200)\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n242.100: Accrued Federal Income Taxes -> Supabase 242.100\n242.200: Accrued State Income Taxes -> Supabase 242.200\n011.001: Federal Income Tax Expense -> Supabase 011.001\n011.002: State Income Tax Expense -> Supabase 011.002",
    "clarification": ""
  },
  "INV-01": {
    "sheet": "Category - Invoice Entry",
    "row": 2,
    "name": "Vendor PRODUCT invoice - goods already received",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\nInvoices.Total Received Not Yet Invoiced > 0",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.200\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.200: Received, not yet invoiced -> Supabase 211.200\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Clarification]\n- [Risk] Possible duplicate freight with Category - Invoice Entry row 5 if Invoice Amount already includes Freight.\n\n- [Risk] The same invoice may have posted under Category - Invoice Entry row 4 before receipt. How should the earlier deposit entry be handled?"
  },
  "INV-02": {
    "sheet": "Category - Invoice Entry",
    "row": 3,
    "name": "Vendor PRODUCT invoice - price is different from the PO",
    "status": "Not Yet",
    "trigger": "",
    "mapping": "",
    "clarification": "[Clarification]\n- Deferred: price-variance filters, amount and account mapping are not defined."
  },
  "INV-03": {
    "sheet": "Category - Invoice Entry",
    "row": 4,
    "name": "Vendor DEPOSIT invoice - billed before the goods ship",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\nInvoices.Related Purchase Order Status = \"Confirmed\"\nInvoices.Latest Purchase Order Received Date is empty",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 132.100\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n132.100: Purchase Order Pre-Payment -> Supabase 132.100\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Clarification]\n- [Risk] Possible duplicate freight with Category - Invoice Entry row 5 if Invoice Amount already includes Freight.\n\n- [Risk] The same invoice may later match Category - Invoice Entry row 2 after receipt. How should the deposit entry be cleared?"
  },
  "INV-04": {
    "sheet": "Category - Invoice Entry",
    "row": 5,
    "name": "Vendor invoice for inbound freight / handling on a PO",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Freight\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 131.100\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n131.100: Committed Inventory -> Supabase 131.100\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Clarification]\n- [Risk] Possible duplicate freight with Category - Invoice Entry rows 2 or 4 if their Invoice Amount already includes Freight.\n\n- How should a posted entry be corrected after Override Invoice Date changes?"
  },
  "INV-05": {
    "sheet": "Category - Invoice Entry",
    "row": 6,
    "name": "Carrier invoice for OUTBOUND shipping to clients",
    "status": "Partially",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"004.013: Freight Cost\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 004.013\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.013: Freight Cost -> Supabase 004.013\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Clarification]\n- [Risk] Possible duplicate expense with Category - Expenses row 3 when the carrier invoice is fully paid by card.\n\n- Which vendors should qualify for outbound shipping? The vendor filter is excluded for now."
  },
  "INV-06": {
    "sheet": "Category - Invoice Entry",
    "row": 7,
    "name": "Sales tax remittance invoice (paying the state)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Sales Tax)\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 212.100\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n212.100: IL State Sale Tax Payable -> Supabase 212.100\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "INV-07": {
    "sheet": "Category - Invoice Entry",
    "row": 8,
    "name": "Fixed asset purchase invoice (vehicle, fixtures, software)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 143.300\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.300: Display Fixtures & Equipment -> Supabase 143.300\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "INV-08": {
    "sheet": "Category - Invoice Entry",
    "row": 9,
    "name": "Vendor CREDIT MEMO - returned goods (RGA return for credit)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is not empty",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 131.400\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n131.400: Pending Return Processing -> Supabase 131.400",
    "clarification": ""
  },
  "INV-09": {
    "sheet": "Category - Invoice Entry",
    "row": 10,
    "name": "Vendor CREDIT MEMO - price credit, no goods returned",
    "status": "Partially",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is empty",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.010\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.010: Cost of Goods Sold -> Supabase 004.010",
    "clarification": "[Clarification]\n- Which account should receive a credit originally charged to an expense? Only COGS 004.010 is mapped for now."
  },
  "INV-10": {
    "sheet": "Category - Invoice Entry",
    "row": 11,
    "name": "Customer invoice for a NON-product charge",
    "status": "Fully",
    "trigger": "[Primary]\nEvery Day - 11:00PM CT\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"010.001: Misc. Income\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 010.001\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n121.100: Standard -> Supabase 121.100\n010.001: Misc. Income -> Supabase 010.001",
    "clarification": ""
  },
  "INV-11": {
    "sheet": "Category - Invoice Entry",
    "row": 12,
    "name": "Customer credit memo for a RETURN",
    "status": "Not Yet",
    "trigger": "",
    "mapping": "",
    "clarification": "[Clarification]\n- Deferred: return-credit filters, amount and account mapping are not defined."
  },
  "PAY-01": {
    "sheet": "Category - Payment",
    "row": 2,
    "name": "CUSTOMER DEPOSIT RECEIVED (before the order is processed)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Product\"\n(Invoices.First Ship Out Date (from Linked Transaction) IS EMPTY\nOR\nPayments.Payment Date <= Invoices.First Ship Out Date (from Linked Transaction))",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 221.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": "[Clarification]\n- [Risk] Possible duplicate bank debit with Category - Payment row 4 if this receipt already includes the overpayment."
  },
  "PAY-02": {
    "sheet": "Category - Payment",
    "row": 3,
    "name": "Customer payment AFTER the order shipped (credit-terms clients)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Product\"\nPayments.Payment Date > Invoices.First Ship Out Date (from Linked Transaction)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": "[Clarification]\n- [Risk] Possible duplicate bank debit with Category - Payment row 4 if this receipt already includes the overpayment."
  },
  "PAY-03": {
    "sheet": "Category - Payment",
    "row": 4,
    "name": "Client OVERPAYS or pays with no invoice to apply it to",
    "status": "Partially",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Refund/Credit\"\nInvoices.Method of Application = \"Credit to Another Order\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 221.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": "[Clarification]\n- [Risk] Category - Payment rows 2 or 3 may already include the overpayment in their bank debit. Should the later credit-payment entry debit the bank again?\n\n- How should a receipt with no linked invoice be handled? This row currently needs a refund/credit invoice."
  },
  "PAY-04": {
    "sheet": "Category - Payment",
    "row": 5,
    "name": "Small short-pay / rounding difference written off",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Product\"\nAND (\n(\nPayments.Overpaid Amount > 0\nAND Payments.Overpaid Amount <= 1\n)\nOR\n(\nInvoices.Invoice Remaining Balance > 0\nAND Invoices.Invoice Remaining Balance <= 5\n)\n)",
    "mapping": "[Field Mapping]\nAmount = Payments.Overpaid Amount (overpaid) or Invoices.Invoice Remaining Balance (underpaid)\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 007.002\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates",
    "clarification": "[Clarification]\n- [Risk] Small overpayments use the same debit 007.002 / credit 121.100 as short-pay write-offs."
  },
  "PAY-05": {
    "sheet": "Category - Payment",
    "row": 6,
    "name": "Refund to a client - by bank / check",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Refund/Credit\"\nInvoices.Method of Application = \"Cash Refund\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 221.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-06": {
    "sheet": "Category - Payment",
    "row": 7,
    "name": "Client payment voided / bounced",
    "status": "Partially",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Cancel Payment = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Product\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Cancelled Date\nBranch = Invoices.Branch\nDebit = 221.100 when either date is empty or Payment Date <= first ship date, otherwise 121.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nClient Reference = Invoices.Linked Client (FIN)\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": "[Clarification]\n- How should we split a cancellation across invoices with zero or mixed-sign Amount To Pay?\n\n- The new payment cancellation and deletion workflow is deferred."
  },
  "PAY-07": {
    "sheet": "Category - Payment",
    "row": 8,
    "name": "Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Product\"\nPayments.Return Payment (AP) = \"unchecked\"\nPayments.Payment Record Type = \"Regular Payment\"\n(Invoices.Related Purchase Order IS NOT EMPTY\nOR\nInvoices.Linked Vendors (For both Expenses and Product Invoices) IS NOT EMPTY)\nPayments.Method - AP IN (\"Nickel Check\", \"Wise\", \"Our ACH / Wire\", \"Vendor ACH / Wire\", \"Paper Check\")",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": "[Clarification]\n- [Gap] This row handles AP Product only. Which category should settle AP expense bills paid from the bank?"
  },
  "PAY-08": {
    "sheet": "Category - Payment",
    "row": 9,
    "name": "Pay a vendor with the company credit card",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Product\"\nPayments.Payment Record Type = \"Regular Payment\"\nPayments.Account to Pay/Receive CONTAINS ANY (\"231.100: Credit Card Clearing\")\n(Invoices.Related Purchase Order IS NOT EMPTY\nOR\nInvoices.Linked Vendors (For both Expenses and Product Invoices) IS NOT EMPTY)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates",
    "clarification": "[Clarification]\n- [Gap] This row handles AP Product only. Which category should clear Accounts Payable for an expense bill paid by card?\n\n- Category - Expenses row 3 records a direct card purchase; it does not clear an earlier AP expense bill."
  },
  "PAY-09": {
    "sheet": "Category - Payment",
    "row": 10,
    "name": "Pay the credit-card statement",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Payment Record Type = \"CC Batch Payment\"\nPayments.Linked Mini-Payments from This Batch IS NOT EMPTY\nPayments.Account to Pay/Receive CONTAINS ANY (\"112.100: Fifth Third Bank\", \"0747: Nickel Operating Account\", \"112.200: Fidelity\")",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 231.100\nCredit = Payments.Account to Pay/Receive\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-10": {
    "sheet": "Category - Payment",
    "row": 11,
    "name": "Early-payment discount taken when paying a vendor",
    "status": "Partially",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Discount Lines Total != 0\nInvoice Lines.Line Type = \"Discount\"\nInvoice Lines.Discount Line Status != \"Expired\"",
    "mapping": "[Field Mapping]\nAmount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Pending\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates",
    "clarification": "[Clarification]\n- Which credit account should receive the discount? If it uses more than one account, how should the amount be split? This category is blocked."
  },
  "PAY-11": {
    "sheet": "Category - Payment",
    "row": 12,
    "name": "Bill paid using vendor credits (no cash)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Credits Applied != 0",
    "mapping": "[Field Mapping]\nAmount = Invoices.Credits Applied\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100 (bill)\nCredit = 211.100 (source credit invoice)\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates",
    "clarification": ""
  },
  "PAY-12": {
    "sheet": "Category - Payment",
    "row": 13,
    "name": "Vendor payment cancelled / returned",
    "status": "Partially",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Invoice Type = \"AP\"\nAND (\nPayments.Cancel Payment = \"checked\"\nOR (\nPayments.Sent = \"checked\"\nAND Payments.Return Payment (AP) = \"checked\"\n)\n)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Cancelled Date (cancelled) or Payments.Payment Date (returned)\nBranch = blank\nDebit = 112.100\nCredit = 211.100",
    "clarification": "[Clarification]\n- The new payment cancellation and deletion workflow is deferred."
  },
  "PAY-13": {
    "sheet": "Category - Payment",
    "row": 14,
    "name": "Vendor sends us a refund",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Credit\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-14": {
    "sheet": "Category - Payment",
    "row": 15,
    "name": "Payroll - pay employees and remit taxes/deductions",
    "status": "Not yet",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPending - deferred",
    "mapping": "[Field Mapping]\nPending\n\n[Account Mapping]\nPending",
    "clarification": "[Clarification]\n- Deferred: payroll payment filters, amount and account mapping are not defined."
  },
  "PAY-15": {
    "sheet": "Category - Payment",
    "row": 16,
    "name": "Pay offshore / 1099 / owner staff (Wise, ACH)",
    "status": "Partially",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Staff\"\nInvoice Lines.Chart of Accounts CONTAINS ANY (\"005.101: Salary - Offshore\", \"005.003: Salary - 1099\", \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.006: Payroll Taxes\", \"005.005: 401K\")",
    "mapping": "[Field Mapping]\nAmount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 241.100 for line accounts 005.101 / 005.003 / 005.001 / 005.002\nDebit = 241.200 for line account 005.006\nDebit = 241.400 for line account 005.005\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n241.100: Accrued, unpaid salary -> Supabase 241.100\n241.200: Accrued, unpaid payroll taxes -> Supabase 241.200\n241.400: Accrued, unpaid 401k -> Supabase 241.400",
    "clarification": "[Clarification]\n- Which field supplies bank wire and FX fees? Fees are excluded for now.\n\n- Employee benefits are excluded. See the account question in Category - Expenses row 7.\n\n- [Risk] Partial payments can repeat the full invoice-line amounts. How should those amounts be split between payments?"
  },
  "PAY-16": {
    "sheet": "Category - Payment",
    "row": 17,
    "name": "Loan payment (principal + interest)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoice Lines.Chart of Accounts CONTAINS ANY (\"232.100: Auto Loan Payable\")",
    "mapping": "[Field Mapping]\nAmount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts (232.100 or 007.003)\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n232.100: Auto Loan Payable -> Supabase 232.100\n007.003: Interest Expense -> Supabase 007.003",
    "clarification": "[Clarification]\n- Which principal should an interest line follow when both loan and LOC principal are linked? See Category - Payment row 19. Ambiguous interest is blocked.\n\n- [Risk] Partial payments can repeat the full invoice-line amounts. How should those amounts be split between payments?"
  },
  "PAY-17": {
    "sheet": "Category - Payment",
    "row": 18,
    "name": "Line of credit - borrow (draw)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"231.200: Note Payable Line of Credit\")",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 231.200\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-18": {
    "sheet": "Category - Payment",
    "row": 19,
    "name": "Line of credit - repay",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoice Lines.Chart of Accounts CONTAINS ANY (\"231.200: Note Payable Line of Credit\")",
    "mapping": "[Field Mapping]\nAmount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts (231.200 or 007.003)\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.200: Note Payable Line of Credit -> Supabase 231.200\n007.003: Interest Expense -> Supabase 007.003",
    "clarification": "[Clarification]\n- Which principal should an interest line follow when both LOC and loan principal are linked? See Category - Payment row 17. Ambiguous interest is blocked.\n\n- [Risk] Partial payments can repeat the full invoice-line amounts. How should those amounts be split between payments?"
  },
  "PAY-19": {
    "sheet": "Category - Payment",
    "row": 20,
    "name": "Move money between our own bank accounts",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"112.100: Fifth Third Bank\", \"0747: Nickel Operating Account\", \"112.200: Fidelity\")\nPayments.Account to Pay/Receive CONTAINS ANY (\"112.100: Fifth Third Bank\", \"0747: Nickel Operating Account\", \"112.200: Fidelity\")\nPayments.Account to Pay/Receive != Invoices.Linked Chart of Accounts",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": "[Clarification]\n- The Debit column names Nickel, but Actual Mapping uses the payment-selected bank. Should the Debit column be updated?"
  },
  "PAY-20": {
    "sheet": "Category - Payment",
    "row": 21,
    "name": "Owner distribution paid",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"316.100: Prior to Current Year Distributions\")",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 316.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-21": {
    "sheet": "Category - Payment",
    "row": 22,
    "name": "Owner puts money into the company",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"311.200: Paid in Capital\")",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 311.200\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-22": {
    "sheet": "Category - Payment",
    "row": 23,
    "name": "Income tax payment",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"242.100: Accrued Federal Income Taxes\", \"242.200: Accrued State Income Taxes\")",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts (242.100 or 242.200)\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n242.100: Accrued Federal Income Taxes -> Supabase 242.100\n242.200: Accrued State Income Taxes -> Supabase 242.200",
    "clarification": ""
  },
  "PAY-23": {
    "sheet": "Category - Payment",
    "row": 24,
    "name": "Insurance claim payout received",
    "status": "Partially",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"122.100\")",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Pending\nCredit = 122.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates",
    "clarification": "[Clarification]\n- How much should debit Fifth Third 112.100, and how much should debit Insurance Claim Recoveries 004.004? This category is blocked.\n\n- Which FIN account should map to insurance receivable 122.100? That account is missing."
  },
  "PAY-24": {
    "sheet": "Category - Payment",
    "row": 25,
    "name": "Security deposit paid (lease)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"143.200: Security Deposits\")",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 143.200\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-25": {
    "sheet": "Category - Payment",
    "row": 26,
    "name": "Interest / dividends received (Fidelity)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"010.003: Interest and Dividends\")",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 112.200\nCredit = 010.003\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates",
    "clarification": ""
  },
  "PAY-26": {
    "sheet": "Category - Payment",
    "row": 27,
    "name": "Bank reconciliation rounding difference",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Reconciled = \"checked\"\nPayments.Reconciled Amount Discrepancy != 0",
    "mapping": "[Field Mapping]\nAmount = Payments.Reconciled Amount Discrepancy\nDate = Payments.Reconciliation Date - Combined\nBranch = blank\nDebit = 007.002\nCredit = Payments.Account to Pay/Receive\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-27": {
    "sheet": "Category - Payment",
    "row": 28,
    "name": "Credit-card rebate earned (cash back)",
    "status": "Fully",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"004.011: Purchased Discounts\n  & Rebate\")\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Purchased Discounts & Rebate Total != 0",
    "mapping": "[Field Mapping]\nAmount = Invoices.Purchased Discounts & Rebate Total\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 231.100\nCredit = 004.011\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors (For both Expenses and Product Invoices)\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates",
    "clarification": ""
  }
} as const;
