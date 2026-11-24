-- Order by the code shown on Progress before slicing the result into pages.
create or replace function public.get_ledger_rule_progress(
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
   and (coalesce(p_query,'')='' or strpos(lower(coalesce(r.display_code,r.rule_code)||' '||r.trigger_name||' '||coalesce(r.chart_family,'')||' '||coalesce(r.debit_label,'')||' '||coalesce(r.credit_label,'')||' '||coalesce(r.source_label,'')),lower(p_query))>0)
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
  select * from metrics order by coalesce(display_code,rule_code) collate "C",rule_code limit p_size offset (p_page-1)*p_size
 )
 select jsonb_build_object(
  'rules',coalesce((select jsonb_agg(jsonb_build_object(
   'ruleCode',r.rule_code,'displayCode',coalesce(r.display_code,r.rule_code),'name',r.trigger_name,'category',r.category,'family',r.chart_family,
   'sourceTable',r.source_table,'sourceLabel',coalesce(r.source_label,r.airtable_sources,'Not specified'),
   'implementationStatus',r.implementation_status,'enabled',r.enabled,
   'debitLabel',r.debit_label,'creditLabel',r.credit_label,'postedCount',r.posted_count,
   'reversalCount',r.reversal_count,'succeededCount',r.succeeded_count,'failedCount',r.failed_count,
   'pendingCount',r.pending_count,'lastActivityAt',r.last_activity,'notes',r.dev_notes
  ) order by coalesce(r.display_code,r.rule_code) collate "C",r.rule_code) from page r),'[]'::jsonb),
  'total',(select count(*) from metrics),'page',p_page,'pageSize',p_size,
  'summary',(select jsonb_build_object('rules',count(*),'enabled',count(*) filter(where enabled),
    'posted',coalesce(sum(posted_count),0),'succeeded',coalesce(sum(succeeded_count),0),'failed',coalesce(sum(failed_count),0)) from metrics),
  'trackingSince',(select min(progress_tracking_since) from public.ledger_rules where retired_at is null)
 ) into result;
 return result;
end $$;
