-- Expense catalog metadata only. The Edge worker supplies all final financial pairs.
-- Bootstrap existing canonical accounts needed before seed.sql runs.
insert into public.accounts (code, name, account_type, subtype, normal_balance, is_bank, is_postable, active)
values
  ('211.100', 'Accounts Payable', 'liability', 'payable', 'credit', false, true, true),
  ('231.100', 'Credit Card Payable', 'liability', 'credit_card', 'credit', false, true, true),
  ('135.000', 'Prepaid Expenses', 'asset', 'prepaid', 'debit', false, true, true),
  ('005.101', 'Staff - Offshore', 'expense', 'payroll', 'debit', false, true, true),
  ('005.201', 'Bonus & Commission', 'expense', 'payroll', 'debit', false, true, true),
  ('009.101', 'Depreciation Expense', 'expense', 'depreciation', 'debit', false, true, true),
  ('161.000', 'Accumulated Depreciation', 'asset', 'contra_asset', 'credit', false, true, true),
  ('007.002', 'Bank, Wire & FX Fees', 'expense', 'opex', 'debit', false, true, true),
  ('004.010', 'Cost of Goods Sold', 'expense', 'cogs', 'debit', false, true, true),
  ('241.300', 'Accrued Bonus & Commission', 'liability', 'accrued_payroll', 'credit', false, true, true),
  ('005.001', 'Staff - Owners', 'expense', 'payroll', 'debit', false, true, true),
  ('005.002', 'Salary - W2', 'expense', 'payroll', 'debit', false, true, true),
  ('005.003', 'Staff - 1099', 'expense', 'payroll', 'debit', false, true, true),
  ('005.005', '401(k) Employer Contribution', 'expense', 'payroll', 'debit', false, true, true),
  ('005.006', 'Payroll Taxes', 'expense', 'payroll', 'debit', false, true, true),
  ('011.001', 'Federal Income Tax Expense', 'expense', 'income_tax', 'debit', false, true, true),
  ('011.002', 'State Income Tax Expense', 'expense', 'income_tax', 'debit', false, true, true),
  ('112.100', 'Bank - Fifth Third', 'asset', 'bank', 'debit', true, true, true),
  ('112.200', 'Cash - Fidelity', 'asset', 'bank', 'debit', true, true, true),
  ('112.300', 'Bank - Nickel', 'asset', 'bank', 'debit', true, true, true),
  ('006.002', 'Utilities', 'expense', 'opex', 'debit', false, true, true),
  ('007.011', 'General Insurance', 'expense', 'opex', 'debit', false, true, true),
  ('008.001', 'Software Licensing', 'expense', 'opex', 'debit', false, true, true)
on conflict (code) do nothing;

insert into public.account_selectors (selector, description)
values
  ('vendor_expense', 'Single expense account linked on the FIN invoice.'),
  ('w2_payroll_expense', 'Invoice-line expense account: Owners, W2, 1099, 401k or Payroll Taxes.'),
  ('income_tax_expense', 'Invoice-line federal or state income-tax expense account.'),
  ('expense_payment_account', 'Account selected in Payments.Account to Pay/Receive; Nickel 0747 maps to 112.300.')
on conflict (selector) do nothing;

insert into public.account_selector_members (selector, account_code)
values
  ('vendor_expense', '006.002'),
  ('vendor_expense', '007.002'),
  ('vendor_expense', '007.011'),
  ('vendor_expense', '008.001'),
  ('vendor_expense', '009.002'),
  ('vendor_expense', '009.006'),
  ('w2_payroll_expense', '005.001'),
  ('w2_payroll_expense', '005.002'),
  ('w2_payroll_expense', '005.003'),
  ('w2_payroll_expense', '005.005'),
  ('w2_payroll_expense', '005.006'),
  ('income_tax_expense', '011.001'),
  ('income_tax_expense', '011.002'),
  ('expense_payment_account', '112.100'),
  ('expense_payment_account', '112.200'),
  ('expense_payment_account', '112.300'),
  ('expense_payment_account', '231.100')
on conflict do nothing;

insert into public.ledger_rules
  (rule_code, category, sort_order, trigger_name, when_to_post, dev_notes, airtable_sources, reversible, active)
select rule_code, 'expense'::public.rule_category, sort_order, trigger_name,
  'Every day at 11:00 PM America/Chicago or Dashboard Sync Button.', dev_notes, airtable_sources, true, active
from (values
  ('EXP-01', 2, 'Enter an operating expense invoice (ex: Utilities)', E'[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"\nInvoices.Linked Chart of Accounts includes "006.002: Utilities"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 211.100', 'FIN: Invoices', true),
  ('EXP-02', 6, 'Company credit-card purchase with NO vendor bill', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"\nInvoices.Linked Chart of Accounts is not empty\nPayments.Account to Pay/Receive includes "231.100: Credit Card Clearing"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 231.100', 'FIN: Payments', true),
  ('EXP-03', 7, 'Prepaid expense bill (pay a year up front, e.g., insurance) - Invoice, not paid', E'[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Assets"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 135.000\nCredit = 211.100', 'FIN: Invoices', true),
  ('EXP-04', 9, 'Prepaid expense - monthly use-up (amortization)', E'[Record]\nPrepay Expenses Log\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPrepay Expenses Log.Cancel Pre-pay Log = false\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Assets"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Prepay Expenses Log.Amount Deducted\nDate = Prepay Expenses Log.Applied Date\nBranch = Invoices.Branch\nDebit = Invoices.Linked Chart of Accounts\nCredit = 135.000', 'FIN: Prepay Expenses Log', true),
  ('EXP-05', 10, 'Employee Tech Allowance - Not Paid', E'[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Staff"\nInvoice Lines.Chart of Accounts includes "005.102: Tech Allowance"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch Employee\nDebit = 005.102\nCredit = 211.100', 'FIN: Invoice Lines', true),
  ('EXP-06', 12, 'Payroll - W2 payroll register (per pay date), Owner', E'[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Staff"\nInvoice Lines.Chart of Accounts includes any of "005.001: Salary - Owners", "005.002: Salary - W2", "005.003: Salary - 1099", "005.005: 401K", "005.006: Payroll Taxes"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100', 'FIN: Invoice Lines', true),
  ('EXP-07', 14, 'Payroll - offshore - unpaid', E'[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Staff"\nInvoice Lines.Chart of Accounts includes "005.101: Salary - Offshore"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.101\nCredit = 211.100', 'FIN: Invoice Lines', true),
  ('EXP-08', 16, '(DO NOTE IMPLEMENT) Month-end accrual - PTO liability
', E'[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n\n[Filters]', 'FIN: Deferred', false),
  ('EXP-09', 17, 'Payrol - Bonuses (Unpaid)', E'[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Staff"\nInvoice Lines.Chart of Accounts includes "005.201: Bonus"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.201\nCredit = 211.100', 'FIN: Invoice Lines', true),
  ('EXP-10', 21, 'Monthly depreciation of equipment, vehicles, fixtures', E'[Record]\nDepreciation Table\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\n\n[Field Mapping]\nAmount = Depreciation Table.Amount Depreciated\nDate = Depreciation Table.Date\nBranch = Blank\nDebit = 009.101\nCredit = 161.000', 'FIN: Depreciation Table', true),
  ('EXP-11', 22, 'Bank fees and charges shown only on the bank statement (Unpaid)', E'[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"\nInvoices.Linked Chart of Accounts includes "007.002: Bank / Misc. Service Charges"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.002\nCredit = 211.100', 'FIN: Invoices', true),
  ('EXP-12', 24, 'Bad-debt reserve (allowance) - month-end
', E'[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nAirtable Record Sync Button\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"\nInvoices.Linked Chart of Accounts includes "007.005: Bad Debt"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 007.005\nCredit = 121.900', 'FIN: Deferred', false),
  ('EXP-13', 27, 'Income tax accrual (quarterly)', E'[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"\nInvoice Lines.Chart of Accounts includes any of "011.001: Federal Income Tax Expense", "011.002: State Income Tax Expense"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Invoice Lines.Chart of Accounts\nCredit = 211.100', 'FIN: Invoice Lines', true),
  ('EXP-14', 3, 'When operating expenses are paid', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"\nInvoices.Linked Chart of Accounts includes "006.002: Utilities"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive', 'FIN: Payments', true),
  ('EXP-15', 4, 'Everytime a product invoice is created', E'[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Product"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 004.010\nCredit = 211.100', 'FIN: Invoices', true),
  ('EXP-16', 5, 'Everytime a product invoice is paid', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Product"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive', 'FIN: Payments', true),
  ('EXP-17', 8, 'Prepaid Expense BILL (actually paid)', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Assets"\nInvoices.Invoice Status (AP) = "Fully Paid"\nInvoices.Mark as Prepaid Asset? = true\nInvoices.Linked Chart of Accounts is not empty\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive', 'FIN: Payments', true),
  ('EXP-18', 11, 'Employee Tech Allowance - Paid', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Staff"\nInvoices.Invoice Status (AP) = "Fully Paid"\nInvoice Lines.Chart of Accounts includes "005.102: Tech Allowance"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch Employee\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive', 'FIN: Payments', true),
  ('EXP-19', 13, 'Payroll - W2 payroll register (Paid)', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Staff"\nInvoices.Invoice Status (AP) = "Fully Paid"\nInvoice Lines.Chart of Accounts includes any of "005.001: Salary - Owners", "005.002: Salary - W2", "005.003: Salary - 1099", "005.005: 401K", "005.006: Payroll Taxes"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive', 'FIN: Payments', true),
  ('EXP-20', 15, 'Payroll - offshore - paid', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Staff"\nInvoices.Invoice Status (AP) = "Fully Paid"\nInvoice Lines.Chart of Accounts includes "005.101: Salary - Offshore"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive', 'FIN: Payments', true),
  ('EXP-21', 18, 'Payrol - Bonuses (paid)', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Staff"\nInvoices.Invoice Status (AP) = "Fully Paid"\nInvoice Lines.Chart of Accounts includes "005.201: Bonus"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive', 'FIN: Payments', true),
  ('EXP-22', 19, 'Payroll - offshore - Month-end accrual Bonus (Unpaid)', E'[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n\n[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Staff"\nInvoice Lines.Chart of Accounts includes "005.103: 13th Month"\nInvoice Lines.Line Amount Is Not Empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per account\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 005.103: 13th Month\nCredit = 241.300', 'FIN: Invoice Lines', false),
  ('EXP-23', 20, 'Payroll - offshore - Month-end accrual Bonus (Paid)', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Staff"\nInvoices.Invoice Status (AP) = "Fully Paid"\nInvoice Lines.Chart of Accounts includes "005.103: 13th Month"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 241.300\nCredit = Payments.Account to Pay/Receive', 'FIN: Payments', true),
  ('EXP-24', 25, 'Bad-Debt Journal Entry', E'', 'FIN: Deferred', false),
  ('EXP-25', 26, 'Bad-Debt Reversal Entry', E'', 'FIN: Deferred', false),
  ('EXP-26', 28, 'Income tax accrual (Paid)', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"\nInvoices.Invoice Status (AP) = "Fully Paid"\nInvoice Lines.Chart of Accounts includes any of "011.001: Federal Income Tax Expense", "011.002: State Income Tax Expense"\nInvoice Lines.Line Amount is not empty\n\n[Field Mapping]\nAmount = Sum of matching Invoice Lines.Line Amount per invoice and account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive', 'FIN: Payments', true),
  ('EXP-27', 23, 'Bank fees and charges shown only on the bank statement (Paid)', E'[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"\nInvoices.Linked Chart of Accounts includes "007.002: Bank / Misc. Service Charges"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive', 'FIN: Payments', true)
) as rules(rule_code, sort_order, trigger_name, dev_notes, airtable_sources, active)
on conflict (rule_code) do update set
  category=excluded.category, sort_order=excluded.sort_order, trigger_name=excluded.trigger_name,
  when_to_post=excluded.when_to_post, dev_notes=excluded.dev_notes, airtable_sources=excluded.airtable_sources,
  reversible=excluded.reversible, active=excluded.active, updated_at=now();

update public.ledger_rules set fin_notes='Use the single expense account linked on the invoice.' where rule_code='EXP-01';
update public.ledger_rules set fin_notes='Record the bill in Prepaid Expenses 135.000; recognize its use through Prepay Expenses Log.' where rule_code='EXP-03';

-- Retire obsolete extra payroll/tax legs; deferred categories retain their rules, not guessed account mappings.
delete from public.ledger_rule_lines
where rule_code like 'EXP-%' and (line_order<>1 or rule_code in ('EXP-08','EXP-12','EXP-22','EXP-24','EXP-25'));

-- The legacy seed owns explicit IDs through 141. Reserve them before adding metadata lines.
select setval(pg_get_serial_sequence('public.ledger_rule_lines','id'), greatest(
  (select coalesce(max(id),0) from public.ledger_rule_lines),
  (select last_value from public.ledger_rule_lines_id_seq), 141), true);

insert into public.ledger_rule_lines (rule_code, side, line_order, account_code, account_selector, label, is_optional)
select rule_code, side::public.balance_side, 1, account_code, account_selector, label, false
from (values
  ('EXP-01', 'debit', null, 'vendor_expense', 'Invoice Expense Account Linked'),
  ('EXP-01', 'credit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-02', 'debit', null, 'vendor_expense', 'Invoice Expense Account Linked'),
  ('EXP-02', 'credit', '231.100', null, 'Credit Card Payable (231.100)'),
  ('EXP-03', 'debit', '135.000', null, 'Prepaid Expenses (135.000)'),
  ('EXP-03', 'credit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-04', 'debit', null, 'vendor_expense', 'Invoice Expense Account Linked'),
  ('EXP-04', 'credit', '135.000', null, 'Prepaid Expenses (135.000)'),
  ('EXP-05', 'debit', '005.102', null, 'Tech Allowance (005.102)'),
  ('EXP-05', 'credit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-06', 'debit', null, 'w2_payroll_expense', 'Invoice-Line Payroll Account Linked'),
  ('EXP-06', 'credit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-07', 'debit', '005.101', null, 'Staff - Offshore (005.101)'),
  ('EXP-07', 'credit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-09', 'debit', '005.201', null, 'Bonus & Commission (005.201)'),
  ('EXP-09', 'credit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-10', 'debit', '009.101', null, 'Depreciation Expense (009.101)'),
  ('EXP-10', 'credit', '161.000', null, 'Accumulated Depreciation (161.000)'),
  ('EXP-11', 'debit', '007.002', null, 'Bank, Wire & FX Fees (007.002)'),
  ('EXP-11', 'credit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-13', 'debit', null, 'income_tax_expense', 'Invoice-Line Tax Expense Account Linked'),
  ('EXP-13', 'credit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-14', 'debit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-14', 'credit', null, 'expense_payment_account', 'Payment Account Linked'),
  ('EXP-15', 'debit', '004.010', null, 'Cost of Goods Sold (004.010)'),
  ('EXP-15', 'credit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-16', 'debit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-16', 'credit', null, 'expense_payment_account', 'Payment Account Linked'),
  ('EXP-17', 'debit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-17', 'credit', null, 'expense_payment_account', 'Payment Account Linked'),
  ('EXP-18', 'debit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-18', 'credit', null, 'expense_payment_account', 'Payment Account Linked'),
  ('EXP-19', 'debit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-19', 'credit', null, 'expense_payment_account', 'Payment Account Linked'),
  ('EXP-20', 'debit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-20', 'credit', null, 'expense_payment_account', 'Payment Account Linked'),
  ('EXP-21', 'debit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-21', 'credit', null, 'expense_payment_account', 'Payment Account Linked'),
  ('EXP-23', 'debit', '241.300', null, 'Accrued Bonus & Commission (241.300)'),
  ('EXP-23', 'credit', null, 'expense_payment_account', 'Payment Account Linked'),
  ('EXP-26', 'debit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-26', 'credit', null, 'expense_payment_account', 'Payment Account Linked'),
  ('EXP-27', 'debit', '211.100', null, 'Accounts Payable (211.100)'),
  ('EXP-27', 'credit', null, 'expense_payment_account', 'Payment Account Linked')
) as lines(rule_code, side, account_code, account_selector, label)
on conflict (rule_code,side,line_order) do update set
  account_code=excluded.account_code, account_selector=excluded.account_selector,
  label=excluded.label, is_optional=excluded.is_optional;
