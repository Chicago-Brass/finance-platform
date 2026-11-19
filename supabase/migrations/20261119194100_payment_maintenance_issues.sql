alter table public.expense_maintenance_issues
  drop constraint expense_maintenance_issues_category_check,
  add constraint expense_maintenance_issues_category_check
  check (category in ('expense', 'invoice_entry', 'payment'));
