-- Period decisions are Edge services; database guards enforce their financial boundaries.
alter table public.app_users add column can_manage_periods boolean not null default false;
alter table public.journal_entries add column source_date date;

create table public.ledger_posting_requests (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('posting','reversal')),
 source_table text not null, source_record_id text not null, event_type text not null,
 accounting_date date not null, fingerprint text not null, payload jsonb not null check (jsonb_typeof(payload)='object'),
 status text not null default 'pending' check (status in ('pending','approved','posted','rejected','superseded')),
 target_journal_ids uuid[] not null default '{}', journal_ids uuid[] not null default '{}',
 reviewed_by text, reviewed_at timestamptz, review_reason text, approval_txid bigint,
 allow_additional_categories boolean not null default false,
 last_error text, writeback_pending boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(kind,source_table,source_record_id,event_type,fingerprint)
);
create index ledger_review_period_status on public.ledger_posting_requests(accounting_date,status,created_at);
create index ledger_review_source on public.ledger_posting_requests(kind,source_table,source_record_id,event_type,created_at desc);
alter table public.journal_entries add column posting_request_id uuid references public.ledger_posting_requests(id);
create unique index journal_review_component on public.journal_entries(posting_request_id,rule_code,source_entry_key)
 where posting_request_id is not null and reverses_entry_id is null;
create unique index journal_review_reversal on public.journal_entries(posting_request_id,reverses_entry_id)
 where posting_request_id is not null and reverses_entry_id is not null;

create table public.ledger_period_history (
 id uuid primary key default gen_random_uuid(), period_month date not null,
 action text not null, actor text, reason text, request_id uuid references public.ledger_posting_requests(id),
 details jsonb not null default '{}' check (jsonb_typeof(details)='object'), created_at timestamptz not null default now()
);
create index ledger_period_history_month on public.ledger_period_history(period_month,created_at desc);
alter table public.ledger_posting_requests enable row level security;
alter table public.ledger_period_history enable row level security;
create policy "app users read" on public.ledger_posting_requests for select to authenticated using ((select public.current_app_role()) is not null);
create policy "app users read" on public.ledger_period_history for select to authenticated using ((select public.current_app_role()) is not null);
grant select on public.ledger_posting_requests,public.ledger_period_history to authenticated;
grant all on public.ledger_posting_requests,public.ledger_period_history to service_role;
-- Browser users cannot bypass the audited period service, including users with the finance role.
drop policy "finance insert" on public.accounting_periods;
drop policy "finance update" on public.accounting_periods;
revoke insert,update on public.accounting_periods from authenticated;

-- Preserve already recorded months and make the current month explicit; never reopen an existing closed month.
insert into public.accounting_periods(period_month,status)
 select distinct period_month,'open' from public.journal_entries
 union select date_trunc('month',now() at time zone 'America/Chicago')::date,'open'
 on conflict (period_month) do nothing;

CREATE OR REPLACE FUNCTION "public"."tg_journal_entries_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare v_dr numeric; v_cr numeric; v_n int; v_orig_status public.entry_status;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'Journal entries must be created as draft and then posted (use public.create_journal_entry).';
    end if;
    new.posted_at := null; new.posted_by := null;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status = 'posted' then
      raise exception 'Posted journal entry #% cannot be deleted. Post a reversing entry instead.', old.entry_number;
    end if;
    return old;
  end if;

  -- UPDATE
  if old.status = 'posted' then
    raise exception 'Posted journal entry #% is immutable. Post a reversing entry instead.', old.entry_number;
  end if;

  if new.status = 'posted' then
    select coalesce(sum(l.debit),0), coalesce(sum(l.credit),0), count(*)
      into v_dr, v_cr, v_n
      from public.journal_lines l where l.entry_id = new.id;
    if v_n < 2 then
      raise exception 'Journal entry #% needs at least 2 lines to post', new.entry_number;
    end if;
    if v_dr <> v_cr then
      raise exception 'Journal entry #% is out of balance: debits % <> credits %', new.entry_number, v_dr, v_cr;
    end if;
    perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('ledger period:' || to_char(new.entry_date, 'YYYY-MM'), 0));
    if new.posting_request_id is not null then
      if not exists (select 1 from public.ledger_posting_requests r
        where r.id=new.posting_request_id and r.status='approved' and r.approval_txid=txid_current()
          and r.source_table=new.source_table and r.source_record_id=new.source_record_id
          and r.accounting_date=new.entry_date
          and ((r.kind='posting' and new.reverses_entry_id is null and r.event_type=new.source_event_type
            and exists (select 1 from jsonb_array_elements(r.payload->'categories') c
              where c->>'ruleCode'=new.rule_code and coalesce(c->>'entryKey','')=new.source_entry_key))
            or (r.kind='reversal' and new.reverses_entry_id=any(r.target_journal_ids)))) then
        raise exception 'Journal requires a matching approval in this transaction';
      end if;
    elsif not exists (select 1 from public.accounting_periods p
      where p.period_month=date_trunc('month',new.entry_date::timestamp)::date and p.status='open') then
      raise exception 'Period % is not open; submit the entry for review', to_char(new.entry_date,'YYYY-MM');
    end if;
    if new.reverses_entry_id is not null then
      select e.status into v_orig_status from public.journal_entries e where e.id = new.reverses_entry_id;
      if v_orig_status is distinct from 'posted' then
        raise exception 'Only posted entries can be reversed';
      end if;
    end if;
    new.posted_at := now();
    new.posted_by := coalesce(auth.jwt() ->> 'email', current_user);
  end if;
  return new;
end $$;


create function public.tg_ledger_history_immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Period history is append-only'; end $$;
create trigger ledger_history_immutable before update or delete on public.ledger_period_history
 for each row execute function public.tg_ledger_history_immutable();
revoke all on function public.tg_ledger_history_immutable() from public;

create view public.v_period_overview with (security_invoker=true) as
with months as (
 select period_month from public.accounting_periods
 union select date_trunc('month',accounting_date)::date from public.ledger_posting_requests
)
select m.period_month,coalesce(p.status,'not_open') as status,p.closed_at,p.closed_by,p.notes,
 (select count(*) from public.journal_entries e where e.period_month=m.period_month and e.status='posted') as posted_count,
 (select count(*) from public.ledger_posting_requests r where r.accounting_date>=m.period_month
   and r.accounting_date<m.period_month+interval '1 month' and r.status='pending') as pending_count,
 (select count(*) from public.journal_entries e where e.period_month=m.period_month and e.status='posted' and e.posted_at>p.closed_at) as adjustments_after_close
from months m left join public.accounting_periods p using(period_month);
grant select on public.v_period_overview to authenticated,service_role;
