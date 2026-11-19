-- A manual repost is a new posting identity. Existing originals and reversals stay linked.
alter table public.journal_entries add column posting_cycle uuid;
drop index public.journal_entries_source_uniq_idx;
create unique index journal_entries_source_uniq_idx
 on public.journal_entries(source_system,source_table,source_record_id,rule_code,source_entry_key,posting_cycle)
 nulls not distinct where source_record_id is not null and reverses_entry_id is null;

create function ledger_private.current_airtable_journals(p_table text,p_record text)
returns setof public.journal_entries
language sql stable security invoker set search_path='' as $$
 with originals as (
   select e.* from public.journal_entries e
   where e.source_system='airtable' and e.source_table=p_table
     and e.source_record_id=p_record and e.reverses_entry_id is null
 ), latest as (
   select distinct on (o.rule_code) o.rule_code,o.posting_cycle
   from originals o order by o.rule_code,o.entry_number desc
 )
 select o.* from originals o join latest l
   on o.rule_code is not distinct from l.rule_code and o.posting_cycle is not distinct from l.posting_cycle
$$;
revoke all on function ledger_private.current_airtable_journals(text,text) from public,anon,authenticated;
grant execute on function ledger_private.current_airtable_journals(text,text) to service_role;
-- Only a proven current replacement can clear the cancellation marker.
create function ledger_private.finish_airtable_repost(p_table text,p_record text,p_cycle uuid)
returns void language sql security definer set search_path='' as $$
 delete from ledger_private.ledger_source_cancellations c
 where c.source_table=p_table and c.source_record_id=p_record
   and exists (
     select 1 from ledger_private.current_airtable_journals(p_table,p_record) e
     where e.posting_cycle=p_cycle and e.status='posted' and c.created_at<=e.posted_at and not exists (
       select 1 from public.journal_entries r where r.reverses_entry_id=e.id and r.status='posted'
     )
   )
$$;
revoke all on function ledger_private.finish_airtable_repost(text,text,uuid) from public,anon,authenticated;
grant execute on function ledger_private.finish_airtable_repost(text,text,uuid) to service_role;

-- A released repost can be retried independently and must not stall the daily dispatcher.
do $$
declare
 definition text := pg_get_functiondef('ledger_private.dispatch_daily_ledger(timestamptz)'::regprocedure);
 marker text := 'where state->>''done''=''false'' or locked_until>p_now';
begin
 if strpos(definition,marker)=0 then raise exception 'Expected dispatcher run selection'; end if;
 execute replace(definition,marker,
  'where (state->>''done''=''false'' and not (state ? ''repostId'')) or locked_until>p_now');
end $$;
