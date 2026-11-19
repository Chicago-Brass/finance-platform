alter table public.expense_maintenance_issues
  add column category text not null default 'expense'
  check (category in ('expense', 'invoice_entry'));
