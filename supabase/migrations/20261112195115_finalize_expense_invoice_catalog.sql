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
