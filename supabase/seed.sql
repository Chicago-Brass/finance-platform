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

insert into public.ledger_rules (rule_code, category, sort_order, trigger_name, when_to_post, fin_notes, dev_notes, audit_trail, airtable_sources, reversible, active)
select rule_code, category, sort_order, trigger_name, when_to_post, fin_notes, dev_notes, audit_trail, airtable_sources, reversible, active from jsonb_populate_recordset(null::public.ledger_rules, '[
  {
    "rule_code": "EXP-01",
    "category": "expense",
    "sort_order": 1,
    "trigger_name": "Enter an operating expense invoice (ex: Utilities)",
    "when_to_post": "When the AP expense invoice is saved/approved. Use the INVOICE DATE (not the date we pay).",
    "fin_notes": "Expense account must be chosen on EVERY line. Never allow a bank (112.x) or revenue (004.00x) account here.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-02",
    "category": "expense",
    "sort_order": 2,
    "trigger_name": "Company credit-card purchase with NO vendor bill",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-03",
    "category": "expense",
    "sort_order": 3,
    "trigger_name": "Prepaid expense bill (pay a year up front, e.g., insurance)",
    "when_to_post": "When the bill is saved (Invoice Date).",
    "fin_notes": "The full year is expensed on the payment date. There is no prepaid account.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-04",
    "category": "expense",
    "sort_order": 4,
    "trigger_name": "Prepaid expense – monthly use-up (amortization)",
    "when_to_post": "Automatic monthly job on the last day of each month, until the prepaid balance is zero.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "New Process",
    "reversible": null,
    "active": true
  },
  {
    "rule_code": "EXP-05",
    "category": "expense",
    "sort_order": 5,
    "trigger_name": "Employee Tech Allowance",
    "when_to_post": "When the tech allowance reimbursement invoice is approved (Invoice Date).",
    "fin_notes": "Keep reimbursements on their own lines, separate from wages.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-06",
    "category": "expense",
    "sort_order": 6,
    "trigger_name": "Payroll – W2 payroll register (per pay date)",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-07",
    "category": "expense",
    "sort_order": 7,
    "trigger_name": "Payroll – offshore / 1099 / owner staff invoice",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "AP",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-08",
    "category": "expense",
    "sort_order": 8,
    "trigger_name": "Month-end accrual – PTO liability",
    "when_to_post": "Monthly job: post only the change in the PTO balance.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "AP",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-09",
    "category": "expense",
    "sort_order": 9,
    "trigger_name": "Month-end accrual – bonus & commission earned",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-10",
    "category": "expense",
    "sort_order": 10,
    "trigger_name": "Monthly depreciation of equipment, vehicles, fixtures",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-11",
    "category": "expense",
    "sort_order": 11,
    "trigger_name": "Bank fees and charges shown only on the bank statement",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "AP",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-12",
    "category": "expense",
    "sort_order": 12,
    "trigger_name": "Bad-debt reserve (allowance) – month-end",
    "when_to_post": "Monthly job (Finance approves the %).",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "EXP-13",
    "category": "expense",
    "sort_order": 13,
    "trigger_name": "Income tax accrual (quarterly)",
    "when_to_post": "Quarterly manual entry by Finance.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN",
    "reversible": true,
    "active": true
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
    "active": true
  },
  {
    "rule_code": "INV-02",
    "category": "invoice_entry",
    "sort_order": 2,
    "trigger_name": "Vendor PRODUCT invoice – price is different from the PO",
    "when_to_post": "Same event as INV-01, when the invoice amount ≠ received value.",
    "fin_notes": "If the vendor billed LESS, the variance line moves to the credit side.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; OPS › KURT - PO Line; OPS › Price Discrepancies",
    "reversible": true,
    "active": true
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
    "active": true
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
    "active": true
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
    "active": true
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
    "active": true
  },
  {
    "rule_code": "INV-07",
    "category": "invoice_entry",
    "sort_order": 7,
    "trigger_name": "Fixed asset purchase invoice (vehicle, fixtures, software)",
    "when_to_post": "When the asset invoice is saved (Invoice Date).",
    "fin_notes": "Also create the Asset Table row so EXP-13 depreciation starts.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; AP › Invoices; FIN › Asset Table",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "INV-08",
    "category": "invoice_entry",
    "sort_order": 8,
    "trigger_name": "Vendor CREDIT MEMO – returned goods (RGA return for credit)",
    "when_to_post": "When the AP credit invoice is saved.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; OPS › KURT - PO",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "INV-09",
    "category": "invoice_entry",
    "sort_order": 9,
    "trigger_name": "Vendor CREDIT MEMO – price credit, no goods returned",
    "when_to_post": "When the AP credit invoice is saved (RGA Outcome = ''No Return, Credit Only'' or a price credit).",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "INV-10",
    "category": "invoice_entry",
    "sort_order": 10,
    "trigger_name": "Customer invoice for a NON-product charge",
    "when_to_post": "When the AR non-product invoice is saved (Invoice Date).",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "INV-11",
    "category": "invoice_entry",
    "sort_order": 11,
    "trigger_name": "Customer credit memo for a RETURN",
    "when_to_post": "When the Return Transaction is approved (Transaction Type = ''Return Transaction'').",
    "fin_notes": "Then either refund the client (PAY-07) or apply the credit to another order (OTH-23).",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "Schedules & Transactions › Transaction",
    "reversible": true,
    "active": true
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
    "active": true
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
    "active": true
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
    "active": true
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
    "active": true
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
    "active": true
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
    "active": true
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
    "active": true
  },
  {
    "rule_code": "PAY-01",
    "category": "payment",
    "sort_order": 1,
    "trigger_name": "Customer deposit received (before the order is processed)",
    "when_to_post": "When the client payment is saved and the order has NOT shipped yet. This payment is what turns ''Clear to Purchase'' to YES.",
    "fin_notes": "CRITICAL gap today: only the bank side is recorded. Nothing tracks the deposit as money owed to the client.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Payments; AR › Payments - NEW; Schedules & Transactions › Transaction",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-02",
    "category": "payment",
    "sort_order": 2,
    "trigger_name": "Customer payment AFTER the order shipped (credit-terms clients)",
    "when_to_post": "When the payment is applied to an invoice whose goods have already shipped.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Payments; AR › Payments - NEW; AR › Invoices",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-03",
    "category": "payment",
    "sort_order": 3,
    "trigger_name": "Client OVERPAYS or pays with no invoice to apply it to",
    "when_to_post": "When a payment has unapplied money left over.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "AR › Payments - NEW",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-04",
    "category": "payment",
    "sort_order": 4,
    "trigger_name": "Small short-pay / rounding difference written off",
    "when_to_post": "When the payment is applied with a small difference (policy limit, e.g., ≤ $5).",
    "fin_notes": "If the client OVERPAID by cents: Dr 121.100 / Cr 010.001.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Payments; AR › Payments - NEW",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-05",
    "category": "payment",
    "sort_order": 5,
    "trigger_name": "Refund to a client – by bank / check",
    "when_to_post": "When the refund payment is sent.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoices; FIN › Payments",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-06",
    "category": "payment",
    "sort_order": 6,
    "trigger_name": "Client payment voided / bounced",
    "when_to_post": "When Void Payment or Cancel Payment = true.",
    "fin_notes": "Never delete the original. Post this reversing entry linked to it.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-07",
    "category": "payment",
    "sort_order": 7,
    "trigger_name": "Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise)",
    "when_to_post": null,
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "AP › Payments - NEW; FIN › Payments",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-08",
    "category": "payment",
    "sort_order": 8,
    "trigger_name": "Pay a vendor with the company credit card",
    "when_to_post": "When the payment is saved with Method - AP = ''CC - Amex'' or ''CC - Visa''.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "AP › Payments - NEW; FIN › Payments",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-09",
    "category": "payment",
    "sort_order": 9,
    "trigger_name": "Pay the credit-card statement",
    "when_to_post": "When the card batch payment is sent (Payment Record Type = ''CC Batch Payment'').",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-10",
    "category": "payment",
    "sort_order": 10,
    "trigger_name": "Early-payment discount taken when paying a vendor",
    "when_to_post": "When paying within the vendor''s discount window.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Invoice Lines; FIN › Vendors",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-11",
    "category": "payment",
    "sort_order": 11,
    "trigger_name": "Bill paid using vendor credits (no cash)",
    "when_to_post": "When Method - AP = ''Paid via Credits''.",
    "fin_notes": "Net zero in the ledger, but the application record must exist so each vendor''s balance is right.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "AP › Payments - NEW; FIN › Invoices",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-12",
    "category": "payment",
    "sort_order": 12,
    "trigger_name": "Vendor payment cancelled / returned",
    "when_to_post": "When Cancel Payment = true or Return Payment (AP) = true.",
    "fin_notes": "Post as a reversing entry. Do not overwrite the original payment.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "AP › Payments - NEW",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-13",
    "category": "payment",
    "sort_order": 13,
    "trigger_name": "Vendor sends us a refund",
    "when_to_post": "When the vendor refund is received.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-14",
    "category": "payment",
    "sort_order": 14,
    "trigger_name": "Payroll – pay employees and remit taxes/deductions",
    "when_to_post": "When the payroll processor debits the bank (pay date / remittance dates).",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-15",
    "category": "payment",
    "sort_order": 15,
    "trigger_name": "Pay offshore / 1099 / owner staff (Wise, ACH)",
    "when_to_post": "When the payment is sent.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-16",
    "category": "payment",
    "sort_order": 16,
    "trigger_name": "Loan payment (principal + interest)",
    "when_to_post": "When the scheduled loan payment clears.",
    "fin_notes": "Gap today: loan bills are coded 100% to the loan account. Always split using the amortization table.",
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Debt Amortization Table; FIN › Debt Holder",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-17",
    "category": "payment",
    "sort_order": 17,
    "trigger_name": "Line of credit – borrow (draw)",
    "when_to_post": "When the draw hits the bank.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "None today (new feed / manual)",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-18",
    "category": "payment",
    "sort_order": 18,
    "trigger_name": "Line of credit – repay",
    "when_to_post": "When the repayment leaves the bank.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "None today (new feed / manual)",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-19",
    "category": "payment",
    "sort_order": 19,
    "trigger_name": "Move money between our own bank accounts",
    "when_to_post": "When the transfer is recorded (both sides in ONE entry).",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Chart of Accounts",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-20",
    "category": "payment",
    "sort_order": 20,
    "trigger_name": "Owner distribution paid",
    "when_to_post": "When the distribution is paid (approved by owners).",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Direct Journal Entries",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-21",
    "category": "payment",
    "sort_order": 21,
    "trigger_name": "Owner puts money into the company",
    "when_to_post": "When the contribution is received.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Direct Journal Entries",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-22",
    "category": "payment",
    "sort_order": 22,
    "trigger_name": "Income tax payment",
    "when_to_post": "When the tax payment is made.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "None today (new feed / manual)",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-23",
    "category": "payment",
    "sort_order": 23,
    "trigger_name": "Insurance claim payout received",
    "when_to_post": "When Claim Status = ''Paid'' and the money arrives.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "Schedules & Transactions › Claims Manager",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-24",
    "category": "payment",
    "sort_order": 24,
    "trigger_name": "Security deposit paid (lease)",
    "when_to_post": "When paid. (Refund = the reverse entry.)",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Direct Journal Entries",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-25",
    "category": "payment",
    "sort_order": 25,
    "trigger_name": "Interest / dividends received (Fidelity)",
    "when_to_post": "When it appears on the statement.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Income Statement - NEW",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-26",
    "category": "payment",
    "sort_order": 26,
    "trigger_name": "Bank reconciliation rounding difference",
    "when_to_post": "During bank reconciliation (limit e.g. ≤ $5; larger amounts go to 999.999 for investigation).",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "AP › Payments - NEW; FIN › Payments",
    "reversible": true,
    "active": true
  },
  {
    "rule_code": "PAY-27",
    "category": "payment",
    "sort_order": 27,
    "trigger_name": "Credit-card rebate earned (cash back)",
    "when_to_post": "When the card statement is closed.",
    "fin_notes": null,
    "dev_notes": null,
    "audit_trail": null,
    "airtable_sources": "FIN › Payments",
    "reversible": true,
    "active": true
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
    "label": "By Vendor (e.g., Utilities 006.002)",
    "is_optional": false
  },
  {
    "id": 2,
    "rule_code": "EXP-01",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 3,
    "rule_code": "EXP-02",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "vendor_expense",
    "label": "Expense account for the receipt (e.g., Software Licensing 008.001)",
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
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 7,
    "rule_code": "EXP-04",
    "side": "debit",
    "line_order": 1,
    "account_code": "007.011",
    "account_selector": null,
    "label": "General Insurance (007.011)",
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
    "label": "Tech Allowance",
    "is_optional": false
  },
  {
    "id": 10,
    "rule_code": "EXP-05",
    "side": "credit",
    "line_order": 1,
    "account_code": "211.100",
    "account_selector": null,
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 11,
    "rule_code": "EXP-06",
    "side": "debit",
    "line_order": 1,
    "account_code": "005.002",
    "account_selector": null,
    "label": "Salary – W2 (005.002)",
    "is_optional": false
  },
  {
    "id": 12,
    "rule_code": "EXP-06",
    "side": "debit",
    "line_order": 2,
    "account_code": "005.006",
    "account_selector": null,
    "label": "Payroll Taxes (005.006)",
    "is_optional": false
  },
  {
    "id": 13,
    "rule_code": "EXP-06",
    "side": "debit",
    "line_order": 3,
    "account_code": "005.005",
    "account_selector": null,
    "label": "401(k) Employer Contribution (005.005)",
    "is_optional": false
  },
  {
    "id": 14,
    "rule_code": "EXP-06",
    "side": "credit",
    "line_order": 1,
    "account_code": "241.100",
    "account_selector": null,
    "label": "Accrued Salaries & Wages (241.100)",
    "is_optional": false
  },
  {
    "id": 15,
    "rule_code": "EXP-06",
    "side": "credit",
    "line_order": 2,
    "account_code": "241.200",
    "account_selector": null,
    "label": "Accrued Payroll Taxes (241.200)",
    "is_optional": false
  },
  {
    "id": 16,
    "rule_code": "EXP-06",
    "side": "credit",
    "line_order": 3,
    "account_code": "241.400",
    "account_selector": null,
    "label": "Accrued 401(k) (241.400)",
    "is_optional": false
  },
  {
    "id": 17,
    "rule_code": "EXP-06",
    "side": "credit",
    "line_order": 4,
    "account_code": "241.600",
    "account_selector": null,
    "label": "Employee Benefit Deductions Payable (241.600)",
    "is_optional": false
  },
  {
    "id": 18,
    "rule_code": "EXP-07",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "staff_expense",
    "label": "Staff expense by Employment Type (005.101 Offshore / 005.003 1099 / 005.001 Owners)",
    "is_optional": false
  },
  {
    "id": 19,
    "rule_code": "EXP-07",
    "side": "credit",
    "line_order": 1,
    "account_code": "241.100",
    "account_selector": null,
    "label": "Accrued Salaries & Wages (241.100)",
    "is_optional": false
  },
  {
    "id": 20,
    "rule_code": "EXP-08",
    "side": "debit",
    "line_order": 1,
    "account_code": "005.002",
    "account_selector": null,
    "label": "Salary – W2 (005.002)",
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
    "label": "Bonus & Commission (005.201)",
    "is_optional": false
  },
  {
    "id": 23,
    "rule_code": "EXP-09",
    "side": "credit",
    "line_order": 1,
    "account_code": "241.300",
    "account_selector": null,
    "label": "Accrued Bonus & Commission (241.300)",
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
    "label": "Bank (Fifth Third or Nickel)",
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
    "label": "Federal Income Tax Expense (011.001)",
    "is_optional": false
  },
  {
    "id": 31,
    "rule_code": "EXP-13",
    "side": "debit",
    "line_order": 2,
    "account_code": "011.002",
    "account_selector": null,
    "label": "State Income Tax Expense (011.002)",
    "is_optional": false
  },
  {
    "id": 32,
    "rule_code": "EXP-13",
    "side": "credit",
    "line_order": 1,
    "account_code": "242.100",
    "account_selector": null,
    "label": "Accrued Federal Income Tax (242.100)",
    "is_optional": false
  },
  {
    "id": 33,
    "rule_code": "EXP-13",
    "side": "credit",
    "line_order": 2,
    "account_code": "242.200",
    "account_selector": null,
    "label": "Accrued State Income Tax (242.200)",
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
    "label": "Client Credits on Account (221.300)",
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
    "label": "Customer Deposits (221.100)",
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
    "label": "Customer Deposits (221.100) or AR (121.100)",
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
    "label": "AP (211.100)",
    "is_optional": false
  },
  {
    "id": 49,
    "rule_code": "PAY-08",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "credit_card",
    "label": "Credit Card Payable (AMEX or Visa)",
    "is_optional": false
  },
  {
    "id": 50,
    "rule_code": "PAY-09",
    "side": "debit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "credit_card",
    "label": "Credit Card Payable (AMEX or Visa)",
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
    "label": "Bank – Fifth Third/Nickel",
    "is_optional": false
  },
  {
    "id": 54,
    "rule_code": "PAY-10",
    "side": "credit",
    "line_order": 2,
    "account_code": "004.011",
    "account_selector": null,
    "label": "Purchase Discounts & Rebates (004.011)",
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
    "label": "Bank – Fifth Third (112.100)",
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
    "label": "Bank – Fifth Third (112.100)",
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
    "label": "Accrued Salaries & Wages (241.100)",
    "is_optional": false
  },
  {
    "id": 62,
    "rule_code": "PAY-14",
    "side": "debit",
    "line_order": 2,
    "account_code": "241.200",
    "account_selector": null,
    "label": "Accrued Payroll Taxes (241.200)",
    "is_optional": false
  },
  {
    "id": 63,
    "rule_code": "PAY-14",
    "side": "debit",
    "line_order": 3,
    "account_code": "241.400",
    "account_selector": null,
    "label": "Accrued 401(k) (241.400)",
    "is_optional": false
  },
  {
    "id": 64,
    "rule_code": "PAY-14",
    "side": "debit",
    "line_order": 4,
    "account_code": "241.600",
    "account_selector": null,
    "label": "Employee Benefit Deductions Payable (241.600)",
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
    "label": "Accrued Salaries & Wages (241.100)",
    "is_optional": false
  },
  {
    "id": 67,
    "rule_code": "PAY-15",
    "side": "debit",
    "line_order": 2,
    "account_code": "007.002",
    "account_selector": null,
    "label": "Bank, Wire & FX Fees (007.002)",
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
    "label": "Auto Loan Payable (232.100)",
    "is_optional": false
  },
  {
    "id": 70,
    "rule_code": "PAY-16",
    "side": "debit",
    "line_order": 2,
    "account_code": "007.003",
    "account_selector": null,
    "label": "Interest Expense (007.003)",
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
    "label": "Line of Credit Payable (231.200)",
    "is_optional": false
  },
  {
    "id": 75,
    "rule_code": "PAY-18",
    "side": "debit",
    "line_order": 2,
    "account_code": "007.003",
    "account_selector": null,
    "label": "Interest Expense (007.003)",
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
    "label": "Bank – Nickel (112.300) [receiving account]",
    "is_optional": false
  },
  {
    "id": 78,
    "rule_code": "PAY-19",
    "side": "credit",
    "line_order": 1,
    "account_code": null,
    "account_selector": "bank",
    "label": "Bank (Nickel/Fifth Third) [sending account]",
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
    "label": "Accrued Federal Income Tax (242.100)",
    "is_optional": false
  },
  {
    "id": 84,
    "rule_code": "PAY-22",
    "side": "debit",
    "line_order": 2,
    "account_code": "242.200",
    "account_selector": null,
    "label": "Accrued State Income Tax (242.200)",
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
    "label": "Bank – Fifth Third (112.100)",
    "is_optional": false
  },
  {
    "id": 87,
    "rule_code": "PAY-23",
    "side": "debit",
    "line_order": 2,
    "account_code": "004.004",
    "account_selector": null,
    "label": "Insurance Claim Recoveries (004.004)",
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
    "label": "Cash – Fidelity (112.200)",
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
    "label": "Received Not Invoiced (GRNI) (211.200)",
    "is_optional": false
  },
  {
    "id": 100,
    "rule_code": "INV-02",
    "side": "debit",
    "line_order": 2,
    "account_code": "004.015",
    "account_selector": null,
    "label": "Inventory / Purchase Price Variance (004.015)",
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
    "label": "Display Fixtures & Equipment (143.300)",
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
    "label": "Inventory – Pending Return Processing (131.400)",
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
    "label": "Miscellaneous Income (010.001)",
    "is_optional": false
  },
  {
    "id": 119,
    "rule_code": "INV-11",
    "side": "debit",
    "line_order": 1,
    "account_code": "004.006",
    "account_selector": null,
    "label": "Sales Returns & Allowances (004.006)",
    "is_optional": false
  },
  {
    "id": 120,
    "rule_code": "INV-11",
    "side": "debit",
    "line_order": 2,
    "account_code": "212.100",
    "account_selector": null,
    "label": "Sales Tax Payable – ship-to state (212.100)",
    "is_optional": false
  },
  {
    "id": 121,
    "rule_code": "INV-11",
    "side": "credit",
    "line_order": 1,
    "account_code": "221.300",
    "account_selector": null,
    "label": "Client Credits on Account (221.300)",
    "is_optional": false
  },
  {
    "id": 122,
    "rule_code": "INV-11",
    "side": "credit",
    "line_order": 2,
    "account_code": "004.005",
    "account_selector": null,
    "label": "Restocking & Cancellation Fees (004.005)",
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
on conflict do nothing;

select pg_catalog.setval('public.ledger_rule_lines_id_seq', coalesce((select max(id) from public.ledger_rule_lines), 1), exists(select 1 from public.ledger_rule_lines));
