insert into public.accounts
  (code, name, account_type, subtype, normal_balance, is_bank, is_postable, active, airtable_record_id)
values
  ('212.100', 'Illinois Sales Tax Payable', 'liability', 'tax_payable', 'credit', false, true, true, 'recVymQinZ4N4KP5A'),
  ('212.200', 'Wisconsin Sales Tax Payable', 'liability', 'tax_payable', 'credit', false, true, true, 'recFMWoLGDkoQAhHc'),
  ('212.300', 'Minnesota Sales Tax Payable', 'liability', 'tax_payable', 'credit', false, true, true, 'rec5dJb89mz0UYLrh')
on conflict (code) do update set
  name=excluded.name,
  airtable_record_id=excluded.airtable_record_id;

update public.ledger_rules
set debit_label=E'Linked State Sales Tax Payable\nIllinois (212.100), Wisconsin (212.200), Minnesota (212.300)',
    dev_notes=replace(replace(replace(split_part(dev_notes,E'\n\n[Issues]',1),
      'Invoices.Vendor Type (AP) = "AP - Expenses (Sales Tax)"',
      E'Invoices.Vendor Type (AP) = "AP - Expenses (Sales Tax)"\nInvoices.Linked Chart of Accounts links exactly one of 212.100, 212.200 or 212.300'),
      'Sales Tax Expense (GL pending)', 'Invoices.Linked Chart of Accounts (State Sales Tax Payable)'),
      'Sales Tax Expense -> Supabase GL pending',
      E'212.100: Illinois Sales Tax Payable -> Supabase 212.100\n212.200: Wisconsin Sales Tax Payable -> Supabase 212.200\n212.300: Minnesota Sales Tax Payable -> Supabase 212.300'),
    enabled=true, implementation_status='fully'
where rule_code='EXP-33' and retired_at is null;

update public.ledger_rules
set dev_notes=replace(dev_notes,
      'Invoices.Vendor Type (AP) = "AP - Expenses (Sales Tax)"',
      E'Invoices.Vendor Type (AP) = "AP - Expenses (Sales Tax)"\nInvoices.Linked Chart of Accounts links exactly one of 212.100, 212.200 or 212.300'),
    enabled=true, implementation_status='fully'
where rule_code='EXP-34' and retired_at is null;
