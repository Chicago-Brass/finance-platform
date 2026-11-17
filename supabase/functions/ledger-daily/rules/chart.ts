// Reviewed T-Chart display groups and stable rule codes; execution modules retain their source ownership.
export const CHART = {
  "EXP-01": {
    "sheet": "Category - Expenses",
    "row": 2,
    "name": "Enter an operating expense invoice (ex: Utilities)",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.012: Returns Disposed Of -> Supabase 004.012\n004.013: Freight Cost -> Supabase 004.013\n005.004: Insurance: Health, Dental, STD -> Supabase 005.004\n005.301: Payroll Processing -> Supabase 005.301\n005.302: Training & Development -> Supabase 005.302\n006.001: Rent -> Supabase 006.001\n006.002: Utilities -> Supabase 006.002\n006.003: Safety & Security Expense -> Supabase 006.003\n006.004: Cleaning -> Supabase 006.004\n007.001: Accounting -> Supabase 007.001\n007.003: Interest Expense -> Supabase 007.003\n007.004: Merchant Services -> Supabase 007.004\n007.006: Sales Tax Miscalculations -> Supabase 007.006\n007.007: Legal -> Supabase 007.007\n007.011: General Insurance -> Supabase 007.011\n007.012: Life Insurance -> Supabase 007.012\n008.001: Software Licensing -> Supabase 008.001\n008.002: IT Services -> Supabase 008.002\n008.003: Server Hosting -> Supabase 008.003\n008.004: Telephone -> Supabase 008.004\n009.001: Marketing & Promotion -> Supabase 009.001\n009.002: Travel -> Supabase 009.002\n009.003: Meals & Entertainment -> Supabase 009.003\n009.004: Warehouse Supplies -> Supabase 009.004\n009.005: Office Expenses -> Supabase 009.005\n009.006: Dues & Organization Subscription -> Supabase 009.006\n009.007: Repairs & Maintenance -> Supabase 009.007\n009.008: Selling Expense -> Supabase 009.008\n009.009: Donations -> Supabase 009.009\n009.010: Postage -> Supabase 009.010\n009.011: Consulting -> Supabase 009.011\n009.012: Permit & Licenses -> Supabase 009.012\n009.013: Shipping Insurance Premiums -> Supabase 009.013\n009.102: Inventory Adjustments -> Supabase 009.102\n010.002: Misc. Expense -> Supabase 010.002\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000\n211.100: Standard Product -> Supabase 211.100\n",
    "clarification": "[Notes]\n- The 37 operating accounts are hardcoded; the Airtable checkbox is not read during sync."
  },
  "EXP-02": {
    "sheet": "Category - Expenses",
    "row": 4,
    "name": "Company credit-card purchase with NO vendor bill",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n008.001: Software Licensing -> Supabase 008.001\n009.002: Travel -> Supabase 009.002\n009.006: Dues & Organization Subscription -> Supabase 009.006\n231.100: Credit Card Clearing -> Supabase 231.100\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000",
    "clarification": ""
  },
  "EXP-03": {
    "sheet": "Category - Expenses",
    "row": 12,
    "name": "Prepaid expense bill (pay a year up front, e.g., insurance) - Invoice, not paid",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 135.000\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n135.000: Prepaid Assets -> Supabase 135.000\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-04": {
    "sheet": "Category - Expenses",
    "row": 14,
    "name": "Prepaid expense - monthly use-up (amortization)",
    "status": "Fully",
    "trigger": "[Record]\nPrepay Expenses Log\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Prepay Expenses Log.Amount Deducted\nDate = Prepay Expenses Log.Applied Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 135.000\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\nNotes = Prepay Expenses Log.Prepay Log\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n007.011: General Insurance -> Supabase 007.011\n135.000: Prepaid Assets -> Supabase 135.000\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000",
    "clarification": ""
  },
  "EXP-05": {
    "sheet": "Category - Expenses",
    "row": 20,
    "name": "Employee Tech Allowance - Not Paid",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch Employee\nDebit = 005.102\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.102: Tech Allowance -> Supabase 005.102\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-06": {
    "sheet": "Category - Expenses",
    "row": 22,
    "name": "Payroll - W2 payroll register (per pay date), Owner",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.001: Salary - Owners -> Supabase 005.001\n005.002: Salary - W2 -> Supabase 005.002\n005.003: Salary - 1099 -> Supabase 005.003\n005.005: 401K -> Supabase 005.005\n005.006: Payroll Taxes -> Supabase 005.006\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Issues]\n- Confirm how to record 005.004 insurance deductions. They are excluded from this W2 pair and can make bank postings exceed the actual payment."
  },
  "EXP-07": {
    "sheet": "Category - Expenses",
    "row": 24,
    "name": "Payroll - offshore - unpaid",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.101\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.101: Salary - Offshore -> Supabase 005.101\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-09": {
    "sheet": "Category - Expenses",
    "row": 26,
    "name": "Payrol - Bonuses (Unpaid)",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.201\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.201: Bonus -> Supabase 005.201\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-10": {
    "sheet": "Category - Expenses",
    "row": 17,
    "name": "Monthly depreciation of equipment, vehicles, fixtures",
    "status": "Fully",
    "trigger": "[Record]\nDepreciation Table\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Depreciation Table.Amount Depreciated\nDate = Depreciation Table.Date\nBranch = Blank\nDebit = 009.101\nCredit = 161.000\n\n[Other Field Mapping]\nNotes = Depreciation Table.Associated Asset\n\n[Account Mapping]\n009.101: Depreciation -> Supabase 009.101\nFixed accumulated depreciation credit -> Supabase 161.000",
    "clarification": ""
  },
  "EXP-11": {
    "sheet": "Category - Expenses",
    "row": 29,
    "name": "Bank fees and charges shown only on the bank statement (Unpaid)",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.002\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.002: Bank / Misc. Service Charges -> Supabase 007.002\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-12": {
    "sheet": "Category - Expenses",
    "row": 34,
    "name": "Bad-debt reserve (allowance) - month-end",
    "status": "Not yet",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"007.005: Bad Debt\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.005\nCredit = 121.900\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.005: Bad Debt -> Supabase 007.005\n121.900: Allowance for Doubtful Accounts -> Supabase 121.900",
    "clarification": "[Notes]\n- Deferred."
  },
  "EXP-13": {
    "sheet": "Category - Expenses",
    "row": 31,
    "name": "Income tax accrual (quarterly)",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n923100: Federal Income Tax -> Supabase 011.001\n923300: State Income Tax -> Supabase 011.002\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-14": {
    "sheet": "Category - Expenses",
    "row": 3,
    "name": "When operating expenses are paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-15": {
    "sheet": "Category - Expenses",
    "row": 5,
    "name": "Everytime a product invoice is created",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount - Invoices.Discount Lines Total\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 004.010\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.010: Cost of Goods Sold -> Supabase 004.010\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Issues]\n- Negative AP Product invoices also match this category. Should they use a different category?"
  },
  "EXP-16": {
    "sheet": "Category - Expenses",
    "row": 6,
    "name": "Everytime a product invoice is paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "EXP-17": {
    "sheet": "Category - Expenses",
    "row": 13,
    "name": "Prepaid Expense BILL (actually paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-18": {
    "sheet": "Category - Expenses",
    "row": 21,
    "name": "Employee Tech Allowance - Paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch Employee\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-19": {
    "sheet": "Category - Expenses",
    "row": 23,
    "name": "Payroll - W2 payroll register (Paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": "[Issues]\n- Confirm how to record 005.004 insurance deductions. They are excluded from this W2 pair and can make bank postings exceed the actual payment."
  },
  "EXP-20": {
    "sheet": "Category - Expenses",
    "row": 25,
    "name": "Payroll - offshore - paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-21": {
    "sheet": "Category - Expenses",
    "row": 27,
    "name": "Payrol - Bonuses (paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-22": {
    "sheet": "Category - Expenses",
    "row": 33,
    "name": "Payroll - offshore - Month-end accrual Bonus (Unpaid)",
    "status": "Not yet",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.103: 13th Month\"\nInvoice Lines.Line Amount Is Not Empty",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per account\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.103: 13th Month\nCredit = 241.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.201: Bonus -> Supabase 005.201\n241.300: Accrued, unpaid bonus -> Supabase 241.300",
    "clarification": "[Notes]\n- Deferred."
  },
  "EXP-23": {
    "sheet": "Category - Expenses",
    "row": 28,
    "name": "Payroll - offshore - Month-end accrual Bonus (Paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 241.300\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n241.300: Accrued Bonus & Commission -> Supabase 241.300\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-24": {
    "sheet": "Category - Expenses",
    "row": 35,
    "name": "Bad-Debt Journal Entry",
    "status": "Not yet",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n",
    "mapping": "",
    "clarification": "[Notes]\n- Deferred."
  },
  "EXP-25": {
    "sheet": "Category - Expenses",
    "row": 36,
    "name": "Bad-Debt Reversal Entry",
    "status": "Not yet",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n",
    "mapping": "",
    "clarification": "[Notes]\n- Deferred."
  },
  "EXP-26": {
    "sheet": "Category - Expenses",
    "row": 32,
    "name": "Income tax accrual (Paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-27": {
    "sheet": "Category - Expenses",
    "row": 30,
    "name": "Bank fees and charges shown only on the bank statement (Paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "INV-07": {
    "row": 15,
    "name": "Fixed asset purchase invoice (vehicle, fixtures, software) Created",
    "status": "Partially",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.300: Display Fixtures & Equipment -> Supabase 143.300\nAccounts Payable (211.100) -> Supabase 211.100",
    "clarification": "[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?",
    "sheet": "Category - Expenses"
  },
  "INV-08": {
    "row": 9,
    "name": "Vendor credit memo - returned goods (RGA return for credit)",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = -Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 131.400\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n131.400: Pending Return Processing -> Supabase 131.400",
    "clarification": "[Notes]\n- FIN stores vendor credits as negative invoice amounts.",
    "sheet": "Category - Expenses"
  },
  "INV-09": {
    "row": 12,
    "name": "Vendor CREDIT MEMO - price credit, no goods returned",
    "status": "Not yet",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is empty",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.010\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.010: Cost of Goods Sold -> Supabase 004.010",
    "clarification": "[Notes]\n- Deferred.",
    "sheet": "Category - Invoice Entry"
  },
  "INV-10": {
    "row": 7,
    "name": "Customer invoice for a NON-product charge Created",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nInvoices.Linked Chart of Accounts -> Supabase matching account\nExample: 004.002: Coordination Fees Charged -> Supabase 004.002\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000",
    "clarification": "[Issues]\n- Potential loan overlaps with Category - Payment rows 12/13 remain unresolved. Those handlers currently stop before posting.",
    "sheet": "Category - Invoice Entry"
  },
  "INV-12": {
    "row": 2,
    "name": "Deposit Invoice is created",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 221.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nClient Deposits Held (221.100) -> Supabase 221.100",
    "clarification": "",
    "sheet": "Category - Invoice Entry"
  },
  "INV-13": {
    "row": 3,
    "name": "Deposit Invoice is paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount x Sum of matching Invoices.Payment Proportion For Batch Allocation\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100",
    "clarification": "[Notes]\n- Product and Non-Product invoices are paid separately.\n\n- Repeated batch payments link the same invoices with unchanged invoice amounts.",
    "sheet": "Category - Invoice Entry"
  },
  "INV-14": {
    "row": 4,
    "name": "Shipment against client deposit",
    "status": "Fully",
    "trigger": "[Record]\nShipping Records\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = MIN(Sum of linked MTAs.Extended Sell Price, MAX(0, Remaining posted deposit balance))\nDate = Shipping Records.Ship Out Date\nBranch = Linked MTAs.Branch\nDebit = 221.100\nCredit = 004.001\n\n[Other Field Mapping]\nVendor Reference = Deposit Invoice.Linked Vendors\nClient Reference = Deposit Invoice.Linked Client\nStaff Reference = Deposit Invoice.Linked Staff\nTransaction Reference = Shipping Records.Transaction\nPO Reference = Deposit Invoice.Related Purchase Order\nState References = Linked MTAs.States, and Sales Tax Rates\n\n[Account Mapping]\n221.100: Client Deposits Held -> Supabase 221.100\n004.001: Product Revenue -> Supabase 004.001",
    "clarification": "[Notes]\n- Remaining deposit is the net posted 221.100 balance linked to the deposit invoice, including reversals.\n\n- Requires one transaction and one deposit invoice; ambiguous links stop without posting.",
    "sheet": "Category - Invoice Entry"
  },
  "INV-15": {
    "row": 5,
    "name": "Full or Balance Invoice is created",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 004.001\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nProduct Revenue (004.001) -> Supabase 004.001",
    "clarification": "",
    "sheet": "Category - Invoice Entry"
  },
  "INV-16": {
    "row": 6,
    "name": "Full or Balance invoice is paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount x Sum of matching Invoices.Payment Proportion For Batch Allocation\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100",
    "clarification": "[Notes]\n- Product and Non-Product invoices are paid separately.\n\n- Repeated batch payments link the same invoices with unchanged invoice amounts.",
    "sheet": "Category - Invoice Entry"
  },
  "INV-17": {
    "row": 16,
    "name": "Fixed Asset Purchase Invoice is Paid",
    "status": "Partially",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Payable (211.100) -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": "[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?",
    "sheet": "Category - Expenses"
  },
  "INV-18": {
    "row": 8,
    "name": "Customer invoice for a non-product charge paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100",
    "clarification": "[Notes]\n- Product and Non-Product invoices are paid separately.\n\n[Issues]\n- Potential loan overlaps with Category - Payment rows 12/13 remain unresolved. Those handlers currently stop before posting.",
    "sheet": "Category - Invoice Entry"
  },
  "PAY-03": {
    "sheet": "Category - Invoice Entry",
    "row": 9,
    "name": "Client OVERPAYS or pays with no invoice to apply it to",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = -Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Payments.Account to Pay/Receive\nCredit = 221.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\nClient Credits on Account (221.300) -> Supabase 221.300",
    "clarification": ""
  },
  "PAY-28": {
    "sheet": "Category - Invoice Entry",
    "row": 10,
    "name": "When we apply AR Credits to Open invoices",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = -Invoices.Credits Applied\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 221.300\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nClient Credits on Account (221.300) -> Supabase 221.300\n121.100: Accounts Receivable -> Supabase 121.100",
    "clarification": ""
  },
  "PAY-29": {
    "sheet": "Category - Invoice Entry",
    "row": 11,
    "name": "When we refund AR credits to customers (no remaining open invoices)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = -Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 221.300\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nClient Credits on Account (221.300) -> Supabase 221.300\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-08": {
    "sheet": "Category - Expenses",
    "row": 7,
    "name": "Pay a vendor with the company credit card",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "PAY-09": {
    "sheet": "Category - Payment",
    "row": 2,
    "name": "Pay the credit-card statement",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Linked Mini-Payments.Invoices.Branch\nDebit = 231.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Linked Mini-Payments.Invoices.Linked Vendors\nClient Reference = Linked Mini-Payments.Invoices.Linked Client\nStaff Reference = Linked Mini-Payments.Invoices.Linked Staff\nTransaction Reference = Linked Mini-Payments.Invoices.Linked Transaction\nPO Reference = Linked Mini-Payments.Invoices.Related Purchase Order\nState References = Linked Mini-Payments.Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n231.100: Credit Card Clearing -> Supabase 231.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-10": {
    "sheet": "Category - Expenses",
    "row": 8,
    "name": "Early-payment discount taken when paying a vendor",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = -Invoice Lines.Line Amount\nDate = Linked Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.011\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.011: Purchased Discounts & Rebate -> Supabase 004.011",
    "clarification": ""
  },
  "PAY-11": {
    "sheet": "Category - Expenses",
    "row": 10,
    "name": "Bill paid using vendor credits (no cash)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = -Invoices.Credits Applied\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100 (bill)\nCredit = 211.100 (source credit invoice)\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Notes]\n- A zero-cash Sent payment still qualifies. Do not require Payments.Amount to be nonzero."
  },
  "PAY-12": {
    "sheet": "Category - Payment",
    "row": 3,
    "name": "Vendor payment returned",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = -Payments.Amount\nDate = Payments.Payment Date\nBranch = blank\nDebit = 112.100\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "PAY-30": {
    "sheet": "Category - Payment",
    "row": 4,
    "name": "Vendor Return Payment, Repaid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 112.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100",
    "clarification": ""
  },
  "PAY-13": {
    "sheet": "Category - Expenses",
    "row": 11,
    "name": "Vendor sends us a refund, Invoice is not an AP-Credit, Negative payment record against an actual return invoice",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = -Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "PAY-31": {
    "sheet": "Category - Payment",
    "row": 5,
    "name": "AR Non-product created with a loan account",
    "status": "Partially",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 112.100\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\nLoan liability accounts -> Supabase matching account (list pending)",
    "clarification": "[Issues]\n- Should the bank debit wait for the loan receipt payment? An invoice alone does not confirm cash received.\n\n- Which loan liability accounts qualify? The selected account is on the invoice, not on Loan Records.\n\n- The same AR Non-Product invoice/payment qualifies for Invoice Entry rows 11/12. Which flow should own the borrowing entry?"
  },
  "PAY-16": {
    "sheet": "Category - Payment",
    "row": 6,
    "name": "Loan payment (principal + interest) ONLY scenario where AR invoice > AP Payment",
    "status": "Partially",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Pending - principal and interest amounts per account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 232.100 (principal) or 007.003 (interest)\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n232.100: Auto Loan Payable -> Supabase 232.100\n007.003: Interest Expense -> Supabase 007.003\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": "[Issues]\n- Which invoice link identifies a monthly repayment rather than the original borrowing: Loan Records or Loan Records 2?\n\n- Should principal and interest come from Invoice Lines.Line Amount or Debt Amortization Table.Principal and Interest?\n\n- INV-18 treats Sent payments on AR Non-Product invoices as cash receipts. How should this outgoing loan payment be separated?"
  },
  "PAY-20": {
    "sheet": "Category - Payment",
    "row": 8,
    "name": "Owner distribution paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 316.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n316.100: Prior to Current Year Distributions -> Supabase 316.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-21": {
    "sheet": "Category - Payment",
    "row": 7,
    "name": "Owner puts money into the company",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 311.200\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n311.200: Paid in Capital -> Supabase 311.200",
    "clarification": ""
  },
  "PAY-23": {
    "sheet": "Category - Payment",
    "row": 9,
    "name": "Insurance claim payout received",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 112.100\nCredit = 004.004\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n004.004: Shipping Insurance Payouts Recieved -> Supabase 004.004",
    "clarification": ""
  },
  "PAY-32": {
    "sheet": "Category - Expenses",
    "row": 18,
    "name": "Security Deposit with Chart of Account Security Deposit",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 143.200\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.200: Security Deposits -> Supabase 143.200\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "PAY-24": {
    "sheet": "Category - Expenses",
    "row": 19,
    "name": "Security deposit paid (lease)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "clarification": ""
  },
  "PAY-27": {
    "sheet": "Category - Payment",
    "row": 10,
    "name": "Credit-card rebate earned (cash back)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 231.100\nCredit = 004.011\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n231.100: Credit Card Clearing -> Supabase 231.100\n004.011: Purchased Discounts & Rebate -> Supabase 004.011",
    "clarification": ""
  }
} as const;
