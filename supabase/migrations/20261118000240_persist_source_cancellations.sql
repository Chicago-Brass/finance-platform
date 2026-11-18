-- Source-level cancellation survives an empty reversal and blocks stale/new category postings.
create table ledger_private.ledger_source_cancellations (
  source_table text not null,
  source_record_id text not null,
  reversal_date date not null,
  created_at timestamptz not null default now(),
  primary key (source_table, source_record_id)
);
alter table ledger_private.ledger_source_cancellations enable row level security;
revoke all on table ledger_private.ledger_source_cancellations from public, anon, authenticated, service_role;
grant usage on schema ledger_private to service_role;
grant select, insert on table ledger_private.ledger_source_cancellations to service_role;

insert into ledger_private.ledger_source_cancellations(source_table,source_record_id,reversal_date)
select source_table,source_record_id,min(reversal_date) from (
  select original.source_table,original.source_record_id,reversal.entry_date as reversal_date
  from public.journal_entries reversal
  join public.journal_entries original on original.id=reversal.reverses_entry_id
  where reversal.status='posted' and original.source_system='airtable'
    and original.source_table is not null and original.source_record_id is not null
  union all
  select source_table,source_record_id,accounting_date
  from public.ledger_posting_requests
  where kind='reversal' and status in ('pending','approved','posted')
) cancelled group by source_table,source_record_id;

with cancelled as (
  update public.ledger_posting_requests p
  set status='rejected',review_reason='Source cancelled in Airtable',reviewed_at=now(),updated_at=now()
  where p.kind='posting' and p.status='pending' and exists (
    select 1 from ledger_private.ledger_source_cancellations c
    where c.source_table=p.source_table and c.source_record_id=p.source_record_id
  ) returning p.id,p.accounting_date
)
insert into public.ledger_period_history(period_month,action,actor,reason,request_id)
select date_trunc('month',accounting_date)::date,'request_rejected','airtable','Source cancelled in Airtable',id from cancelled;
