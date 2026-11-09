-- Checkpoints only. All category calculations and journal writes remain in Edge code.
create table public.ledger_daily_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  lease_token uuid,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ledger_daily_runs enable row level security;
revoke all on public.ledger_daily_runs from public, anon, authenticated;
grant select, insert, update on public.ledger_daily_runs to service_role;
comment on table public.ledger_daily_runs is 'Private resumable ledger-sync checkpoints. No schedule is enabled by this migration.';
