create table public.expense_maintenance_issues (
  id text primary key,
  rule_codes text[] not null,
  title text not null,
  context text not null,
  finding text not null,
  recommendation text not null,
  examples jsonb not null check (jsonb_typeof(examples) = 'array'),
  sort_order integer not null,
  notes text not null default '' check (char_length(notes) <= 4000)
);

alter table public.expense_maintenance_issues enable row level security;
revoke all on public.expense_maintenance_issues from public, anon, authenticated;
grant select, update(notes) on public.expense_maintenance_issues to authenticated;
grant select, insert, update on public.expense_maintenance_issues to service_role;

create policy "finance users read expense issues" on public.expense_maintenance_issues
for select to authenticated using ((select public.current_app_role()) is not null);

create policy "finance users edit expense issue notes" on public.expense_maintenance_issues
for update to authenticated using ((select public.current_app_role()) is not null)
with check ((select public.current_app_role()) is not null);
