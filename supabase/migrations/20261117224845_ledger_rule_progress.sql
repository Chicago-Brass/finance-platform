-- Progress metadata does not change source filters, enabled switches or posting identity.
alter table public.ledger_rules
 add column source_table text,
 add column source_label text,
 add column implementation_status text not null default 'not_implemented'
   check (implementation_status in ('fully','partial','not_implemented','deferred')),
 add column chart_family text,
 add column retired_at timestamptz,
 add column progress_tracking_since timestamptz not null default now();

update public.ledger_rules r set source_table=v.table_id, source_label=v.label, implementation_status=v.status
from (values
 ('PAY-03','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('PAY-28','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('PAY-29','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-08','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-09','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-10','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('PAY-11','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-12','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-30','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-13','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-31','tbldQXuqNEp8G5pfs','Invoices','not_implemented'),
 ('PAY-16','tblR61NG9i0giid28','Payments','not_implemented'),
 ('PAY-20','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-21','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-23','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-32','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('PAY-24','tblR61NG9i0giid28','Payments','fully'),
 ('PAY-27','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-01','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('EXP-02','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-03','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('EXP-04','tbl1LgiUYt7Gc492d','Prepay Expenses Log','fully'),
 ('EXP-05','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('EXP-06','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('EXP-07','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('EXP-09','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('EXP-10','tblC0dbO5UMXzHma9','Depreciation','fully'),
 ('EXP-11','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('EXP-12','tbldQXuqNEp8G5pfs','Invoices','deferred'),
 ('EXP-13','tblV26TC0f6CKDneL','Invoice Lines','fully'),
 ('EXP-14','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-15','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('EXP-16','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-17','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-18','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-19','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-20','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-21','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-22','tblV26TC0f6CKDneL','Invoice Lines','deferred'),
 ('EXP-23','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-24','tbldQXuqNEp8G5pfs','Invoices','deferred'),
 ('EXP-25','tbldQXuqNEp8G5pfs','Invoices','deferred'),
 ('EXP-26','tblR61NG9i0giid28','Payments','fully'),
 ('EXP-27','tblR61NG9i0giid28','Payments','fully'),
 ('INV-12','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('INV-13','tblR61NG9i0giid28','Payments','fully'),
 ('INV-14','tblrnXm1HN9y6HPxY','Shipping Records','fully'),
 ('INV-15','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('INV-16','tblR61NG9i0giid28','Payments','fully'),
 ('INV-07','tbldQXuqNEp8G5pfs','Invoices','partial'),
 ('INV-17','tblR61NG9i0giid28','Payments','partial'),
 ('INV-08','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('INV-09','tbldQXuqNEp8G5pfs','Invoices','deferred'),
 ('INV-10','tbldQXuqNEp8G5pfs','Invoices','fully'),
 ('INV-18','tblR61NG9i0giid28','Payments','fully'),
 ('MAN-01','tblCoBk0WB46B662R','Direct Journal Entries','fully')
) v(code,table_id,label,status) where r.rule_code=v.code;

-- Store category outcomes separately from financial rows; retiring a catalog rule must not erase logs.
create table public.ledger_rule_attempts (
 id uuid primary key default gen_random_uuid(),
 run_id uuid not null references public.ledger_daily_runs(id) on delete cascade,
 rule_code text not null,
 source_table text not null,
 source_record_id text not null,
 outcome text not null check (outcome in ('succeeded','failed','pending')),
 error text,
 occurred_at timestamptz not null default now(),
 unique(run_id,rule_code,source_table,source_record_id),
 check (outcome='failed' or error is null)
);
alter table public.ledger_rule_attempts enable row level security;
revoke all on public.ledger_rule_attempts from public,anon,authenticated;
grant select on public.ledger_rule_attempts to authenticated;
grant select,insert,update,delete on public.ledger_rule_attempts to service_role;
create policy "app users read" on public.ledger_rule_attempts for select to authenticated
 using ((select public.current_app_role()) is not null);
create index ledger_rule_attempts_rule_activity on public.ledger_rule_attempts(rule_code,occurred_at desc);
create index journal_entries_rule_activity on public.journal_entries(rule_code,posted_at desc,entry_number desc) where status='posted';

-- Financial totals include existing journals. Attempt totals begin at progress_tracking_since.
create function public.get_ledger_rule_progress(
 p_from date default null, p_to date default null, p_query text default '', p_category text default '',
 p_implementation text default '', p_enabled text default 'all', p_rule text default null,
 p_page integer default 1, p_size integer default 50
) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_from>p_to or p_page<1 or p_page>10000 or p_size<1 or p_size>100 or length(p_query)>200
   or p_enabled not in ('all','enabled','disabled')
   or p_category not in ('','expense','payment','invoice_entry','other')
   or p_implementation not in ('','fully','partial','not_implemented','deferred') then
  raise exception 'Invalid progress filters' using errcode='22023';
 end if;
 with selected_rules as materialized (
  select r.* from public.ledger_rules r where r.retired_at is null
   and (p_rule is null or r.rule_code=p_rule)
   and (p_category='' or r.category::text=p_category)
   and (p_implementation='' or r.implementation_status=p_implementation)
   and (p_enabled='all' or r.enabled=(p_enabled='enabled'))
   and (coalesce(p_query,'')='' or strpos(lower(r.rule_code||' '||r.trigger_name||' '||coalesce(r.chart_family,'')||' '||coalesce(r.debit_label,'')||' '||coalesce(r.credit_label,'')||' '||coalesce(r.source_label,'')),lower(p_query))>0)
 ), journals as (
  select e.rule_code,count(*) filter(where e.reverses_entry_id is null) as posted_count,
   count(*) filter(where e.reverses_entry_id is not null) as reversal_count,max(e.posted_at) last_activity
  from public.journal_entries e join selected_rules r using(rule_code)
  where e.status='posted'
   and (p_from is null or e.posted_at>=p_from::timestamp at time zone 'America/Chicago')
   and (p_to is null or e.posted_at<(p_to+1)::timestamp at time zone 'America/Chicago')
  group by e.rule_code
 ), attempts as (
  select a.rule_code,count(*) filter(where a.outcome='succeeded') succeeded_count,
   count(*) filter(where a.outcome='failed') failed_count,max(a.occurred_at) last_activity
  from public.ledger_rule_attempts a join selected_rules r using(rule_code)
  where (p_from is null or a.occurred_at>=p_from::timestamp at time zone 'America/Chicago')
   and (p_to is null or a.occurred_at<(p_to+1)::timestamp at time zone 'America/Chicago')
  group by a.rule_code
 ), pending as (
  select r.rule_code,count(distinct p.id) pending_count
  from public.ledger_posting_requests p
  cross join lateral jsonb_array_elements(coalesce(p.payload->'categories','[]'::jsonb)) c
  join selected_rules r on r.rule_code=c->>'ruleCode'
  where p.kind='posting' and (p.status='pending' or p.writeback_pending)
   and (p_from is null or p.created_at>=p_from::timestamp at time zone 'America/Chicago')
   and (p_to is null or p.created_at<(p_to+1)::timestamp at time zone 'America/Chicago')
  group by r.rule_code
 ), metrics as materialized (
  select r.*,coalesce(j.posted_count,0) posted_count,coalesce(j.reversal_count,0) reversal_count,
   coalesce(a.succeeded_count,0) succeeded_count,coalesce(a.failed_count,0) failed_count,
   coalesce(p.pending_count,0) pending_count,greatest(j.last_activity,a.last_activity) last_activity
  from selected_rules r left join journals j using(rule_code) left join attempts a using(rule_code) left join pending p using(rule_code)
 ), page as (
  select * from metrics order by category,sort_order,rule_code limit p_size offset (p_page-1)*p_size
 )
 select jsonb_build_object(
  'rules',coalesce((select jsonb_agg(jsonb_build_object(
   'ruleCode',r.rule_code,'name',r.trigger_name,'category',r.category,'family',r.chart_family,
   'sourceTable',r.source_table,'sourceLabel',coalesce(r.source_label,r.airtable_sources,'Not specified'),
   'implementationStatus',r.implementation_status,'enabled',r.enabled,
   'debitLabel',r.debit_label,'creditLabel',r.credit_label,'postedCount',r.posted_count,
   'reversalCount',r.reversal_count,'succeededCount',r.succeeded_count,'failedCount',r.failed_count,
   'pendingCount',r.pending_count,'lastActivityAt',r.last_activity,'notes',r.dev_notes
  ) order by r.category,r.sort_order,r.rule_code) from page r),'[]'::jsonb),
  'total',(select count(*) from metrics),'page',p_page,'pageSize',p_size,
  'summary',(select jsonb_build_object('rules',count(*),'enabled',count(*) filter(where enabled),
    'posted',coalesce(sum(posted_count),0),'succeeded',coalesce(sum(succeeded_count),0),'failed',coalesce(sum(failed_count),0)) from metrics),
  'trackingSince',(select min(progress_tracking_since) from public.ledger_rules where retired_at is null)
 ) into result;
 return result;
end $$;
revoke all on function public.get_ledger_rule_progress(date,date,text,text,text,text,text,integer,integer) from public,anon;
grant execute on function public.get_ledger_rule_progress(date,date,text,text,text,text,text,integer,integer) to authenticated,service_role;

create function public.get_ledger_rule_journals(
 p_rule text, p_from date default null, p_to date default null, p_page integer default 1
) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare overview jsonb; result jsonb;
begin
 if p_rule is null or length(p_rule)>50 then raise exception 'Choose a rule' using errcode='22023'; end if;
 if p_page<1 or p_page>10000 then raise exception 'Invalid journal page' using errcode='22023'; end if;
 overview := public.get_ledger_rule_progress(p_from,p_to,p_rule=>p_rule,p_size=>1);
 if jsonb_array_length(overview->'rules')=0 then return null; end if;
 with entries as materialized (
  select e.* from public.journal_entries e where e.rule_code=p_rule and e.status='posted'
   and (p_from is null or e.posted_at>=p_from::timestamp at time zone 'America/Chicago')
   and (p_to is null or e.posted_at<(p_to+1)::timestamp at time zone 'America/Chicago')
 ), page as (
  select * from entries order by posted_at desc,entry_number desc limit 20 offset (p_page-1)*20
 ), recent_attempts as (
  select * from public.ledger_rule_attempts a where a.rule_code=p_rule
   and (p_from is null or a.occurred_at>=p_from::timestamp at time zone 'America/Chicago')
   and (p_to is null or a.occurred_at<(p_to+1)::timestamp at time zone 'America/Chicago')
  order by occurred_at desc,id limit 20
 )
 select jsonb_build_object(
  'rule',overview->'rules'->0,
  'journals',coalesce((select jsonb_agg(jsonb_build_object(
   'id',e.id,'entryNumber',e.entry_number,'entryDate',e.entry_date,'postedAt',e.posted_at,
   'description',e.description,'sourceTable',e.source_table,'sourceRecordId',e.source_record_id,
   'auditLink',e.audit_link,'isReversal',e.reverses_entry_id is not null,
   'lines',coalesce((select jsonb_agg(jsonb_build_object(
    'lineNumber',l.line_no,'accountCode',l.account_code,'accountName',a.name,
    'debit',l.debit::text,'credit',l.credit::text,'branch',l.branch,'auditLink',l.audit_link
   ) order by l.line_no) from public.journal_lines l join public.accounts a on a.code=l.account_code where l.entry_id=e.id),'[]'::jsonb)
  ) order by e.posted_at desc,e.entry_number desc) from page e),'[]'::jsonb),
  'total',(select count(*) from entries),'page',p_page,'pageSize',20,
  'attempts',coalesce((select jsonb_agg(jsonb_build_object(
   'id',a.id,'sourceTable',a.source_table,'sourceRecordId',a.source_record_id,
   'outcome',a.outcome,'occurredAt',a.occurred_at,'error',a.error,
   'auditLink','https://airtable.com/app0Q1UMEdUeWl538/'||a.source_table||'/'||a.source_record_id
  ) order by a.occurred_at desc,a.id) from recent_attempts a),'[]'::jsonb),
  'attemptsLimit',20,'trackingSince',overview->'trackingSince'
 ) into result;
 return result;
end $$;
revoke all on function public.get_ledger_rule_journals(text,date,date,integer) from public,anon;
grant execute on function public.get_ledger_rule_journals(text,date,date,integer) to authenticated,service_role;

-- Journal-only months must remain visible even when no explicit period has been opened yet.
create or replace view public.v_period_overview with (security_invoker=true) as
with months as (
 select period_month from public.accounting_periods
 union select date_trunc('month',accounting_date)::date from public.ledger_posting_requests
 union select period_month from public.journal_entries where status='posted'
)
select m.period_month,coalesce(p.status,'not_open') as status,p.closed_at,p.closed_by,p.notes,
 (select count(*) from public.journal_entries e where e.period_month=m.period_month and e.status='posted') as posted_count,
 (select count(*) from public.ledger_posting_requests r where r.accounting_date>=m.period_month
   and r.accounting_date<m.period_month+interval '1 month' and r.status='pending') as pending_count,
 (select count(*) from public.journal_entries e where e.period_month=m.period_month and e.status='posted' and e.posted_at>p.closed_at) as adjustments_after_close
from months m left join public.accounting_periods p using(period_month);
