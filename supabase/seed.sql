-- Reference catalog only. No users, accounting periods, journals or financial transactions.
-- Apply with the initial migration on a new database. Never reset a hosted project to load this seed.

insert into public.accounts (code, name, account_type, subtype, normal_balance, is_bank, is_postable, active, description, airtable_record_id)
select code, name, account_type, subtype, normal_balance, is_bank, is_postable, active, description, airtable_record_id from jsonb_populate_recordset(null::public.accounts, '[
  {
    "code": "004.001",
    "name": "Product Revenue – Brass Hardware",
    "account_type": "revenue",
    "subtype": "sales",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "004.003",
    "name": "Freight Charged to Clients",
    "account_type": "revenue",
    "subtype": "sales",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "004.004",
    "name": "Insurance Claim Recoveries",
    "account_type": "revenue",
    "subtype": "other_income",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "004.005",
    "name": "Restocking & Cancellation Fees",
    "account_type": "revenue",
    "subtype": "sales",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "004.006",
    "name": "Sales Returns & Allowances",
    "account_type": "revenue",
    "subtype": "contra_revenue",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "004.010",
    "name": "Cost of Goods Sold",
    "account_type": "expense",
    "subtype": "cogs",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "004.011",
    "name": "Purchase Discounts & Rebates",
    "account_type": "expense",
    "subtype": "contra_cogs",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "004.013",
    "name": "Freight & Handling Cost",
    "account_type": "expense",
    "subtype": "cogs",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "004.015",
    "name": "Inventory / Purchase Price Variance",
    "account_type": "expense",
    "subtype": "cogs",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "005.001",
    "name": "Staff – Owners",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "005.002",
    "name": "Salary – W2",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "005.003",
    "name": "Staff – 1099",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "005.005",
    "name": "401(k) Employer Contribution",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "005.006",
    "name": "Payroll Taxes",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "005.101",
    "name": "Staff – Offshore",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "005.201",
    "name": "Bonus & Commission",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "006.002",
    "name": "Utilities",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "007.002",
    "name": "Bank, Wire & FX Fees",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "007.003",
    "name": "Interest Expense",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "007.005",
    "name": "Bad Debt Expense",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "007.006",
    "name": "Sales Tax Miscalculations",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "007.011",
    "name": "General Insurance",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "008.001",
    "name": "Software Licensing",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "009.101",
    "name": "Depreciation Expense",
    "account_type": "expense",
    "subtype": "depreciation",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "010.001",
    "name": "Miscellaneous Income",
    "account_type": "revenue",
    "subtype": "other_income",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "010.003",
    "name": "Interest & Dividend Income",
    "account_type": "revenue",
    "subtype": "other_income",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "011.001",
    "name": "Federal Income Tax Expense",
    "account_type": "expense",
    "subtype": "income_tax",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "011.002",
    "name": "State Income Tax Expense",
    "account_type": "expense",
    "subtype": "income_tax",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "112.100",
    "name": "Bank – Fifth Third",
    "account_type": "asset",
    "subtype": "bank",
    "normal_balance": "debit",
    "is_bank": true,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "112.200",
    "name": "Cash – Fidelity",
    "account_type": "asset",
    "subtype": "bank",
    "normal_balance": "debit",
    "is_bank": true,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "112.300",
    "name": "Bank – Nickel",
    "account_type": "asset",
    "subtype": "bank",
    "normal_balance": "debit",
    "is_bank": true,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "121.100",
    "name": "Accounts Receivable",
    "account_type": "asset",
    "subtype": "receivable",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "121.900",
    "name": "Allowance for Doubtful Accounts",
    "account_type": "asset",
    "subtype": "contra_asset",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "122.100",
    "name": "Insurance Claims Receivable",
    "account_type": "asset",
    "subtype": "receivable",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "131.100",
    "name": "Inventory – Committed to Client Orders",
    "account_type": "asset",
    "subtype": "inventory",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "131.300",
    "name": "Inventory – On-Hand Stock (Uncommitted)",
    "account_type": "asset",
    "subtype": "inventory",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "131.400",
    "name": "Inventory – Pending Return Processing",
    "account_type": "asset",
    "subtype": "inventory",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "132.100",
    "name": "Vendor Deposits / PO Pre-Payments",
    "account_type": "asset",
    "subtype": "prepaid",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "135.000",
    "name": "Prepaid Expenses",
    "account_type": "asset",
    "subtype": "prepaid",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "143.200",
    "name": "Security Deposits",
    "account_type": "asset",
    "subtype": "other_asset",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "143.300",
    "name": "Display Fixtures & Equipment",
    "account_type": "asset",
    "subtype": "fixed_asset",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "161.000",
    "name": "Accumulated Depreciation",
    "account_type": "asset",
    "subtype": "contra_asset",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "211.100",
    "name": "Accounts Payable",
    "account_type": "liability",
    "subtype": "payable",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "211.200",
    "name": "Received Not Invoiced (GRNI)",
    "account_type": "liability",
    "subtype": "payable",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "212.100",
    "name": "Sales Tax Payable",
    "account_type": "liability",
    "subtype": "tax_payable",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "221.100",
    "name": "Customer Deposits",
    "account_type": "liability",
    "subtype": "customer_funds",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "221.300",
    "name": "Client Credits on Account",
    "account_type": "liability",
    "subtype": "customer_funds",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "231.100",
    "name": "Credit Card Payable",
    "account_type": "liability",
    "subtype": "credit_card",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "231.200",
    "name": "Line of Credit Payable",
    "account_type": "liability",
    "subtype": "debt",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "232.100",
    "name": "Auto Loan Payable",
    "account_type": "liability",
    "subtype": "debt",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "241.100",
    "name": "Accrued Salaries & Wages",
    "account_type": "liability",
    "subtype": "accrued_payroll",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "241.200",
    "name": "Accrued Payroll Taxes",
    "account_type": "liability",
    "subtype": "accrued_payroll",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "241.300",
    "name": "Accrued Bonus & Commission",
    "account_type": "liability",
    "subtype": "accrued_payroll",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "241.400",
    "name": "Accrued 401(k)",
    "account_type": "liability",
    "subtype": "accrued_payroll",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "241.500",
    "name": "Accrued PTO",
    "account_type": "liability",
    "subtype": "accrued_payroll",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "241.600",
    "name": "Employee Benefit Deductions Payable",
    "account_type": "liability",
    "subtype": "accrued_payroll",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "242.100",
    "name": "Accrued Federal Income Tax",
    "account_type": "liability",
    "subtype": "tax_payable",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "242.200",
    "name": "Accrued State Income Tax",
    "account_type": "liability",
    "subtype": "tax_payable",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "311.200",
    "name": "Additional Paid-in Capital",
    "account_type": "equity",
    "subtype": "capital",
    "normal_balance": "credit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "316.100",
    "name": "Shareholder Distributions",
    "account_type": "equity",
    "subtype": "distributions",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  },
  {
    "code": "999.999",
    "name": "Suspense – Under Investigation",
    "account_type": "asset",
    "subtype": "suspense",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "description": null,
    "airtable_record_id": null
  }
]'::jsonb)
on conflict do nothing;

insert into public.account_selectors (selector, description)
select selector, description from jsonb_populate_recordset(null::public.account_selectors, '[
  {
    "selector": "bank",
    "description": "Operating bank: Nickel or Fifth Third"
  },
  {
    "selector": "cogs_or_expense",
    "description": "COGS, or the original expense account for expense credits"
  },
  {
    "selector": "credit_card",
    "description": "Credit Card Payable (AMEX or Visa)"
  },
  {
    "selector": "customer_deposit_or_ar",
    "description": "Customer Deposits or AR, depending on what the payment was applied to"
  },
  {
    "selector": "staff_expense",
    "description": "Staff expense by Employment Type: Offshore / 1099 / Owners"
  },
  {
    "selector": "tech_allowance",
    "description": "Tech Allowance expense (no account code assigned yet in T-Chart)"
  },
  {
    "selector": "vendor_expense",
    "description": "Expense account chosen on the vendor bill / receipt line (any opex; never bank or revenue)"
  }
]'::jsonb)
on conflict do nothing;

insert into public.account_selector_members (selector, account_code)
select selector, account_code from jsonb_populate_recordset(null::public.account_selector_members, '[
  {
    "selector": "bank",
    "account_code": "112.100"
  },
  {
    "selector": "bank",
    "account_code": "112.300"
  },
  {
    "selector": "cogs_or_expense",
    "account_code": "004.010"
  },
  {
    "selector": "cogs_or_expense",
    "account_code": "004.013"
  },
  {
    "selector": "cogs_or_expense",
    "account_code": "004.015"
  },
  {
    "selector": "cogs_or_expense",
    "account_code": "006.002"
  },
  {
    "selector": "cogs_or_expense",
    "account_code": "007.002"
  },
  {
    "selector": "cogs_or_expense",
    "account_code": "007.003"
  },
  {
    "selector": "cogs_or_expense",
    "account_code": "007.005"
  },
  {
    "selector": "cogs_or_expense",
    "account_code": "007.006"
  },
  {
    "selector": "cogs_or_expense",
    "account_code": "007.011"
  },
  {
    "selector": "cogs_or_expense",
    "account_code": "008.001"
  },
  {
    "selector": "credit_card",
    "account_code": "231.100"
  },
  {
    "selector": "customer_deposit_or_ar",
    "account_code": "121.100"
  },
  {
    "selector": "customer_deposit_or_ar",
    "account_code": "221.100"
  },
  {
    "selector": "staff_expense",
    "account_code": "005.001"
  },
  {
    "selector": "staff_expense",
    "account_code": "005.003"
  },
  {
    "selector": "staff_expense",
    "account_code": "005.101"
  },
  {
    "selector": "vendor_expense",
    "account_code": "005.001"
  },
  {
    "selector": "vendor_expense",
    "account_code": "005.002"
  },
  {
    "selector": "vendor_expense",
    "account_code": "005.003"
  },
  {
    "selector": "vendor_expense",
    "account_code": "005.005"
  },
  {
    "selector": "vendor_expense",
    "account_code": "005.006"
  },
  {
    "selector": "vendor_expense",
    "account_code": "005.101"
  },
  {
    "selector": "vendor_expense",
    "account_code": "005.201"
  },
  {
    "selector": "vendor_expense",
    "account_code": "006.002"
  },
  {
    "selector": "vendor_expense",
    "account_code": "007.002"
  },
  {
    "selector": "vendor_expense",
    "account_code": "007.003"
  },
  {
    "selector": "vendor_expense",
    "account_code": "007.005"
  },
  {
    "selector": "vendor_expense",
    "account_code": "007.006"
  },
  {
    "selector": "vendor_expense",
    "account_code": "007.011"
  },
  {
    "selector": "vendor_expense",
    "account_code": "008.001"
  },
  {
    "selector": "vendor_expense",
    "account_code": "009.101"
  }
]'::jsonb)
on conflict do nothing;

insert into public.ledger_rules (rule_code, category, sort_order, trigger_name, when_to_post, fin_notes, dev_notes, audit_trail, airtable_sources, reversible, active, debit_label, credit_label)
select rule_code, category, sort_order, trigger_name, when_to_post, fin_notes, dev_notes, audit_trail, airtable_sources, reversible, active, debit_label, credit_label from jsonb_populate_recordset(null::public.ledger_rules, '[
  {
    "rule_code": "EXP-01",
    "category": "expense",
    "sort_order": 2,
    "trigger_name": "Enter an operating expense invoice (ex: Utilities)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "AP expense invoice linked to Utilities 006.002. Use Invoice Amount and Invoice Date. -- Not PAID, Invoice Date, Daily.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 2\n[Implementation]\nPartially\n\n[Debit]\nInvoice account linked\nExample: Utilities (006.002)\n\n[Credit]\nAccounts Payable (211.100)\n\nDAILY\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"006.002: Utilities\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n006.002: Utilities -> Supabase 006.002\n211.100: Standard Product -> Supabase 211.100\n\n[Issues]\n- Which operating-expense accounts should qualify beyond Utilities 006.002?",
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "Invoice account linked\nExample: Utilities (006.002)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "EXP-02",
    "category": "expense",
    "sort_order": 6,
    "trigger_name": "Company credit-card purchase with NO vendor bill",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button",
    "fin_notes": "Fully Paid AP expense invoice with a linked credit-card payment. Use the invoice account and Invoice Amount. Paid Date, Credit Card Clearing. Has to be posted automatically, not by daily cutoff. Notes from Airtable, not from Vercel",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 6\n[Implementation]\nFully\n\n[Debit]\nInvoice expense account linked\nExamples: Software Licensing (008.001), Travel (009.002)\n\n[Credit]\nCredit Card Payable (231.100)\n\nDAILY\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = true\nInvoices.Linked Chart of Accounts is not empty\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n008.001: Software Licensing -> Supabase 008.001\n009.002: Travel -> Supabase 009.002\n009.006: Dues & Organization Subscription -> Supabase 009.006\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Possible duplicate expense with Expense rows 2/22 or Invoice Entry row 6.",
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "Invoice expense account linked\nExamples: Software Licensing (008.001), Travel (009.002)",
    "credit_label": "Credit Card Payable (231.100)"
  },
  {
    "rule_code": "EXP-03",
    "category": "expense",
    "sort_order": 7,
    "trigger_name": "Prepaid expense bill (pay a year up front, e.g., insurance) - Invoice, not paid",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "AP expense invoice marked as prepaid. Prepaid Expenses (135.000) already exists in the ledger. Use Invoice Date; monthly use-up is recorded from Prepay Expenses Log.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 7\n[Implementation]\nFully\n\n[Debit]\nPrepaid Expenses (135.000)\n\n[Credit]\nAccounts Payable (211.100)\n\nInvoice created, posted daily, that has a prepaid expense account.\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 135.000\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n135.000: Prepaid Assets -> Supabase 135.000\n211.100: Standard Product -> Supabase 211.100\n\n[Issues]\n- Possible duplicate AP posting with Category - Invoice Entry row 8.",
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "Prepaid Expenses (135.000)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "EXP-04",
    "category": "expense",
    "sort_order": 9,
    "trigger_name": "Prepaid expense - monthly use-up (amortization)",
    "when_to_post": "[Record]\nPrepay Expenses Log\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "Use each Prepay Expenses Log record: Amount Deducted and Applied Date. Prepay Log supplies the note.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 9\n[Implementation]\nFully\n\n[Debit]\nInvoice expense account linked\nExample: General Insurance (007.011)\n\n[Credit]\nPrepaid Expenses (135.000)\n\nAutomatic +30 days\n\n[Record]\nPrepay Expenses Log\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nPrepay Expenses Log.Cancel Pre-pay Log = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Prepay Expenses Log.Amount Deducted\nDate = Prepay Expenses Log.Applied Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 135.000\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\nNotes = Prepay Expenses Log.Prepay Log\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n007.011: General Insurance -> Supabase 007.011\n135.000: Prepaid Assets -> Supabase 135.000",
    "audit_trail": null,
    "airtable_sources": "New Process",
    "reversible": true,
    "active": true,
    "debit_label": "Invoice expense account linked\nExample: General Insurance (007.011)",
    "credit_label": "Prepaid Expenses (135.000)"
  },
  {
    "rule_code": "EXP-05",
    "category": "expense",
    "sort_order": 10,
    "trigger_name": "Employee Tech Allowance - Not Paid",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "AP Staff invoice with Tech Allowance 005.102 lines. Sum Line Amount by account and use Branch Employee.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 10\n[Implementation]\nFully\n\n[Debit]\n005.102: Tech Allowance\n\n[Credit]\nAccounts Payable (211.100)\n\nDAILY POSTING\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch Employee\nDebit = 005.102\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.102: Tech Allowance -> Supabase 005.102\n211.100: Standard Product -> Supabase 211.100",
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "005.102: Tech Allowance",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "EXP-06",
    "category": "expense",
    "sort_order": 12,
    "trigger_name": "Payroll - W2 payroll register (per pay date), Owner",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "AP Staff invoice with W2 salary, payroll tax or 401k lines. Sum Line Amount by account into separate journals. Employee benefits 241.600 remain excluded.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 12\n[Implementation]\nFully\n\n[Debit]\n005.001: Salary - Owners\n005.002: Salary - W2\n005.003: Salary - 1099\n005.005: 401K\n005.006: Payroll Taxes\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes any of \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.003: Salary - 1099\", \"005.005: 401K\", \"005.006: Payroll Taxes\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.001: Salary - Owners -> Supabase 005.001\n005.002: Salary - W2 -> Supabase 005.002\n005.003: Salary - 1099 -> Supabase 005.003\n005.005: 401K -> Supabase 005.005\n005.006: Payroll Taxes -> Supabase 005.006\n211.100: Standard Product -> Supabase 211.100\n\n[Issues]\n- Confirm how to record 005.004 insurance deductions. They are excluded from this W2 pair and can make bank postings exceed the actual payment.",
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "005.001: Salary - Owners\n005.002: Salary - W2\n005.003: Salary - 1099\n005.005: 401K\n005.006: Payroll Taxes",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "EXP-07",
    "category": "expense",
    "sort_order": 14,
    "trigger_name": "Payroll - offshore - unpaid",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "AP Staff invoice with offshore, 1099 or owner salary lines. Sum Line Amount by account and accrue to 241.100.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 14\n[Implementation]\nFully\n\n[Debit]\n005.101: Salary - Offshore\n\n[Credit]\nAccounts Payable (211.100)\n\nDAILY POSTING ENTRY, UPON CREATION, INVOICE DATE\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.101: Salary - Offshore\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.101\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.101: Salary - Offshore -> Supabase 005.101\n211.100: Standard Product -> Supabase 211.100",
    "audit_trail": null,
    "airtable_sources": "AP",
    "reversible": true,
    "active": true,
    "debit_label": "005.101: Salary - Offshore",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "EXP-08",
    "category": "expense",
    "sort_order": 28,
    "trigger_name": "(DO NOTE IMPLEMENT) Month-end accrual - PTO liability\n",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n",
    "fin_notes": "Deferred. PTO trigger, amount source and account mapping are not defined.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 28\n[Implementation]\nNot yet\n\n[Debit]\nSalary - W2 (005.002)\n\n[Credit]\nAccrued PTO (241.500)\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n\n[Filters]\n\n[Issues]\n- Deferred: the PTO trigger, amount and account mapping are not defined.",
    "audit_trail": null,
    "airtable_sources": "AP",
    "reversible": true,
    "active": false,
    "debit_label": "Salary - W2 (005.002)",
    "credit_label": "Accrued PTO (241.500)"
  },
  {
    "rule_code": "EXP-09",
    "category": "expense",
    "sort_order": 16,
    "trigger_name": "Payrol - Bonuses (Unpaid)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 16\n[Implementation]\nFully\n\n[Debit]\n005.201: Bonus\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.201\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.201: Bonus -> Supabase 005.201\n211.100: Standard Product -> Supabase 211.100",
    "audit_trail": null,
    "airtable_sources": "FIN: Invoice Lines",
    "reversible": true,
    "active": true,
    "debit_label": "005.201: Bonus",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "EXP-10",
    "category": "expense",
    "sort_order": 20,
    "trigger_name": "Monthly depreciation of equipment, vehicles, fixtures",
    "when_to_post": "[Record]\nDepreciation Table\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "Use the recorded Amount Depreciated and Date from Depreciation Table. Associated Asset supplies the note.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 20\n[Implementation]\nFully\n\n[Debit]\nDepreciation Expense (009.101)\n\n[Credit]\nAccumulated Depreciation (161.000)\n\nDAILY POSTING\n\n[Record]\nDepreciation Table\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\n\n\n[Field Mapping]\nAmount = Depreciation Table.Amount Depreciated\nDate = Depreciation Table.Date\nBranch = Blank\nDebit = 009.101\nCredit = 161.000\n\n[Other Field Mapping]\nNotes = Depreciation Table.Associated Asset\n\n[Account Mapping]\n009.101: Depreciation -> Supabase 009.101\nFixed accumulated depreciation credit -> Supabase 161.000",
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "Depreciation Expense (009.101)",
    "credit_label": "Accumulated Depreciation (161.000)"
  },
  {
    "rule_code": "EXP-11",
    "category": "expense",
    "sort_order": 21,
    "trigger_name": "Bank fees and charges shown only on the bank statement (Unpaid)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "Not Yet Paid Expense Invoice with chart of account, bank wire fees",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 21\n[Implementation]\nFully\n\n[Debit]\nBank, Wire & FX Fees (007.002)\n\n[Credit]\nAccounts Payable (211.100)\n\nDAILY POSTING\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.002\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.002: Bank / Misc. Service Charges -> Supabase 007.002\n211.100: Standard Product -> Supabase 211.100",
    "audit_trail": null,
    "airtable_sources": "AP",
    "reversible": true,
    "active": true,
    "debit_label": "Bank, Wire & FX Fees (007.002)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "EXP-12",
    "category": "expense",
    "sort_order": 23,
    "trigger_name": "Bad-debt reserve (allowance) - month-end\n",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Month-end posting of entries depending on no. of terms  divided by remaining balance on the transaction",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 23\n[Implementation]\nNot yet\n\n[Debit]\nBad Debt Expense (007.005)\n\n[Credit]\nAllowance for Doubtful Accounts (121.900)\n\nApproved Date + 30 days\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"007.005: Bad Debt\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.005\nCredit = 121.900\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.005: Bad Debt -> Supabase 007.005\n121.900: Allowance for Doubtful Accounts -> Supabase 121.900",
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": false,
    "debit_label": "Bad Debt Expense (007.005)",
    "credit_label": "Allowance for Doubtful Accounts (121.900)"
  },
  {
    "rule_code": "EXP-13",
    "category": "expense",
    "sort_order": 26,
    "trigger_name": "Income tax accrual (quarterly)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "AP expense invoice linked to exactly one federal or state income-tax liability account. Use Invoice Amount and Invoice Date.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 26\n[Implementation]\nFully\n\n[Debit]\nFederal Income Tax Expense (011.001)\nState Income Tax Expense (011.002)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoice Lines.Chart of Accounts includes any of \"923100: Federal Income Tax\", \"923300: State Income Tax\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n923100: Federal Income Tax -> Supabase 011.001\n923300: State Income Tax -> Supabase 011.002\n211.100: Standard Product -> Supabase 211.100",
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "Federal Income Tax Expense (011.001)\nState Income Tax Expense (011.002)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "INV-01",
    "category": "invoice_entry",
    "sort_order": 1,
    "trigger_name": "Vendor PRODUCT invoice – goods already received",
    "when_to_post": "When the AP product invoice is saved and matched to its Purchase Order (Invoice Date).",
    "fin_notes": "Gap today: product invoices carry no account. The system must derive these lines from the PO match.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; OPS › KURT - PO / KURT - PO Line",
    "reversible": true,
    "active": false,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "INV-02",
    "category": "invoice_entry",
    "sort_order": 7,
    "trigger_name": "Vendor PRODUCT invoice - price is different from the PO",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: Same event as INV-01, when the invoice amount ≠ received value.\nNote: If the vendor billed LESS, the variance line moves to the credit side.",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 7\n[Implementation]\nNot Yet\n\n[Debit]\nmultiple:\n• Received Not Invoiced (GRNI) (211.200)\n• Inventory / Purchase Price Variance (004.015)\n\n[Credit]\nAP (211.100)\n\nDeferred. Price-variance filters, amount and account mapping are not defined.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\n\n[Issues]\n- Deferred: price-variance filters, amount and account mapping are not defined.",
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices\nOPS › KURT - PO Line\nOPS › Price Discrepancies",
    "reversible": true,
    "active": false,
    "debit_label": "multiple:\n• Received Not Invoiced (GRNI) (211.200)\n• Inventory / Purchase Price Variance (004.015)",
    "credit_label": "AP (211.100)"
  },
  {
    "rule_code": "INV-03",
    "category": "invoice_entry",
    "sort_order": 3,
    "trigger_name": "Vendor DEPOSIT invoice – billed before the goods ship",
    "when_to_post": "When the vendor deposit invoice is saved, before any receipt on that PO.",
    "fin_notes": "Applied later when the goods arrive (OTH-12).",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; FIN › Vendors; FIN › Purchase Orders",
    "reversible": true,
    "active": false,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "INV-04",
    "category": "invoice_entry",
    "sort_order": 4,
    "trigger_name": "Vendor invoice for inbound freight / handling on a PO",
    "when_to_post": "When the invoice is saved (Invoice Date).",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "OPS › KURT - PO; FIN › Invoices",
    "reversible": true,
    "active": false,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "INV-05",
    "category": "invoice_entry",
    "sort_order": 5,
    "trigger_name": "Carrier invoice for OUTBOUND shipping to clients",
    "when_to_post": "When the carrier invoice is saved (Invoice Date).",
    "fin_notes": "Never use 004.003 for this. 004.003 is freight we CHARGE clients (revenue).",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices",
    "reversible": true,
    "active": false,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "INV-06",
    "category": "invoice_entry",
    "sort_order": 6,
    "trigger_name": "Sales tax remittance invoice (paying the state)",
    "when_to_post": "When the state sales-tax return/invoice is saved.",
    "fin_notes": "If the return differs from the tax we recorded, post the difference to 007.006 Sales Tax Miscalculations.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; FIN › States & Sales Tax Rates",
    "reversible": true,
    "active": false,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "INV-07",
    "category": "invoice_entry",
    "sort_order": 8,
    "trigger_name": "Fixed asset purchase invoice (vehicle, fixtures, software) Created",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Record the asset invoice on Invoice Date. Create the related asset record for depreciation under Category - Expenses row 11 (EXP-10).",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 8\n[Implementation]\nFully\n\n[Debit]\nSample:\nDisplay Fixtures & Equipment (143.300)\n\n[Credit]\nAP (211.100)\n\nDaily\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 143.300\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.300: Display Fixtures & Equipment -> Supabase 143.300\n211.100: Standard Product -> Supabase 211.100\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices\nAP › Invoices\nFIN › Asset Table",
    "reversible": true,
    "active": true,
    "debit_label": "Sample:\nDisplay Fixtures & Equipment (143.300)",
    "credit_label": "AP (211.100)"
  },
  {
    "rule_code": "INV-08",
    "category": "invoice_entry",
    "sort_order": 10,
    "trigger_name": "Vendor CREDIT MEMO - returned goods (RGA return for credit)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the AP credit invoice is created, link chart of account to Inventory.",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 10\n[Implementation]\nFully\n\n[Debit]\nAP (211.100)\n\n[Credit]\nInventory - Pending Return Processing (131.400)\n\nAP Credit invoice with a Related Purchase Order. Use Invoice Amount and Invoice Date.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is not empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 131.400\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n131.400: Pending Return Processing -> Supabase 131.400\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices\nOPS › KURT - PO",
    "reversible": true,
    "active": true,
    "debit_label": "AP (211.100)",
    "credit_label": "Inventory - Pending Return Processing (131.400)"
  },
  {
    "rule_code": "INV-09",
    "category": "invoice_entry",
    "sort_order": 11,
    "trigger_name": "Vendor CREDIT MEMO - price credit, no goods returned",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the AP credit invoice is saved (RGA Outcome = ''No Return, Credit Only'' or a price credit).",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 11\n[Implementation]\nPartially\n\n[Debit]\nAP (211.100)\n\n[Credit]\nCOGS (004.010), or the original expense account for expense credits\n\nAP Credit invoice without a Related Purchase Order. COGS 004.010 is mapped; the original-expense alternative remains pending.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.010\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.010: Cost of Goods Sold -> Supabase 004.010\n\n\n[Notes]\n- Only COGS 004.010 is mapped for now.\n\n[Issues]\n- Which account should receive a credit originally charged to an expense?",
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices",
    "reversible": true,
    "active": true,
    "debit_label": "AP (211.100)",
    "credit_label": "COGS (004.010), or the original expense account for expense credits"
  },
  {
    "rule_code": "INV-10",
    "category": "invoice_entry",
    "sort_order": 12,
    "trigger_name": "Customer invoice for a NON-product charge Created",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the AR non-product invoice is saved (Invoice Date).",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 12\n[Implementation]\nFully\n\n[Debit]\nAR (121.100)\n\n[Credit]\nInvoice Account Linked\n004.002: Coordination Fees Charged\n\nAR Non-Product invoice linked to Misc. Income 010.001. Use Invoice Amount and Invoice Date.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"010.001: Misc. Income\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 010.001\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n121.100: Standard -> Supabase 121.100\n010.001: Misc. Income -> Supabase 010.001\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices",
    "reversible": true,
    "active": true,
    "debit_label": "AR (121.100)",
    "credit_label": "Invoice Account Linked\n004.002: Coordination Fees Charged"
  },
  {
    "rule_code": "INV-11",
    "category": "invoice_entry",
    "sort_order": 14,
    "trigger_name": "Customer credit memo for a RETURN",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Deferred. Once the return credit is defined, client cash refunds are Category - Payment row 6 (PAY-05); credit applications are OTH-23.",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 14\n[Implementation]\nNot Yet\n\n[Debit]\nmultiple:\n• Sales Returns & Allowances (004.006)\n• Sales Tax Payable - ship-to state (212.100)\n\n[Credit]\nmultiple:\n• Client Credits on Account (221.300)\n• Restocking & Cancellation Fees (004.005)\n\nDeferred. Return-credit filters, amount and account mapping are not defined.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\n\n[Issues]\n- Deferred: return-credit filters, amount and account mapping are not defined.",
    "audit_trail": null,
    "airtable_sources": "Schedules & Transactions › Transaction",
    "reversible": true,
    "active": false,
    "debit_label": "multiple:\n• Sales Returns & Allowances (004.006)\n• Sales Tax Payable - ship-to state (212.100)",
    "credit_label": "multiple:\n• Client Credits on Account (221.300)\n• Restocking & Cancellation Fees (004.005)"
  },
  {
    "rule_code": "OTH-01",
    "category": "other",
    "sort_order": 1,
    "trigger_name": "Vendor PRICE INCREASE – goods received in a closed month, still in our warehouse",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; OPS › KURT - PO Line; OPS › Price Discrepancies",
    "reversible": true,
    "active": true,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "OTH-02",
    "category": "other",
    "sort_order": 2,
    "trigger_name": "Vendor PRICE INCREASE – goods already SOLD to the client in a closed month",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "Schedules & Transactions › Shipping Record",
    "reversible": true,
    "active": true,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "OTH-03",
    "category": "other",
    "sort_order": 3,
    "trigger_name": "Vendor PRICE INCREASE – some units sold, some still in stock",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "OPS › KURT - PO Line; Schedules & Transactions › Main - Tag / Item Assigned",
    "reversible": true,
    "active": true,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "OTH-04",
    "category": "other",
    "sort_order": 4,
    "trigger_name": "Vendor SUPPLEMENTAL bill for a price increase after the original bill was booked in a closed month",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; OPS › Price Discrepancies",
    "reversible": true,
    "active": true,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "OTH-05",
    "category": "other",
    "sort_order": 5,
    "trigger_name": "Vendor PRICE DECREASE / credit after the month closed (goods already sold)",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; OPS › Price Discrepancies",
    "reversible": true,
    "active": true,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "OTH-06",
    "category": "other",
    "sort_order": 6,
    "trigger_name": "CUSTOMER PRICE INCREASE – order already shipped and recorded in a closed month",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; Schedules & Transactions › Main - Tag / Item Assigned",
    "reversible": true,
    "active": true,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "OTH-07",
    "category": "other",
    "sort_order": 7,
    "trigger_name": "Correcting a WRONG ACCOUNT used in a closed month (e.g., carrier bill coded to revenue)",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices",
    "reversible": true,
    "active": true,
    "debit_label": null,
    "credit_label": null
  },
  {
    "rule_code": "PAY-01",
    "category": "payment",
    "sort_order": 2,
    "trigger_name": "CUSTOMER DEPOSIT RECEIVED (before the order is processed)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Record the AR Product receipt as a customer deposit when Payment Date is on or before first shipment, or shipment is blank.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 2\n[Implementation]\nFully\n\n[Debit]\nBank (Nickel/Fifth Third)\n\n[Credit]\nCustomer Deposits (221.100)\n\nAR Product receipt dated on or before first shipment, or with no shipment date. Use the payment Amount.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Product\"\n(Invoices.First Ship Out Date (from Linked Transaction) IS EMPTY\nOR\nPayments.Payment Date <= Invoices.First Ship Out Date (from Linked Transaction))\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 221.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n\n[Issues]\n- [Risk] Possible duplicate bank debit with Category - Payment row 4 if this receipt already includes the overpayment.",
    "audit_trail": null,
    "airtable_sources": "FIN › Payments\nAR › Payments - NEW\nSchedules & Transactions › Transaction",
    "reversible": true,
    "active": true,
    "debit_label": "Bank (Nickel/Fifth Third)",
    "credit_label": "Customer Deposits (221.100)"
  },
  {
    "rule_code": "PAY-02",
    "category": "payment",
    "sort_order": 3,
    "trigger_name": "Customer payment AFTER the order shipped (credit-terms clients)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the payment is applied to an invoice whose goods have already shipped.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 3\n[Implementation]\nFully\n\n[Debit]\nBank (Nickel/Fifth Third)\n\n[Credit]\nAR (121.100)\n\nAR Product receipt dated after first shipment. Use the payment Amount.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Product\"\nPayments.Payment Date > Invoices.First Ship Out Date (from Linked Transaction)\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n\n\n[Issues]\n- [Risk] Possible duplicate bank debit with Category - Payment row 4 if this receipt already includes the overpayment.",
    "audit_trail": null,
    "airtable_sources": "FIN › Payments\nAR › Payments - NEW\nAR › Invoices",
    "reversible": true,
    "active": true,
    "debit_label": "Bank (Nickel/Fifth Third)",
    "credit_label": "AR (121.100)"
  },
  {
    "rule_code": "PAY-03",
    "category": "payment",
    "sort_order": 4,
    "trigger_name": "Client OVERPAYS or pays with no invoice to apply it to",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Use the refund/credit payment amount to record credit available for another order.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 4\n[Implementation]\nPartially\n\n[Debit]\nBank (Nickel/Fifth Third)\n\n[Credit]\nClient Credits on Account (221.300)\n\n\nAR refund/credit payment applied as credit to another order. Use the credit payment Amount.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Refund/Credit\"\nInvoices.Method of Application = \"Credit to Another Order\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 221.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n\n\n[Issues]\n- [Risk] Category - Payment rows 2 or 3 may already include the overpayment in their bank debit. Should the later credit-payment entry debit the bank again?\n\n- How should a receipt with no linked invoice be handled? This row currently needs a refund/credit invoice.",
    "audit_trail": null,
    "airtable_sources": "AR › Payments - NEW\n",
    "reversible": true,
    "active": true,
    "debit_label": "Bank (Nickel/Fifth Third)",
    "credit_label": "Client Credits on Account (221.300)\n"
  },
  {
    "rule_code": "PAY-04",
    "category": "payment",
    "sort_order": 5,
    "trigger_name": "Small short-pay / rounding difference written off",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Write off verified shortfalls up to $5 and small overpayments up to $1 using the official Mapping.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 5\n[Implementation]\nFully\n\n[Debit]\nBank, Wire & FX Fees (007.002)\n\n[Credit]\nAR (121.100)\n\nWrite off an overpayment up to $1 per payment or a verified underpayment up to $5 once per invoice.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Product\"\nAND (\n(\nPayments.Overpaid Amount > 0\nAND Payments.Overpaid Amount <= 1\n)\nOR\n(\nInvoices.Invoice Remaining Balance > 0\nAND Invoices.Invoice Remaining Balance <= 5\n)\n)\n\n[Field Mapping]\nAmount = Payments.Overpaid Amount (overpaid) or Invoices.Invoice Remaining Balance (underpaid)\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 007.002\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n\n[Issues]\n- [Risk] Small overpayments use the same debit 007.002 / credit 121.100 as short-pay write-offs.",
    "audit_trail": null,
    "airtable_sources": "FIN › Payments\nAR › Payments - NEW",
    "reversible": true,
    "active": true,
    "debit_label": "Bank, Wire & FX Fees (007.002)",
    "credit_label": "AR (121.100)"
  },
  {
    "rule_code": "PAY-05",
    "category": "payment",
    "sort_order": 6,
    "trigger_name": "Refund to a client - by bank / check\n",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the refund payment is sent.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 6\n[Implementation]\nFully\n\n[Debit]\nCustomer Deposits (221.100)\n\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nAR refund/credit payment with Method of Application = Cash Refund.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Refund/Credit\"\nInvoices.Method of Application = \"Cash Refund\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 221.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices\nFIN › Payments",
    "reversible": true,
    "active": true,
    "debit_label": "Customer Deposits (221.100)\n",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-06",
    "category": "payment",
    "sort_order": 7,
    "trigger_name": "Client payment voided / bounced\n",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Record the cancellation on Payment Cancelled Date. Retain the original payment record.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 7\n[Implementation]\nPartially\n\n[Debit]\nCustomer Deposits (221.100) or \nAR (121.100)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nCancelled AR Product payment. Choose the deposit or receivable account from the payment and shipment dates. The new cancellation/deletion workflow is deferred.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Cancel Payment = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Product\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Cancelled Date\nBranch = Invoices.Branch\nDebit = 221.100 when either date is empty or Payment Date <= first ship date, otherwise 121.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nClient Reference = Invoices.Linked Client (FIN)\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n\n\n[Notes]\n- The new payment cancellation and deletion workflow is deferred.\n\n[Issues]\n- How should we split a cancellation across invoices with zero or mixed-sign Amount To Pay?",
    "audit_trail": null,
    "airtable_sources": "FIN › Payments\n",
    "reversible": true,
    "active": true,
    "debit_label": "Customer Deposits (221.100) or \nAR (121.100)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-07",
    "category": "payment",
    "sort_order": 8,
    "trigger_name": "Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Payment, row 8\n[Implementation]\nFully\n\n[Debit]\nAP (211.100)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nRegular AP Product payment by a listed bank method, linked to a PO or vendor. Return Payment (AP) must be unchecked.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Product\"\nPayments.Return Payment (AP) = \"unchecked\"\nPayments.Payment Record Type = \"Regular Payment\"\n(Invoices.Related Purchase Order IS NOT EMPTY\nOR\nInvoices.Linked Vendors IS NOT EMPTY)\nPayments.Method - AP IN (\"Nickel Check\", \"Wise\", \"Our ACH / Wire\", \"Vendor ACH / Wire\", \"Paper Check\")\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n\n\n[Issues]\n- [Gap] This row handles AP Product only. Which category should settle AP expense bills paid from the bank?",
    "audit_trail": null,
    "airtable_sources": "AP › Payments - NEW\nFIN › Payments",
    "reversible": true,
    "active": true,
    "debit_label": "AP (211.100)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-08",
    "category": "payment",
    "sort_order": 9,
    "trigger_name": "Pay a vendor with the company credit card",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Use Payment Date for AP Product payments made through Credit Card Clearing 231.100.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 9\n[Implementation]\nFully\n\n[Debit]\nAP (211.100)\n\n\n[Credit]\nCredit Card Payable (AMEX or Visa)\n\n\nRegular AP Product payment linked to Credit Card Clearing 231.100 and a PO or vendor.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Product\"\nPayments.Account to Pay/Receive CONTAINS ANY (\"231.100: Credit Card Clearing\")\n(Invoices.Related Purchase Order IS NOT EMPTY\nOR\nInvoices.Linked Vendors IS NOT EMPTY)\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n\n[Notes]\n- Category - Expenses row 3 records a direct card purchase; it does not clear an earlier AP expense bill.\n\n[Issues]\n- [Gap] This row handles AP Product only. Which category should clear Accounts Payable for an expense bill paid by card?",
    "audit_trail": null,
    "airtable_sources": "AP › Payments - NEW\nFIN › Payments",
    "reversible": true,
    "active": true,
    "debit_label": "AP (211.100)\n",
    "credit_label": "Credit Card Payable (AMEX or Visa)\n"
  },
  {
    "rule_code": "PAY-09",
    "category": "payment",
    "sort_order": 10,
    "trigger_name": "Pay the credit-card statement\n",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the card batch payment is sent (Payment Record Type = ''CC Batch Payment'').",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 10\n[Implementation]\nFully\n\n[Debit]\nCredit Card Payable (AMEX or Visa)\n\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nCC Batch Payment with linked mini-payments and a selected bank account.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Payment Record Type = \"CC Batch Payment\"\nPayments.Linked Mini-Payments from This Batch IS NOT EMPTY\nPayments.Account to Pay/Receive CONTAINS ANY (\"112.100: Fifth Third Bank\", \"0747: Nickel Operating Account\", \"112.200: Fidelity\")\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 231.100\nCredit = Payments.Account to Pay/Receive\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": true,
    "debit_label": "Credit Card Payable (AMEX or Visa)\n",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-10",
    "category": "payment",
    "sort_order": 11,
    "trigger_name": "Early-payment discount taken when paying a vendor",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Use non-expired discount lines from a Fully Paid AP invoice. Credit account mapping remains unresolved.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 11\n[Implementation]\nPartially\n\n[Debit]\nAP (211.100)\n\n[Credit]\nmultiple:\n• Bank - Fifth Third/Nickel\n• Purchase Discounts & Rebates (004.011)\n\nFully Paid AP invoice with non-expired discount lines. Use line amounts grouped by account; credit mapping remains pending.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Discount Lines Total != 0\nInvoice Lines.Line Type = \"Discount\"\nInvoice Lines.Discount Line Status != \"Expired\"\n\n[Field Mapping]\nAmount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Pending\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n\n[Notes]\n- This category is blocked until the discount credit mapping is resolved.\n\n[Issues]\n- Which credit account should receive the discount? If it uses more than one account, how should the amount be split?",
    "audit_trail": null,
    "airtable_sources": "FIN › Invoice Lines\nFIN › Vendors",
    "reversible": true,
    "active": true,
    "debit_label": "AP (211.100)",
    "credit_label": "multiple:\n• Bank - Fifth Third/Nickel\n• Purchase Discounts & Rebates (004.011)"
  },
  {
    "rule_code": "PAY-11",
    "category": "payment",
    "sort_order": 12,
    "trigger_name": "Bill paid using vendor credits (no cash)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Use Credits Applied from a Fully Paid AP invoice with a Sent payment. Keep separate bill and source-credit references.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 12\n[Implementation]\nFully\n\n[Debit]\nAP (211.100)\n\n[Credit]\nAP (211.100)\n\nFully Paid AP invoice using vendor credits. Use Credits Applied and retain separate bill and source-credit references.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Credits Applied != 0\n\n[Field Mapping]\nAmount = Invoices.Credits Applied\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100 (bill)\nCredit = 211.100 (source credit invoice)\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n",
    "audit_trail": null,
    "airtable_sources": "AP › Payments - NEW\nFIN › Invoices",
    "reversible": true,
    "active": true,
    "debit_label": "AP (211.100)",
    "credit_label": "AP (211.100)"
  },
  {
    "rule_code": "PAY-12",
    "category": "payment",
    "sort_order": 13,
    "trigger_name": "Vendor payment cancelled / returned",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Record a cancelled AP payment or a Sent AP return using the payment Amount and mapped date. Retain the original payment record.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 13\n[Implementation]\nPartially\n\n[Debit]\nBank - Fifth Third (112.100)\n\n[Credit]\nAP (211.100)\n\nCancelled AP payment, or a Sent AP payment marked Return Payment (AP). Use the payment Amount and mapped date.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Invoice Type = \"AP\"\nAND (\nPayments.Cancel Payment = \"checked\"\nOR (\nPayments.Sent = \"checked\"\nAND Payments.Return Payment (AP) = \"checked\"\n)\n)\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Cancelled Date (cancelled) or Payments.Payment Date (returned)\nBranch = blank\nDebit = 112.100\nCredit = 211.100\n\n\n[Notes]\n- The new payment cancellation and deletion workflow is deferred.",
    "audit_trail": null,
    "airtable_sources": "AP › Payments - NEW",
    "reversible": true,
    "active": true,
    "debit_label": "Bank - Fifth Third (112.100)",
    "credit_label": "AP (211.100)"
  },
  {
    "rule_code": "PAY-13",
    "category": "payment",
    "sort_order": 14,
    "trigger_name": "Vendor sends us a refund",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the vendor refund is received.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 14\n[Implementation]\nFully\n\n[Debit]\nBank (Fifth Third / Nickel / Fidelity)\n\n[Credit]\nAP (211.100)\n\nSent AP Credit payment received into the selected payment account. Use the payment Amount.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Credit\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": true,
    "debit_label": "Bank (Fifth Third / Nickel / Fidelity)",
    "credit_label": "AP (211.100)"
  },
  {
    "rule_code": "PAY-14",
    "category": "payment",
    "sort_order": 15,
    "trigger_name": "Payroll - pay employees and remit taxes/deductions",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Deferred. Separate payroll-processor payment routing is not defined.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 15\n[Implementation]\nNot yet\n\n[Debit]\nmultiple:\n• Accrued Salaries & Wages (241.100)\n• Accrued Payroll Taxes (241.200)\n• Accrued 401(k) (241.400)\n• Employee Benefit Deductions Payable (241.600)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nDeferred. Payroll payment filters, amount and account mapping are not defined.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPending - deferred\n\n[Field Mapping]\nPending\n\n[Account Mapping]\nPending\n\n\n[Issues]\n- Deferred: payroll payment filters, amount and account mapping are not defined.",
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": false,
    "debit_label": "multiple:\n• Accrued Salaries & Wages (241.100)\n• Accrued Payroll Taxes (241.200)\n• Accrued 401(k) (241.400)\n• Employee Benefit Deductions Payable (241.600)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-15",
    "category": "payment",
    "sort_order": 16,
    "trigger_name": "Pay offshore / 1099 / owner staff (Wise, ACH)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the payment is sent.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 16\n[Implementation]\nPartially\n\n[Debit]\nmultiple:\n• Accrued Salaries & Wages (241.100)\n• Bank, Wire & FX Fees (007.002)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nStaff payment clearing wages, payroll tax and 401k liabilities from invoice lines. Sum by account. Bank wire/FX fees and employee benefits are excluded.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Staff\"\nInvoice Lines.Chart of Accounts CONTAINS ANY (\"005.101: Salary - Offshore\", \"005.003: Salary - 1099\", \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.006: Payroll Taxes\", \"005.005: 401K\")\n\n[Field Mapping]\nAmount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 241.100 for line accounts 005.101 / 005.003 / 005.001 / 005.002\nDebit = 241.200 for line account 005.006\nDebit = 241.400 for line account 005.005\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n241.100: Accrued, unpaid salary -> Supabase 241.100\n241.200: Accrued, unpaid payroll taxes -> Supabase 241.200\n241.400: Accrued, unpaid 401k -> Supabase 241.400\n\n\n[Notes]\n- Bank wire and FX fees are excluded for now.\n\n- Employee benefits are excluded. See the account question in Category - Expenses row 7.\n\n[Issues]\n- Which field supplies bank wire and FX fees?\n\n- [Risk] Partial payments can repeat the full invoice-line amounts. How should those amounts be split between payments?",
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": true,
    "debit_label": "multiple:\n• Accrued Salaries & Wages (241.100)\n• Bank, Wire & FX Fees (007.002)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-16",
    "category": "payment",
    "sort_order": 17,
    "trigger_name": "Loan payment (principal + interest)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Use separately coded principal and interest invoice lines. Date the entry with Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 17\n[Implementation]\nFully\n\n[Debit]\nmultiple:\n• Auto Loan Payable (232.100)\n• Interest Expense (007.003)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nAuto-loan principal 232.100 and related interest 007.003 from invoice lines. Sum by account into separate journals.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoice Lines.Chart of Accounts CONTAINS ANY (\"232.100: Auto Loan Payable\")\n\n[Field Mapping]\nAmount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts (232.100 or 007.003)\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n232.100: Auto Loan Payable -> Supabase 232.100\n007.003: Interest Expense -> Supabase 007.003\n\n\n[Notes]\n- Ambiguous interest is blocked.\n\n[Issues]\n- Which principal should an interest line follow when both loan and LOC principal are linked? See Category - Payment row 19.\n\n- [Risk] Partial payments can repeat the full invoice-line amounts. How should those amounts be split between payments?",
    "audit_trail": null,
    "airtable_sources": "FIN › Debt Amortization Table\nFIN › Debt Holder",
    "reversible": true,
    "active": true,
    "debit_label": "multiple:\n• Auto Loan Payable (232.100)\n• Interest Expense (007.003)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-17",
    "category": "payment",
    "sort_order": 18,
    "trigger_name": "Line of credit - borrow (draw)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the draw hits the bank.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 18\n[Implementation]\nFully\n\n[Debit]\nBank (Fifth Third/Nickel)\n\n[Credit]\nLine of Credit Payable (231.200)\n\nAR Non-Product receipt linked to Line of Credit Payable 231.200.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"231.200: Note Payable Line of Credit\")\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 231.200\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n",
    "audit_trail": null,
    "airtable_sources": "None today (new feed / manual)",
    "reversible": true,
    "active": true,
    "debit_label": "Bank (Fifth Third/Nickel)",
    "credit_label": "Line of Credit Payable (231.200)"
  },
  {
    "rule_code": "PAY-18",
    "category": "payment",
    "sort_order": 19,
    "trigger_name": "Line of credit - repay",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the repayment leaves the bank.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 19\n[Implementation]\nFully\n\n[Debit]\nmultiple:\n• Line of Credit Payable (231.200)\n• Interest Expense (007.003)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nLOC principal 231.200 and related interest 007.003 from invoice lines. Sum by account into separate journals.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoice Lines.Chart of Accounts CONTAINS ANY (\"231.200: Note Payable Line of Credit\")\n\n[Field Mapping]\nAmount = SUM(Invoice Lines.Line Amount) per Invoice Lines.Chart of Accounts\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts (231.200 or 007.003)\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.200: Note Payable Line of Credit -> Supabase 231.200\n007.003: Interest Expense -> Supabase 007.003\n\n\n[Notes]\n- Ambiguous interest is blocked.\n\n[Issues]\n- Which principal should an interest line follow when both LOC and loan principal are linked? See Category - Payment row 17.\n\n- [Risk] Partial payments can repeat the full invoice-line amounts. How should those amounts be split between payments?",
    "audit_trail": null,
    "airtable_sources": "None today (new feed / manual)",
    "reversible": true,
    "active": true,
    "debit_label": "multiple:\n• Line of Credit Payable (231.200)\n• Interest Expense (007.003)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-19",
    "category": "payment",
    "sort_order": 20,
    "trigger_name": "Move money between our own bank accounts",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Record the transfer on Payment Date, with one journal for each bank account pair.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 20\n[Implementation]\nFully\n\n[Debit]\nBank - Nickel (112.300)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nTransfer between the payment-selected and invoice-selected bank accounts. Follow the debit and credit direction in Mapping.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"112.100: Fifth Third Bank\", \"0747: Nickel Operating Account\", \"112.200: Fidelity\")\nPayments.Account to Pay/Receive CONTAINS ANY (\"112.100: Fifth Third Bank\", \"0747: Nickel Operating Account\", \"112.200: Fidelity\")\nPayments.Account to Pay/Receive != Invoices.Linked Chart of Accounts\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n\n\n[Issues]\n- The Debit column names Nickel, but Actual Mapping uses the payment-selected bank. Should the Debit column be updated?",
    "audit_trail": null,
    "airtable_sources": "FIN › Chart of Accounts",
    "reversible": true,
    "active": true,
    "debit_label": "Bank - Nickel (112.300)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-20",
    "category": "payment",
    "sort_order": 21,
    "trigger_name": "Owner distribution paid",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the distribution is paid (approved by owners).",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 21\n[Implementation]\nFully\n\n[Debit]\nShareholder Distributions (316.100)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nAP expense payment linked to distributions account 316.100.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"316.100: Prior to Current Year Distributions\")\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 316.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Direct Journal Entries",
    "reversible": true,
    "active": true,
    "debit_label": "Shareholder Distributions (316.100)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-21",
    "category": "payment",
    "sort_order": 22,
    "trigger_name": "Owner puts money into the company",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the contribution is received.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 22\n[Implementation]\nFully\n\n[Debit]\nBank (Nickel/Fifth Third)\n\n[Credit]\nAdditional Paid-in Capital (311.200)\n\nAR Non-Product receipt linked to paid-in capital account 311.200.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"311.200: Paid in Capital\")\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 311.200\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Direct Journal Entries",
    "reversible": true,
    "active": true,
    "debit_label": "Bank (Nickel/Fifth Third)",
    "credit_label": "Additional Paid-in Capital (311.200)"
  },
  {
    "rule_code": "PAY-22",
    "category": "payment",
    "sort_order": 23,
    "trigger_name": "Income tax payment",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "When: When the tax payment is made.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 23\n[Implementation]\nFully\n\n[Debit]\nmultiple:\n• Accrued Federal Income Tax (242.100)\n• Accrued State Income Tax (242.200)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nAP expense payment linked to federal or state income-tax payable. Group the mapped account components into separate journals.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"242.100: Accrued Federal Income Taxes\", \"242.200: Accrued State Income Taxes\")\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts (242.100 or 242.200)\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n242.100: Accrued Federal Income Taxes -> Supabase 242.100\n242.200: Accrued State Income Taxes -> Supabase 242.200\n",
    "audit_trail": null,
    "airtable_sources": "None today (new feed / manual)",
    "reversible": true,
    "active": true,
    "debit_label": "multiple:\n• Accrued Federal Income Tax (242.100)\n• Accrued State Income Tax (242.200)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-23",
    "category": "payment",
    "sort_order": 24,
    "trigger_name": "Insurance claim payout received",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Use Payment Date for the Sent insurance receipt. The debit account and amount split remain unresolved.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 24\n[Implementation]\nPartially\n\n[Debit]\nmultiple:\n• Bank - Fifth Third (112.100)\n• Insurance Claim Recoveries (004.004)\n\n[Credit]\nInsurance Claims Receivable (122.100)\n\nAR Non-Product insurance receipt linked to 122.100. The debit account and component split remain pending.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"122.100\")\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Pending\nCredit = 122.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n\n[Notes]\n- This category is blocked until the insurance debit split and receivable mapping are resolved.\n\n[Issues]\n- How much should debit Fifth Third 112.100, and how much should debit Insurance Claim Recoveries 004.004?\n\n- Which FIN account should map to insurance receivable 122.100? That account is missing.",
    "audit_trail": null,
    "airtable_sources": "Schedules & Transactions › Claims Manager",
    "reversible": true,
    "active": true,
    "debit_label": "multiple:\n• Bank - Fifth Third (112.100)\n• Insurance Claim Recoveries (004.004)",
    "credit_label": "Insurance Claims Receivable (122.100)"
  },
  {
    "rule_code": "PAY-24",
    "category": "payment",
    "sort_order": 25,
    "trigger_name": "Security deposit paid (lease)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Record the security-deposit payment using Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 25\n[Implementation]\nFully\n\n[Debit]\nSecurity Deposits (143.200)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nAP expense payment linked to Security Deposits 143.200.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AP\"\nPayments.Vendor Type = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"143.200: Security Deposits\")\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 143.200\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Direct Journal Entries",
    "reversible": true,
    "active": true,
    "debit_label": "Security Deposits (143.200)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-25",
    "category": "payment",
    "sort_order": 26,
    "trigger_name": "Interest / dividends received (Fidelity)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Use the linked interest/dividend Invoice Amount and Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 26\n[Implementation]\nFully\n\n[Debit]\nCash - Fidelity (112.200)\n\n[Credit]\nInterest & Dividend Income (010.003)\n\nAR Non-Product invoice linked to Interest and Dividends 010.003. Use the signed Invoice Amount on Payment Date.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"010.003: Interest and Dividends\")\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 112.200\nCredit = 010.003\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Income Statement - NEW",
    "reversible": true,
    "active": true,
    "debit_label": "Cash - Fidelity (112.200)",
    "credit_label": "Interest & Dividend Income (010.003)"
  },
  {
    "rule_code": "PAY-26",
    "category": "payment",
    "sort_order": 27,
    "trigger_name": "Bank reconciliation rounding difference",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Use the signed Reconciled Amount Discrepancy and Reconciliation Date - Combined.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 27\n[Implementation]\nFully\n\n[Debit]\nBank, Wire & FX Fees (007.002)\n\n[Credit]\nBank (Nickel/Fifth Third)\n\nReconciled payment with a nonzero signed Reconciled Amount Discrepancy. Use Reconciliation Date - Combined.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Reconciled = \"checked\"\nPayments.Reconciled Amount Discrepancy != 0\n\n[Field Mapping]\nAmount = Payments.Reconciled Amount Discrepancy\nDate = Payments.Reconciliation Date - Combined\nBranch = blank\nDebit = 007.002\nCredit = Payments.Account to Pay/Receive\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n",
    "audit_trail": null,
    "airtable_sources": "AP › Payments - NEW\nFIN › Payments",
    "reversible": true,
    "active": true,
    "debit_label": "Bank, Wire & FX Fees (007.002)",
    "credit_label": "Bank (Nickel/Fifth Third)"
  },
  {
    "rule_code": "PAY-27",
    "category": "payment",
    "sort_order": 28,
    "trigger_name": "Credit-card rebate earned (cash back)",
    "when_to_post": "[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button",
    "fin_notes": "Record Purchased Discounts & Rebate Total from a Fully Paid AR Non-Product invoice linked to a Sent payment.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 28\n[Implementation]\nFully\n\n[Debit]\nCredit Card Payable (231.100)\n\n[Credit]\nPurchase Discounts & Rebates (004.011)\n\nFully Paid AR Non-Product invoice linked to 004.011 and a Sent payment. Use Purchased Discounts & Rebate Total.\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nPayments.Sent = \"checked\"\nPayments.Invoice Type = \"AR\"\nPayments.Vendor Type = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts CONTAINS ANY (\"004.011: Purchased Discounts\n  & Rebate\")\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Purchased Discounts & Rebate Total != 0\n\n[Field Mapping]\nAmount = Invoices.Purchased Discounts & Rebate Total\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 231.100\nCredit = 004.011\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client (FIN)\nStaff Reference = Invoices.Linked Staff (FIN)\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState Reference = Invoices.States & Sales Tax Rates\n",
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": true,
    "debit_label": "Credit Card Payable (231.100)",
    "credit_label": "Purchase Discounts & Rebates (004.011)"
  },
  {
    "rule_code": "EXP-14",
    "category": "expense",
    "sort_order": 3,
    "trigger_name": "When operating expenses are paid",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 3\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"006.002: Utilities\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"
  },
  {
    "rule_code": "EXP-15",
    "category": "expense",
    "sort_order": 4,
    "trigger_name": "Everytime a product invoice is created",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "Daily",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 4\n[Implementation]\nFully\n\n[Debit]\nCost of Goods Sold (004.010)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 004.010\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.010: Cost of Goods Sold -> Supabase 004.010\n211.100: Standard Product -> Supabase 211.100\n\n[Issues]\n- Possible duplicate AP posting with Category - Invoice Entry rows 2 or 4.",
    "airtable_sources": "FIN: Invoices",
    "reversible": true,
    "active": true,
    "debit_label": "Cost of Goods Sold (004.010)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "EXP-16",
    "category": "expense",
    "sort_order": 5,
    "trigger_name": "Everytime a product invoice is paid",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "Daily",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 5\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Possible duplicate settlement with Category - Payment rows 8 or 9.",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"
  },
  {
    "rule_code": "EXP-17",
    "category": "expense",
    "sort_order": 8,
    "trigger_name": "Prepaid Expense BILL (actually paid)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "Just with payment record, fully paid",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 8\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\nDAILY\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"
  },
  {
    "rule_code": "EXP-18",
    "category": "expense",
    "sort_order": 11,
    "trigger_name": "Employee Tech Allowance - Paid",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "Once it is paid",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 11\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\nDAILY POSTING \n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch Employee\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"
  },
  {
    "rule_code": "EXP-19",
    "category": "expense",
    "sort_order": 13,
    "trigger_name": "Payroll - W2 payroll register (Paid)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 13\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes any of \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.003: Salary - 1099\", \"005.005: 401K\", \"005.006: Payroll Taxes\"\nInvoice Lines.Line Amount is not empty\n\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Possible duplicate bank posting with Category - Payment row 16.\n\n[Issues]\n- Confirm how to record 005.004 insurance deductions. They are excluded from this W2 pair and can make bank postings exceed the actual payment.",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"
  },
  {
    "rule_code": "EXP-20",
    "category": "expense",
    "sort_order": 15,
    "trigger_name": "Payroll - offshore - paid",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 15\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\nDAILY POSTING OF ENTRY\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.101: Salary - Offshore\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Possible duplicate bank posting with Category - Payment row 16.",
    "airtable_sources": "AP",
    "reversible": true,
    "active": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"
  },
  {
    "rule_code": "EXP-21",
    "category": "expense",
    "sort_order": 17,
    "trigger_name": "Payrol - Bonuses (paid)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 17\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"
  },
  {
    "rule_code": "EXP-22",
    "category": "expense",
    "sort_order": 18,
    "trigger_name": "Payroll - offshore - Month-end accrual Bonus (Unpaid)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "AP Staff invoice with Bonus 005.201 lines. Sum Line Amount by account and accrue to 241.300. INVOICE CREATED",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 18\n[Implementation]\nNot yet\n\n[Debit]\n13th Month Bonus (005.103)\n\n[Credit]\nAccrued Bonus & Commission (241.300)\n\nDAILY POSTING\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.103: 13th Month\"\nInvoice Lines.Line Amount Is Not Empty\n\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per account\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.103: 13th Month\nCredit = 241.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.201: Bonus -> Supabase 005.201\n241.300: Accrued, unpaid bonus -> Supabase 241.300",
    "airtable_sources": "FIN",
    "reversible": true,
    "active": false,
    "debit_label": "13th Month Bonus (005.103)",
    "credit_label": "Accrued Bonus & Commission (241.300)"
  },
  {
    "rule_code": "EXP-23",
    "category": "expense",
    "sort_order": 19,
    "trigger_name": "Payroll - offshore - Month-end accrual Bonus (Paid)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "PAYMENT MADE",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 19\n[Implementation]\nFully\n\n[Debit]\nAccrued Bonus & Commission (241.300)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\nDAILY POSTING\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.103: 13th Month\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 241.300\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n241.300: Accrued Bonus & Commission -> Supabase 241.300\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true,
    "debit_label": "Accrued Bonus & Commission (241.300)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"
  },
  {
    "rule_code": "EXP-27",
    "category": "expense",
    "sort_order": 22,
    "trigger_name": "Bank fees and charges shown only on the bank statement (Paid)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n",
    "fin_notes": "Paid Expense Invoice with chart of accunt, bank wire feees",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 22\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\nDAILY POSTING\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100",
    "airtable_sources": "AP",
    "reversible": true,
    "active": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"
  },
  {
    "rule_code": "EXP-24",
    "category": "expense",
    "sort_order": 24,
    "trigger_name": "Bad-Debt Journal Entry",
    "when_to_post": null,
    "fin_notes": "Enter Journal entry manually from Airtable, select acccounts, amount, etc.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 24\n[Implementation]\nNot yet\n\n[Debit]\nAllowance for Doubtful Accounts (121.900)\n\n[Credit]\nAR account (pending)\n\nDaily Posting",
    "airtable_sources": "FIN",
    "reversible": true,
    "active": false,
    "debit_label": "Allowance for Doubtful Accounts (121.900)",
    "credit_label": "AR account (pending)"
  },
  {
    "rule_code": "EXP-25",
    "category": "expense",
    "sort_order": 25,
    "trigger_name": "Bad-Debt Reversal Entry",
    "when_to_post": null,
    "fin_notes": "Enter Journal entry manually from airtable, accounts. Amount is bad debt expense, allowance is remaining on the record",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 25\n[Implementation]\nNot yet\n\n[Debit]\nBank account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747)\n\n[Credit]\nBad Debt Expense (007.005)\nAllowance for Doubtful Accounts (121.900)\n\nDaily Posting",
    "airtable_sources": "FIN",
    "reversible": true,
    "active": false,
    "debit_label": "Bank account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747)",
    "credit_label": "Bad Debt Expense (007.005)\nAllowance for Doubtful Accounts (121.900)"
  },
  {
    "rule_code": "EXP-26",
    "category": "expense",
    "sort_order": 27,
    "trigger_name": "Income tax accrual (Paid)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 27\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes any of \"923100: Federal Income Tax\", \"923300: State Income Tax\"\nInvoice Lines.Line Amount is not empty\n\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Possible duplicate bank posting with Category - Payment row 23.",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"
  },
  {
    "rule_code": "INV-12",
    "category": "invoice_entry",
    "sort_order": 2,
    "trigger_name": "Deposit Invoice is created",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 2\n[Implementation]\nnot Yet\n\n[Debit]\nBank\n\n[Credit]\n221.100: Client Deposits Held\n\nDaily",
    "airtable_sources": null,
    "reversible": true,
    "active": false,
    "debit_label": "Bank",
    "credit_label": "221.100: Client Deposits Held"
  },
  {
    "rule_code": "INV-13",
    "category": "invoice_entry",
    "sort_order": 3,
    "trigger_name": "Deposit Invoice is paid",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 3\n[Implementation]\nnot Yet\n\n[Debit]\nAR (121.100)\n\n[Credit]\nBank\n\nDaily",
    "airtable_sources": null,
    "reversible": true,
    "active": false,
    "debit_label": "AR (121.100)",
    "credit_label": "Bank"
  },
  {
    "rule_code": "INV-14",
    "category": "invoice_entry",
    "sort_order": 4,
    "trigger_name": "For each shipping record that shipped, create an entry against the deposit from linked total $ amount of MTA unit prices",
    "when_to_post": null,
    "fin_notes": "Total Extended Sell Price of Linked MTAs",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 4\n[Implementation]\nnot Yet\n\n[Debit]\n221.100: Client Deposits Held\n\n[Credit]\nSales Revenue\n\nDaily",
    "airtable_sources": null,
    "reversible": true,
    "active": false,
    "debit_label": "221.100: Client Deposits Held",
    "credit_label": "Sales Revenue"
  },
  {
    "rule_code": "INV-15",
    "category": "invoice_entry",
    "sort_order": 5,
    "trigger_name": "Full or Balance Invoice is created",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 5\n[Implementation]\nnot Yet\n\n[Debit]\nAR (121.100)\n\n[Credit]\nSales Revenue\n\nDaily",
    "airtable_sources": null,
    "reversible": true,
    "active": false,
    "debit_label": "AR (121.100)",
    "credit_label": "Sales Revenue"
  },
  {
    "rule_code": "INV-16",
    "category": "invoice_entry",
    "sort_order": 6,
    "trigger_name": "Full or Balance invoice is paid",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 6\n[Implementation]\nnot yet\n\n[Debit]\nBank\n\n[Credit]\nAR (121.100)\n\nDaily",
    "airtable_sources": null,
    "reversible": true,
    "active": false,
    "debit_label": "Bank",
    "credit_label": "AR (121.100)"
  },
  {
    "rule_code": "INV-17",
    "category": "invoice_entry",
    "sort_order": 9,
    "trigger_name": "Fixed Asset Purchase Invoice is Paid",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 9\n[Implementation]\nNot yet\n\n[Debit]\nAP (211.100)\n\n[Credit]\nBank\n\nDaily",
    "airtable_sources": null,
    "reversible": true,
    "active": false,
    "debit_label": "AP (211.100)",
    "credit_label": "Bank"
  },
  {
    "rule_code": "INV-18",
    "category": "invoice_entry",
    "sort_order": 13,
    "trigger_name": "Customer invoice for a non-product charge paid",
    "when_to_post": null,
    "fin_notes": "When non-product invoice is paid",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 13\n[Implementation]\nnot Yet\n\n[Debit]\nBank\n\n[Credit]\nAR (121.100)\n\nDAILY",
    "airtable_sources": "Payment",
    "reversible": true,
    "active": false,
    "debit_label": "Bank",
    "credit_label": "AR (121.100)"
  }
]'::jsonb)
on conflict do nothing;

insert into public.ledger_rule_lines (id, rule_code, side, line_order, account_code, account_selector, label, is_optional) overriding system value
select id, rule_code, side, line_order, account_code, account_selector, label, is_optional from jsonb_populate_recordset(null::public.ledger_rule_lines, '[
  {
    "id": 1,
    "rule_code": "EXP-01",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "vendor_expense",
    "label": "Invoice account linked\nExample: Utilities (006.002)",
    "is_optional": false
  },
  {
    "id": 2,
    "rule_code": "EXP-01",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 3,
    "rule_code": "EXP-02",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "vendor_expense",
    "label": "Invoice expense account linked\nExamples: Software Licensing (008.001), Travel (009.002)",
    "is_optional": false
  },
  {
    "id": 4,
    "rule_code": "EXP-02",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "credit_card",
    "label": "Credit Card Payable (231.100)",
    "is_optional": false
  },
  {
    "id": 5,
    "rule_code": "EXP-03",
    "side": "debit",
    "line_order": 1,
    "account_code": "135.000",
    "account_selector": null,
    "label": "Prepaid Expenses (135.000)",
    "is_optional": false
  },
  {
    "id": 6,
    "rule_code": "EXP-03",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 7,
    "rule_code": "EXP-04",
    "side": "debit",
    "line_order": 1,
    "account_code": "007.011",
    "account_selector": null,
    "label": "Invoice expense account linked\nExample: General Insurance (007.011)",
    "is_optional": false
  },
  {
    "id": 8,
    "rule_code": "EXP-04",
    "side": "credit",
    "line_order": 1,
    "account_code": "135.000",
    "account_selector": null,
    "label": "Prepaid Expenses (135.000)",
    "is_optional": false
  },
  {
    "id": 9,
    "rule_code": "EXP-05",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "tech_allowance",
    "label": "005.102: Tech Allowance",
    "is_optional": false
  },
  {
    "id": 10,
    "rule_code": "EXP-05",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 11,
    "rule_code": "EXP-06",
    "side": "debit",
    "line_order": 1,
    "account_code": "005.002",
    "account_selector": null,
    "label": "005.001: Salary - Owners\n005.002: Salary - W2\n005.003: Salary - 1099\n005.005: 401K\n005.006: Payroll Taxes",
    "is_optional": false
  },
  {
    "id": 12,
    "rule_code": "EXP-06",
    "side": "debit",
    "line_order": 2,
    "account_code": "005.006",
    "account_selector": null,
    "label": "005.001: Salary - Owners\n005.002: Salary - W2\n005.003: Salary - 1099\n005.005: 401K\n005.006: Payroll Taxes",
    "is_optional": false
  },
  {
    "id": 13,
    "rule_code": "EXP-06",
    "side": "debit",
    "line_order": 3,
    "account_code": "005.005",
    "account_selector": null,
    "label": "005.001: Salary - Owners\n005.002: Salary - W2\n005.003: Salary - 1099\n005.005: 401K\n005.006: Payroll Taxes",
    "is_optional": false
  },
  {
    "id": 14,
    "rule_code": "EXP-06",
    "side": "credit",
    "line_order": 1,
    "account_code": "241.100",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 15,
    "rule_code": "EXP-06",
    "side": "credit",
    "line_order": 2,
    "account_code": "241.200",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 16,
    "rule_code": "EXP-06",
    "side": "credit",
    "line_order": 3,
    "account_code": "241.400",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 17,
    "rule_code": "EXP-06",
    "side": "credit",
    "line_order": 4,
    "account_code": "241.600",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 18,
    "rule_code": "EXP-07",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "staff_expense",
    "label": "005.101: Salary - Offshore",
    "is_optional": false
  },
  {
    "id": 19,
    "rule_code": "EXP-07",
    "side": "credit",
    "line_order": 1,
    "account_code": "241.100",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 20,
    "rule_code": "EXP-08",
    "side": "debit",
    "line_order": 1,
    "account_code": "005.002",
    "account_selector": null,
    "label": "Salary - W2 (005.002)",
    "is_optional": false
  },
  {
    "id": 21,
    "rule_code": "EXP-08",
    "side": "credit",
    "line_order": 1,
    "account_code": "241.500",
    "account_selector": null,
    "label": "Accrued PTO (241.500)",
    "is_optional": false
  },
  {
    "id": 22,
    "rule_code": "EXP-09",
    "side": "debit",
    "line_order": 1,
    "account_code": "005.201",
    "account_selector": null,
    "label": "005.201: Bonus",
    "is_optional": false
  },
  {
    "id": 23,
    "rule_code": "EXP-09",
    "side": "credit",
    "line_order": 1,
    "account_code": "241.300",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 24,
    "rule_code": "EXP-10",
    "side": "debit",
    "line_order": 1,
    "account_code": "009.101",
    "account_selector": null,
    "label": "Depreciation Expense (009.101)",
    "is_optional": false
  },
  {
    "id": 25,
    "rule_code": "EXP-10",
    "side": "credit",
    "line_order": 1,
    "account_code": "161.000",
    "account_selector": null,
    "label": "Accumulated Depreciation (161.000)",
    "is_optional": false
  },
  {
    "id": 26,
    "rule_code": "EXP-11",
    "side": "debit",
    "line_order": 1,
    "account_code": "007.002",
    "account_selector": null,
    "label": "Bank, Wire & FX Fees (007.002)",
    "is_optional": false
  },
  {
    "id": 27,
    "rule_code": "EXP-11",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 28,
    "rule_code": "EXP-12",
    "side": "debit",
    "line_order": 1,
    "account_code": "007.005",
    "account_selector": null,
    "label": "Bad Debt Expense (007.005)",
    "is_optional": false
  },
  {
    "id": 29,
    "rule_code": "EXP-12",
    "side": "credit",
    "line_order": 1,
    "account_code": "121.900",
    "account_selector": null,
    "label": "Allowance for Doubtful Accounts (121.900)",
    "is_optional": false
  },
  {
    "id": 30,
    "rule_code": "EXP-13",
    "side": "debit",
    "line_order": 1,
    "account_code": "011.001",
    "account_selector": null,
    "label": "Federal Income Tax Expense (011.001)\nState Income Tax Expense (011.002)",
    "is_optional": false
  },
  {
    "id": 31,
    "rule_code": "EXP-13",
    "side": "debit",
    "line_order": 2,
    "account_code": "011.002",
    "account_selector": null,
    "label": "Federal Income Tax Expense (011.001)\nState Income Tax Expense (011.002)",
    "is_optional": false
  },
  {
    "id": 32,
    "rule_code": "EXP-13",
    "side": "credit",
    "line_order": 1,
    "account_code": "242.100",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 33,
    "rule_code": "EXP-13",
    "side": "credit",
    "line_order": 2,
    "account_code": "242.200",
    "account_selector": null,
    "label": "Accounts Payable (211.100)",
    "is_optional": false
  },
  {
    "id": 34,
    "rule_code": "PAY-01",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 35,
    "rule_code": "PAY-01",
    "side": "credit",
    "line_order": 1,
    "account_code": "221.100",
    "account_selector": null,
    "label": "Customer Deposits (221.100)",
    "is_optional": false
  },
  {
    "id": 36,
    "rule_code": "PAY-02",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 37,
    "rule_code": "PAY-02",
    "side": "credit",
    "line_order": 1,
    "account_code": "121.100",
    "account_selector": null,
    "label": "AR (121.100)",
    "is_optional": false
  },
  {
    "id": 38,
    "rule_code": "PAY-03",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 39,
    "rule_code": "PAY-03",
    "side": "credit",
    "line_order": 1,
    "account_code": "221.300",
    "account_selector": null,
    "label": "Client Credits on Account (221.300)\n",
    "is_optional": false
  },
  {
    "id": 40,
    "rule_code": "PAY-04",
    "side": "debit",
    "line_order": 1,
    "account_code": "007.002",
    "account_selector": null,
    "label": "Bank, Wire & FX Fees (007.002)",
    "is_optional": false
  },
  {
    "id": 41,
    "rule_code": "PAY-04",
    "side": "credit",
    "line_order": 1,
    "account_code": "121.100",
    "account_selector": null,
    "label": "AR (121.100)",
    "is_optional": false
  },
  {
    "id": 42,
    "rule_code": "PAY-05",
    "side": "debit",
    "line_order": 1,
    "account_code": "221.100",
    "account_selector": null,
    "label": "Customer Deposits (221.100)\n",
    "is_optional": false
  },
  {
    "id": 43,
    "rule_code": "PAY-05",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 44,
    "rule_code": "PAY-06",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "customer_deposit_or_ar",
    "label": "Customer Deposits (221.100) or \nAR (121.100)",
    "is_optional": false
  },
  {
    "id": 45,
    "rule_code": "PAY-06",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 46,
    "rule_code": "PAY-07",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 47,
    "rule_code": "PAY-07",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 48,
    "rule_code": "PAY-08",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)\n",
    "is_optional": false
  },
  {
    "id": 49,
    "rule_code": "PAY-08",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "credit_card",
    "label": "Credit Card Payable (AMEX or Visa)\n",
    "is_optional": false
  },
  {
    "id": 50,
    "rule_code": "PAY-09",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "credit_card",
    "label": "Credit Card Payable (AMEX or Visa)\n",
    "is_optional": false
  },
  {
    "id": 51,
    "rule_code": "PAY-09",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 52,
    "rule_code": "PAY-10",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 53,
    "rule_code": "PAY-10",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "multiple:\n• Bank - Fifth Third/Nickel\n• Purchase Discounts & Rebates (004.011)",
    "is_optional": false
  },
  {
    "id": 54,
    "rule_code": "PAY-10",
    "side": "credit",
    "line_order": 2,
    "account_code": "004.011",
    "account_selector": null,
    "label": "multiple:\n• Bank - Fifth Third/Nickel\n• Purchase Discounts & Rebates (004.011)",
    "is_optional": false
  },
  {
    "id": 55,
    "rule_code": "PAY-11",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 56,
    "rule_code": "PAY-11",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 57,
    "rule_code": "PAY-12",
    "side": "debit",
    "line_order": 1,
    "account_code": "112.100",
    "account_selector": null,
    "label": "Bank - Fifth Third (112.100)",
    "is_optional": false
  },
  {
    "id": 58,
    "rule_code": "PAY-12",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 59,
    "rule_code": "PAY-13",
    "side": "debit",
    "line_order": 1,
    "account_code": "112.100",
    "account_selector": null,
    "label": "Bank (Fifth Third / Nickel / Fidelity)",
    "is_optional": false
  },
  {
    "id": 60,
    "rule_code": "PAY-13",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 61,
    "rule_code": "PAY-14",
    "side": "debit",
    "line_order": 1,
    "account_code": "241.100",
    "account_selector": null,
    "label": "multiple:\n• Accrued Salaries & Wages (241.100)\n• Accrued Payroll Taxes (241.200)\n• Accrued 401(k) (241.400)\n• Employee Benefit Deductions Payable (241.600)",
    "is_optional": false
  },
  {
    "id": 62,
    "rule_code": "PAY-14",
    "side": "debit",
    "line_order": 2,
    "account_code": "241.200",
    "account_selector": null,
    "label": "multiple:\n• Accrued Salaries & Wages (241.100)\n• Accrued Payroll Taxes (241.200)\n• Accrued 401(k) (241.400)\n• Employee Benefit Deductions Payable (241.600)",
    "is_optional": false
  },
  {
    "id": 63,
    "rule_code": "PAY-14",
    "side": "debit",
    "line_order": 3,
    "account_code": "241.400",
    "account_selector": null,
    "label": "multiple:\n• Accrued Salaries & Wages (241.100)\n• Accrued Payroll Taxes (241.200)\n• Accrued 401(k) (241.400)\n• Employee Benefit Deductions Payable (241.600)",
    "is_optional": false
  },
  {
    "id": 64,
    "rule_code": "PAY-14",
    "side": "debit",
    "line_order": 4,
    "account_code": "241.600",
    "account_selector": null,
    "label": "multiple:\n• Accrued Salaries & Wages (241.100)\n• Accrued Payroll Taxes (241.200)\n• Accrued 401(k) (241.400)\n• Employee Benefit Deductions Payable (241.600)",
    "is_optional": false
  },
  {
    "id": 65,
    "rule_code": "PAY-14",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 66,
    "rule_code": "PAY-15",
    "side": "debit",
    "line_order": 1,
    "account_code": "241.100",
    "account_selector": null,
    "label": "multiple:\n• Accrued Salaries & Wages (241.100)\n• Bank, Wire & FX Fees (007.002)",
    "is_optional": false
  },
  {
    "id": 67,
    "rule_code": "PAY-15",
    "side": "debit",
    "line_order": 2,
    "account_code": "007.002",
    "account_selector": null,
    "label": "multiple:\n• Accrued Salaries & Wages (241.100)\n• Bank, Wire & FX Fees (007.002)",
    "is_optional": true
  },
  {
    "id": 68,
    "rule_code": "PAY-15",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 69,
    "rule_code": "PAY-16",
    "side": "debit",
    "line_order": 1,
    "account_code": "232.100",
    "account_selector": null,
    "label": "multiple:\n• Auto Loan Payable (232.100)\n• Interest Expense (007.003)",
    "is_optional": false
  },
  {
    "id": 70,
    "rule_code": "PAY-16",
    "side": "debit",
    "line_order": 2,
    "account_code": "007.003",
    "account_selector": null,
    "label": "multiple:\n• Auto Loan Payable (232.100)\n• Interest Expense (007.003)",
    "is_optional": false
  },
  {
    "id": 71,
    "rule_code": "PAY-16",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 72,
    "rule_code": "PAY-17",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Fifth Third/Nickel)",
    "is_optional": false
  },
  {
    "id": 73,
    "rule_code": "PAY-17",
    "side": "credit",
    "line_order": 1,
    "account_code": "231.200",
    "account_selector": null,
    "label": "Line of Credit Payable (231.200)",
    "is_optional": false
  },
  {
    "id": 74,
    "rule_code": "PAY-18",
    "side": "debit",
    "line_order": 1,
    "account_code": "231.200",
    "account_selector": null,
    "label": "multiple:\n• Line of Credit Payable (231.200)\n• Interest Expense (007.003)",
    "is_optional": false
  },
  {
    "id": 75,
    "rule_code": "PAY-18",
    "side": "debit",
    "line_order": 2,
    "account_code": "007.003",
    "account_selector": null,
    "label": "multiple:\n• Line of Credit Payable (231.200)\n• Interest Expense (007.003)",
    "is_optional": false
  },
  {
    "id": 76,
    "rule_code": "PAY-18",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 77,
    "rule_code": "PAY-19",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank - Nickel (112.300)",
    "is_optional": false
  },
  {
    "id": 78,
    "rule_code": "PAY-19",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 79,
    "rule_code": "PAY-20",
    "side": "debit",
    "line_order": 1,
    "account_code": "316.100",
    "account_selector": null,
    "label": "Shareholder Distributions (316.100)",
    "is_optional": false
  },
  {
    "id": 80,
    "rule_code": "PAY-20",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 81,
    "rule_code": "PAY-21",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 82,
    "rule_code": "PAY-21",
    "side": "credit",
    "line_order": 1,
    "account_code": "311.200",
    "account_selector": null,
    "label": "Additional Paid-in Capital (311.200)",
    "is_optional": false
  },
  {
    "id": 83,
    "rule_code": "PAY-22",
    "side": "debit",
    "line_order": 1,
    "account_code": "242.100",
    "account_selector": null,
    "label": "multiple:\n• Accrued Federal Income Tax (242.100)\n• Accrued State Income Tax (242.200)",
    "is_optional": false
  },
  {
    "id": 84,
    "rule_code": "PAY-22",
    "side": "debit",
    "line_order": 2,
    "account_code": "242.200",
    "account_selector": null,
    "label": "multiple:\n• Accrued Federal Income Tax (242.100)\n• Accrued State Income Tax (242.200)",
    "is_optional": false
  },
  {
    "id": 85,
    "rule_code": "PAY-22",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 86,
    "rule_code": "PAY-23",
    "side": "debit",
    "line_order": 1,
    "account_code": "112.100",
    "account_selector": null,
    "label": "multiple:\n• Bank - Fifth Third (112.100)\n• Insurance Claim Recoveries (004.004)",
    "is_optional": false
  },
  {
    "id": 87,
    "rule_code": "PAY-23",
    "side": "debit",
    "line_order": 2,
    "account_code": "004.004",
    "account_selector": null,
    "label": "multiple:\n• Bank - Fifth Third (112.100)\n• Insurance Claim Recoveries (004.004)",
    "is_optional": false
  },
  {
    "id": 88,
    "rule_code": "PAY-23",
    "side": "credit",
    "line_order": 1,
    "account_code": "122.100",
    "account_selector": null,
    "label": "Insurance Claims Receivable (122.100)",
    "is_optional": false
  },
  {
    "id": 89,
    "rule_code": "PAY-24",
    "side": "debit",
    "line_order": 1,
    "account_code": "143.200",
    "account_selector": null,
    "label": "Security Deposits (143.200)",
    "is_optional": false
  },
  {
    "id": 90,
    "rule_code": "PAY-24",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 91,
    "rule_code": "PAY-25",
    "side": "debit",
    "line_order": 1,
    "account_code": "112.200",
    "account_selector": null,
    "label": "Cash - Fidelity (112.200)",
    "is_optional": false
  },
  {
    "id": 92,
    "rule_code": "PAY-25",
    "side": "credit",
    "line_order": 1,
    "account_code": "010.003",
    "account_selector": null,
    "label": "Interest & Dividend Income (010.003)",
    "is_optional": false
  },
  {
    "id": 93,
    "rule_code": "PAY-26",
    "side": "debit",
    "line_order": 1,
    "account_code": "007.002",
    "account_selector": null,
    "label": "Bank, Wire & FX Fees (007.002)",
    "is_optional": false
  },
  {
    "id": 94,
    "rule_code": "PAY-26",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third)",
    "is_optional": false
  },
  {
    "id": 95,
    "rule_code": "PAY-27",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "credit_card",
    "label": "Credit Card Payable (231.100)",
    "is_optional": false
  },
  {
    "id": 96,
    "rule_code": "PAY-27",
    "side": "credit",
    "line_order": 1,
    "account_code": "004.011",
    "account_selector": null,
    "label": "Purchase Discounts & Rebates (004.011)",
    "is_optional": false
  },
  {
    "id": 97,
    "rule_code": "INV-01",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.200",
    "account_selector": null,
    "label": "Received Not Invoiced (GRNI) (211.200)",
    "is_optional": false
  },
  {
    "id": 98,
    "rule_code": "INV-01",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 99,
    "rule_code": "INV-02",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.200",
    "account_selector": null,
    "label": "multiple:\n• Received Not Invoiced (GRNI) (211.200)\n• Inventory / Purchase Price Variance (004.015)",
    "is_optional": false
  },
  {
    "id": 100,
    "rule_code": "INV-02",
    "side": "debit",
    "line_order": 2,
    "account_code": "004.015",
    "account_selector": null,
    "label": "multiple:\n• Received Not Invoiced (GRNI) (211.200)\n• Inventory / Purchase Price Variance (004.015)",
    "is_optional": false
  },
  {
    "id": 101,
    "rule_code": "INV-02",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 102,
    "rule_code": "INV-03",
    "side": "debit",
    "line_order": 1,
    "account_code": "132.100",
    "account_selector": null,
    "label": "Vendor Deposits / PO Pre-Payments (132.100)",
    "is_optional": false
  },
  {
    "id": 103,
    "rule_code": "INV-03",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 104,
    "rule_code": "INV-04",
    "side": "debit",
    "line_order": 1,
    "account_code": "131.100",
    "account_selector": null,
    "label": "Inventory – Committed to Client Orders (131.100)",
    "is_optional": false
  },
  {
    "id": 105,
    "rule_code": "INV-04",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 106,
    "rule_code": "INV-05",
    "side": "debit",
    "line_order": 1,
    "account_code": "004.013",
    "account_selector": null,
    "label": "Freight & Handling Cost (004.013)",
    "is_optional": false
  },
  {
    "id": 107,
    "rule_code": "INV-05",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 108,
    "rule_code": "INV-06",
    "side": "debit",
    "line_order": 1,
    "account_code": "212.100",
    "account_selector": null,
    "label": "Sales Tax Payable – ship-to state (212.100)",
    "is_optional": false
  },
  {
    "id": 109,
    "rule_code": "INV-06",
    "side": "debit",
    "line_order": 2,
    "account_code": "007.006",
    "account_selector": null,
    "label": "Sales Tax Miscalculations (007.006) – only if return differs",
    "is_optional": true
  },
  {
    "id": 110,
    "rule_code": "INV-06",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 111,
    "rule_code": "INV-07",
    "side": "debit",
    "line_order": 1,
    "account_code": "143.300",
    "account_selector": null,
    "label": "Sample:\nDisplay Fixtures & Equipment (143.300)",
    "is_optional": false
  },
  {
    "id": 112,
    "rule_code": "INV-07",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 113,
    "rule_code": "INV-08",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 114,
    "rule_code": "INV-08",
    "side": "credit",
    "line_order": 1,
    "account_code": "131.400",
    "account_selector": null,
    "label": "Inventory - Pending Return Processing (131.400)",
    "is_optional": false
  },
  {
    "id": 115,
    "rule_code": "INV-09",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 116,
    "rule_code": "INV-09",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "cogs_or_expense",
    "label": "COGS (004.010), or the original expense account for expense credits",
    "is_optional": false
  },
  {
    "id": 117,
    "rule_code": "INV-10",
    "side": "debit",
    "line_order": 1,
    "account_code": "121.100",
    "account_selector": null,
    "label": "AR (121.100)",
    "is_optional": false
  },
  {
    "id": 118,
    "rule_code": "INV-10",
    "side": "credit",
    "line_order": 1,
    "account_code": "010.001",
    "account_selector": null,
    "label": "Invoice Account Linked\n004.002: Coordination Fees Charged",
    "is_optional": false
  },
  {
    "id": 119,
    "rule_code": "INV-11",
    "side": "debit",
    "line_order": 1,
    "account_code": "004.006",
    "account_selector": null,
    "label": "multiple:\n• Sales Returns & Allowances (004.006)\n• Sales Tax Payable - ship-to state (212.100)",
    "is_optional": false
  },
  {
    "id": 120,
    "rule_code": "INV-11",
    "side": "debit",
    "line_order": 2,
    "account_code": "212.100",
    "account_selector": null,
    "label": "multiple:\n• Sales Returns & Allowances (004.006)\n• Sales Tax Payable - ship-to state (212.100)",
    "is_optional": false
  },
  {
    "id": 121,
    "rule_code": "INV-11",
    "side": "credit",
    "line_order": 1,
    "account_code": "221.300",
    "account_selector": null,
    "label": "multiple:\n• Client Credits on Account (221.300)\n• Restocking & Cancellation Fees (004.005)",
    "is_optional": false
  },
  {
    "id": 122,
    "rule_code": "INV-11",
    "side": "credit",
    "line_order": 2,
    "account_code": "004.005",
    "account_selector": null,
    "label": "multiple:\n• Client Credits on Account (221.300)\n• Restocking & Cancellation Fees (004.005)",
    "is_optional": true
  },
  {
    "id": 123,
    "rule_code": "OTH-01",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.200",
    "account_selector": null,
    "label": "Received Not Invoiced (GRNI) (211.200)",
    "is_optional": false
  },
  {
    "id": 124,
    "rule_code": "OTH-01",
    "side": "debit",
    "line_order": 2,
    "account_code": "131.300",
    "account_selector": null,
    "label": "Inventory – On-Hand Stock (Uncommitted) (131.300)",
    "is_optional": false
  },
  {
    "id": 125,
    "rule_code": "OTH-01",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 126,
    "rule_code": "OTH-02",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.200",
    "account_selector": null,
    "label": "Received Not Invoiced (GRNI) (211.200)",
    "is_optional": false
  },
  {
    "id": 127,
    "rule_code": "OTH-02",
    "side": "debit",
    "line_order": 2,
    "account_code": "004.015",
    "account_selector": null,
    "label": "Inventory / Purchase Price Variance (004.015)",
    "is_optional": false
  },
  {
    "id": 128,
    "rule_code": "OTH-02",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 129,
    "rule_code": "OTH-03",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.200",
    "account_selector": null,
    "label": "Received Not Invoiced (GRNI) (211.200)",
    "is_optional": false
  },
  {
    "id": 130,
    "rule_code": "OTH-03",
    "side": "debit",
    "line_order": 2,
    "account_code": "004.015",
    "account_selector": null,
    "label": "Inventory / Purchase Price Variance (004.015)",
    "is_optional": false
  },
  {
    "id": 131,
    "rule_code": "OTH-03",
    "side": "debit",
    "line_order": 3,
    "account_code": "131.300",
    "account_selector": null,
    "label": "Inventory – On-Hand Stock (Uncommitted) (131.300)",
    "is_optional": false
  },
  {
    "id": 132,
    "rule_code": "OTH-03",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 133,
    "rule_code": "OTH-04",
    "side": "debit",
    "line_order": 1,
    "account_code": "004.015",
    "account_selector": null,
    "label": "Inventory / Purchase Price Variance (004.015)",
    "is_optional": false
  },
  {
    "id": 134,
    "rule_code": "OTH-04",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 135,
    "rule_code": "OTH-05",
    "side": "debit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 136,
    "rule_code": "OTH-05",
    "side": "credit",
    "line_order": 1,
    "account_code": "004.015",
    "account_selector": null,
    "label": "Inventory / Purchase Price Variance (004.015)",
    "is_optional": false
  },
  {
    "id": 137,
    "rule_code": "OTH-06",
    "side": "debit",
    "line_order": 1,
    "account_code": "121.100",
    "account_selector": null,
    "label": "AR (121.100)",
    "is_optional": false
  },
  {
    "id": 138,
    "rule_code": "OTH-06",
    "side": "credit",
    "line_order": 1,
    "account_code": "004.001",
    "account_selector": null,
    "label": "Product Revenue – Brass Hardware (004.001)",
    "is_optional": false
  },
  {
    "id": 139,
    "rule_code": "OTH-06",
    "side": "credit",
    "line_order": 2,
    "account_code": "212.100",
    "account_selector": null,
    "label": "Sales Tax Payable – ship-to state (212.100)",
    "is_optional": false
  },
  {
    "id": 140,
    "rule_code": "OTH-07",
    "side": "debit",
    "line_order": 1,
    "account_code": "004.013",
    "account_selector": null,
    "label": "Freight & Handling Cost (004.013)",
    "is_optional": false
  },
  {
    "id": 141,
    "rule_code": "OTH-07",
    "side": "credit",
    "line_order": 1,
    "account_code": "004.003",
    "account_selector": null,
    "label": "Freight Charged to Clients (004.003)",
    "is_optional": false
  }
]'::jsonb)
where rule_code not like 'EXP-%' and rule_code not like 'INV-%' and rule_code not like 'INV-%'
on conflict do nothing;

select pg_catalog.setval('public.ledger_rule_lines_id_seq', coalesce((select max(id) from public.ledger_rule_lines), 1), exists(select 1 from public.ledger_rule_lines));


-- Current Invoice Entry catalog, 12 November 2026.
-- Current Invoice Entry chart. Preserve journals and existing operator switches.
insert into public.accounts(code,name,account_type,subtype,normal_balance) values
('004.001','Product Revenue - Brass Hardware','revenue','sales','credit'),
('004.002','Coordination Fees Charged','revenue','sales','credit'),
('121.100','Accounts Receivable','asset','receivable','debit'),
('221.100','Customer Deposits','liability','deposits','credit'),
('143.300','Display Fixtures & Equipment','asset','fixed_asset','debit')
on conflict(code) do nothing;

insert into public.account_selectors(selector,description) values
('invoice_linked_account','Single account selected on the FIN invoice.'),
('invoice_payment_account','Single account selected on the FIN payment.')
on conflict(selector) do nothing;
insert into public.account_selector_members(selector,account_code)
select s.selector,a.code from public.accounts a cross join (values ('invoice_linked_account'),('invoice_payment_account')) as s(selector)
where a.is_postable on conflict do nothing;

insert into public.ledger_rules(rule_code,category,sort_order,trigger_name,when_to_post,dev_notes,airtable_sources,active,enabled,reversible,debit_label,credit_label)
select rule_code,'invoice_entry',sort_order,trigger_name,when_to_post,dev_notes,airtable_sources,active,false,true,debit_label,credit_label
from jsonb_to_recordset('[{"rule_code":"INV-12","sort_order":2,"trigger_name":"Deposit Invoice is created","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 2\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 221.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nClient Deposits Held (221.100) -> Supabase 221.100","airtable_sources":"FIN: Invoices","active":true,"debit_label":"Accounts Receivable (121.100)","credit_label":"Client Deposits Held (221.100)"},{"rule_code":"INV-13","sort_order":3,"trigger_name":"Deposit Invoice is paid","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 3\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100","airtable_sources":"FIN: Payments","active":true,"debit_label":"Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","credit_label":"Accounts Receivable (121.100)"},{"rule_code":"INV-14","sort_order":4,"trigger_name":"For each shipping record that shipped, create an entry against the deposit from linked total $ amount of MTA unit prices","when_to_post":"[Record]\nShipping Record\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nShipping Record.Ship Out = true\nShipping Record.Ship Out Date is not empty","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 4\n[Implementation]\nPartially\n\n[Record]\nShipping Record\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nShipping Record.Ship Out = true\nShipping Record.Ship Out Date is not empty\n\n[Field Mapping]\nAmount = Sum of linked MTAs.Extended Sell Price\nDate = Shipping Record.Ship Out Date\nBranch = Linked MTAs.Branch\nDebit = 221.100\nCredit = 004.001\n\n[Other Field Mapping]\nTransaction Reference = Shipping Record.Transaction\nState References = Linked MTAs.States & Sales Tax Rates\n\n[Account Mapping]\nClient Deposits Held (221.100) -> Supabase 221.100\nProduct Revenue (004.001) -> Supabase 004.001\n\n[Notes]\n- Deposit recognition is not capped yet.\n- Shipping Record currently links to MTAs (Deprecated) and Transactions (Deprecated).\n\n[Issues]\n- Which deposit invoice sets the maximum recognition amount for each shipping record?","airtable_sources":"FIN: Shipping Record","active":true,"debit_label":"Client Deposits Held (221.100)","credit_label":"Product Revenue (004.001)"},{"rule_code":"INV-15","sort_order":5,"trigger_name":"Full or Balance Invoice is created","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 5\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 004.001\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nProduct Revenue (004.001) -> Supabase 004.001","airtable_sources":"FIN: Invoices","active":true,"debit_label":"Accounts Receivable (121.100)","credit_label":"Product Revenue (004.001)"},{"rule_code":"INV-16","sort_order":6,"trigger_name":"Full or Balance invoice is paid","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 6\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100","airtable_sources":"FIN: Payments","active":true,"debit_label":"Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","credit_label":"Accounts Receivable (121.100)"},{"rule_code":"INV-02","sort_order":7,"trigger_name":"Vendor PRODUCT invoice - price is different from the PO","when_to_post":"[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 7\n[Implementation]\nNot yet\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\n\n[Issues]\n- Deferred: price-variance filters, amount and account mapping are not defined.","airtable_sources":"FIN: Deferred","active":false,"debit_label":"multiple:\n\u2022 Received Not Invoiced (GRNI) (211.200)\n\u2022 Inventory / Purchase Price Variance (004.015)","credit_label":"AP (211.100)"},{"rule_code":"INV-07","sort_order":8,"trigger_name":"Fixed asset purchase invoice (vehicle, fixtures, software) Created","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 8\n[Implementation]\nPartially\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.300: Display Fixtures & Equipment -> Supabase 143.300\nAccounts Payable (211.100) -> Supabase 211.100\n\n[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?","airtable_sources":"FIN: Invoices","active":true,"debit_label":"Invoice account linked\nExample: Display Fixtures & Equipment (143.300)","credit_label":"Accounts Payable (211.100)"},{"rule_code":"INV-17","sort_order":9,"trigger_name":"Fixed Asset Purchase Invoice is Paid","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 9\n[Implementation]\nPartially\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Payable (211.100) -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?","airtable_sources":"FIN: Payments","active":true,"debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)"},{"rule_code":"INV-08","sort_order":10,"trigger_name":"Vendor CREDIT MEMO - returned goods (RGA return for credit)","when_to_post":"[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is not empty","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 10\n[Implementation]\nNot yet\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is not empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 131.400\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n131.400: Pending Return Processing -> Supabase 131.400\n\n\n[Issues]\n- Deferred. Do not post this category yet.","airtable_sources":"FIN: Deferred","active":false,"debit_label":"AP (211.100)","credit_label":"Inventory \u2013 Pending Return Processing (131.400)"},{"rule_code":"INV-09","sort_order":11,"trigger_name":"Vendor CREDIT MEMO - price credit, no goods returned","when_to_post":"[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is empty","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 11\n[Implementation]\nNot yet\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.010\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.010: Cost of Goods Sold -> Supabase 004.010\n\n\n[Issues]\n- Deferred. Do not post this category yet.","airtable_sources":"FIN: Deferred","active":false,"debit_label":"AP (211.100)","credit_label":"COGS (004.010), or the original expense account for expense credits"},{"rule_code":"INV-10","sort_order":12,"trigger_name":"Customer invoice for a NON-product charge Created","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 12\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nInvoices.Linked Chart of Accounts -> Supabase matching account\nExample: 004.002: Coordination Fees Charged -> Supabase 004.002","airtable_sources":"FIN: Invoices","active":true,"debit_label":"Accounts Receivable (121.100)","credit_label":"Invoice account linked\nExample: Coordination Fees Charged (004.002)"},{"rule_code":"INV-18","sort_order":13,"trigger_name":"Customer invoice for a non-product charge paid","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 13\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100","airtable_sources":"FIN: Payments","active":true,"debit_label":"Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","credit_label":"Accounts Receivable (121.100)"},{"rule_code":"INV-11","sort_order":14,"trigger_name":"Customer credit memo for a RETURN","when_to_post":"[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 14\n[Implementation]\nNot yet\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\n\n[Issues]\n- Deferred: return-credit filters, amount and account mapping are not defined.","airtable_sources":"FIN: Deferred","active":false,"debit_label":"multiple:\n\u2022 Sales Returns & Allowances (004.006)\n\u2022 Sales Tax Payable \u2013 ship-to state (212.100)","credit_label":"multiple:\n\u2022 Client Credits on Account (221.300)\n\u2022 Restocking & Cancellation Fees (004.005)"}]'::jsonb) as r(rule_code text,sort_order integer,trigger_name text,when_to_post text,dev_notes text,airtable_sources text,active boolean,debit_label text,credit_label text)
on conflict(rule_code) do update set sort_order=excluded.sort_order,trigger_name=excluded.trigger_name,when_to_post=excluded.when_to_post,dev_notes=excluded.dev_notes,airtable_sources=excluded.airtable_sources,active=excluded.active,reversible=excluded.reversible,debit_label=excluded.debit_label,credit_label=excluded.credit_label;

update public.ledger_rules set active=false,enabled=false where rule_code in ('INV-01','INV-03','INV-04','INV-05','INV-06','INV-02','INV-08','INV-09','INV-11');

insert into public.ledger_rule_lines(rule_code,side,line_order,account_code,account_selector,label) values
('INV-12','debit',1,'121.100',null,'Accounts Receivable (121.100)'),
('INV-12','credit',1,'221.100',null,'Client Deposits Held (221.100)'),
('INV-13','debit',1,null,'invoice_payment_account','Payment account linked'),
('INV-13','credit',1,'121.100',null,'Accounts Receivable (121.100)'),
('INV-14','debit',1,'221.100',null,'Client Deposits Held (221.100)'),
('INV-14','credit',1,'004.001',null,'Product Revenue (004.001)'),
('INV-15','debit',1,'121.100',null,'Accounts Receivable (121.100)'),
('INV-15','credit',1,'004.001',null,'Product Revenue (004.001)'),
('INV-16','debit',1,null,'invoice_payment_account','Payment account linked'),
('INV-16','credit',1,'121.100',null,'Accounts Receivable (121.100)'),
('INV-07','debit',1,null,'invoice_linked_account','Invoice account linked'),
('INV-07','credit',1,'211.100',null,'Accounts Payable (211.100)'),
('INV-17','debit',1,'211.100',null,'Accounts Payable (211.100)'),
('INV-17','credit',1,null,'invoice_payment_account','Payment account linked'),
('INV-10','debit',1,'121.100',null,'Accounts Receivable (121.100)'),
('INV-10','credit',1,null,'invoice_linked_account','Invoice account linked'),
('INV-18','debit',1,null,'invoice_payment_account','Payment account linked'),
('INV-18','credit',1,'121.100',null,'Accounts Receivable (121.100)')
on conflict(rule_code,side,line_order) do update set account_code=excluded.account_code,account_selector=excluded.account_selector,label=excluded.label,is_optional=false;


-- Finalized Expense and Invoice Entry registry, 12 November 2026.
-- Finalize only Expense and Invoice Entry. Journal history is never deleted.
update public.ledger_rules set active=false,enabled=false
where rule_code in ('EXP-08','INV-02','INV-11','INV-01','INV-03','INV-04','INV-05','INV-06');
delete from public.ledger_rules r
where rule_code in ('EXP-08','INV-02','INV-11','INV-01','INV-03','INV-04','INV-05','INV-06')
  and not exists(select 1 from public.journal_entries j where j.rule_code=r.rule_code);

update public.ledger_rules r set dev_notes=c.dev_notes,when_to_post=c.when_to_post,trigger_name=c.trigger_name,
  debit_label=c.debit_label,credit_label=c.credit_label,enabled=c.enabled,active=c.active
from jsonb_to_recordset('[{"rule_code":"EXP-01","dev_notes":"[T-Chart]\nCategory - Expenses, row 2\n[Implementation]\nPartially\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"006.002: Utilities\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n006.002: Utilities -> Supabase 006.002\n211.100: Standard Product -> Supabase 211.100\n\n[Issues]\n- Which operating-expense accounts should qualify beyond Utilities 006.002?","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"006.002: Utilities\"","trigger_name":"Enter an operating expense invoice (ex: Utilities)","debit_label":"Invoice account linked\nExample: Utilities (006.002)","credit_label":"Accounts Payable (211.100)","enabled":false,"active":true},{"rule_code":"EXP-02","dev_notes":"[T-Chart]\nCategory - Expenses, row 6\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = true\nInvoices.Linked Chart of Accounts is not empty\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n008.001: Software Licensing -> Supabase 008.001\n009.002: Travel -> Supabase 009.002\n009.006: Dues & Organization Subscription -> Supabase 009.006\n231.100: Credit Card Clearing -> Supabase 231.100","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = true\nInvoices.Linked Chart of Accounts is not empty\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"","trigger_name":"Company credit-card purchase with NO vendor bill","debit_label":"Invoice account linked\nExamples: Software Licensing (008.001), Travel (009.002)","credit_label":"Credit Card Payable (231.100)","enabled":true,"active":true},{"rule_code":"EXP-03","dev_notes":"[T-Chart]\nCategory - Expenses, row 7\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 135.000\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n135.000: Prepaid Assets -> Supabase 135.000\n211.100: Standard Product -> Supabase 211.100","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty","trigger_name":"Prepaid expense bill (pay a year up front, e.g., insurance) - Invoice, not paid","debit_label":"Prepaid Expenses (135.000)","credit_label":"Accounts Payable (211.100)","enabled":true,"active":true},{"rule_code":"EXP-04","dev_notes":"[T-Chart]\nCategory - Expenses, row 9\n[Implementation]\nFully\n\n[Record]\nPrepay Expenses Log\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPrepay Expenses Log.Cancel Pre-pay Log = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Prepay Expenses Log.Amount Deducted\nDate = Prepay Expenses Log.Applied Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 135.000\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\nNotes = Prepay Expenses Log.Prepay Log\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n007.011: General Insurance -> Supabase 007.011\n135.000: Prepaid Assets -> Supabase 135.000","when_to_post":"[Record]\nPrepay Expenses Log\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPrepay Expenses Log.Cancel Pre-pay Log = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty","trigger_name":"Prepaid expense - monthly use-up (amortization)","debit_label":"Invoice expense account linked\nExample: General Insurance (007.011)","credit_label":"Prepaid Expenses (135.000)","enabled":true,"active":true},{"rule_code":"EXP-05","dev_notes":"[T-Chart]\nCategory - Expenses, row 10\n[Implementation]\nFully\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch Employee\nDebit = 005.102\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.102: Tech Allowance -> Supabase 005.102\n211.100: Standard Product -> Supabase 211.100","when_to_post":"[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Employee Tech Allowance - Not Paid","debit_label":"005.102: Tech Allowance","credit_label":"Accounts Payable (211.100)","enabled":true,"active":true},{"rule_code":"EXP-06","dev_notes":"[T-Chart]\nCategory - Expenses, row 12\n[Implementation]\nFully\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes any of \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.003: Salary - 1099\", \"005.005: 401K\", \"005.006: Payroll Taxes\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.001: Salary - Owners -> Supabase 005.001\n005.002: Salary - W2 -> Supabase 005.002\n005.003: Salary - 1099 -> Supabase 005.003\n005.005: 401K -> Supabase 005.005\n005.006: Payroll Taxes -> Supabase 005.006\n211.100: Standard Product -> Supabase 211.100","when_to_post":"[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes any of \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.003: Salary - 1099\", \"005.005: 401K\", \"005.006: Payroll Taxes\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Payroll - W2 payroll register (per pay date), Owner","debit_label":"Invoice line account linked\nExamples:\n005.001: Salary - Owners\n005.002: Salary - W2\n005.003: Salary - 1099\n005.005: 401K\n005.006: Payroll Taxes","credit_label":"Accounts Payable (211.100)","enabled":true,"active":true},{"rule_code":"EXP-07","dev_notes":"[T-Chart]\nCategory - Expenses, row 14\n[Implementation]\nFully\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.101: Salary - Offshore\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.101\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.101: Salary - Offshore -> Supabase 005.101\n211.100: Standard Product -> Supabase 211.100","when_to_post":"[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.101: Salary - Offshore\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Payroll - offshore - unpaid","debit_label":"005.101: Salary - Offshore","credit_label":"Accounts Payable (211.100)","enabled":true,"active":true},{"rule_code":"EXP-09","dev_notes":"[T-Chart]\nCategory - Expenses, row 16\n[Implementation]\nFully\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.201\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.201: Bonus -> Supabase 005.201\n211.100: Standard Product -> Supabase 211.100","when_to_post":"[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Payrol - Bonuses (Unpaid)","debit_label":"005.201: Bonus","credit_label":"Accounts Payable (211.100)","enabled":true,"active":true},{"rule_code":"EXP-10","dev_notes":"[T-Chart]\nCategory - Expenses, row 20\n[Implementation]\nFully\n\n[Record]\nDepreciation Table\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\n\n[Field Mapping]\nAmount = Depreciation Table.Amount Depreciated\nDate = Depreciation Table.Date\nBranch = Blank\nDebit = 009.101\nCredit = 161.000\n\n[Other Field Mapping]\nNotes = Depreciation Table.Associated Asset\n\n[Account Mapping]\n009.101: Depreciation -> Supabase 009.101\nFixed accumulated depreciation credit -> Supabase 161.000","when_to_post":"[Record]\nDepreciation Table\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]","trigger_name":"Monthly depreciation of equipment, vehicles, fixtures","debit_label":"Depreciation Expense (009.101)","credit_label":"Accumulated Depreciation (161.000)","enabled":true,"active":true},{"rule_code":"EXP-11","dev_notes":"[T-Chart]\nCategory - Expenses, row 21\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.002\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.002: Bank / Misc. Service Charges -> Supabase 007.002\n211.100: Standard Product -> Supabase 211.100","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"","trigger_name":"Bank fees and charges shown only on the bank statement (Unpaid)","debit_label":"Bank, Wire & FX Fees (007.002)","credit_label":"Accounts Payable (211.100)","enabled":true,"active":true},{"rule_code":"EXP-12","dev_notes":"[T-Chart]\nCategory - Expenses, row 23\n[Implementation]\nNot yet\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"007.005: Bad Debt\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.005\nCredit = 121.900\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.005: Bad Debt -> Supabase 007.005\n121.900: Allowance for Doubtful Accounts -> Supabase 121.900\n\n[Notes]\n- Deferred.","when_to_post":"[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"007.005: Bad Debt\"","trigger_name":"Bad-debt reserve (allowance) - month-end\n","debit_label":"Bad Debt Expense (007.005)","credit_label":"Allowance for Doubtful Accounts (121.900)","enabled":false,"active":false},{"rule_code":"EXP-13","dev_notes":"[T-Chart]\nCategory - Expenses, row 26\n[Implementation]\nFully\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoice Lines.Chart of Accounts includes any of \"923100: Federal Income Tax\", \"923300: State Income Tax\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n923100: Federal Income Tax -> Supabase 011.001\n923300: State Income Tax -> Supabase 011.002\n211.100: Standard Product -> Supabase 211.100","when_to_post":"[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoice Lines.Chart of Accounts includes any of \"923100: Federal Income Tax\", \"923300: State Income Tax\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Income tax accrual (quarterly)","debit_label":"Invoice line account linked\nExamples: Federal Income Tax Expense (011.001), State Income Tax Expense (011.002)","credit_label":"Accounts Payable (211.100)","enabled":true,"active":true},{"rule_code":"EXP-14","dev_notes":"[T-Chart]\nCategory - Expenses, row 3\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"006.002: Utilities\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Notes]\n- The invoice counterpart in Expense row 2 remains disabled while partial.","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"006.002: Utilities\"","trigger_name":"When operating expenses are paid","debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":true,"active":true},{"rule_code":"EXP-15","dev_notes":"[T-Chart]\nCategory - Expenses, row 4\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 004.010\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.010: Cost of Goods Sold -> Supabase 004.010\n211.100: Standard Product -> Supabase 211.100","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"","trigger_name":"Everytime a product invoice is created","debit_label":"Cost of Goods Sold (004.010)","credit_label":"Accounts Payable (211.100)","enabled":true,"active":true},{"rule_code":"EXP-16","dev_notes":"[T-Chart]\nCategory - Expenses, row 5\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Possible duplicate settlement with Category - Payment rows 8 or 9.","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"","trigger_name":"Everytime a product invoice is paid","debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":true,"active":true},{"rule_code":"EXP-17","dev_notes":"[T-Chart]\nCategory - Expenses, row 8\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty","trigger_name":"Prepaid Expense BILL (actually paid)","debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":true,"active":true},{"rule_code":"EXP-18","dev_notes":"[T-Chart]\nCategory - Expenses, row 11\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch Employee\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Employee Tech Allowance - Paid","debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":true,"active":true},{"rule_code":"EXP-19","dev_notes":"[T-Chart]\nCategory - Expenses, row 13\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes any of \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.003: Salary - 1099\", \"005.005: 401K\", \"005.006: Payroll Taxes\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Possible duplicate bank posting with Category - Payment row 16.","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes any of \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.003: Salary - 1099\", \"005.005: 401K\", \"005.006: Payroll Taxes\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Payroll - W2 payroll register (Paid)","debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":true,"active":true},{"rule_code":"EXP-20","dev_notes":"[T-Chart]\nCategory - Expenses, row 15\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.101: Salary - Offshore\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Possible duplicate bank posting with Category - Payment row 16.","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.101: Salary - Offshore\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Payroll - offshore - paid","debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":true,"active":true},{"rule_code":"EXP-21","dev_notes":"[T-Chart]\nCategory - Expenses, row 17\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Payrol - Bonuses (paid)","debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":true,"active":true},{"rule_code":"EXP-22","dev_notes":"[T-Chart]\nCategory - Expenses, row 18\n[Implementation]\nNot yet\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.103: 13th Month\"\nInvoice Lines.Line Amount Is Not Empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per account\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.103: 13th Month\nCredit = 241.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.201: Bonus -> Supabase 005.201\n241.300: Accrued, unpaid bonus -> Supabase 241.300\n\n[Notes]\n- Deferred.","when_to_post":"[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.103: 13th Month\"\nInvoice Lines.Line Amount Is Not Empty","trigger_name":"Payroll - offshore - Month-end accrual Bonus (Unpaid)","debit_label":"13th Month Bonus (005.103)","credit_label":"Accrued Bonus & Commission (241.300)","enabled":false,"active":false},{"rule_code":"EXP-23","dev_notes":"[T-Chart]\nCategory - Expenses, row 19\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.103: 13th Month\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 241.300\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n241.300: Accrued Bonus & Commission -> Supabase 241.300\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.103: 13th Month\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Payroll - offshore - Month-end accrual Bonus (Paid)","debit_label":"Accrued Bonus & Commission (241.300)","credit_label":"Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":true,"active":true},{"rule_code":"EXP-24","dev_notes":"[T-Chart]\nCategory - Expenses, row 24\n[Implementation]\nNot yet\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n\n\n[Notes]\n- Deferred.","when_to_post":"[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n","trigger_name":"Bad-Debt Journal Entry","debit_label":"Allowance for Doubtful Accounts (121.900)","credit_label":"AR account (pending)","enabled":false,"active":false},{"rule_code":"EXP-25","dev_notes":"[T-Chart]\nCategory - Expenses, row 25\n[Implementation]\nNot yet\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n\n\n[Notes]\n- Deferred.","when_to_post":"[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n","trigger_name":"Bad-Debt Reversal Entry","debit_label":"Bank account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747)","credit_label":"Bad Debt Expense (007.005)\nAllowance for Doubtful Accounts (121.900)","enabled":false,"active":false},{"rule_code":"EXP-26","dev_notes":"[T-Chart]\nCategory - Expenses, row 27\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes any of \"923100: Federal Income Tax\", \"923300: State Income Tax\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Possible duplicate bank posting with Category - Payment row 23.","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes any of \"923100: Federal Income Tax\", \"923300: State Income Tax\"\nInvoice Lines.Line Amount is not empty","trigger_name":"Income tax accrual (Paid)","debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":true,"active":true},{"rule_code":"EXP-27","dev_notes":"[T-Chart]\nCategory - Expenses, row 22\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"","trigger_name":"Bank fees and charges shown only on the bank statement (Paid)","debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":true,"active":true},{"rule_code":"INV-07","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 8\n[Implementation]\nPartially\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.300: Display Fixtures & Equipment -> Supabase 143.300\nAccounts Payable (211.100) -> Supabase 211.100\n\n[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"","trigger_name":"Fixed asset purchase invoice (vehicle, fixtures, software) Created","debit_label":"Invoice account linked\nExample: Display Fixtures & Equipment (143.300)","credit_label":"Accounts Payable (211.100)","enabled":false,"active":true},{"rule_code":"INV-08","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 10\n[Implementation]\nNot yet\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is not empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 131.400\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n131.400: Pending Return Processing -> Supabase 131.400\n\n[Notes]\n- Deferred.","when_to_post":"[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is not empty","trigger_name":"Vendor CREDIT MEMO - returned goods (RGA return for credit)","debit_label":"AP (211.100)","credit_label":"Inventory \u2013 Pending Return Processing (131.400)","enabled":false,"active":false},{"rule_code":"INV-09","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 11\n[Implementation]\nNot yet\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.010\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.010: Cost of Goods Sold -> Supabase 004.010\n\n[Notes]\n- Deferred.","when_to_post":"[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is empty","trigger_name":"Vendor CREDIT MEMO - price credit, no goods returned","debit_label":"AP (211.100)","credit_label":"COGS (004.010), or the original expense account for expense credits","enabled":false,"active":false},{"rule_code":"INV-10","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 12\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nInvoices.Linked Chart of Accounts -> Supabase matching account\nExample: 004.002: Coordination Fees Charged -> Supabase 004.002\n\n[Issues]\n- Possible duplicate with Category - Payment rows 18/22/24/26/28 if those rules are enabled.","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"","trigger_name":"Customer invoice for a NON-product charge Created","debit_label":"Accounts Receivable (121.100)","credit_label":"Invoice account linked\nExample: Coordination Fees Charged (004.002)","enabled":true,"active":true},{"rule_code":"INV-12","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 2\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 221.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nClient Deposits Held (221.100) -> Supabase 221.100","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"","trigger_name":"Deposit Invoice is created","debit_label":"Accounts Receivable (121.100)","credit_label":"Client Deposits Held (221.100)","enabled":true,"active":true},{"rule_code":"INV-13","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 3\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100\n\n[Issues]\n- Possible duplicate cash posting with Category - Payment rows 2/3 if those rules are enabled.","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"","trigger_name":"Deposit Invoice is paid","debit_label":"Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","credit_label":"Accounts Receivable (121.100)","enabled":true,"active":true},{"rule_code":"INV-14","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 4\n[Implementation]\nPartially\n\n[Record]\nShipping Record\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nShipping Record.Ship Out = true\nShipping Record.Ship Out Date is not empty\n\n[Field Mapping]\nAmount = Sum of linked MTAs.Extended Sell Price\nDate = Shipping Record.Ship Out Date\nBranch = Linked MTAs.Branch\nDebit = 221.100\nCredit = 004.001\n\n[Other Field Mapping]\nTransaction Reference = Shipping Record.Transaction\nState References = Linked MTAs.States & Sales Tax Rates\n\n[Account Mapping]\nClient Deposits Held (221.100) -> Supabase 221.100\nProduct Revenue (004.001) -> Supabase 004.001\n\n[Notes]\n- Deposit recognition is not capped yet.\n- Shipping Record currently links to MTAs (Deprecated) and Transactions (Deprecated).\n\n[Issues]\n- Which deposit invoice sets the maximum recognition amount for each shipping record?\n- The Shipping Record reversal checkbox automation is not configured yet.","when_to_post":"[Record]\nShipping Record\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nShipping Record.Ship Out = true\nShipping Record.Ship Out Date is not empty","trigger_name":"For each shipping record that shipped, create an entry against the deposit from linked total $ amount of MTA unit prices","debit_label":"Client Deposits Held (221.100)","credit_label":"Product Revenue (004.001)","enabled":false,"active":true},{"rule_code":"INV-15","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 5\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 004.001\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nProduct Revenue (004.001) -> Supabase 004.001","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"","trigger_name":"Full or Balance Invoice is created","debit_label":"Accounts Receivable (121.100)","credit_label":"Product Revenue (004.001)","enabled":true,"active":true},{"rule_code":"INV-16","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 6\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100\n\n[Issues]\n- Possible duplicate cash posting with Category - Payment rows 2/3 if those rules are enabled.","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"","trigger_name":"Full or Balance invoice is paid","debit_label":"Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","credit_label":"Accounts Receivable (121.100)","enabled":true,"active":true},{"rule_code":"INV-17","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 9\n[Implementation]\nPartially\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Payable (211.100) -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"","trigger_name":"Fixed Asset Purchase Invoice is Paid","debit_label":"Accounts Payable (211.100)","credit_label":"Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","enabled":false,"active":true},{"rule_code":"INV-18","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 13\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100\n\n[Issues]\n- Possible duplicate with Category - Payment rows 18/22/24/26/28 if those rules are enabled.","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"","trigger_name":"Customer invoice for a non-product charge paid","debit_label":"Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)","credit_label":"Accounts Receivable (121.100)","enabled":true,"active":true}]'::jsonb) as c(rule_code text,dev_notes text,when_to_post text,trigger_name text,debit_label text,credit_label text,enabled boolean,active boolean)
where r.rule_code=c.rule_code;

-- Final Expense and Invoice Entry catalog, accounts and shared deposit lookup.
-- Replaces only unrecorded local increments; existing migration history and journals are preserved.

-- Preserve FIN account identity and classify distributions as contra-equity.
insert into public.accounts
  (code, name, account_type, subtype, normal_balance, is_bank, is_postable, active, airtable_record_id)
values
  ('007.012', 'Life Insurance', 'expense', 'opex', 'debit', false, true, true, 'recOISQxKs7D8ly8c'),
  ('316.200', 'Current Year Distributions', 'equity', 'distributions', 'debit', false, true, true, 'recyd0u3t15rqUi3l')
on conflict (code) do update set
  name=excluded.name, account_type=excluded.account_type, subtype=excluded.subtype,
  normal_balance=excluded.normal_balance, is_bank=excluded.is_bank,
  is_postable=excluded.is_postable, active=excluded.active,
  airtable_record_id=excluded.airtable_record_id;

-- Complete the reviewed operating account allowlist without changing existing account metadata.
insert into public.accounts (code,name,account_type,subtype,normal_balance,is_bank,is_postable,active,airtable_record_id)
select code,name,account_type::public.account_type,subtype,normal_balance::public.balance_side,is_bank,is_postable,active,airtable_record_id
from jsonb_to_recordset($accounts$[
  {
    "code": "004.012",
    "name": "Returns Disposed Of",
    "account_type": "expense",
    "subtype": "cogs",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recxuZlrhM9AnHdKl"
  },
  {
    "code": "004.013",
    "name": "Freight & Handling Cost",
    "account_type": "expense",
    "subtype": "cogs",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": null
  },
  {
    "code": "005.004",
    "name": "Insurance: Health, Dental, STD",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "rec09TLJJNYBZozcV"
  },
  {
    "code": "005.301",
    "name": "Payroll Processing",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "rec361wUM7OpTkzaj"
  },
  {
    "code": "005.302",
    "name": "Training & Development",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recpgeeTaNh0j999i"
  },
  {
    "code": "006.001",
    "name": "Rent",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recNGyZhWR94dJQkh"
  },
  {
    "code": "006.002",
    "name": "Utilities",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": null
  },
  {
    "code": "006.003",
    "name": "Safety & Security Expense",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recjG7v56GHEapzht"
  },
  {
    "code": "006.004",
    "name": "Cleaning",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "rec8ziKZFrKDcO0tZ"
  },
  {
    "code": "007.001",
    "name": "Accounting",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "receWZg3aJS0wmDkL"
  },
  {
    "code": "007.003",
    "name": "Interest Expense",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": null
  },
  {
    "code": "007.004",
    "name": "Merchant Services",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recijCAT7INhBU1fI"
  },
  {
    "code": "007.006",
    "name": "Sales Tax Miscalculations",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": null
  },
  {
    "code": "007.007",
    "name": "Legal",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recko1VeTaIWPJqdd"
  },
  {
    "code": "007.011",
    "name": "General Insurance",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": null
  },
  {
    "code": "007.012",
    "name": "Life Insurance",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recOISQxKs7D8ly8c"
  },
  {
    "code": "008.001",
    "name": "Software Licensing",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": null
  },
  {
    "code": "008.002",
    "name": "IT Services",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recMjlRf4mb9XC5ol"
  },
  {
    "code": "008.003",
    "name": "Server Hosting",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recsbMnqdjFPqX0BK"
  },
  {
    "code": "008.004",
    "name": "Telephone",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recR7b04vmj7Pfx5g"
  },
  {
    "code": "009.001",
    "name": "Marketing & Promotion",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recf9fPK8d2WU4vbL"
  },
  {
    "code": "009.002",
    "name": "Travel",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recNVjoY2qo8bdQT7"
  },
  {
    "code": "009.003",
    "name": "Meals & Entertainment",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recBflvdRwHHFFepY"
  },
  {
    "code": "009.004",
    "name": "Warehouse Supplies",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recGmMBKgrVUNB0cj"
  },
  {
    "code": "009.005",
    "name": "Office Expenses",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recalDCxZyTa6oBE3"
  },
  {
    "code": "009.006",
    "name": "Dues & Organization Subscription",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recsUdNvhsEbvL9v3"
  },
  {
    "code": "009.007",
    "name": "Repairs & Maintenance",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "reczUYR3vjrFK2AGT"
  },
  {
    "code": "009.008",
    "name": "Selling Expense",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "rec6IMNa7M4yrXT8r"
  },
  {
    "code": "009.009",
    "name": "Donations",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "rechABN52b1EGVtV6"
  },
  {
    "code": "009.010",
    "name": "Postage",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recPMiTvUUF6Bwzen"
  },
  {
    "code": "009.011",
    "name": "Consulting",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recWOS4ruekFhsD8d"
  },
  {
    "code": "009.012",
    "name": "Permit & Licenses",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recUDrEf79caMDXhq"
  },
  {
    "code": "009.013",
    "name": "Shipping Insurance Premiums",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recyt7Cbu1ydlMRti"
  },
  {
    "code": "009.102",
    "name": "Inventory Adjustments",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "rectwHldxWAbnXpHM"
  },
  {
    "code": "010.002",
    "name": "Misc. Expense",
    "account_type": "expense",
    "subtype": "other_expense",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "reckZo04JiwlusgxP"
  },
  {
    "code": "525.300",
    "name": "Workers Compensation",
    "account_type": "expense",
    "subtype": "payroll",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recV3DduaAU8fibUC"
  },
  {
    "code": "922.000",
    "name": "Freight and Handling In",
    "account_type": "expense",
    "subtype": "opex",
    "normal_balance": "debit",
    "is_bank": false,
    "is_postable": true,
    "active": true,
    "airtable_record_id": "recwI7644usVPCiDO"
  }
]$accounts$::jsonb) as a(code text,name text,account_type text,subtype text,normal_balance text,is_bank boolean,is_postable boolean,active boolean,airtable_record_id text)
on conflict (code) do nothing;

-- Operating metadata has its own selector; no-vendor-bill and prepaid mappings remain dynamic.
insert into public.account_selectors (selector,description) values ('operating_expense','The 37 reviewed operating invoice accounts, excluding dedicated Expense categories.') on conflict (selector) do update set description=excluded.description;
insert into public.account_selector_members (selector,account_code)
select 'operating_expense',value from jsonb_array_elements_text($codes$["004.012", "004.013", "005.004", "005.301", "005.302", "006.001", "006.002", "006.003", "006.004", "007.001", "007.003", "007.004", "007.006", "007.007", "007.011", "007.012", "008.001", "008.002", "008.003", "008.004", "009.001", "009.002", "009.003", "009.004", "009.005", "009.006", "009.007", "009.008", "009.009", "009.010", "009.011", "009.012", "009.013", "009.102", "010.002", "525.300", "922.000"]$codes$::jsonb) on conflict do nothing;
update public.ledger_rule_lines set account_selector='operating_expense' where rule_code='EXP-01' and side='debit' and line_order=1;

create index if not exists journal_lines_deposit_invoice_refs_idx
on public.journal_lines using gin (invoice_ref) where account_code='221.100';

update public.ledger_rules r set
  sort_order=coalesce(c.sort_order,r.sort_order),
  trigger_name=coalesce(c.trigger_name,r.trigger_name),
  when_to_post=coalesce(c.when_to_post,r.when_to_post),
  fin_notes=coalesce(c.fin_notes,r.fin_notes),
  dev_notes=coalesce(c.dev_notes,r.dev_notes),
  airtable_sources=coalesce(c.airtable_sources,r.airtable_sources),
  reversible=coalesce(c.reversible,r.reversible),
  active=coalesce(c.active,r.active),
  enabled=coalesce(c.enabled,r.enabled),
  debit_label=coalesce(c.debit_label,r.debit_label),
  credit_label=coalesce(c.credit_label,r.credit_label)
from jsonb_to_recordset($catalog$[
  {"rule_code":"EXP-01","dev_notes":"[T-Chart]\nCategory - Expenses, row 2\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes any of \"004.012\", \"004.013\", \"005.004\", \"005.301\", \"005.302\", \"006.001\", \"006.002\", \"006.003\", \"006.004\", \"007.001\", \"007.003\", \"007.004\", \"007.006\", \"007.007\", \"007.011\", \"007.012\", \"008.001\", \"008.002\", \"008.003\", \"008.004\", \"009.001\", \"009.002\", \"009.003\", \"009.004\", \"009.005\", \"009.006\", \"009.007\", \"009.008\", \"009.009\", \"009.010\", \"009.011\", \"009.012\", \"009.013\", \"009.102\", \"010.002\", \"525300\", \"922000\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.012: Returns Disposed Of -> Supabase 004.012\n004.013: Freight Cost -> Supabase 004.013\n005.004: Insurance: Health, Dental, STD -> Supabase 005.004\n005.301: Payroll Processing -> Supabase 005.301\n005.302: Training & Development -> Supabase 005.302\n006.001: Rent -> Supabase 006.001\n006.002: Utilities -> Supabase 006.002\n006.003: Safety & Security Expense -> Supabase 006.003\n006.004: Cleaning -> Supabase 006.004\n007.001: Accounting -> Supabase 007.001\n007.003: Interest Expense -> Supabase 007.003\n007.004: Merchant Services -> Supabase 007.004\n007.006: Sales Tax Miscalculations -> Supabase 007.006\n007.007: Legal -> Supabase 007.007\n007.011: General Insurance -> Supabase 007.011\n007.012: Life Insurance -> Supabase 007.012\n008.001: Software Licensing -> Supabase 008.001\n008.002: IT Services -> Supabase 008.002\n008.003: Server Hosting -> Supabase 008.003\n008.004: Telephone -> Supabase 008.004\n009.001: Marketing & Promotion -> Supabase 009.001\n009.002: Travel -> Supabase 009.002\n009.003: Meals & Entertainment -> Supabase 009.003\n009.004: Warehouse Supplies -> Supabase 009.004\n009.005: Office Expenses -> Supabase 009.005\n009.006: Dues & Organization Subscription -> Supabase 009.006\n009.007: Repairs & Maintenance -> Supabase 009.007\n009.008: Selling Expense -> Supabase 009.008\n009.009: Donations -> Supabase 009.009\n009.010: Postage -> Supabase 009.010\n009.011: Consulting -> Supabase 009.011\n009.012: Permit & Licenses -> Supabase 009.012\n009.013: Shipping Insurance Premiums -> Supabase 009.013\n009.102: Inventory Adjustments -> Supabase 009.102\n010.002: Misc. Expense -> Supabase 010.002\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000\n211.100: Standard Product -> Supabase 211.100\n\n[Notes]\n- The 37 operating accounts are hardcoded; the Airtable checkbox is not read during sync.","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes any of \"004.012\", \"004.013\", \"005.004\", \"005.301\", \"005.302\", \"006.001\", \"006.002\", \"006.003\", \"006.004\", \"007.001\", \"007.003\", \"007.004\", \"007.006\", \"007.007\", \"007.011\", \"007.012\", \"008.001\", \"008.002\", \"008.003\", \"008.004\", \"009.001\", \"009.002\", \"009.003\", \"009.004\", \"009.005\", \"009.006\", \"009.007\", \"009.008\", \"009.009\", \"009.010\", \"009.011\", \"009.012\", \"009.013\", \"009.102\", \"010.002\", \"525300\", \"922000\"","enabled":true},
  {"rule_code":"EXP-02","dev_notes":"[T-Chart]\nCategory - Expenses, row 6\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = true\nInvoices.Linked Chart of Accounts is not empty\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n008.001: Software Licensing -> Supabase 008.001\n009.002: Travel -> Supabase 009.002\n009.006: Dues & Organization Subscription -> Supabase 009.006\n231.100: Credit Card Clearing -> Supabase 231.100\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000","fin_notes":"AP expense card payment marked as no vendor bill. Use Payments.Amount and Payments.Payment Date; debit the linked invoice expense account and credit 231.100."},
  {"rule_code":"EXP-04","dev_notes":"[T-Chart]\nCategory - Expenses, row 9\n[Implementation]\nFully\n\n[Record]\nPrepay Expenses Log\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPrepay Expenses Log.Cancel Pre-pay Log = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Prepay Expenses Log.Amount Deducted\nDate = Prepay Expenses Log.Applied Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 135.000\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\nNotes = Prepay Expenses Log.Prepay Log\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n007.011: General Insurance -> Supabase 007.011\n135.000: Prepaid Assets -> Supabase 135.000\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000"},
  {"rule_code":"EXP-07","fin_notes":"AP Staff invoice lines linked to 005.101: Salary - Offshore. Use each Line Amount and Invoice Date; debit 005.101 and credit Accounts Payable 211.100."},
  {"rule_code":"EXP-13","fin_notes":"AP expense invoice lines linked to FIN 923100: Federal Income Tax or 923300: State Income Tax. Use each Line Amount and Invoice Date; map the debit to 011.001 or 011.002 and credit Accounts Payable 211.100."},
  {"rule_code":"EXP-14","dev_notes":"[T-Chart]\nCategory - Expenses, row 3\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes any of \"004.012\", \"004.013\", \"005.004\", \"005.301\", \"005.302\", \"006.001\", \"006.002\", \"006.003\", \"006.004\", \"007.001\", \"007.003\", \"007.004\", \"007.006\", \"007.007\", \"007.011\", \"007.012\", \"008.001\", \"008.002\", \"008.003\", \"008.004\", \"009.001\", \"009.002\", \"009.003\", \"009.004\", \"009.005\", \"009.006\", \"009.007\", \"009.008\", \"009.009\", \"009.010\", \"009.011\", \"009.012\", \"009.013\", \"009.102\", \"010.002\", \"525300\", \"922000\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100","when_to_post":"[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Return Payment (AP) = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes any of \"004.012\", \"004.013\", \"005.004\", \"005.301\", \"005.302\", \"006.001\", \"006.002\", \"006.003\", \"006.004\", \"007.001\", \"007.003\", \"007.004\", \"007.006\", \"007.007\", \"007.011\", \"007.012\", \"008.001\", \"008.002\", \"008.003\", \"008.004\", \"009.001\", \"009.002\", \"009.003\", \"009.004\", \"009.005\", \"009.006\", \"009.007\", \"009.008\", \"009.009\", \"009.010\", \"009.011\", \"009.012\", \"009.013\", \"009.102\", \"010.002\", \"525300\", \"922000\"","enabled":true},
  {"rule_code":"EXP-15","dev_notes":"[T-Chart]\nCategory - Expenses, row 4\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 004.010\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.010: Cost of Goods Sold -> Supabase 004.010\n211.100: Standard Product -> Supabase 211.100\n\n[Issues]\n- Negative AP Product invoices also match this category. Should they use a different category?"},
  {"rule_code":"INV-07","fin_notes":"Record the asset invoice on Invoice Date. Depreciation is handled separately in Category - Expenses row 20.","sort_order":7,"dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 7\n[Implementation]\nPartially\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.300: Display Fixtures & Equipment -> Supabase 143.300\nAccounts Payable (211.100) -> Supabase 211.100\n\n[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?"},
  {"rule_code":"INV-08","sort_order":9,"trigger_name":"Vendor credit memo - returned goods (RGA return for credit)","when_to_post":"[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is not empty","fin_notes":"Record the vendor credit by debiting Accounts Payable and crediting Inventory - Pending Return Processing.","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 9\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is not empty\n\n[Field Mapping]\nAmount = -Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 131.400\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n131.400: Pending Return Processing -> Supabase 131.400\n\n[Notes]\n- FIN stores vendor credits as negative invoice amounts.","airtable_sources":"FIN: Invoices","reversible":true,"active":true,"enabled":true,"debit_label":"Accounts Payable (211.100)","credit_label":"Inventory - Pending Return Processing (131.400)"},
  {"rule_code":"INV-09","sort_order":10,"dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 10\n[Implementation]\nNot yet\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.010\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.010: Cost of Goods Sold -> Supabase 004.010\n\n[Notes]\n- Deferred."},
  {"rule_code":"INV-10","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 11\n[Implementation]\nFully\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nInvoices.Linked Chart of Accounts -> Supabase matching account\nExample: 004.002: Coordination Fees Charged -> Supabase 004.002\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000\n\n[Issues]\n- Possible duplicate with Category - Payment rows 18/22/24/26/28 if those rules are enabled.","sort_order":11},
  {"rule_code":"INV-13","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 3\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\n\n[Field Mapping]\nAmount = Payments.Amount x Sum of matching Invoices.Payment Proportion For Batch Allocation\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100\n\n[Notes]\n- Product and Non-Product invoices are paid separately.\n\n- Repeated batch payments link the same invoices with unchanged invoice amounts.\n\n[Issues]\n- Possible duplicate cash posting with Category - Payment rows 2/3 if those rules are enabled."},
  {"rule_code":"INV-14","sort_order":4,"trigger_name":"Shipment against client deposit","when_to_post":"[Record]\nShipping Records\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nShipping Records.Ship Out = true\nShipping Records.Ship Out Date is not empty\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\nInvoices.Cancel Invoice = false","fin_notes":"Release the shipped selling value from Client Deposits Held to Product Revenue, up to the remaining deposit balance.","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 4\n[Implementation]\nFully\n\n[Record]\nShipping Records\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nShipping Records.Ship Out = true\nShipping Records.Ship Out Date is not empty\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\nInvoices.Cancel Invoice = false\n\n[Field Mapping]\nAmount = MIN(Sum of linked MTAs.Extended Sell Price, MAX(0, Remaining posted deposit balance))\nDate = Shipping Records.Ship Out Date\nBranch = Linked MTAs.Branch\nDebit = 221.100\nCredit = 004.001\n\n[Other Field Mapping]\nVendor Reference = Deposit Invoice.Linked Vendors\nClient Reference = Deposit Invoice.Linked Client\nStaff Reference = Deposit Invoice.Linked Staff\nTransaction Reference = Shipping Records.Transaction\nPO Reference = Deposit Invoice.Related Purchase Order\nState References = Linked MTAs.States, and Sales Tax Rates\n\n[Account Mapping]\n221.100: Client Deposits Held -> Supabase 221.100\n004.001: Product Revenue -> Supabase 004.001\n\n[Notes]\n- Remaining deposit is the net posted 221.100 balance linked to the deposit invoice, including reversals.\n\n- Requires one transaction and one deposit invoice; ambiguous links stop without posting.","airtable_sources":"FIN: Shipping Records","reversible":true,"active":true,"enabled":true,"debit_label":"Client Deposits Held (221.100)","credit_label":"Product Revenue (004.001)"},
  {"rule_code":"INV-16","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 6\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"\n\n[Field Mapping]\nAmount = Payments.Amount x Sum of matching Invoices.Payment Proportion For Batch Allocation\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100\n\n[Notes]\n- Product and Non-Product invoices are paid separately.\n\n- Repeated batch payments link the same invoices with unchanged invoice amounts.\n\n[Issues]\n- Possible duplicate cash posting with Category - Payment rows 2/3 if those rules are enabled."},
  {"rule_code":"INV-17","sort_order":8,"dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 8\n[Implementation]\nPartially\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Payable (211.100) -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?"},
  {"rule_code":"INV-18","dev_notes":"[T-Chart]\nCategory - Invoice Entry, row 12\n[Implementation]\nFully\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100\n\n[Notes]\n- Product and Non-Product invoices are paid separately.\n\n[Issues]\n- Possible duplicate with Category - Payment rows 18/22/24/26/28 if those rules are enabled.","sort_order":12}
]$catalog$::jsonb)
  as c(rule_code text, sort_order integer, trigger_name text, when_to_post text, fin_notes text, dev_notes text, airtable_sources text, reversible boolean, active boolean, enabled boolean, debit_label text, credit_label text)
where r.rule_code=c.rule_code;

-- Current Payment catalog (17 November 2026).
-- Existing hosted catalog targets, also available before seed on fresh installations.
insert into public.accounts(code,name,account_type,subtype,normal_balance,is_bank,is_postable,active,airtable_record_id)
select code,name,account_type::public.account_type,subtype,normal_balance::public.balance_side,is_bank,is_postable,active,airtable_record_id
from jsonb_to_recordset($targets$[{"code": "004.011", "name": "Purchase Discounts & Rebates", "account_type": "expense", "subtype": "contra_cogs", "normal_balance": "credit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "112.100", "name": "Bank \u2013 Fifth Third", "account_type": "asset", "subtype": "bank", "normal_balance": "debit", "is_bank": true, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "121.100", "name": "Accounts Receivable", "account_type": "asset", "subtype": "receivable", "normal_balance": "debit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "122.100", "name": "Insurance Claims Receivable", "account_type": "asset", "subtype": "receivable", "normal_balance": "debit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "143.200", "name": "Security Deposits", "account_type": "asset", "subtype": "other_asset", "normal_balance": "debit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "211.100", "name": "Accounts Payable", "account_type": "liability", "subtype": "payable", "normal_balance": "credit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "221.300", "name": "Client Credits on Account", "account_type": "liability", "subtype": "customer_funds", "normal_balance": "credit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "231.100", "name": "Credit Card Payable", "account_type": "liability", "subtype": "credit_card", "normal_balance": "credit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "311.200", "name": "Additional Paid-in Capital", "account_type": "equity", "subtype": "capital", "normal_balance": "credit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "316.100", "name": "Shareholder Distributions", "account_type": "equity", "subtype": "distributions", "normal_balance": "debit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}]$targets$::jsonb) as a(code text,name text,account_type text,subtype text,normal_balance text,is_bank boolean,is_postable boolean,active boolean,airtable_record_id text) on conflict(code) do nothing;

-- Reordered Payment T-Charts. Retire only unreferenced rules; posted history stays reversible.
update public.ledger_rules r set active=false,enabled=false where r.category='payment' and r.rule_code not in ('PAY-03','PAY-28','PAY-29','PAY-08','PAY-09','PAY-10','PAY-11','PAY-12','PAY-30','PAY-13','PAY-31','PAY-16','PAY-20','PAY-21','PAY-23','PAY-32','PAY-24','PAY-27');
delete from public.ledger_rules r where r.category='payment' and r.rule_code not in ('PAY-03','PAY-28','PAY-29','PAY-08','PAY-09','PAY-10','PAY-11','PAY-12','PAY-30','PAY-13','PAY-31','PAY-16','PAY-20','PAY-21','PAY-23','PAY-32','PAY-24','PAY-27')
 and not exists(select 1 from public.journal_entries e where e.rule_code=r.rule_code)
 and not exists(select 1 from public.ledger_posting_requests p where p.status in ('pending','approved','rejected') and p.payload::text like '%'||r.rule_code||'%');

insert into public.ledger_rules(rule_code,category,sort_order,trigger_name,when_to_post,fin_notes,dev_notes,airtable_sources,reversible,active,enabled,debit_label,credit_label)
select rule_code,'payment',sort_order,trigger_name,when_to_post,fin_notes,dev_notes,airtable_sources,reversible,active,enabled,debit_label,credit_label
from jsonb_populate_recordset(null::public.ledger_rules,$payment$[
  {
    "rule_code": "PAY-03",
    "category": "payment",
    "sort_order": 2,
    "trigger_name": "Client OVERPAYS or pays with no invoice to apply it to",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Refund/Credit\"",
    "fin_notes": "Use the refund/credit payment amount to record credit available for another order.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 2\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nRecognize the AR refund/credit invoice, regardless of Method of Application.\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Refund/Credit\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount (sign pending)\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Pending - funding account\nCredit = 221.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\nClient Credits on Account (221.300) -> Supabase 221.300\n\n[Issues]\n- The original receipt may already debit the bank through Invoice Entry row 3 or 6. Which account should fund this client credit instead?\n\n- The sampled credit invoices are negative. Should Amount negate Invoice Amount to credit the client-credit liability?",
    "airtable_sources": "FIN: Invoices",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "credit_label": "Client Credits on Account (221.300)"
  },
  {
    "rule_code": "PAY-28",
    "category": "payment",
    "sort_order": 3,
    "trigger_name": "When we apply AR Credits to Open invoices",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Credits Applied is not empty\nInvoices.Credits Applied != 0\nSource Credit Invoice.Method of Application = \"Credit to Another Order\"",
    "fin_notes": "",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 3\n[Implementation]\nFully\n\nApply client credit to the recipient AR invoice when Credits Applied is populated and nonzero.\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Credits Applied is not empty\nInvoices.Credits Applied != 0\nSource Credit Invoice.Method of Application = \"Credit to Another Order\"\n\n[Field Mapping]\nAmount = -Invoices.Credits Applied\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 221.300\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nClient Credits on Account (221.300) -> Supabase 221.300\n121.100: Accounts Receivable -> Supabase 121.100",
    "airtable_sources": "FIN: Invoices",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Client Credits on Account (221.300)",
    "credit_label": "Accounts Receivable (121.100)"
  },
  {
    "rule_code": "PAY-29",
    "category": "payment",
    "sort_order": 4,
    "trigger_name": "When we refund AR credits to customers (no remaining open invoices)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Refund/Credit\"\nInvoices.Method of Application = \"Cash Refund\"",
    "fin_notes": "",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 4\n[Implementation]\nFully\n\nRefund the client credit when the linked Cash Refund invoice payment is Sent.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Refund/Credit\"\nInvoices.Method of Application = \"Cash Refund\"\n\n[Field Mapping]\nAmount = -Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 221.300\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nClient Credits on Account (221.300) -> Supabase 221.300\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Client Credits on Account (221.300)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)"
  },
  {
    "rule_code": "PAY-08",
    "category": "payment",
    "sort_order": 5,
    "trigger_name": "Pay a vendor with the company credit card",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"",
    "fin_notes": "Use Payment Date for AP Product payments made through Credit Card Clearing 231.100.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 5\n[Implementation]\nPartial - functioning; duplicate risk noted\n\nPay an AP Product invoice through Credit Card Clearing 231.100.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Category - Expenses row 5 already matches these product card payments. Which category should own this entry so it posts only once?",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Credit Card Payable (231.100)"
  },
  {
    "rule_code": "PAY-09",
    "category": "payment",
    "sort_order": 6,
    "trigger_name": "Pay the credit-card statement",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"CC Batch Payment\"",
    "fin_notes": "When: When the card batch payment is sent (Payment Record Type = 'CC Batch Payment').",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 6\n[Implementation]\nFully\n\nPay the CC Batch Payment record from its selected payment account.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"CC Batch Payment\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Linked Mini-Payments.Invoices.Branch\nDebit = 231.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Linked Mini-Payments.Invoices.Linked Vendors\nClient Reference = Linked Mini-Payments.Invoices.Linked Client\nStaff Reference = Linked Mini-Payments.Invoices.Linked Staff\nTransaction Reference = Linked Mini-Payments.Invoices.Linked Transaction\nPO Reference = Linked Mini-Payments.Invoices.Related Purchase Order\nState References = Linked Mini-Payments.Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n231.100: Credit Card Clearing -> Supabase 231.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Credit Card Payable (231.100)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)"
  },
  {
    "rule_code": "PAY-10",
    "category": "payment",
    "sort_order": 7,
    "trigger_name": "Early-payment discount taken when paying a vendor",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nLinked Payments.Sent = true\nInvoice Lines.Line Type = \"Discount\"\nInvoice Lines.Discount Line Status != \"Expired\"",
    "fin_notes": "Use non-expired discount lines from a Fully Paid AP invoice. Credit account mapping remains unresolved.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 7\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nRecord the early-payment discount line separately from the cash payment, if the invoice accrual has not already included it.\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nLinked Payments.Sent = true\nInvoice Lines.Line Type = \"Discount\"\nInvoice Lines.Discount Line Status != \"Expired\"\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount (sign pending)\nDate = Linked Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.011 (pending approval)\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.011: Purchased Discounts & Rebate -> Supabase 004.011\n\n[Issues]\n- Expense row 4 posts Invoice Amount after discount, and Expense row 5 clears that net amount. Should the invoice accrual use the gross amount before this separate discount entry?\n\n- Confirm this row credits only 004.011. The account column previously also included the bank, which the payment entry already credits.\n\n- Discount Line Amount is negative, for example -3.58. Should its amount be negated for debit AP / credit 004.011?",
    "airtable_sources": "FIN: Invoice Lines",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Purchase Discounts & Rebates (004.011) - pending approval"
  },
  {
    "rule_code": "PAY-11",
    "category": "payment",
    "sort_order": 8,
    "trigger_name": "Bill paid using vendor credits (no cash)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Credits Applied is not empty\nInvoices.Credits Applied != 0",
    "fin_notes": "Use Credits Applied from a Fully Paid AP invoice with a Sent payment. Keep separate bill and source-credit references.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 8\n[Implementation]\nFully\n\nSettle the linked AP bill using vendor credits. The Sent payment owns the journal and reversal.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Credits Applied is not empty\nInvoices.Credits Applied != 0\n\n[Field Mapping]\nAmount = -Invoices.Credits Applied\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100 (bill)\nCredit = 211.100 (source credit invoice)\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n\n[Notes]\n- A zero-cash Sent payment still qualifies. Do not require Payments.Amount to be nonzero.",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Accounts Payable (211.100)\nBill being settled",
    "credit_label": "Accounts Payable (211.100)\nSource credit invoice"
  },
  {
    "rule_code": "PAY-12",
    "category": "payment",
    "sort_order": 9,
    "trigger_name": "Vendor payment cancelled / returned (When Return Payment is marked)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Invoice Type = \"AP\"\nPayments.Return Payment (AP) = true",
    "fin_notes": "Record only a Sent AP returned payment using Payments.Amount and Payments.Payment Date. Cancellation is excluded.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 9\n[Implementation]\nFully\n\nRecord the returned AP payment. Cancellation is excluded from this category.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Invoice Type = \"AP\"\nPayments.Return Payment (AP) = true\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = blank\nDebit = 112.100\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n211.100: Standard Product -> Supabase 211.100",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Fifth Third Bank (112.100)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "PAY-30",
    "category": "payment",
    "sort_order": 10,
    "trigger_name": "Vendor Return Payment, Repaid",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Invoice Type = \"AP\"\nPayments.Repay = true (source record pending confirmation)",
    "fin_notes": "",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 10\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nRecord the replacement vendor payment after a returned payment.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Invoice Type = \"AP\"\nPayments.Repay = true (source record pending confirmation)\n\n[Field Mapping]\nAmount = Payments.Amount (source record pending confirmation)\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 112.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n\n[Issues]\n- Repay=true is on a negative -91.47 record between the original returned payment and a positive 91.47 replacement. Should this row post the positive replacement once Sent instead?",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Fifth Third Bank (112.100)"
  },
  {
    "rule_code": "PAY-13",
    "category": "payment",
    "sort_order": 11,
    "trigger_name": "Vendor sends us a refund, Invoice is not an AP-Credit, Negative payment record against an actual return invoice",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Refund\"",
    "fin_notes": "When: When the vendor refund is received.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 11\n[Implementation]\nFully\n\nReceive the vendor refund through a Sent payment linked to the new AP - Refund invoice type.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Refund\"\n\n[Field Mapping]\nAmount = -Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n211.100: Standard Product -> Supabase 211.100",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "PAY-31",
    "category": "payment",
    "sort_order": 12,
    "trigger_name": "AR Non-product created with a loan account",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Loan Records is not empty\nInvoices.Linked Chart of Accounts includes a loan liability account = Pending",
    "fin_notes": "",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 12\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nRecognize the borrowing linked to an AR Non-Product loan invoice.\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Loan Records is not empty\nInvoices.Linked Chart of Accounts includes a loan liability account = Pending\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 112.100\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\nLoan liability accounts -> Supabase matching account (list pending)\n\n[Issues]\n- Should the bank debit wait for the loan receipt payment? An invoice alone does not confirm cash received.\n\n- Which loan liability accounts qualify? The selected account is on the invoice, not on Loan Records.\n\n- The same AR Non-Product invoice/payment qualifies for Invoice Entry rows 11/12. Which flow should own the borrowing entry?",
    "airtable_sources": "FIN: Invoices",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Fifth Third Bank (112.100)",
    "credit_label": "Invoice loan account linked\nExample: Auto Loan Payable (232.100)"
  },
  {
    "rule_code": "PAY-16",
    "category": "payment",
    "sort_order": 13,
    "trigger_name": "Loan payment (principal + interest) ONLY scenario where AR invoice > AP Payment",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nMonthly loan invoice link = Pending\nPrincipal / interest source = Pending",
    "fin_notes": "Use separately coded principal and interest invoice lines. Date the entry with Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 13\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nPay the principal and interest linked to the AR Non-Product loan invoice, with one journal per account.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nMonthly loan invoice link = Pending\nPrincipal / interest source = Pending\n\n[Field Mapping]\nAmount = Pending - principal and interest amounts per account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 232.100 (principal) or 007.003 (interest)\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n232.100: Auto Loan Payable -> Supabase 232.100\n007.003: Interest Expense -> Supabase 007.003\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n\n[Issues]\n- Which invoice link identifies a monthly repayment rather than the original borrowing: Loan Records or Loan Records 2?\n\n- Should principal and interest come from Invoice Lines.Line Amount or Debt Amortization Table.Principal and Interest?\n\n- Invoice Entry row 12 treats Sent payments on AR Non-Product invoices as cash receipts. How should this outgoing loan payment be separated?",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Invoice-line account linked\nAuto Loan Payable (232.100)\nInterest Expense (007.003)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)"
  },
  {
    "rule_code": "PAY-20",
    "category": "payment",
    "sort_order": 14,
    "trigger_name": "Owner distribution paid",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"316.100: Prior to Current Year Distributions\"",
    "fin_notes": "When: When the distribution is paid (approved by owners).",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 14\n[Implementation]\nFully\n\nPost the owner distribution when its AP expense payment is sent.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"316.100: Prior to Current Year Distributions\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 316.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n316.100: Prior to Current Year Distributions -> Supabase 316.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Shareholder Distributions (316.100)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)"
  },
  {
    "rule_code": "PAY-21",
    "category": "payment",
    "sort_order": 15,
    "trigger_name": "Owner puts money into the company",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"311.200: Paid in Capital\"",
    "fin_notes": "When: When the contribution is received.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 15\n[Implementation]\nPartial - functioning; duplicate risk noted\n\nRecord the owner cash contribution from its AR Non-Product payment.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"311.200: Paid in Capital\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 311.200\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n311.200: Paid in Capital -> Supabase 311.200\n\n[Issues]\n- The invoice matches Invoice Entry row 11 and its payment matches row 12. Should those generic AR entries handle the contribution, or should this direct entry replace them?",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "credit_label": "Additional Paid-in Capital (311.200)"
  },
  {
    "rule_code": "PAY-23",
    "category": "payment",
    "sort_order": 16,
    "trigger_name": "Insurance claim payout received",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"122.100\" (FIN account pending)",
    "fin_notes": "Use Payment Date and the fixed Fifth Third debit. FIN account identity and overlap ownership remain unresolved.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 16\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nReceive the insurance claim into Fifth Third, clearing Insurance Claims Receivable 122.100.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"122.100\" (FIN account pending)\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 112.100\nCredit = 122.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\nFIN insurance receivable account pending -> Supabase 122.100\n\n[Issues]\n- Supabase 122.100 exists, but FIN has no 122.100 account for the invoice filter. Which FIN account should identify the claim receivable?\n\n- The invoice/payment also matches Invoice Entry rows 11/12. Which route should own the claim receipt?",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Fifth Third Bank (112.100)",
    "credit_label": "Insurance Claims Receivable (122.100)"
  },
  {
    "rule_code": "PAY-32",
    "category": "payment",
    "sort_order": 17,
    "trigger_name": "Security Deposit with Chart of Account Security Deposit",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Linked Chart of Accounts includes \"143.200: Security Deposits\"",
    "fin_notes": "",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 17\n[Implementation]\nFully\n\nRecord the security-deposit asset and AP when the asset invoice is recognized.\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Linked Chart of Accounts includes \"143.200: Security Deposits\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 143.200\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.200: Security Deposits -> Supabase 143.200\n211.100: Standard Product -> Supabase 211.100",
    "airtable_sources": "FIN: Invoices",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Security Deposits (143.200)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "PAY-24",
    "category": "payment",
    "sort_order": 18,
    "trigger_name": "Security deposit paid (lease)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Linked Chart of Accounts includes \"143.200: Security Deposits\"",
    "fin_notes": "Record the security-deposit payment using Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 18\n[Implementation]\nFully\n\nPay the AP Asset security-deposit invoice, debiting AP and crediting the selected payment account.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Linked Chart of Accounts includes \"143.200: Security Deposits\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)"
  },
  {
    "rule_code": "PAY-27",
    "category": "payment",
    "sort_order": 19,
    "trigger_name": "Credit-card rebate earned (cash back)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nLinked Payments.Sent = true\nInvoice Lines.Line Type = \"Expense\"\nInvoice Lines.Chart of Accounts includes \"004.011: Purchased Discounts & Rebate\"\nInvoice Lines.Line Amount != 0",
    "fin_notes": "Use Invoice Lines.Line Amount from the matching rebate line on a Fully Paid AR Non-Product invoice linked to a Sent payment.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 19\n[Implementation]\nPartial - functioning; duplicate risk noted\n\nReduce the card liability using each matching 004.011 rebate line on the fully paid AR Non-Product invoice.\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nLinked Payments.Sent = true\nInvoice Lines.Line Type = \"Expense\"\nInvoice Lines.Chart of Accounts includes \"004.011: Purchased Discounts & Rebate\"\nInvoice Lines.Line Amount != 0\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Linked Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 231.100\nCredit = 004.011\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n231.100: Credit Card Clearing -> Supabase 231.100\n004.011: Purchased Discounts & Rebate -> Supabase 004.011\n\n[Issues]\n- This invoice/payment also matches Invoice Entry rows 11/12. Which route should handle the card rebate so its credit and settlement are not recorded twice?",
    "airtable_sources": "FIN: Invoice Lines",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Credit Card Payable (231.100)",
    "credit_label": "Purchase Discounts & Rebates (004.011)"
  }
]$payment$::jsonb)
on conflict(rule_code) do update set category=excluded.category,sort_order=excluded.sort_order,trigger_name=excluded.trigger_name,when_to_post=excluded.when_to_post,fin_notes=excluded.fin_notes,dev_notes=excluded.dev_notes,airtable_sources=excluded.airtable_sources,reversible=excluded.reversible,active=excluded.active,enabled=excluded.enabled,debit_label=excluded.debit_label,credit_label=excluded.credit_label;

delete from public.ledger_rule_lines where line_order<>1 and rule_code in ('PAY-03','PAY-28','PAY-29','PAY-08','PAY-09','PAY-10','PAY-11','PAY-12','PAY-30','PAY-13','PAY-31','PAY-16','PAY-20','PAY-21','PAY-23','PAY-32','PAY-24','PAY-27');
insert into public.ledger_rule_lines(rule_code,side,line_order,account_code,account_selector,label) values
('PAY-03','debit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-03','credit',1,'221.300',null,'Client Credits on Account (221.300)'),
('PAY-28','debit',1,'221.300',null,'Client Credits on Account (221.300)'),
('PAY-28','credit',1,'121.100',null,'Accounts Receivable (121.100)'),
('PAY-29','debit',1,'221.300',null,'Client Credits on Account (221.300)'),
('PAY-29','credit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-08','debit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-08','credit',1,'231.100',null,'Credit Card Payable (231.100)'),
('PAY-09','debit',1,'231.100',null,'Credit Card Payable (231.100)'),
('PAY-09','credit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-10','debit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-10','credit',1,'004.011',null,'Purchase Discounts & Rebates (004.011) - pending approval'),
('PAY-11','debit',1,'211.100',null,'Accounts Payable (211.100)
Bill being settled'),
('PAY-11','credit',1,'211.100',null,'Accounts Payable (211.100)
Source credit invoice'),
('PAY-12','debit',1,'112.100',null,'Fifth Third Bank (112.100)'),
('PAY-12','credit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-30','debit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-30','credit',1,'112.100',null,'Fifth Third Bank (112.100)'),
('PAY-13','debit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-13','credit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-31','debit',1,'112.100',null,'Fifth Third Bank (112.100)'),
('PAY-31','credit',1,null,'invoice_linked_account','Invoice loan account linked
Example: Auto Loan Payable (232.100)'),
('PAY-16','debit',1,null,'invoice_linked_account','Invoice-line account linked
Auto Loan Payable (232.100)
Interest Expense (007.003)'),
('PAY-16','credit',1,null,'invoice_linked_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-20','debit',1,'316.100',null,'Shareholder Distributions (316.100)'),
('PAY-20','credit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-21','debit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-21','credit',1,'311.200',null,'Additional Paid-in Capital (311.200)'),
('PAY-23','debit',1,'112.100',null,'Fifth Third Bank (112.100)'),
('PAY-23','credit',1,'122.100',null,'Insurance Claims Receivable (122.100)'),
('PAY-32','debit',1,'143.200',null,'Security Deposits (143.200)'),
('PAY-32','credit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-24','debit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-24','credit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-27','debit',1,'231.100',null,'Credit Card Payable (231.100)'),
('PAY-27','credit',1,'004.011',null,'Purchase Discounts & Rebates (004.011)')
on conflict(rule_code,side,line_order) do update set account_code=excluded.account_code,account_selector=excluded.account_selector,label=excluded.label,is_optional=false;

-- Finalize invoice-owned client credit creation using the chart's payment account and approved sign.
update public.ledger_rules set enabled=true,active=true,reversible=true,
 fin_notes='Use the negated credit Invoice Amount to record client credit available.',
 dev_notes='[T-Chart]
Category - Payment, row 2
[Implementation]
Fully

Recognize the AR refund/credit invoice, regardless of Method of Application.

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Refund/Credit"

[Field Mapping]
Amount = -Invoices.Invoice Amount
Date = Invoices.Invoice Date
Branch = Invoices.Branch
Debit = Invoices.Linked Payments.Account to Pay/Receive
Credit = 221.300

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
Client Credits on Account (221.300) -> Supabase 221.300'
where rule_code='PAY-03';

-- Keep product bank settlements separate from credit-card clearing settlements.
update public.ledger_rules set enabled=true,active=true,reversible=true,when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Account to Pay/Receive does not include "231.100: Credit Card Clearing"
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"',dev_notes='[T-Chart]
Category - Expenses, row 5
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Account to Pay/Receive does not include "231.100: Credit Card Clearing"
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200',credit_label='Payment account linked
Examples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200)' where rule_code='EXP-16';

update public.ledger_rules set enabled=true,active=true,reversible=true,when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"',dev_notes='[T-Chart]
Category - Payment, row 5
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = 231.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
231.100: Credit Card Clearing -> Supabase 231.100',credit_label='Credit Card Clearing (231.100)' where rule_code='PAY-08';

-- Record product AP before discounts and clear the discount from its owning invoice line.
begin;
update public.ledger_rules set enabled=true,active=true,reversible=true,when_to_post='[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"',fin_notes='Accrue the product invoice before its discount; the payment and discount line clear AP separately.',dev_notes='[T-Chart]
Category - Expenses, row 4
[Implementation]
Fully

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"

[Field Mapping]
Amount = Invoices.Invoice Amount - Invoices.Discount Lines Total
Date = Invoices.Invoice Date
Branch = Invoices.Branch
Debit = 004.010
Credit = 211.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
004.010: Cost of Goods Sold -> Supabase 004.010
211.100: Standard Product -> Supabase 211.100

[Issues]
- Negative AP Product invoices also match this category. Should they use a different category?' where rule_code='EXP-15';
update public.ledger_rules set enabled=true,active=true,reversible=true,when_to_post='[Record]
Invoice Lines

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Invoice Lines.Line Type = "Discount"
Invoice Lines.Discount Line Status != "Expired"',fin_notes='Post only the negated discount line amount; the separate payment category records the bank movement.',dev_notes='[T-Chart]
Category - Payment, row 7
[Implementation]
Fully

[Record]
Invoice Lines

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Invoice Lines.Line Type = "Discount"
Invoice Lines.Discount Line Status != "Expired"

[Field Mapping]
Amount = -Invoice Lines.Line Amount
Date = Linked Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = 004.011

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
004.011: Purchased Discounts & Rebate -> Supabase 004.011',credit_label='Purchase Discounts & Rebates (004.011)' where rule_code='PAY-10';
update public.ledger_rule_lines set account_code='004.011',account_selector=null,label='Purchase Discounts & Rebates (004.011)' where rule_code='PAY-10' and side='credit' and line_order=1;
commit;

-- Route replacement payments through PAY-30 using FIN Repayment, preserving signed amounts.
begin;
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = true
Invoices.Linked Chart of Accounts is not empty
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"',dev_notes='[T-Chart]
Category - Expenses, row 6
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = true
Invoices.Linked Chart of Accounts is not empty
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Invoices.Linked Chart of Accounts
Credit = 231.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Invoices.Linked Chart of Accounts -> Supabase matching expense account
008.001: Software Licensing -> Supabase 008.001
009.002: Travel -> Supabase 009.002
009.006: Dues & Organization Subscription -> Supabase 009.006
231.100: Credit Card Clearing -> Supabase 231.100
525300: Workers Compensation -> Supabase 525.300
922000: Freight and Handling In -> Supabase 922.000' where rule_code='EXP-02';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes any of "004.012", "004.013", "005.004", "005.301", "005.302", "006.001", "006.002", "006.003", "006.004", "007.001", "007.003", "007.004", "007.006", "007.007", "007.011", "007.012", "008.001", "008.002", "008.003", "008.004", "009.001", "009.002", "009.003", "009.004", "009.005", "009.006", "009.007", "009.008", "009.009", "009.010", "009.011", "009.012", "009.013", "009.102", "010.002", "525300", "922000"',dev_notes='[T-Chart]
Category - Expenses, row 3
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes any of "004.012", "004.013", "005.004", "005.301", "005.302", "006.001", "006.002", "006.003", "006.004", "007.001", "007.003", "007.004", "007.006", "007.007", "007.011", "007.012", "008.001", "008.002", "008.003", "008.004", "009.001", "009.002", "009.003", "009.004", "009.005", "009.006", "009.007", "009.008", "009.009", "009.010", "009.011", "009.012", "009.013", "009.102", "010.002", "525300", "922000"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-14';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Account to Pay/Receive does not include "231.100: Credit Card Clearing"
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"',dev_notes='[T-Chart]
Category - Expenses, row 5
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Account to Pay/Receive does not include "231.100: Credit Card Clearing"
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200' where rule_code='EXP-16';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoices.Mark as Prepaid Asset? = true
Invoices.Linked Chart of Accounts is not empty',dev_notes='[T-Chart]
Category - Expenses, row 8
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoices.Mark as Prepaid Asset? = true
Invoices.Linked Chart of Accounts is not empty

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-17';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.102: Tech Allowance"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 11
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.102: Tech Allowance"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch Employee
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-18';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "005.001: Salary - Owners", "005.002: Salary - W2", "005.003: Salary - 1099", "005.005: 401K", "005.006: Payroll Taxes"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 13
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "005.001: Salary - Owners", "005.002: Salary - W2", "005.003: Salary - 1099", "005.005: 401K", "005.006: Payroll Taxes"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-19';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.101: Salary - Offshore"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 15
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.101: Salary - Offshore"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-20';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.201: Bonus"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 17
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.201: Bonus"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-21';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.103: 13th Month"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 19
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.103: 13th Month"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 241.300
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
241.300: Accrued Bonus & Commission -> Supabase 241.300
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-23';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "923100: Federal Income Tax", "923300: State Income Tax"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 27
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "923100: Federal Income Tax", "923300: State Income Tax"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-26';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes "007.002: Bank / Misc. Service Charges"',dev_notes='[T-Chart]
Category - Expenses, row 22
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes "007.002: Bank / Misc. Service Charges"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-27';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"',dev_notes='[T-Chart]
Category - Payment, row 5
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = 231.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='PAY-08';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Invoices.Credits Applied is not empty
Invoices.Credits Applied != 0',dev_notes='[T-Chart]
Category - Payment, row 8
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Invoices.Credits Applied is not empty
Invoices.Credits Applied != 0

[Field Mapping]
Amount = -Invoices.Credits Applied
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100 (bill)
Credit = 211.100 (source credit invoice)

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100

[Notes]
- A zero-cash Sent payment still qualifies. Do not require Payments.Amount to be nonzero.' where rule_code='PAY-11';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Linked Chart of Accounts includes "316.100: Prior to Current Year Distributions"',dev_notes='[T-Chart]
Category - Payment, row 14
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Linked Chart of Accounts includes "316.100: Prior to Current Year Distributions"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 316.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
316.100: Prior to Current Year Distributions -> Supabase 316.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200' where rule_code='PAY-20';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Linked Chart of Accounts includes "143.200: Security Deposits"',dev_notes='[T-Chart]
Category - Payment, row 18
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Linked Chart of Accounts includes "143.200: Security Deposits"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200' where rule_code='PAY-24';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Mark as Prepaid Asset? = false
Invoices.Linked Chart of Accounts includes "143.300: Display Fixtures & Equipment"',dev_notes='[T-Chart]
Category - Invoice Entry, row 8
[Implementation]
Partially

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Mark as Prepaid Asset? = false
Invoices.Linked Chart of Accounts includes "143.300: Display Fixtures & Equipment"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Accounts Payable (211.100) -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100

[Issues]
- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?' where rule_code='INV-17';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Invoice Type = "AP"
Payments.Return Payment (AP) = true',dev_notes='[T-Chart]
Category - Payment, row 9
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Invoice Type = "AP"
Payments.Return Payment (AP) = true

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = blank
Debit = 112.100
Credit = 211.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
211.100: Standard Product -> Supabase 211.100' where rule_code='PAY-12';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Invoice Type = "AP"
Payments.Repayment = true',dev_notes='[T-Chart]
Category - Payment, row 10
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Invoice Type = "AP"
Payments.Repayment = true

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = 112.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100',enabled=true,active=true,reversible=true where rule_code='PAY-30';
update public.ledger_rules set fin_notes='Record the replacement Sent AP payment marked Repayment; ordinary settlement rules exclude it.' where rule_code='PAY-30';
commit;

-- Cashback belongs to its qualifying AR non-product invoice; keep disabled until ownership is resolved.
begin;
update public.ledger_rules set enabled=false,active=true,reversible=true,airtable_sources='FIN: Invoices',when_to_post='[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Invoices.Invoice Amount != 0',fin_notes='Use Invoice Amount from the Fully Paid AR Non-Product invoice; its Sent card-clearing payment supplies the date.',dev_notes='[T-Chart]
Category - Payment, row 19
[Implementation]
Partial - functioning; disabled pending ownership

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Invoices.Invoice Amount != 0

[Field Mapping]
Amount = Invoices.Invoice Amount
Date = Linked Payments.Payment Date
Branch = Invoices.Branch
Debit = 231.100
Credit = 004.011

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
231.100: Credit Card Clearing -> Supabase 231.100
004.011: Purchased Discounts & Rebate -> Supabase 004.011

[Issues]
- Can duplicate Invoice Entry rows 11/12; choose which route owns cashback.',debit_label='Credit Card Clearing (231.100)',credit_label='Purchase Discounts & Rebates (004.011)' where rule_code='PAY-27';
update public.ledger_rule_lines set account_code='231.100',account_selector=null,label='Credit Card Clearing (231.100)' where rule_code='PAY-27' and side='debit' and line_order=1;
update public.ledger_rule_lines set account_code='004.011',account_selector=null,label='Purchase Discounts & Rebates (004.011)' where rule_code='PAY-27' and side='credit' and line_order=1;
commit;

-- Cashback posts only through PAY-27; generic AR non-product entries exclude its invoice account.
begin;
update public.ledger_rules set when_to_post='[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"',dev_notes='[T-Chart]
Category - Invoice Entry, row 11
[Implementation]
Fully

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"

[Field Mapping]
Amount = Invoices.Invoice Amount
Date = Invoices.Invoice Date
Branch = Invoices.Branch
Debit = 121.100
Credit = Invoices.Linked Chart of Accounts

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Accounts Receivable (121.100) -> Supabase 121.100
Invoices.Linked Chart of Accounts -> Supabase matching account
Example: 004.002: Coordination Fees Charged -> Supabase 004.002
525300: Workers Compensation -> Supabase 525.300
922000: Freight and Handling In -> Supabase 922.000

[Issues]
- Possible duplicate with Category - Payment rows 12/13/15/16 if those rules are enabled.' where rule_code='INV-10';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"',dev_notes='[T-Chart]
Category - Invoice Entry, row 12
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Payments.Account to Pay/Receive
Credit = 121.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100
Accounts Receivable (121.100) -> Supabase 121.100

[Notes]
- Product and Non-Product invoices are paid separately.

[Issues]
- Possible duplicate with Category - Payment rows 12/13/15/16 if those rules are enabled.' where rule_code='INV-18';
update public.ledger_rules set when_to_post='[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Invoices.Invoice Amount != 0',dev_notes='[T-Chart]
Category - Payment, row 19
[Implementation]
Fully

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Invoices.Invoice Amount != 0

[Field Mapping]
Amount = Invoices.Invoice Amount
Date = Linked Payments.Payment Date
Branch = Invoices.Branch
Debit = 231.100
Credit = 004.011

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
231.100: Credit Card Clearing -> Supabase 231.100
004.011: Purchased Discounts & Rebate -> Supabase 004.011',enabled=true,active=true,reversible=true where rule_code='PAY-27';
commit;

-- Classify every payment by Payment Record Type; return records carry negative amounts.
begin;
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Refund/Credit"
Invoices.Method of Application = "Cash Refund"',dev_notes='[T-Chart]
Category - Payment, row 4
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Refund/Credit"
Invoices.Method of Application = "Cash Refund"

[Field Mapping]
Amount = -Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 221.300
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Client Credits on Account (221.300) -> Supabase 221.300
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200' where rule_code='PAY-29';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"',dev_notes='[T-Chart]
Category - Payment, row 5
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = 231.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='PAY-08';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "CC Batch Payment"',dev_notes='[T-Chart]
Category - Payment, row 6
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "CC Batch Payment"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Linked Mini-Payments.Invoices.Branch
Debit = 231.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Linked Mini-Payments.Invoices.Linked Vendors
Client Reference = Linked Mini-Payments.Invoices.Linked Client
Staff Reference = Linked Mini-Payments.Invoices.Linked Staff
Transaction Reference = Linked Mini-Payments.Invoices.Linked Transaction
PO Reference = Linked Mini-Payments.Invoices.Related Purchase Order
State References = Linked Mini-Payments.Invoices.States & Sales Tax Rates

[Account Mapping]
231.100: Credit Card Clearing -> Supabase 231.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200' where rule_code='PAY-09';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Invoices.Credits Applied is not empty
Invoices.Credits Applied != 0',dev_notes='[T-Chart]
Category - Payment, row 8
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Invoices.Credits Applied is not empty
Invoices.Credits Applied != 0

[Field Mapping]
Amount = -Invoices.Credits Applied
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100 (bill)
Credit = 211.100 (source credit invoice)

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100

[Notes]
- A zero-cash Sent payment still qualifies. Do not require Payments.Amount to be nonzero.' where rule_code='PAY-11';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Return Payment"
Payments.Invoice Type = "AP"',dev_notes='[T-Chart]
Category - Payment, row 9
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Return Payment"
Payments.Invoice Type = "AP"

[Field Mapping]
Amount = -Payments.Amount
Date = Payments.Payment Date
Branch = blank
Debit = 112.100
Credit = 211.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
211.100: Standard Product -> Supabase 211.100' where rule_code='PAY-12';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Repayment"
Payments.Invoice Type = "AP"',dev_notes='[T-Chart]
Category - Payment, row 10
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Repayment"
Payments.Invoice Type = "AP"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = 112.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100' where rule_code='PAY-30';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Refund"',dev_notes='[T-Chart]
Category - Payment, row 11
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Refund"

[Field Mapping]
Amount = -Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Payments.Account to Pay/Receive
Credit = 211.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
211.100: Standard Product -> Supabase 211.100' where rule_code='PAY-13';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Monthly loan invoice link = Pending
Principal / interest source = Pending',dev_notes='[T-Chart]
Category - Payment, row 13
[Implementation]
Partially

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Monthly loan invoice link = Pending
Principal / interest source = Pending

[Field Mapping]
Amount = Pending - principal and interest amounts per account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 232.100 (principal) or 007.003 (interest)
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
232.100: Auto Loan Payable -> Supabase 232.100
007.003: Interest Expense -> Supabase 007.003
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200

[Issues]
- Which invoice link identifies a monthly repayment rather than the original borrowing: Loan Records or Loan Records 2?

- Should principal and interest come from Invoice Lines.Line Amount or Debt Amortization Table.Principal and Interest?

- Invoice Entry row 12 treats Sent payments on AR Non-Product invoices as cash receipts. How should this outgoing loan payment be separated?' where rule_code='PAY-16';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Linked Chart of Accounts includes "316.100: Prior to Current Year Distributions"',dev_notes='[T-Chart]
Category - Payment, row 14
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Linked Chart of Accounts includes "316.100: Prior to Current Year Distributions"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 316.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
316.100: Prior to Current Year Distributions -> Supabase 316.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200' where rule_code='PAY-20';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "311.200: Paid in Capital"',dev_notes='[T-Chart]
Category - Payment, row 15
[Implementation]
Partially

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "311.200: Paid in Capital"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Payments.Account to Pay/Receive
Credit = 311.200

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
311.200: Paid in Capital -> Supabase 311.200

[Issues]
- The invoice matches Invoice Entry row 11 and its payment matches row 12. Should those generic AR entries handle the contribution, or should this direct entry replace them?' where rule_code='PAY-21';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "122.100" (FIN account pending)',dev_notes='[T-Chart]
Category - Payment, row 16
[Implementation]
Partially

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "122.100" (FIN account pending)

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 112.100
Credit = 122.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
FIN insurance receivable account pending -> Supabase 122.100

[Issues]
- Supabase 122.100 exists, but FIN has no 122.100 account for the invoice filter. Which FIN account should identify the claim receivable?

- The invoice/payment also matches Invoice Entry rows 11/12. Which route should own the claim receipt?' where rule_code='PAY-23';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Linked Chart of Accounts includes "143.200: Security Deposits"',dev_notes='[T-Chart]
Category - Payment, row 18
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Linked Chart of Accounts includes "143.200: Security Deposits"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200' where rule_code='PAY-24';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = true
Invoices.Linked Chart of Accounts is not empty
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"',dev_notes='[T-Chart]
Category - Expenses, row 6
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = true
Invoices.Linked Chart of Accounts is not empty
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Invoices.Linked Chart of Accounts
Credit = 231.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Invoices.Linked Chart of Accounts -> Supabase matching expense account
008.001: Software Licensing -> Supabase 008.001
009.002: Travel -> Supabase 009.002
009.006: Dues & Organization Subscription -> Supabase 009.006
231.100: Credit Card Clearing -> Supabase 231.100
525300: Workers Compensation -> Supabase 525.300
922000: Freight and Handling In -> Supabase 922.000' where rule_code='EXP-02';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes any of "004.012", "004.013", "005.004", "005.301", "005.302", "006.001", "006.002", "006.003", "006.004", "007.001", "007.003", "007.004", "007.006", "007.007", "007.011", "007.012", "008.001", "008.002", "008.003", "008.004", "009.001", "009.002", "009.003", "009.004", "009.005", "009.006", "009.007", "009.008", "009.009", "009.010", "009.011", "009.012", "009.013", "009.102", "010.002", "525300", "922000"',dev_notes='[T-Chart]
Category - Expenses, row 3
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes any of "004.012", "004.013", "005.004", "005.301", "005.302", "006.001", "006.002", "006.003", "006.004", "007.001", "007.003", "007.004", "007.006", "007.007", "007.011", "007.012", "008.001", "008.002", "008.003", "008.004", "009.001", "009.002", "009.003", "009.004", "009.005", "009.006", "009.007", "009.008", "009.009", "009.010", "009.011", "009.012", "009.013", "009.102", "010.002", "525300", "922000"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-14';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Payments.Account to Pay/Receive does not include "231.100: Credit Card Clearing"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"',dev_notes='[T-Chart]
Category - Expenses, row 5
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Payments.Account to Pay/Receive does not include "231.100: Credit Card Clearing"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200' where rule_code='EXP-16';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoices.Mark as Prepaid Asset? = true
Invoices.Linked Chart of Accounts is not empty',dev_notes='[T-Chart]
Category - Expenses, row 8
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoices.Mark as Prepaid Asset? = true
Invoices.Linked Chart of Accounts is not empty

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-17';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.102: Tech Allowance"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 11
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.102: Tech Allowance"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch Employee
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-18';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "005.001: Salary - Owners", "005.002: Salary - W2", "005.003: Salary - 1099", "005.005: 401K", "005.006: Payroll Taxes"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 13
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "005.001: Salary - Owners", "005.002: Salary - W2", "005.003: Salary - 1099", "005.005: 401K", "005.006: Payroll Taxes"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-19';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.101: Salary - Offshore"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 15
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.101: Salary - Offshore"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-20';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.201: Bonus"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 17
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.201: Bonus"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-21';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.103: 13th Month"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 19
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.103: 13th Month"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 241.300
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
241.300: Accrued Bonus & Commission -> Supabase 241.300
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-23';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "923100: Federal Income Tax", "923300: State Income Tax"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 27
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "923100: Federal Income Tax", "923300: State Income Tax"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-26';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes "007.002: Bank / Misc. Service Charges"',dev_notes='[T-Chart]
Category - Expenses, row 22
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes "007.002: Bank / Misc. Service Charges"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-27';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Product"
Invoices.Invoice Kind (AR) = "Deposit Invoice"',dev_notes='[T-Chart]
Category - Invoice Entry, row 3
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Product"
Invoices.Invoice Kind (AR) = "Deposit Invoice"

[Field Mapping]
Amount = Payments.Amount x Sum of matching Invoices.Payment Proportion For Batch Allocation
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Payments.Account to Pay/Receive
Credit = 121.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100
Accounts Receivable (121.100) -> Supabase 121.100

[Notes]
- Product and Non-Product invoices are paid separately.

- Repeated batch payments link the same invoices with unchanged invoice amounts.' where rule_code='INV-13';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Product"
Invoices.Invoice Kind (AR) is "Full Invoice" or "Balance Invoice"',dev_notes='[T-Chart]
Category - Invoice Entry, row 6
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Product"
Invoices.Invoice Kind (AR) is "Full Invoice" or "Balance Invoice"

[Field Mapping]
Amount = Payments.Amount x Sum of matching Invoices.Payment Proportion For Batch Allocation
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Payments.Account to Pay/Receive
Credit = 121.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100
Accounts Receivable (121.100) -> Supabase 121.100

[Notes]
- Product and Non-Product invoices are paid separately.

- Repeated batch payments link the same invoices with unchanged invoice amounts.' where rule_code='INV-16';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Mark as Prepaid Asset? = false
Invoices.Linked Chart of Accounts includes "143.300: Display Fixtures & Equipment"',dev_notes='[T-Chart]
Category - Invoice Entry, row 8
[Implementation]
Partially

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Mark as Prepaid Asset? = false
Invoices.Linked Chart of Accounts includes "143.300: Display Fixtures & Equipment"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Accounts Payable (211.100) -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100

[Issues]
- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?' where rule_code='INV-17';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"',dev_notes='[T-Chart]
Category - Invoice Entry, row 12
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Payments.Account to Pay/Receive
Credit = 121.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100
Accounts Receivable (121.100) -> Supabase 121.100

[Notes]
- Product and Non-Product invoices are paid separately.

[Issues]
- Possible duplicate with Category - Payment rows 12/13/15/16 if those rules are enabled.' where rule_code='INV-18';
update public.ledger_rules set when_to_post='[Record]
Invoice Lines

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Payment Record Type = "Regular Payment"
Invoice Lines.Line Type = "Discount"
Invoice Lines.Discount Line Status != "Expired"',dev_notes='[T-Chart]
Category - Payment, row 7
[Implementation]
Fully

[Record]
Invoice Lines

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Payment Record Type = "Regular Payment"
Invoice Lines.Line Type = "Discount"
Invoice Lines.Discount Line Status != "Expired"

[Field Mapping]
Amount = -Invoice Lines.Line Amount
Date = Linked Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = 004.011

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
004.011: Purchased Discounts & Rebate -> Supabase 004.011' where rule_code='PAY-10';
update public.ledger_rules set when_to_post='[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Payment Record Type = "Regular Payment"
Linked Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Invoices.Invoice Amount != 0',dev_notes='[T-Chart]
Category - Payment, row 19
[Implementation]
Fully

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Payment Record Type = "Regular Payment"
Linked Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Invoices.Invoice Amount != 0

[Field Mapping]
Amount = Invoices.Invoice Amount
Date = Linked Payments.Payment Date
Branch = Invoices.Branch
Debit = 231.100
Credit = 004.011

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
231.100: Credit Card Clearing -> Supabase 231.100
004.011: Purchased Discounts & Rebate -> Supabase 004.011' where rule_code='PAY-27';
update public.ledger_rules set trigger_name='Vendor payment returned',fin_notes='Record a Sent AP Return Payment using the negated Payment Amount and Payment Date.' where rule_code='PAY-12';
update public.ledger_rules set fin_notes='Record the Sent AP replacement whose Payment Record Type is Repayment, using Payment Amount and Payment Date.' where rule_code='PAY-30';
commit;

-- Cashback is owned by its Sent Regular Payment and records Payment Amount once.
begin;
update public.ledger_rules set enabled=true,active=true,reversible=true,airtable_sources='FIN: Payments',when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Payments.Amount != 0
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"',fin_notes='Use Payment Amount and Payment Date from the Sent Regular Payment through Credit Card Clearing, linked to a Fully Paid AR Non-Product 004.011 invoice.',dev_notes='[T-Chart]
Category - Payment, row 19
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Payments.Amount != 0
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 231.100
Credit = 004.011

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
231.100: Credit Card Clearing -> Supabase 231.100
004.011: Purchased Discounts & Rebate -> Supabase 004.011' where rule_code='PAY-27';
commit;

-- Route owner contributions directly through PAY-21 without generic AR duplicates.
begin;
update public.ledger_rules set when_to_post='[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"',dev_notes='[T-Chart]
Category - Invoice Entry, row 11
[Implementation]
Fully

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"

[Field Mapping]
Amount = Invoices.Invoice Amount
Date = Invoices.Invoice Date
Branch = Invoices.Branch
Debit = 121.100
Credit = Invoices.Linked Chart of Accounts

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Accounts Receivable (121.100) -> Supabase 121.100
Invoices.Linked Chart of Accounts -> Supabase matching account
Example: 004.002: Coordination Fees Charged -> Supabase 004.002
525300: Workers Compensation -> Supabase 525.300
922000: Freight and Handling In -> Supabase 922.000

[Issues]
- Potential loan/insurance overlaps with Category - Payment rows 12/13/16 remain unresolved. Those handlers currently stop before posting.' where rule_code='INV-10';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"',dev_notes='[T-Chart]
Category - Invoice Entry, row 12
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Payments.Account to Pay/Receive
Credit = 121.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100
Accounts Receivable (121.100) -> Supabase 121.100

[Notes]
- Product and Non-Product invoices are paid separately.

[Issues]
- Potential loan/insurance overlaps with Category - Payment rows 12/13/16 remain unresolved. Those handlers currently stop before posting.' where rule_code='INV-18';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "311.200: Paid in Capital"',dev_notes='[T-Chart]
Category - Payment, row 15
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "311.200: Paid in Capital"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Payments.Account to Pay/Receive
Credit = 311.200

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
311.200: Paid in Capital -> Supabase 311.200',enabled=true,active=true,reversible=true,fin_notes='Record the Sent owner contribution directly; generic AR entries exclude invoice account 311.200.' where rule_code='PAY-21';
commit;

-- Record insurance payouts once through PAY-23; exclude generic AR routes.
begin;
insert into public.accounts(code,name,account_type,subtype,normal_balance,is_bank,is_postable,active) values ('004.004','Insurance Claim Recoveries','revenue','other_income','credit',false,true,true) on conflict (code) do nothing;
update public.ledger_rules set when_to_post='[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"
Invoices.Linked Chart of Accounts does not include "004.004: Shipping Insurance Payouts Recieved"',dev_notes='[T-Chart]
Category - Invoice Entry, row 11
[Implementation]
Fully

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"
Invoices.Linked Chart of Accounts does not include "004.004: Shipping Insurance Payouts Recieved"

[Field Mapping]
Amount = Invoices.Invoice Amount
Date = Invoices.Invoice Date
Branch = Invoices.Branch
Debit = 121.100
Credit = Invoices.Linked Chart of Accounts

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Accounts Receivable (121.100) -> Supabase 121.100
Invoices.Linked Chart of Accounts -> Supabase matching account
Example: 004.002: Coordination Fees Charged -> Supabase 004.002
525300: Workers Compensation -> Supabase 525.300
922000: Freight and Handling In -> Supabase 922.000

[Issues]
- Potential loan overlaps with Category - Payment rows 12/13 remain unresolved. Those handlers currently stop before posting.' where rule_code='INV-10';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"
Invoices.Linked Chart of Accounts does not include "004.004: Shipping Insurance Payouts Recieved"',dev_notes='[T-Chart]
Category - Invoice Entry, row 12
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"
Invoices.Linked Chart of Accounts does not include "004.004: Shipping Insurance Payouts Recieved"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Payments.Account to Pay/Receive
Credit = 121.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100
Accounts Receivable (121.100) -> Supabase 121.100

[Notes]
- Product and Non-Product invoices are paid separately.

[Issues]
- Potential loan overlaps with Category - Payment rows 12/13 remain unresolved. Those handlers currently stop before posting.' where rule_code='INV-18';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.004: Shipping Insurance Payouts Recieved"',dev_notes='[T-Chart]
Category - Payment, row 16
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.004: Shipping Insurance Payouts Recieved"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 112.100
Credit = 004.004

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
004.004: Shipping Insurance Payouts Recieved -> Supabase 004.004',enabled=true,active=true,reversible=true,credit_label='Insurance Claim Recoveries (004.004)',fin_notes='Record the Sent insurance payout directly to 004.004; generic AR entries exclude invoice account 004.004.' where rule_code='PAY-23';
update public.ledger_rule_lines set account_code='004.004',account_selector=null,label='Insurance Claim Recoveries (004.004)' where rule_code='PAY-23' and side='credit' and line_order=1;
commit;

-- Direct journals are independent of the three T-Chart categories.
insert into public.ledger_rules(rule_code,category,sort_order,trigger_name,when_to_post,dev_notes,airtable_sources,reversible,active,enabled,debit_label,credit_label)
values ('MAN-01','other',1,'Manual Journal Entry',
'[Record]
Direct Journal Entries

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Date Approved is not empty
Posted Entry = false
Cancel Entry = false',
'[Field Mapping]
Date = Direct Journal Entries.Date Approved
Branch = Direct Journal Entries.Branch
Amount = Journal Lines.Line Amount
Debit = Journal Lines.Debit Accounts
Credit = Journal Lines.Credit Accounts

[Notes]
One parent entry creates one journal containing all linked line pairs. Optional linked invoices supply reference arrays only.',
'FIN: Direct Journal Entries',true,true,true,'Journal Lines.Debit Accounts','Journal Lines.Credit Accounts')
on conflict(rule_code) do update set trigger_name=excluded.trigger_name,when_to_post=excluded.when_to_post,dev_notes=excluded.dev_notes,
 airtable_sources=excluded.airtable_sources,reversible=true,active=true,enabled=true,debit_label=excluded.debit_label,credit_label=excluded.credit_label;

-- Grouped live T-Chart catalog (18 November 2026).
update public.ledger_rules r set source_table=v.table_id, source_label=v.label, implementation_status=v.status
from (values
 ('PAY-03','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('PAY-28','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('PAY-29','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-08','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-09','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-10','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('PAY-11','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-12','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-30','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-13','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-31','tbldQXuqNEp8G5pfs','Invoices','not_implemented'),
 ('PAY-16','tblR61NG9i0giid28','Payments','not_implemented'),
 ('PAY-20','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-21','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-23','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-32','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('PAY-24','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-27','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-01','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('EXP-02','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-03','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('EXP-04','tbl1LgiUYt7Gc492d','Prepay Expenses Log','fully'),
 ('EXP-05','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('EXP-06','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('EXP-07','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('EXP-09','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('EXP-10','tblC0dbO5UMXzHma9','Depreciation','fully'),
 ('EXP-11','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('EXP-12','tbldQXuqNEp8G5pfs','Invoices','deferred'),
 ('EXP-13','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('EXP-14','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-15','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('EXP-16','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-17','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-18','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-19','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-20','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-21','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-22','tblV26TC0f6CKDneL','Invoice Lines','deferred'),
 ('EXP-23','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-24','tbldQXuqNEp8G5pfs','Invoices','deferred'),
 ('EXP-25','tbldQXuqNEp8G5pfs','Invoices','deferred'),
 ('EXP-26','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-27','tblR61NG9i0giid28','Payments','fully'),
 ('INV-12','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('INV-13','tblR61NG9i0giid28','Payments','fully'),
 ('INV-14','tblrnXm1HN9y6HPxY','Shipping Records','fully'),
 ('INV-15','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('INV-16','tblR61NG9i0giid28','Payments','fully'),
 ('INV-07','tbldQXuqNEp8G5pfs','Invoices','partial'),
 ('INV-17','tblR61NG9i0giid28','Payments','partial'),
 ('INV-08','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('INV-09','tbldQXuqNEp8G5pfs','Invoices','deferred'),
 ('INV-10','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('INV-18','tblR61NG9i0giid28','Payments','fully'),
 ('MAN-01','tblCoBk0WB46B662R','Direct Journal Entries','fully')
) v(code,table_id,label,status) where r.rule_code=v.code;

-- Stable codes preserve posting/reversal identity while grouping related chart flows.
-- Source filters, account mappings, journals, enabled switches and schedules are unchanged.
update public.ledger_rules r set category=c.category::public.rule_category,sort_order=c.sort_order,
 trigger_name=c.trigger_name,chart_family=c.chart_family,implementation_status=c.implementation_status,
 debit_label=c.debit_label,credit_label=c.credit_label,when_to_post=c.when_to_post,
 fin_notes=c.fin_notes,dev_notes=c.dev_notes,retired_at=null
from jsonb_to_recordset($grouped$[
  {
    "rule_code": "EXP-01",
    "category": "expense",
    "sort_order": 2,
    "trigger_name": "Enter an operating expense invoice (ex: Utilities)",
    "chart_family": "Operating Expenses",
    "implementation_status": "fully",
    "debit_label": "Invoice account linked\nExample: Utilities (006.002)",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use the linked invoice account from the approved 37-account list, Invoice Amount and Invoice Date.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 2\n\n[Code]\nEXP-01\n\n[Family]\nOperating Expenses\n\n[Implementation]\nFully\n\n[Debit]\nInvoice account linked\nExample: Utilities (006.002)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes any of \"004.012\", \"004.013\", \"005.004\", \"005.301\", \"005.302\", \"006.001\", \"006.002\", \"006.003\", \"006.004\", \"007.001\", \"007.003\", \"007.004\", \"007.006\", \"007.007\", \"007.011\", \"007.012\", \"008.001\", \"008.002\", \"008.003\", \"008.004\", \"009.001\", \"009.002\", \"009.003\", \"009.004\", \"009.005\", \"009.006\", \"009.007\", \"009.008\", \"009.009\", \"009.010\", \"009.011\", \"009.012\", \"009.013\", \"009.102\", \"010.002\", \"525300\", \"922000\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.012: Returns Disposed Of -> Supabase 004.012\n004.013: Freight Cost -> Supabase 004.013\n005.004: Insurance: Health, Dental, STD -> Supabase 005.004\n005.301: Payroll Processing -> Supabase 005.301\n005.302: Training & Development -> Supabase 005.302\n006.001: Rent -> Supabase 006.001\n006.002: Utilities -> Supabase 006.002\n006.003: Safety & Security Expense -> Supabase 006.003\n006.004: Cleaning -> Supabase 006.004\n007.001: Accounting -> Supabase 007.001\n007.003: Interest Expense -> Supabase 007.003\n007.004: Merchant Services -> Supabase 007.004\n007.006: Sales Tax Miscalculations -> Supabase 007.006\n007.007: Legal -> Supabase 007.007\n007.011: General Insurance -> Supabase 007.011\n007.012: Life Insurance -> Supabase 007.012\n008.001: Software Licensing -> Supabase 008.001\n008.002: IT Services -> Supabase 008.002\n008.003: Server Hosting -> Supabase 008.003\n008.004: Telephone -> Supabase 008.004\n009.001: Marketing & Promotion -> Supabase 009.001\n009.002: Travel -> Supabase 009.002\n009.003: Meals & Entertainment -> Supabase 009.003\n009.004: Warehouse Supplies -> Supabase 009.004\n009.005: Office Expenses -> Supabase 009.005\n009.006: Dues & Organization Subscription -> Supabase 009.006\n009.007: Repairs & Maintenance -> Supabase 009.007\n009.008: Selling Expense -> Supabase 009.008\n009.009: Donations -> Supabase 009.009\n009.010: Postage -> Supabase 009.010\n009.011: Consulting -> Supabase 009.011\n009.012: Permit & Licenses -> Supabase 009.012\n009.013: Shipping Insurance Premiums -> Supabase 009.013\n009.102: Inventory Adjustments -> Supabase 009.102\n010.002: Misc. Expense -> Supabase 010.002\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000\n211.100: Standard Product -> Supabase 211.100\n\n[Notes]\n- The 37 operating accounts are hardcoded; the Airtable checkbox is not read during sync."
  },
  {
    "rule_code": "EXP-14",
    "category": "expense",
    "sort_order": 3,
    "trigger_name": "When operating expenses are paid",
    "chart_family": "Operating Expenses",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 3\n\n[Code]\nEXP-14\n\n[Family]\nOperating Expenses\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes any of \"004.012\", \"004.013\", \"005.004\", \"005.301\", \"005.302\", \"006.001\", \"006.002\", \"006.003\", \"006.004\", \"007.001\", \"007.003\", \"007.004\", \"007.006\", \"007.007\", \"007.011\", \"007.012\", \"008.001\", \"008.002\", \"008.003\", \"008.004\", \"009.001\", \"009.002\", \"009.003\", \"009.004\", \"009.005\", \"009.006\", \"009.007\", \"009.008\", \"009.009\", \"009.010\", \"009.011\", \"009.012\", \"009.013\", \"009.102\", \"010.002\", \"525300\", \"922000\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100"
  },
  {
    "rule_code": "EXP-15",
    "category": "expense",
    "sort_order": 5,
    "trigger_name": "Everytime a product invoice is created",
    "chart_family": "Product Purchases",
    "implementation_status": "fully",
    "debit_label": "Cost of Goods Sold (004.010)",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Daily",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 5\n\n[Code]\nEXP-15\n\n[Family]\nProduct Purchases\n\n[Implementation]\nFully\n\n[Debit]\nCost of Goods Sold (004.010)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount - Invoices.Discount Lines Total\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 004.010\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n004.010: Cost of Goods Sold -> Supabase 004.010\n211.100: Standard Product -> Supabase 211.100\n\n[Issues]\n- Negative AP Product invoices also match this category. Should they use a different category?"
  },
  {
    "rule_code": "EXP-16",
    "category": "expense",
    "sort_order": 6,
    "trigger_name": "Everytime a product invoice is paid",
    "chart_family": "Product Purchases",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Daily",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 6\n\n[Code]\nEXP-16\n\n[Family]\nProduct Purchases\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nPayments.Account to Pay/Receive does not include \"231.100: Credit Card Clearing\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200"
  },
  {
    "rule_code": "EXP-02",
    "category": "expense",
    "sort_order": 4,
    "trigger_name": "Company credit-card purchase with NO vendor bill",
    "chart_family": "Operating Expenses",
    "implementation_status": "fully",
    "debit_label": "Invoice expense account linked\nExamples: Software Licensing (008.001), Travel (009.002)",
    "credit_label": "Credit Card Payable (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "AP expense card payment marked as no vendor bill. Use Payments.Amount and Payments.Payment Date; debit the linked invoice expense account and credit 231.100.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 4\n\n[Code]\nEXP-02\n\n[Family]\nOperating Expenses\n\n[Implementation]\nFully\n\n[Debit]\nInvoice expense account linked\nExamples: Software Licensing (008.001), Travel (009.002)\n\n[Credit]\nCredit Card Payable (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = true\nInvoices.Linked Chart of Accounts is not empty\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n008.001: Software Licensing -> Supabase 008.001\n009.002: Travel -> Supabase 009.002\n009.006: Dues & Organization Subscription -> Supabase 009.006\n231.100: Credit Card Clearing -> Supabase 231.100\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000"
  },
  {
    "rule_code": "EXP-03",
    "category": "expense",
    "sort_order": 12,
    "trigger_name": "Prepaid expense bill (pay a year up front, e.g., insurance) - Invoice, not paid",
    "chart_family": "Prepaid Expenses",
    "implementation_status": "fully",
    "debit_label": "Prepaid Expenses (135.000)",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "AP asset invoice marked as prepaid. Debit Prepaid Expenses 135.000 and credit Accounts Payable 211.100.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 12\n\n[Code]\nEXP-03\n\n[Family]\nPrepaid Expenses\n\n[Implementation]\nFully\n\n[Debit]\nPrepaid Expenses (135.000)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 135.000\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n135.000: Prepaid Assets -> Supabase 135.000\n211.100: Standard Product -> Supabase 211.100"
  },
  {
    "rule_code": "EXP-17",
    "category": "expense",
    "sort_order": 13,
    "trigger_name": "Prepaid Expense BILL (actually paid)",
    "chart_family": "Prepaid Expenses",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Just with payment record, fully paid",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 13\n\n[Code]\nEXP-17\n\n[Family]\nPrepaid Expenses\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100"
  },
  {
    "rule_code": "EXP-04",
    "category": "expense",
    "sort_order": 14,
    "trigger_name": "Prepaid expense - monthly use-up (amortization)",
    "chart_family": "Prepaid Expenses",
    "implementation_status": "fully",
    "debit_label": "Invoice expense account linked\nExample: General Insurance (007.011)",
    "credit_label": "Prepaid Expenses (135.000)",
    "when_to_post": "[Record]\nPrepay Expenses Log\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use each Prepay Expenses Log record: Amount Deducted and Applied Date. Prepay Log supplies the note.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 14\n\n[Code]\nEXP-04\n\n[Family]\nPrepaid Expenses\n\n[Implementation]\nFully\n\n[Debit]\nInvoice expense account linked\nExample: General Insurance (007.011)\n\n[Credit]\nPrepaid Expenses (135.000)\n\n[Record]\nPrepay Expenses Log\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPrepay Expenses Log.Cancel Pre-pay Log = false\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Prepay Expenses Log.Amount Deducted\nDate = Prepay Expenses Log.Applied Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 135.000\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\nNotes = Prepay Expenses Log.Prepay Log\n\n[Account Mapping]\nInvoices.Linked Chart of Accounts -> Supabase matching expense account\n007.011: General Insurance -> Supabase 007.011\n135.000: Prepaid Assets -> Supabase 135.000\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000"
  },
  {
    "rule_code": "EXP-05",
    "category": "expense",
    "sort_order": 20,
    "trigger_name": "Employee Tech Allowance - Not Paid",
    "chart_family": "Tech Allowance",
    "implementation_status": "fully",
    "debit_label": "005.102: Tech Allowance",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use each Tech Allowance invoice line amount and its parent Invoice Date and Branch Employee.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 20\n\n[Code]\nEXP-05\n\n[Family]\nTech Allowance\n\n[Implementation]\nFully\n\n[Debit]\n005.102: Tech Allowance\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch Employee\nDebit = 005.102\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.102: Tech Allowance -> Supabase 005.102\n211.100: Standard Product -> Supabase 211.100"
  },
  {
    "rule_code": "EXP-18",
    "category": "expense",
    "sort_order": 21,
    "trigger_name": "Employee Tech Allowance - Paid",
    "chart_family": "Tech Allowance",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Once it is paid",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 21\n\n[Code]\nEXP-18\n\n[Family]\nTech Allowance\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.102: Tech Allowance\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch Employee\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100"
  },
  {
    "rule_code": "EXP-06",
    "category": "expense",
    "sort_order": 22,
    "trigger_name": "Payroll - W2 payroll register (per pay date), Owner",
    "chart_family": "W2 and Owner Payroll",
    "implementation_status": "fully",
    "debit_label": "005.001: Salary - Owners\n005.002: Salary - W2\n005.003: Salary - 1099\n005.005: 401K\n005.006: Payroll Taxes",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use each W2, owner, 1099, 401K or payroll-tax invoice line amount. Debit its account and credit Accounts Payable 211.100.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 22\n\n[Code]\nEXP-06\n\n[Family]\nW2 and Owner Payroll\n\n[Implementation]\nFully\n\n[Debit]\n005.001: Salary - Owners\n005.002: Salary - W2\n005.003: Salary - 1099\n005.005: 401K\n005.006: Payroll Taxes\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes any of \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.003: Salary - 1099\", \"005.005: 401K\", \"005.006: Payroll Taxes\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.001: Salary - Owners -> Supabase 005.001\n005.002: Salary - W2 -> Supabase 005.002\n005.003: Salary - 1099 -> Supabase 005.003\n005.005: 401K -> Supabase 005.005\n005.006: Payroll Taxes -> Supabase 005.006\n211.100: Standard Product -> Supabase 211.100\n\n[Issues]\n- Confirm how to record 005.004 insurance deductions. They are excluded from this W2 pair and can make bank postings exceed the actual payment."
  },
  {
    "rule_code": "EXP-19",
    "category": "expense",
    "sort_order": 23,
    "trigger_name": "Payroll - W2 payroll register (Paid)",
    "chart_family": "W2 and Owner Payroll",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 23\n\n[Code]\nEXP-19\n\n[Family]\nW2 and Owner Payroll\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes any of \"005.001: Salary - Owners\", \"005.002: Salary - W2\", \"005.003: Salary - 1099\", \"005.005: 401K\", \"005.006: Payroll Taxes\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Confirm how to record 005.004 insurance deductions. They are excluded from this W2 pair and can make bank postings exceed the actual payment."
  },
  {
    "rule_code": "EXP-07",
    "category": "expense",
    "sort_order": 24,
    "trigger_name": "Payroll - offshore - unpaid",
    "chart_family": "Offshore Payroll",
    "implementation_status": "fully",
    "debit_label": "005.101: Salary - Offshore",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "AP Staff invoice lines linked to 005.101: Salary - Offshore. Use each Line Amount and Invoice Date; debit 005.101 and credit Accounts Payable 211.100.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 24\n\n[Code]\nEXP-07\n\n[Family]\nOffshore Payroll\n\n[Implementation]\nFully\n\n[Debit]\n005.101: Salary - Offshore\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.101: Salary - Offshore\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.101\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.101: Salary - Offshore -> Supabase 005.101\n211.100: Standard Product -> Supabase 211.100"
  },
  {
    "rule_code": "EXP-20",
    "category": "expense",
    "sort_order": 25,
    "trigger_name": "Payroll - offshore - paid",
    "chart_family": "Offshore Payroll",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 25\n\n[Code]\nEXP-20\n\n[Family]\nOffshore Payroll\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.101: Salary - Offshore\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100"
  },
  {
    "rule_code": "EXP-09",
    "category": "expense",
    "sort_order": 26,
    "trigger_name": "Payrol - Bonuses (Unpaid)",
    "chart_family": "Payroll Bonus",
    "implementation_status": "fully",
    "debit_label": "005.201: Bonus",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 26\n\n[Code]\nEXP-09\n\n[Family]\nPayroll Bonus\n\n[Implementation]\nFully\n\n[Debit]\n005.201: Bonus\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.201\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n005.201: Bonus -> Supabase 005.201\n211.100: Standard Product -> Supabase 211.100"
  },
  {
    "rule_code": "EXP-21",
    "category": "expense",
    "sort_order": 27,
    "trigger_name": "Payrol - Bonuses (paid)",
    "chart_family": "Payroll Bonus",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 27\n\n[Code]\nEXP-21\n\n[Family]\nPayroll Bonus\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.201: Bonus\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100"
  },
  {
    "rule_code": "EXP-23",
    "category": "expense",
    "sort_order": 28,
    "trigger_name": "Payroll - offshore - Month-end accrual Bonus (Paid)",
    "chart_family": "Accrued Bonus",
    "implementation_status": "fully",
    "debit_label": "Accrued Bonus & Commission (241.300)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "PAYMENT MADE",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 28\n\n[Code]\nEXP-23\n\n[Family]\nAccrued Bonus\n\n[Implementation]\nFully\n\n[Debit]\nAccrued Bonus & Commission (241.300)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Staff\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes \"005.103: 13th Month\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 241.300\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n241.300: Accrued Bonus & Commission -> Supabase 241.300\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100"
  },
  {
    "rule_code": "EXP-10",
    "category": "expense",
    "sort_order": 17,
    "trigger_name": "Monthly depreciation of equipment, vehicles, fixtures",
    "chart_family": "Fixed Assets",
    "implementation_status": "fully",
    "debit_label": "Depreciation Expense (009.101)",
    "credit_label": "Accumulated Depreciation (161.000)",
    "when_to_post": "[Record]\nDepreciation Table\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use the recorded Amount Depreciated and Date from Depreciation Table. Associated Asset supplies the note.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 17\n\n[Code]\nEXP-10\n\n[Family]\nFixed Assets\n\n[Implementation]\nFully\n\n[Debit]\nDepreciation Expense (009.101)\n\n[Credit]\nAccumulated Depreciation (161.000)\n\n[Record]\nDepreciation Table\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\n\n[Field Mapping]\nAmount = Depreciation Table.Amount Depreciated\nDate = Depreciation Table.Date\nBranch = Blank\nDebit = 009.101\nCredit = 161.000\n\n[Other Field Mapping]\nNotes = Depreciation Table.Associated Asset\n\n[Account Mapping]\n009.101: Depreciation -> Supabase 009.101\nFixed accumulated depreciation credit -> Supabase 161.000"
  },
  {
    "rule_code": "EXP-11",
    "category": "expense",
    "sort_order": 29,
    "trigger_name": "Bank fees and charges shown only on the bank statement (Unpaid)",
    "chart_family": "Bank Fees",
    "implementation_status": "fully",
    "debit_label": "Bank, Wire & FX Fees (007.002)",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "AP expense invoice linked to Bank / Misc. Service Charges 007.002. Debit 007.002 and credit Accounts Payable 211.100.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 29\n\n[Code]\nEXP-11\n\n[Family]\nBank Fees\n\n[Implementation]\nFully\n\n[Debit]\nBank, Wire & FX Fees (007.002)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.002\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n007.002: Bank / Misc. Service Charges -> Supabase 007.002\n211.100: Standard Product -> Supabase 211.100"
  },
  {
    "rule_code": "EXP-27",
    "category": "expense",
    "sort_order": 30,
    "trigger_name": "Bank fees and charges shown only on the bank statement (Paid)",
    "chart_family": "Bank Fees",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Sent payment for a Bank / Misc. Service Charges invoice. Debit Accounts Payable 211.100 and credit the payment account.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 30\n\n[Code]\nEXP-27\n\n[Family]\nBank Fees\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Mark as No Vendor Bill? = false\nInvoices.Linked Chart of Accounts includes \"007.002: Bank / Misc. Service Charges\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100"
  },
  {
    "rule_code": "EXP-13",
    "category": "expense",
    "sort_order": 31,
    "trigger_name": "Income tax accrual (quarterly)",
    "chart_family": "Income Tax",
    "implementation_status": "fully",
    "debit_label": "Federal Income Tax Expense (011.001)\nState Income Tax Expense (011.002)",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "AP expense invoice lines linked to FIN 923100: Federal Income Tax or 923300: State Income Tax. Use each Line Amount and Invoice Date; map the debit to 011.001 or 011.002 and credit Accounts Payable 211.100.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 31\n\n[Code]\nEXP-13\n\n[Family]\nIncome Tax\n\n[Implementation]\nFully\n\n[Debit]\nFederal Income Tax Expense (011.001)\nState Income Tax Expense (011.002)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoice Lines.Chart of Accounts includes any of \"923100: Federal Income Tax\", \"923300: State Income Tax\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n923100: Federal Income Tax -> Supabase 011.001\n923300: State Income Tax -> Supabase 011.002\n211.100: Standard Product -> Supabase 211.100"
  },
  {
    "rule_code": "EXP-26",
    "category": "expense",
    "sort_order": 32,
    "trigger_name": "Income tax accrual (Paid)",
    "chart_family": "Income Tax",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 32\n\n[Code]\nEXP-26\n\n[Family]\nIncome Tax\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Invoice Status (AP) = \"Fully Paid\"\nInvoice Lines.Chart of Accounts includes any of \"923100: Federal Income Tax\", \"923300: State Income Tax\"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100"
  },
  {
    "rule_code": "INV-12",
    "category": "invoice_entry",
    "sort_order": 2,
    "trigger_name": "Deposit Invoice is created",
    "chart_family": "Customer Deposits",
    "implementation_status": "fully",
    "debit_label": "Accounts Receivable (121.100)",
    "credit_label": "Client Deposits Held (221.100)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 2\n\n[Code]\nINV-12\n\n[Family]\nCustomer Deposits\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Receivable (121.100)\n\n[Credit]\nClient Deposits Held (221.100)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 221.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nClient Deposits Held (221.100) -> Supabase 221.100"
  },
  {
    "rule_code": "INV-13",
    "category": "invoice_entry",
    "sort_order": 3,
    "trigger_name": "Deposit Invoice is paid",
    "chart_family": "Customer Deposits",
    "implementation_status": "fully",
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "credit_label": "Accounts Receivable (121.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 3\n\n[Code]\nINV-13\n\n[Family]\nCustomer Deposits\n\n[Implementation]\nFully\n\n[Debit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Credit]\nAccounts Receivable (121.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\n\n[Field Mapping]\nAmount = Payments.Amount x Sum of matching Invoices.Payment Proportion For Batch Allocation\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100\n\n[Notes]\n- Product and Non-Product invoices are paid separately.\n\n- Repeated batch payments link the same invoices with unchanged invoice amounts."
  },
  {
    "rule_code": "INV-14",
    "category": "invoice_entry",
    "sort_order": 4,
    "trigger_name": "Shipment against client deposit",
    "chart_family": "Customer Deposits",
    "implementation_status": "fully",
    "debit_label": "Client Deposits Held (221.100)",
    "credit_label": "Product Revenue (004.001)",
    "when_to_post": "[Record]\nShipping Records\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Release the shipped selling value from Client Deposits Held to Product Revenue, up to the remaining deposit balance.",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 4\n\n[Code]\nINV-14\n\n[Family]\nCustomer Deposits\n\n[Implementation]\nFully\n\n[Debit]\nClient Deposits Held (221.100)\n\n[Credit]\nProduct Revenue (004.001)\n\n[Record]\nShipping Records\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nShipping Records.Ship Out = true\nShipping Records.Ship Out Date is not empty\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) = \"Deposit Invoice\"\nInvoices.Cancel Invoice = false\n\n[Field Mapping]\nAmount = MIN(Sum of linked MTAs.Extended Sell Price, MAX(0, Remaining posted deposit balance))\nDate = Shipping Records.Ship Out Date\nBranch = Linked MTAs.Branch\nDebit = 221.100\nCredit = 004.001\n\n[Other Field Mapping]\nVendor Reference = Deposit Invoice.Linked Vendors\nClient Reference = Deposit Invoice.Linked Client\nStaff Reference = Deposit Invoice.Linked Staff\nTransaction Reference = Shipping Records.Transaction\nPO Reference = Deposit Invoice.Related Purchase Order\nState References = Linked MTAs.States, and Sales Tax Rates\n\n[Account Mapping]\n221.100: Client Deposits Held -> Supabase 221.100\n004.001: Product Revenue -> Supabase 004.001\n\n[Notes]\n- Remaining deposit is the net posted 221.100 balance linked to the deposit invoice, including reversals.\n\n- Requires one transaction and one deposit invoice; ambiguous links stop without posting."
  },
  {
    "rule_code": "INV-15",
    "category": "invoice_entry",
    "sort_order": 5,
    "trigger_name": "Full or Balance Invoice is created",
    "chart_family": "Customer Product Sales",
    "implementation_status": "fully",
    "debit_label": "Accounts Receivable (121.100)",
    "credit_label": "Product Revenue (004.001)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 5\n\n[Code]\nINV-15\n\n[Family]\nCustomer Product Sales\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Receivable (121.100)\n\n[Credit]\nProduct Revenue (004.001)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = 004.001\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nProduct Revenue (004.001) -> Supabase 004.001"
  },
  {
    "rule_code": "INV-16",
    "category": "invoice_entry",
    "sort_order": 6,
    "trigger_name": "Full or Balance invoice is paid",
    "chart_family": "Customer Product Sales",
    "implementation_status": "fully",
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "credit_label": "Accounts Receivable (121.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 6\n\n[Code]\nINV-16\n\n[Family]\nCustomer Product Sales\n\n[Implementation]\nFully\n\n[Debit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Credit]\nAccounts Receivable (121.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Product\"\nInvoices.Invoice Kind (AR) is \"Full Invoice\" or \"Balance Invoice\"\n\n[Field Mapping]\nAmount = Payments.Amount x Sum of matching Invoices.Payment Proportion For Batch Allocation\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100\n\n[Notes]\n- Product and Non-Product invoices are paid separately.\n\n- Repeated batch payments link the same invoices with unchanged invoice amounts."
  },
  {
    "rule_code": "INV-07",
    "category": "expense",
    "sort_order": 15,
    "trigger_name": "Fixed asset purchase invoice (vehicle, fixtures, software) Created",
    "chart_family": "Fixed Assets",
    "implementation_status": "partial",
    "debit_label": "Invoice account linked\nExample: Display Fixtures & Equipment (143.300)",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Record the asset invoice on Invoice Date. Depreciation is handled separately in EXP-10.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 15\n\n[Code]\nINV-07\n\n[Family]\nFixed Assets\n\n[Implementation]\nPartially\n\n[Debit]\nInvoice account linked\nExample: Display Fixtures & Equipment (143.300)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.300: Display Fixtures & Equipment -> Supabase 143.300\nAccounts Payable (211.100) -> Supabase 211.100\n\n[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?"
  },
  {
    "rule_code": "INV-17",
    "category": "expense",
    "sort_order": 16,
    "trigger_name": "Fixed Asset Purchase Invoice is Paid",
    "chart_family": "Fixed Assets",
    "implementation_status": "partial",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 16\n\n[Code]\nINV-17\n\n[Family]\nFixed Assets\n\n[Implementation]\nPartially\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Mark as Prepaid Asset? = false\nInvoices.Linked Chart of Accounts includes \"143.300: Display Fixtures & Equipment\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Payable (211.100) -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?"
  },
  {
    "rule_code": "INV-08",
    "category": "expense",
    "sort_order": 9,
    "trigger_name": "Vendor credit memo - returned goods (RGA return for credit)",
    "chart_family": "Vendor Credits and Refunds",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Inventory - Pending Return Processing (131.400)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Record the vendor credit by debiting Accounts Payable and crediting Inventory - Pending Return Processing.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 9\n\n[Code]\nINV-08\n\n[Family]\nVendor Credits and Refunds\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nInventory - Pending Return Processing (131.400)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Credit\"\nInvoices.Related Purchase Order is not empty\n\n[Field Mapping]\nAmount = -Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 131.400\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n131.400: Pending Return Processing -> Supabase 131.400\n\n[Notes]\n- FIN stores vendor credits as negative invoice amounts."
  },
  {
    "rule_code": "INV-10",
    "category": "invoice_entry",
    "sort_order": 7,
    "trigger_name": "Customer invoice for a NON-product charge Created",
    "chart_family": "Customer Non-product Sales",
    "implementation_status": "fully",
    "debit_label": "Accounts Receivable (121.100)",
    "credit_label": "Invoice account linked\nExample: Coordination Fees Charged (004.002)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Record the AR non-product receivable and credit the linked invoice account.",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 7\n\n[Code]\nINV-10\n\n[Family]\nCustomer Non-product Sales\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Receivable (121.100)\n\n[Credit]\nInvoice account linked\nExample: Coordination Fees Charged (004.002)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts does not include \"004.011: Purchased Discounts & Rebate\"\nInvoices.Linked Chart of Accounts does not include \"311.200: Paid in Capital\"\nInvoices.Linked Chart of Accounts does not include \"004.004: Shipping Insurance Payouts Recieved\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 121.100\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nAccounts Receivable (121.100) -> Supabase 121.100\nInvoices.Linked Chart of Accounts -> Supabase matching account\nExample: 004.002: Coordination Fees Charged -> Supabase 004.002\n525300: Workers Compensation -> Supabase 525.300\n922000: Freight and Handling In -> Supabase 922.000\n\n[Issues]\n- Potential loan overlaps with Category - Payment rows 12/13 remain unresolved. Those handlers currently stop before posting."
  },
  {
    "rule_code": "INV-18",
    "category": "invoice_entry",
    "sort_order": 8,
    "trigger_name": "Customer invoice for a non-product charge paid",
    "chart_family": "Customer Non-product Sales",
    "implementation_status": "fully",
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)",
    "credit_label": "Accounts Receivable (121.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "When non-product invoice is paid",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 8\n\n[Code]\nINV-18\n\n[Family]\nCustomer Non-product Sales\n\n[Implementation]\nFully\n\n[Debit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)\n\n[Credit]\nAccounts Receivable (121.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts does not include \"004.011: Purchased Discounts & Rebate\"\nInvoices.Linked Chart of Accounts does not include \"311.200: Paid in Capital\"\nInvoices.Linked Chart of Accounts does not include \"004.004: Shipping Insurance Payouts Recieved\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n231.100: Credit Card Clearing -> Supabase 231.100\nAccounts Receivable (121.100) -> Supabase 121.100\n\n[Notes]\n- Product and Non-Product invoices are paid separately.\n\n[Issues]\n- Potential loan overlaps with Category - Payment rows 12/13 remain unresolved. Those handlers currently stop before posting."
  },
  {
    "rule_code": "PAY-03",
    "category": "invoice_entry",
    "sort_order": 9,
    "trigger_name": "Client OVERPAYS or pays with no invoice to apply it to",
    "chart_family": "Customer Credits",
    "implementation_status": "fully",
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "credit_label": "Client Credits on Account (221.300)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use the negated credit Invoice Amount to record client credit available.",
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 9\n\n[Code]\nPAY-03\n\n[Family]\nCustomer Credits\n\n[Implementation]\nFully\n\n[Debit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)\n\n[Credit]\nClient Credits on Account (221.300)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Refund/Credit\"\n\n[Field Mapping]\nAmount = -Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Payments.Account to Pay/Receive\nCredit = 221.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\nClient Credits on Account (221.300) -> Supabase 221.300"
  },
  {
    "rule_code": "PAY-28",
    "category": "invoice_entry",
    "sort_order": 10,
    "trigger_name": "When we apply AR Credits to Open invoices",
    "chart_family": "Customer Credits",
    "implementation_status": "fully",
    "debit_label": "Client Credits on Account (221.300)",
    "credit_label": "Accounts Receivable (121.100)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 10\n\n[Code]\nPAY-28\n\n[Family]\nCustomer Credits\n\n[Implementation]\nFully\n\n[Debit]\nClient Credits on Account (221.300)\n\n[Credit]\nAccounts Receivable (121.100)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Credits Applied is not empty\nInvoices.Credits Applied != 0\nSource Credit Invoice.Method of Application = \"Credit to Another Order\"\n\n[Field Mapping]\nAmount = -Invoices.Credits Applied\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 221.300\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nClient Credits on Account (221.300) -> Supabase 221.300\n121.100: Accounts Receivable -> Supabase 121.100"
  },
  {
    "rule_code": "PAY-29",
    "category": "invoice_entry",
    "sort_order": 11,
    "trigger_name": "When we refund AR credits to customers (no remaining open invoices)",
    "chart_family": "Customer Credits",
    "implementation_status": "fully",
    "debit_label": "Client Credits on Account (221.300)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Invoice Entry, row 11\n\n[Code]\nPAY-29\n\n[Family]\nCustomer Credits\n\n[Implementation]\nFully\n\n[Debit]\nClient Credits on Account (221.300)\n\n[Credit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Refund/Credit\"\nInvoices.Method of Application = \"Cash Refund\"\n\n[Field Mapping]\nAmount = -Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 221.300\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nClient Credits on Account (221.300) -> Supabase 221.300\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200"
  },
  {
    "rule_code": "PAY-08",
    "category": "expense",
    "sort_order": 7,
    "trigger_name": "Pay a vendor with the company credit card",
    "chart_family": "Product Purchases",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Credit Card Clearing (231.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use Payment Date for AP Product payments made through Credit Card Clearing 231.100.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 7\n\n[Code]\nPAY-08\n\n[Family]\nProduct Purchases\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nCredit Card Clearing (231.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n231.100: Credit Card Clearing -> Supabase 231.100"
  },
  {
    "rule_code": "PAY-09",
    "category": "payment",
    "sort_order": 2,
    "trigger_name": "Pay the credit-card statement",
    "chart_family": "Credit Card Settlement",
    "implementation_status": "fully",
    "debit_label": "Credit Card Payable (231.100)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "When: When the card batch payment is sent (Payment Record Type = 'CC Batch Payment').",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 2\n\n[Code]\nPAY-09\n\n[Family]\nCredit Card Settlement\n\n[Implementation]\nFully\n\n[Debit]\nCredit Card Payable (231.100)\n\n[Credit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"CC Batch Payment\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Linked Mini-Payments.Invoices.Branch\nDebit = 231.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Linked Mini-Payments.Invoices.Linked Vendors\nClient Reference = Linked Mini-Payments.Invoices.Linked Client\nStaff Reference = Linked Mini-Payments.Invoices.Linked Staff\nTransaction Reference = Linked Mini-Payments.Invoices.Linked Transaction\nPO Reference = Linked Mini-Payments.Invoices.Related Purchase Order\nState References = Linked Mini-Payments.Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n231.100: Credit Card Clearing -> Supabase 231.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200"
  },
  {
    "rule_code": "PAY-10",
    "category": "expense",
    "sort_order": 8,
    "trigger_name": "Early-payment discount taken when paying a vendor",
    "chart_family": "Product Purchases",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Purchase Discounts & Rebates (004.011)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use non-expired discount lines from a Fully Paid AP invoice and the linked Sent payment date.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 8\n\n[Code]\nPAY-10\n\n[Family]\nProduct Purchases\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPurchase Discounts & Rebates (004.011)\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nLinked Payments.Sent = true\nLinked Payments.Payment Record Type = \"Regular Payment\"\nInvoice Lines.Line Type = \"Discount\"\nInvoice Lines.Discount Line Status != \"Expired\"\n\n[Field Mapping]\nAmount = -Invoice Lines.Line Amount\nDate = Linked Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.011\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.011: Purchased Discounts & Rebate -> Supabase 004.011"
  },
  {
    "rule_code": "PAY-11",
    "category": "expense",
    "sort_order": 10,
    "trigger_name": "Bill paid using vendor credits (no cash)",
    "chart_family": "Vendor Credits and Refunds",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)\nBill being settled",
    "credit_label": "Accounts Payable (211.100)\nSource credit invoice",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use Credits Applied from a Fully Paid AP invoice with a Sent payment. Keep separate bill and source-credit references.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 10\n\n[Code]\nPAY-11\n\n[Family]\nVendor Credits and Refunds\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\nBill being settled\n\n[Credit]\nAccounts Payable (211.100)\nSource credit invoice\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Credits Applied is not empty\nInvoices.Credits Applied != 0\n\n[Field Mapping]\nAmount = -Invoices.Credits Applied\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100 (bill)\nCredit = 211.100 (source credit invoice)\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n\n[Notes]\n- A zero-cash Sent payment still qualifies. Do not require Payments.Amount to be nonzero."
  },
  {
    "rule_code": "PAY-12",
    "category": "payment",
    "sort_order": 3,
    "trigger_name": "Vendor payment returned",
    "chart_family": "Vendor Payment Returns",
    "implementation_status": "fully",
    "debit_label": "Fifth Third Bank (112.100)",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use the negated Return Payment amount and Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 3\n\n[Code]\nPAY-12\n\n[Family]\nVendor Payment Returns\n\n[Implementation]\nFully\n\n[Debit]\nFifth Third Bank (112.100)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Return Payment\"\nPayments.Invoice Type = \"AP\"\n\n[Field Mapping]\nAmount = -Payments.Amount\nDate = Payments.Payment Date\nBranch = blank\nDebit = 112.100\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n211.100: Standard Product -> Supabase 211.100"
  },
  {
    "rule_code": "PAY-30",
    "category": "payment",
    "sort_order": 4,
    "trigger_name": "Vendor Return Payment, Repaid",
    "chart_family": "Vendor Payment Returns",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Fifth Third Bank (112.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use the Sent AP payment with Payment Record Type = Repayment.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 4\n\n[Code]\nPAY-30\n\n[Family]\nVendor Payment Returns\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nFifth Third Bank (112.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Repayment\"\nPayments.Invoice Type = \"AP\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 112.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100"
  },
  {
    "rule_code": "PAY-13",
    "category": "expense",
    "sort_order": 11,
    "trigger_name": "Vendor sends us a refund, Invoice is not an AP-Credit, Negative payment record against an actual return invoice",
    "chart_family": "Vendor Credits and Refunds",
    "implementation_status": "fully",
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "When: When the vendor refund is received.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 11\n\n[Code]\nPAY-13\n\n[Family]\nVendor Credits and Refunds\n\n[Implementation]\nFully\n\n[Debit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Refund\"\n\n[Field Mapping]\nAmount = -Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n211.100: Standard Product -> Supabase 211.100"
  },
  {
    "rule_code": "PAY-31",
    "category": "payment",
    "sort_order": 5,
    "trigger_name": "AR Non-product created with a loan account",
    "chart_family": "Loans",
    "implementation_status": "partial",
    "debit_label": "Fifth Third Bank (112.100)",
    "credit_label": "Invoice loan account linked\nExample: Auto Loan Payable (232.100)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Payment, row 5\n\n[Code]\nPAY-31\n\n[Family]\nLoans\n\n[Implementation]\nPartially\n\n[Debit]\nFifth Third Bank (112.100)\n\n[Credit]\nInvoice loan account linked\nExample: Auto Loan Payable (232.100)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Loan Records is not empty\nInvoices.Linked Chart of Accounts includes a loan liability account = Pending\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 112.100\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\nLoan liability accounts -> Supabase matching account (list pending)\n\n[Issues]\n- Should the bank debit wait for the loan receipt payment? An invoice alone does not confirm cash received.\n\n- Which loan liability accounts qualify? The selected account is on the invoice, not on Loan Records.\n\n- The same AR Non-Product invoice/payment qualifies for Invoice Entry rows 11/12. Which flow should own the borrowing entry?"
  },
  {
    "rule_code": "PAY-16",
    "category": "payment",
    "sort_order": 6,
    "trigger_name": "Loan payment (principal + interest) ONLY scenario where AR invoice > AP Payment",
    "chart_family": "Loans",
    "implementation_status": "partial",
    "debit_label": "Invoice-line account linked\nAuto Loan Payable (232.100)\nInterest Expense (007.003)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use separately coded principal and interest invoice lines. Date the entry with Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 6\n\n[Code]\nPAY-16\n\n[Family]\nLoans\n\n[Implementation]\nPartially\n\n[Debit]\nInvoice-line account linked\nAuto Loan Payable (232.100)\nInterest Expense (007.003)\n\n[Credit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nMonthly loan invoice link = Pending\nPrincipal / interest source = Pending\n\n[Field Mapping]\nAmount = Pending - principal and interest amounts per account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 232.100 (principal) or 007.003 (interest)\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n232.100: Auto Loan Payable -> Supabase 232.100\n007.003: Interest Expense -> Supabase 007.003\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n\n[Issues]\n- Which invoice link identifies a monthly repayment rather than the original borrowing: Loan Records or Loan Records 2?\n\n- Should principal and interest come from Invoice Lines.Line Amount or Debt Amortization Table.Principal and Interest?\n\n- INV-18 treats Sent payments on AR Non-Product invoices as cash receipts. How should this outgoing loan payment be separated?"
  },
  {
    "rule_code": "PAY-20",
    "category": "payment",
    "sort_order": 8,
    "trigger_name": "Owner distribution paid",
    "chart_family": "Owner Capital",
    "implementation_status": "fully",
    "debit_label": "Shareholder Distributions (316.100)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "When: When the distribution is paid (approved by owners).",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 8\n\n[Code]\nPAY-20\n\n[Family]\nOwner Capital\n\n[Implementation]\nFully\n\n[Debit]\nShareholder Distributions (316.100)\n\n[Credit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"316.100: Prior to Current Year Distributions\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 316.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n316.100: Prior to Current Year Distributions -> Supabase 316.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200"
  },
  {
    "rule_code": "PAY-21",
    "category": "payment",
    "sort_order": 7,
    "trigger_name": "Owner puts money into the company",
    "chart_family": "Owner Capital",
    "implementation_status": "fully",
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "credit_label": "Additional Paid-in Capital (311.200)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "When: When the contribution is received.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 7\n\n[Code]\nPAY-21\n\n[Family]\nOwner Capital\n\n[Implementation]\nFully\n\n[Debit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)\n\n[Credit]\nAdditional Paid-in Capital (311.200)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"311.200: Paid in Capital\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 311.200\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n311.200: Paid in Capital -> Supabase 311.200"
  },
  {
    "rule_code": "PAY-23",
    "category": "payment",
    "sort_order": 9,
    "trigger_name": "Insurance claim payout received",
    "chart_family": "Insurance Claims",
    "implementation_status": "fully",
    "debit_label": "Fifth Third Bank (112.100)",
    "credit_label": "Insurance Claim Recoveries (004.004)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use Payment Date and the fixed Fifth Third debit. FIN account identity and overlap ownership remain unresolved.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 9\n\n[Code]\nPAY-23\n\n[Family]\nInsurance Claims\n\n[Implementation]\nFully\n\n[Debit]\nFifth Third Bank (112.100)\n\n[Credit]\nInsurance Claim Recoveries (004.004)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"004.004: Shipping Insurance Payouts Recieved\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 112.100\nCredit = 004.004\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n004.004: Shipping Insurance Payouts Recieved -> Supabase 004.004"
  },
  {
    "rule_code": "PAY-32",
    "category": "expense",
    "sort_order": 18,
    "trigger_name": "Security Deposit with Chart of Account Security Deposit",
    "chart_family": "Security Deposits",
    "implementation_status": "fully",
    "debit_label": "Security Deposits (143.200)",
    "credit_label": "Accounts Payable (211.100)",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": null,
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 18\n\n[Code]\nPAY-32\n\n[Family]\nSecurity Deposits\n\n[Implementation]\nFully\n\n[Debit]\nSecurity Deposits (143.200)\n\n[Credit]\nAccounts Payable (211.100)\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Linked Chart of Accounts includes \"143.200: Security Deposits\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 143.200\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.200: Security Deposits -> Supabase 143.200\n211.100: Standard Product -> Supabase 211.100"
  },
  {
    "rule_code": "PAY-24",
    "category": "expense",
    "sort_order": 19,
    "trigger_name": "Security deposit paid (lease)",
    "chart_family": "Security Deposits",
    "implementation_status": "fully",
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Record the security-deposit payment using Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Expenses, row 19\n\n[Code]\nPAY-24\n\n[Family]\nSecurity Deposits\n\n[Implementation]\nFully\n\n[Debit]\nAccounts Payable (211.100)\n\n[Credit]\nPayment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Linked Chart of Accounts includes \"143.200: Security Deposits\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200"
  },
  {
    "rule_code": "PAY-27",
    "category": "payment",
    "sort_order": 10,
    "trigger_name": "Credit-card rebate earned (cash back)",
    "chart_family": "Card Rewards",
    "implementation_status": "fully",
    "debit_label": "Credit Card Clearing (231.100)",
    "credit_label": "Purchase Discounts & Rebates (004.011)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)",
    "fin_notes": "Use Payment Amount and Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 10\n\n[Code]\nPAY-27\n\n[Family]\nCard Rewards\n\n[Implementation]\nFully\n\n[Debit]\nCredit Card Clearing (231.100)\n\n[Credit]\nPurchase Discounts & Rebates (004.011)\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"Regular Payment\"\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"\nPayments.Amount != 0\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"004.011: Purchased Discounts & Rebate\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 231.100\nCredit = 004.011\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n231.100: Credit Card Clearing -> Supabase 231.100\n004.011: Purchased Discounts & Rebate -> Supabase 004.011"
  }
]$grouped$::jsonb)
 as c(rule_code text,category text,sort_order integer,trigger_name text,chart_family text,implementation_status text,
 debit_label text,credit_label text,when_to_post text,fin_notes text,dev_notes text)
where r.rule_code=c.rule_code;

-- Retain immutable journal/review history; only unreferenced archived catalog rows are deleted.
update public.ledger_rules r set enabled=false,retired_at=coalesce(retired_at,now())
where r.rule_code in ('EXP-08','EXP-12','EXP-22','EXP-24','EXP-25','INV-02','INV-09','INV-11','PAY-01','PAY-02','PAY-04','PAY-05','PAY-06','PAY-07','PAY-14','PAY-15','PAY-17','PAY-18','PAY-19','PAY-22','PAY-25','PAY-26');
delete from public.ledger_rules r where r.rule_code in ('EXP-08','EXP-12','EXP-22','EXP-24','EXP-25','INV-02','INV-09','INV-11','PAY-01','PAY-02','PAY-04','PAY-05','PAY-06','PAY-07','PAY-14','PAY-15','PAY-17','PAY-18','PAY-19','PAY-22','PAY-25','PAY-26')
 and not exists(select 1 from public.journal_entries e where e.rule_code=r.rule_code)
 and not exists(select 1 from public.ledger_posting_requests p where p.payload::text like '%'||r.rule_code||'%');
