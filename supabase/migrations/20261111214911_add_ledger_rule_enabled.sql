-- Operational switch for new postings; active remains a descriptive catalog label.
alter table public.ledger_rules add column enabled boolean not null default true;
comment on column public.ledger_rules.enabled is
  'Allows new journals for this category. Disabling does not block exact replays or reversals.';
