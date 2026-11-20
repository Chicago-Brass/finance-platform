alter table public.expense_maintenance_issues add column reviewed boolean not null default false;

update public.expense_maintenance_issues set reviewed = true where resolved;

alter table public.expense_maintenance_issues
  add constraint expense_maintenance_issues_resolution_requires_review check (reviewed or not resolved);

grant update (reviewed) on public.expense_maintenance_issues to authenticated;
