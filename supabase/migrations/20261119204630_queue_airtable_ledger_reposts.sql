-- Manual requests run after the next 11 PM Chicago daily sync. The existing cron owns dispatch.
create table ledger_private.airtable_repost_requests (
  id uuid primary key default gen_random_uuid(),
  source_table text not null check (source_table in ('tbldQXuqNEp8G5pfs','tblzYDob4qF6Kha8u')),
  source_record_id text not null check (source_record_id ~ '^rec[A-Za-z0-9]{14}$'),
  rule_code text not null,
  original_ids uuid[] not null check (cardinality(original_ids) > 0),
  repost_on date not null,
  created_at timestamptz not null default now(),
  dispatched_at timestamptz,
  finished_at timestamptz,
  outcome text check (outcome in ('posted','needs_review','failed','superseded'))
);
create unique index airtable_repost_one_open_rule on ledger_private.airtable_repost_requests
  (source_table,source_record_id,rule_code) where finished_at is null;
revoke all on ledger_private.airtable_repost_requests from public, anon, authenticated;
grant select, insert, update on ledger_private.airtable_repost_requests to service_role;

create function ledger_private.enqueue_airtable_reposts(p_table text,p_record text)
returns table(id uuid, rule_code text, repost_on date)
language sql security invoker set search_path='' as $$
  insert into ledger_private.airtable_repost_requests as q
    (source_table,source_record_id,rule_code,original_ids,repost_on)
  select p_table,p_record,e.rule_code,array_agg(e.id order by e.id),
    (now() at time zone 'America/Chicago')::date +
      case when (now() at time zone 'America/Chicago')::time >= time '23:00' then 1 else 0 end
  from ledger_private.current_airtable_journals(p_table,p_record) e
  join public.ledger_rules r on r.rule_code=e.rule_code and r.enabled
  where p_table in ('tbldQXuqNEp8G5pfs','tblzYDob4qF6Kha8u')
  group by e.rule_code
  having bool_and(e.status='posted' and exists(
    select 1 from public.journal_entries rev where rev.reverses_entry_id=e.id and rev.status='posted'
  ))
  on conflict (source_table,source_record_id,rule_code) where finished_at is null
    do update set original_ids=q.original_ids
  returning q.id,q.rule_code,q.repost_on
$$;
revoke all on function ledger_private.enqueue_airtable_reposts(text,text) from public, anon, authenticated;
grant execute on function ledger_private.enqueue_airtable_reposts(text,text) to service_role;

alter function ledger_private.dispatch_daily_ledger(timestamptz) rename to dispatch_ordinary_daily_ledger;

create function ledger_private.dispatch_daily_ledger(p_now timestamptz default now()) returns bigint
language plpgsql security invoker set search_path='' as $$
declare
  request_id bigint;
  queued ledger_private.airtable_repost_requests%rowtype;
  endpoint text;
  secret text;
begin
  request_id := ledger_private.dispatch_ordinary_daily_ledger(p_now);
  if request_id is not null then return request_id; end if;
  if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtextextended('ledger-sync:global',0)) then return null; end if;
  if exists(select 1 from public.ledger_daily_runs where locked_until>p_now
    or (state->>'done'='false' and not (state ? 'repostId'))) then return null; end if;

  update ledger_private.airtable_repost_requests q
  set finished_at=p_now,
      outcome=case
        when exists(select 1 from public.journal_entries e where e.posting_cycle=q.id and e.status='posted') then 'posted'
        when exists(select 1 from public.journal_entries e where e.posting_cycle=q.id) then 'needs_review'
        else 'failed'
      end
  from public.ledger_daily_runs r
  where r.run_key=q.id::text and r.state->>'done'='true' and q.finished_at is null;

  select q.* into queued from ledger_private.airtable_repost_requests q
  where q.finished_at is null
    and (q.dispatched_at is null or q.dispatched_at<=p_now-interval '2 minutes')
    and exists(select 1 from public.ledger_daily_runs r
      where r.run_key like 'scheduled:____-__-__' and r.state->>'done'='true'
      and r.run_key >= 'scheduled:'||q.repost_on::text)
  order by q.created_at,q.id limit 1 for update skip locked;
  if not found then return null; end if;

  if not exists(select 1 from public.ledger_daily_runs r where r.run_key=queued.id::text)
     and queued.original_ids is distinct from (
       select array_agg(e.id order by e.id)
       from ledger_private.current_airtable_journals(queued.source_table,queued.source_record_id) e
       where e.rule_code=queued.rule_code
     ) then
    update ledger_private.airtable_repost_requests set finished_at=p_now,outcome='superseded' where id=queued.id;
    return null;
  end if;

  select decrypted_secret into endpoint from vault.decrypted_secrets where name='ledger_daily_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name='ledger_webhook_secret';
  if endpoint is null or secret is null then return null; end if;
  update ledger_private.airtable_repost_requests set dispatched_at=p_now where id=queued.id;
  select net.http_post(url:=endpoint,
    headers:=jsonb_build_object('Content-Type','application/json','x-ledger-secret',secret),
    body:=jsonb_build_object('runKey',queued.id::text,'repostId',queued.id::text,'dryRun',false,
      'categoryCodes',jsonb_build_array(queued.rule_code),'maxRecords',50,
      'source',jsonb_build_object('tableId',queued.source_table,'recordId',queued.source_record_id)),
    timeout_milliseconds:=120000) into request_id;
  return request_id;
end;
$$;
revoke all on function ledger_private.dispatch_daily_ledger(timestamptz) from public, anon, authenticated, service_role;
