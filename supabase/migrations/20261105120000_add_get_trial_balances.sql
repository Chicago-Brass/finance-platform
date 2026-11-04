-- Batched trial balances for the report pages: one round trip instead of one per column.
-- Each requested (as-of, from) pair is answered by public.get_trial_balance itself, so every set
-- is identical to a single call. One row per pair keeps the response far below the API row limit.
-- SECURITY INVOKER: the caller's grants and RLS policies apply, exactly as for get_trial_balance.
create or replace function public.get_trial_balances(p_as_of date[], p_from date[])
returns table (period_index integer, accounts jsonb)
language plpgsql
stable
security invoker
set search_path to ''
as $function$
begin
  if p_as_of is null or p_from is null or cardinality(p_as_of) <> cardinality(p_from) then
    raise exception 'p_as_of and p_from must be arrays of the same length' using errcode = '22023';
  end if;
  if cardinality(p_as_of) > 100 then
    raise exception 'At most 100 trial balances per call' using errcode = '22023';
  end if;
  if array_position(p_as_of, null) is not null then
    raise exception 'Every trial balance needs an as-of date' using errcode = '22023';
  end if;
  return query
    select request.ord::integer,
           coalesce((select jsonb_agg(to_jsonb(tb) order by tb.account_number)
                     from public.get_trial_balance(request.as_of, request.from_date) tb), '[]'::jsonb)
    from unnest(p_as_of, p_from) with ordinality as request(as_of, from_date, ord)
    order by request.ord;
end
$function$;

-- Default privileges already withhold new functions; grant only signed-in report users.
revoke all on function public.get_trial_balances(date[], date[]) from public, anon;
grant execute on function public.get_trial_balances(date[], date[]) to authenticated;
