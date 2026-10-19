-- App user allowlist and roles.
-- Signing in (Microsoft SSO or email link) is not enough: the user must be listed here and active.

create table if not exists public.app_users (
  email       text primary key check (email = lower(email)),
  full_name   text,
  role        text not null check (role in ('viewer', 'finance', 'admin')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.app_users is 'Allowlist of people who may use the finance app, with their role.';

alter table public.app_users enable row level security;

-- No anonymous access at all.
revoke all on table public.app_users from anon;
revoke all on table public.app_users from authenticated;
grant select on table public.app_users to authenticated;

-- A signed-in user can see only their own row. Changes are made by admins via migrations/SQL.
drop policy if exists "users read own row" on public.app_users;
create policy "users read own row"
  on public.app_users
  for select
  to authenticated
  using (email = lower((select auth.jwt() ->> 'email')));

-- Returns the caller's role, or null if they are not on the allowlist / inactive.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.role
  from public.app_users u
  where u.email = lower((select auth.jwt() ->> 'email'))
    and u.active
$$;

revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;

insert into public.app_users (email, full_name, role)
values
  ('ramses.fernandez@chicagobrass.com', 'Ram Fernandez', 'admin'),
  ('jeric.narte@chicagobrass.com', 'Jerrick Narte', 'admin'),
  ('mae.porras@chicagobrass.com', 'Mae Porras', 'finance'),
  ('kurt@chicagobrass.com', 'Kurt', 'viewer'),
  ('pete@chicagobrass.com', 'Pete', 'viewer')
on conflict (email) do nothing;
