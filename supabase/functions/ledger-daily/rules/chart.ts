// Reviewed Expense and Invoice Entry chart metadata. Black rows are excluded.
export const CHART = {
  "EXP-01": {
    "sheet": "Category - Expenses",
    "row": 2,
    "name": "Enter an operating expense invoice (ex: Utilities)",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes any of \"004.012\", \"004.013\", \"005.004\", \"005.301\", \"005.302\", \"006.001\", \"006.002\", \"006.003\", \"006.004\", \"007.001\", \"007.003\", \"007.004\", \"007.006\", \"007.007\", \"007.011\", \"007.012\", \"008.001\", \"008.002\", \"008.003\", \"008.004\", \"009.001\", \"009.002\", \"009.003\", \"009.004\", \"009.005\", \"009.006\", \"009.007\", \"009.008\", \"009.009\", \"009.010\", \"009.011\", \"009.012\", \"009.013\", \"009.102\", \"010.002\", \"525300\", \"922000\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.012: Returns Disposed Of -> Supabase 004.012\n004.013: Freight Cost -> Supabase 004.013\n005.004: Insurance: Health, Dental, STD -> Supabase 005.004\n005.301: Payroll Processing -> Supabase 005.301\n005.302: Training & Development -> Supabase 005.302\n006.001: Rent -> Supabase 006.001\n006.002: Utilities -> Supabase 006.002\n006.003: Safety & Security Expense -> Supabase 006.003\n006.004: Cleaning -> Supabase 006.004\n007.001: Accounting -> Supabase 007.001\n007.003: Interest Expense -> Supabase 007.003\n007.004: Merchant Services -> Supabase 007.004\n007.006: Sales Tax Miscalculations -> Supabase 007.006\n007.007: Legal -> Supabase 007.007\n007.011: General Insurance -> Supabase 007.011\n007.012: Life Insurance -> Supabase 007.012\n008.001: Software Licensing -> Supabase 008.001\n008.002: IT Services -> Supabase 008.002\n008.003: Server Hosting -> Supabase 008.003\n008.004: Telephone -> Supabase 008.004\n009.001: Marketing & Promotion -> Supabase 009.001\n009.002: Travel -> Supabase 009.002\n009.003: Meals & Entertainment -> Supabase 009.003\n009.004: Warehouse Supplies -> Supabase 009.004\n009.005: Office Expenses -> Supabase 009.005\n009.006: Dues & Organization Subscription -> Supabase 009.006\n009.007: Repairs & Maintenance -> Supabase 009.007\n009.008: Selling Expense -> Supabase 009.008\n009.009: Donations -> Supabase 009.009\n009.010: Postage -> Supabase 009.010\n009.011: Consulting -> Supabase 009.011\n009.012: Permit & Licenses -> Supabase 009.012\n009.013: Shipping Insurance Premiums -> Supabase 009.013\n009.102: Inventory Adjustments -> Supabase 009.102\n010.002: Misc. Expense -> Supabase 010.002\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Notes]\n- The 37 operating accounts are hardcoded; the Airtable checkbox is not read during sync."
  },
  "EXP-02": {
    "sheet": "Category - Expenses",
    "row": 6,
    "name": "Company credit-card purchase with NO vendor bill",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = true\nInvoices.Linked Chart of Accounts is not empty\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n008.001: Software Licensing -> Supabase 008.001\n009.002: Travel -> Supabase 009.002\n009.006: Dues & Organization Subscription -> Supabase 009.006\n231.100: Credit Card Clearing -> Supabase 231.100\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000",
    "clarification": ""
  },
  "EXP-03": {
    "sheet": "Category - Expenses",
    "row": 7,
    "name": "Prepaid expense bill (pay a year up front, e.g., insurance) - Invoice, not paid",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 135.000\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n135.000: Prepaid Assets -> Supabase 135.000\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-04": {
    "sheet": "Category - Expenses",
    "row": 9,
    "name": "Prepaid expense - monthly use-up (amortization)",
    "status": "Fully",
    "trigger": "[Record]\nPrepay Expenses Log\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPrepay Expenses Log.Cancel Pre-pay Log = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty",
    "mapping": "[Field Mapping]\nAmount = Prepay Expenses Log.Amount Deducted\nDate = Prepay Expenses Log.Applied Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 135.000\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\nNotes = Prepay Expenses Log.Prepay Log\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n007.011: General Insurance -> Supabase 007.011\n135.000: Prepaid Assets -> Supabase 135.000\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000",
    "clarification": ""
  },
  "EXP-05": {
    "sheet": "Category - Expenses",
    "row": 10,
    "name": "Employee Tech Allowance - Not Paid",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch Employee\nDebit = 005.102\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.102: Tech Allowance -> Supabase 005.102\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-06": {
    "sheet": "Category - Expenses",
    "row": 12,
    "name": "Payroll - W2 payroll register (per pay date), Owner",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes any of \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.003: Salary - 1099\", \"005.005: 401K\", \"005.006: Payroll Taxes\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.001: Salary - Owners -> Supabase 005.001\n005.002: Salary - W2 -> Supabase 005.002\n005.003: Salary - 1099 -> Supabase 005.003\n005.005: 401K -> Supabase 005.005\n005.006: Payroll Taxes -> Supabase 005.006\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-07": {
    "sheet": "Category - Expenses",
    "row": 14,
    "name": "Payroll - offshore - unpaid",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.101: Salary - Offshore\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.101\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.101: Salary - Offshore -> Supabase 005.101\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-09": {
    "sheet": "Category - Expenses",
    "row": 16,
    "name": "Payrol - Bonuses (Unpaid)",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.201\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.201: Bonus -> Supabase 005.201\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-10": {
    "sheet": "Category - Expenses",
    "row": 20,
    "name": "Monthly depreciation of equipment, vehicles, fixtures",
    "status": "Fully",
    "trigger": "[Record]\nDepreciation Table\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]",
    "mapping": "[Field Mapping]\nAmount = Depreciation Table.Amount Depreciated\nDate = Depreciation Table.Date\nBranch = Blank\nDebit = 009.101\nCredit = 161.000\n\n[Other Field Mapping]\nNotes = Depreciation Table.Associated Asset\n\n[Account Mapping]\n009.101: Depreciation -> Supabase 009.101\nFixed accumulated depreciation credit -> Supabase 161.000",
    "clarification": ""
  },
  "EXP-11": {
    "sheet": "Category - Expenses",
    "row": 21,
    "name": "Bank fees and charges shown only on the bank statement (Unpaid)",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.002\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.002: Bank / Misc. Service Charges -> Supabase 007.002\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-12": {
    "sheet": "Category - Expenses",
    "row": 23,
    "name": "Bad-debt reserve (allowance) - month-end\n",
    "status": "Not yet",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"007.005: Bad Debt\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.005\nCredit = 121.900\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.005: Bad Debt -> Supabase 007.005\n121.900: Allowance for Doubtful Accounts -> Supabase 121.900",
    "clarification": "[Notes]\n- Deferred."
  },
  "EXP-13": {
    "sheet": "Category - Expenses",
    "row": 26,
    "name": "Income tax accrual (quarterly)",
    "status": "Fully",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoice Lines.Chart of Accounts includes any of \"923100: Federal Income Tax\", \"923300: State Income Tax\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n923100: Federal Income Tax -> Supabase 011.001\n923300: State Income Tax -> Supabase 011.002\n211.100: Standard Product -> Supabase 211.100",
    "clarification": ""
  },
  "EXP-14": {
    "sheet": "Category - Expenses",
    "row": 3,
    "name": "When operating expenses are paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes any of \"004.012\", \"004.013\", \"005.004\", \"005.301\", \"005.302\", \"006.001\", \"006.002\", \"006.003\", \"006.004\", \"007.001\", \"007.003\", \"007.004\", \"007.006\", \"007.007\", \"007.011\", \"007.012\", \"008.001\", \"008.002\", \"008.003\", \"008.004\", \"009.001\", \"009.002\", \"009.003\", \"009.004\", \"009.005\", \"009.006\", \"009.007\", \"009.008\", \"009.009\", \"009.010\", \"009.011\", \"009.012\", \"009.013\", \"009.102\", \"010.002\", \"525300\", \"922000\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-15": {
    "sheet": "Category - Expenses",
    "row": 4,
    "name": "Everytime a product invoice is created",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 004.010\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.010: Cost of Goods Sold -> Supabase 004.010\n211.100: Standard Product -> Supabase 211.100",
    "clarification": "[Issues]\n- Negative AP Product invoices also match this category. Should they use a different category?"
  },
  "EXP-16": {
    "sheet": "Category - Expenses",
    "row": 5,
    "name": "Everytime a product invoice is paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": "[Issues]\n- Possible duplicate settlement with Category - Payment rows 8 or 9."
  },
  "EXP-17": {
    "sheet": "Category - Expenses",
    "row": 8,
    "name": "Prepaid Expense BILL (actually paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-18": {
    "sheet": "Category - Expenses",
    "row": 11,
    "name": "Employee Tech Allowance - Paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch Employee\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-19": {
    "sheet": "Category - Expenses",
    "row": 13,
    "name": "Payroll - W2 payroll register (Paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes any of \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.003: Salary - 1099\", \"005.005: 401K\", \"005.006: Payroll Taxes\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": "[Issues]\n- Possible duplicate bank posting with Category - Payment row 16."
  },
  "EXP-20": {
    "sheet": "Category - Expenses",
    "row": 15,
    "name": "Payroll - offshore - paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.101: Salary - Offshore\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": "[Issues]\n- Possible duplicate bank posting with Category - Payment row 16."
  },
  "EXP-21": {
    "sheet": "Category - Expenses",
    "row": 17,
    "name": "Payrol - Bonuses (paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-22": {
    "sheet": "Category - Expenses",
    "row": 18,
    "name": "Payroll - offshore - Month-end accrual Bonus (Unpaid)",
    "status": "Not yet",
    "trigger": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.103: 13th Month\"\nInvoice Lines.Line Amount Is Not Empty",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per account\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.103: 13th Month\nCredit = 241.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.201: Bonus -> Supabase 005.201\n241.300: Accrued, unpaid bonus -> Supabase 241.300",
    "clarification": "[Notes]\n- Deferred."
  },
  "EXP-23": {
    "sheet": "Category - Expenses",
    "row": 19,
    "name": "Payroll - offshore - Month-end accrual Bonus (Paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.103: 13th Month\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 241.300\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n241.300: Accrued Bonus & Commission -> Supabase 241.300\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "EXP-24": {
    "sheet": "Category - Expenses",
    "row": 24,
    "name": "Bad-Debt Journal Entry",
    "status": "Not yet",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n",
    "mapping": "",
    "clarification": "[Notes]\n- Deferred."
  },
  "EXP-25": {
    "sheet": "Category - Expenses",
    "row": 25,
    "name": "Bad-Debt Reversal Entry",
    "status": "Not yet",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n",
    "mapping": "",
    "clarification": "[Notes]\n- Deferred."
  },
  "EXP-26": {
    "sheet": "Category - Expenses",
    "row": 27,
    "name": "Income tax accrual (Paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes any of \"923100: Federal Income Tax\", \"923300: State Income Tax\"\nInvoice Lines.Line Amount is not empty",
    "mapping": "[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": "[Issues]\n- Possible duplicate bank posting with Category - Payment row 23."
  },
  "EXP-27": {
    "sheet": "Category - Expenses",
    "row": 22,
    "name": "Bank fees and charges shown only on the bank statement (Paid)",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": ""
  },
  "INV-07": {
    "row": 7,
    "name": "Fixed asset purchase invoice (vehicle, fixtures, software) Created",
    "status": "Partially",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.300: Display Fixtures & Equipment -> Supabase 143.300\nAccounts Payable (211.100) -> Supabase 211.100",
    "clarification": "[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?",
    "sheet": "Category - Invoice Entry"
  },
  "INV-08": {
    "row": 9,
    "name": "Vendor credit memo - returned goods (RGA return for credit)",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is not empty",
    "mapping": "[Field Mapping]\nAmount = -Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 131.400\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n131.400: Pending Return Processing -> Supabase 131.400",
    "clarification": "[Notes]\n- FIN stores vendor credits as negative invoice amounts.",
    "sheet": "Category - Invoice Entry"
  },
  "INV-09": {
    "row": 10,
    "name": "Vendor CREDIT MEMO - price credit, no goods returned",
    "status": "Not yet",
    "trigger": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is empty",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.010\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.010: Cost of Goods Sold -> Supabase 004.010",
    "clarification": "[Notes]\n- Deferred.",
    "sheet": "Category - Invoice Entry"
  },
  "INV-10": {
    "row": 11,
    "name": "Customer invoice for a NON-product charge Created",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nInvoices.Linked Chart of Accounts -> Supabase matching account\nExample: 004.002: Coordination Fees Charged -> Supabase 004.002\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000",
    "clarification": "[Issues]\n- Possible duplicate with Category - Payment rows 18/22/24/26/28 if those rules are enabled.",
    "sheet": "Category - Invoice Entry"
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
  },
  "INV-12": {
    "row": 2,
    "name": "Deposit Invoice is created",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 221.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nClient Deposits Held (221.100) -> Supabase 221.100",
    "clarification": "",
    "sheet": "Category - Invoice Entry"
  },
  "INV-13": {
    "row": 3,
    "name": "Deposit Invoice is paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount x Sum of matching Invoices.Payment Proportion For Batch Allocation\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100",
    "clarification": "[Notes]\n- Product and Non-Product invoices are paid separately.\n\n- Repeated batch payments link the same invoices with unchanged invoice amounts.\n\n[Issues]\n- Possible duplicate cash posting with Category - Payment rows 2/3 if those rules are enabled.",
    "sheet": "Category - Invoice Entry"
  },
  "INV-14": {
    "row": 4,
    "name": "Shipment against client deposit",
    "status": "Fully",
    "trigger": "[Record]\nShipping Records\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nShipping Records.Ship Out = true\nShipping Records.Ship Out Date is not empty\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\nInvoices.Cancel Invoice = false",
    "mapping": "[Field Mapping]\nAmount = MIN(Sum of linked MTAs.Extended Sell Price, MAX(0, Remaining posted deposit balance))\nDate = Shipping Records.Ship Out Date\nBranch = Linked MTAs.Branch\nDebit = 221.100\nCredit = 004.001\n\n[Other Field Mapping]\nVendor Reference = Deposit Invoice.Linked Vendors\nClient Reference = Deposit Invoice.Linked Client\nStaff Reference = Deposit Invoice.Linked Staff\nTransaction Reference = Shipping Records.Transaction\nPO Reference = Deposit Invoice.Related Purchase Order\nState References = Linked MTAs.States, and Sales Tax Rates\n\n[Account Mapping]\n221.100: Client Deposits Held -> Supabase 221.100\n004.001: Product Revenue -> Supabase 004.001",
    "clarification": "[Notes]\n- Remaining deposit is the net posted 221.100 balance linked to the deposit invoice, including reversals.\n\n- Requires one transaction and one deposit invoice; ambiguous links stop without posting.",
    "sheet": "Category - Invoice Entry"
  },
  "INV-15": {
    "row": 5,
    "name": "Full or Balance Invoice is created",
    "status": "Fully",
    "trigger": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"",
    "mapping": "[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 004.001\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nProduct Revenue (004.001) -> Supabase 004.001",
    "clarification": "",
    "sheet": "Category - Invoice Entry"
  },
  "INV-16": {
    "row": 6,
    "name": "Full or Balance invoice is paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount x Sum of matching Invoices.Payment Proportion For Batch Allocation\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100",
    "clarification": "[Notes]\n- Product and Non-Product invoices are paid separately.\n\n- Repeated batch payments link the same invoices with unchanged invoice amounts.\n\n[Issues]\n- Possible duplicate cash posting with Category - Payment rows 2/3 if those rules are enabled.",
    "sheet": "Category - Invoice Entry"
  },
  "INV-17": {
    "row": 8,
    "name": "Fixed Asset Purchase Invoice is Paid",
    "status": "Partially",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Payable (211.100) -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "clarification": "[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?",
    "sheet": "Category - Invoice Entry"
  },
  "INV-18": {
    "row": 12,
    "name": "Customer invoice for a non-product charge paid",
    "status": "Fully",
    "trigger": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"",
    "mapping": "[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100",
    "clarification": "[Notes]\n- Product and Non-Product invoices are paid separately.\n\n[Issues]\n- Possible duplicate with Category - Payment rows 18/22/24/26/28 if those rules are enabled.",
    "sheet": "Category - Invoice Entry"
  }
} as const;
