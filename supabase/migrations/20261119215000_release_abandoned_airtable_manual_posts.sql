-- Record-specific Airtable posts can resume from a checkpoint without holding the nightly queue open.
create function ledger_private.keeps_daily_run_lock(p_key text, p_state jsonb, p_locked_until timestamptz, p_now timestamptz)
returns boolean language sql immutable security invoker set search_path='' as $$
  select coalesce(p_locked_until > p_now, false)
    or (p_state->>'done' = 'false' and not (p_state ? 'repostId')
      and not (p_key like 'airtable-post:%' and p_state ? 'source'))
$$;

revoke all on function ledger_private.keeps_daily_run_lock(text,jsonb,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function ledger_private.keeps_daily_run_lock(text,jsonb,timestamptz,timestamptz) to service_role;

do $$
declare
  ordinary text := pg_get_functiondef('ledger_private.dispatch_ordinary_daily_ledger(timestamptz)'::regprocedure);
  repost text := pg_get_functiondef('ledger_private.dispatch_daily_ledger(timestamptz)'::regprocedure);
  ordinary_filter text := $filter$where (state->>'done'='false' and not (state ? 'repostId')) or locked_until>p_now order by created_at limit 1$filter$;
  repost_filter text := $filter$where locked_until>p_now
    or (state->>'done'='false' and not (state ? 'repostId'))$filter$;
begin
  if strpos(ordinary, ordinary_filter) = 0 or strpos(repost, repost_filter) = 0 then
    raise exception 'Unexpected dispatch lock filters';
  end if;
  execute replace(ordinary, ordinary_filter,
    'where ledger_private.keeps_daily_run_lock(run_key,state,locked_until,p_now) order by created_at limit 1');
  execute replace(repost, repost_filter, 'where ledger_private.keeps_daily_run_lock(run_key,state,locked_until,p_now)');
end
$$;
