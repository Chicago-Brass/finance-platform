-- Keep full journal lines and existing access controls; show 25 journal entries per page.
create or replace function public.get_ledger_rule_journals(
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
  select * from entries order by posted_at desc,entry_number desc limit 25 offset (p_page-1)*25
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
  'total',(select count(*) from entries),'page',p_page,'pageSize',25,
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

