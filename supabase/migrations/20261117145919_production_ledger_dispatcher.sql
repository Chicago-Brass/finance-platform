-- Install the dispatcher everywhere; only production gets credentials and a scheduled job.
create extension if not exists pg_net with schema extensions;
create schema if not exists ledger_private;
revoke all on schema ledger_private from public, anon, authenticated;

create function ledger_private.dispatch_daily_ledger(p_now timestamptz default now()) returns bigint
language plpgsql security invoker set search_path='' as $$
declare
  local_day date := (p_now at time zone 'America/Chicago')::date;
  local_hour integer := extract(hour from now() at time zone 'America/Chicago');
  run public.ledger_daily_runs%rowtype;
  request_body jsonb;
  endpoint text;
  secret text;
  request_id bigint;
begin
  if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtextextended('ledger-sync:global',0)) then return null; end if;
  select * into run from public.ledger_daily_runs
    where state->>'done'='false' or locked_until>p_now order by created_at limit 1;
  if found then
    -- Manual runs retain ownership of the global lock and must be resumed by their caller.
    if run.run_key not like 'scheduled:%' or run.locked_until>p_now then return null; end if;
    request_body := jsonb_build_object('runKey',run.run_key,'dryRun',(run.state->>'dryRun')::boolean,
      'categoryCodes',run.state->'categoryIds','maxRecords',50,
      'fromDate',run.state#>>'{dateRange,from}','toDate',run.state#>>'{dateRange,to}');
  else
    if local_hour<>23 then return null; end if;
    if exists(select 1 from public.ledger_daily_runs where run_key='scheduled:'||local_day::text) then return null; end if;
    request_body := jsonb_build_object('runKey','scheduled:'||local_day::text,'dryRun',false,'maxRecords',50,
      'fromDate',(local_day-29)::text,'toDate',local_day::text);
  end if;
  select decrypted_secret into endpoint from vault.decrypted_secrets where name='ledger_daily_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name='ledger_webhook_secret';
  if endpoint is null or secret is null then return null; end if;
  select net.http_post(url:=endpoint,headers:=jsonb_build_object('Content-Type','application/json','x-ledger-secret',secret),
    body:=request_body,timeout_milliseconds:=120000) into request_id;
  return request_id;
end;
$$;
revoke all on function ledger_private.dispatch_daily_ledger(timestamptz) from public, anon, authenticated, service_role;
comment on function ledger_private.dispatch_daily_ledger(timestamptz) is 'Production-only minute dispatcher: start at 23:00 America/Chicago, resume scheduled batches. No job or credentials are installed by migrations.';
