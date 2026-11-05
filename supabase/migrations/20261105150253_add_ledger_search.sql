-- Search the caller's complete visible ledger before paging, with literal substring matching.
create or replace function public.search_ledger(
  p_from date,
  p_to date,
  p_query text,
  p_account text default null,
  p_offset text default null,
  p_side text default 'all',
  p_skip bigint default 0,
  p_take integer default 101
)
returns setof public.v_ledger
language plpgsql
stable
security invoker
set search_path to ''
as $function$
begin
  if p_from is null or p_to is null or p_query is null
     or char_length(btrim(p_query)) not between 1 and 200 then
    raise exception 'Dates and a search of 1 to 200 characters are required' using errcode = '22023';
  end if;
  if p_side is null or p_side not in ('all', 'debit', 'credit')
     or p_skip is null or p_skip < 0 or p_skip > 9007199254740991
     or p_take is null or p_take not between 1 and 501 then
    raise exception 'Invalid ledger side or page range' using errcode = '22023';
  end if;
  if (p_account is not null and p_account !~ '^\d{3}\.\d{3}$')
     or (p_offset is not null and p_offset !~ '^\d{3}\.\d{3}$') then
    raise exception 'Invalid ledger account code' using errcode = '22023';
  end if;

  return query
    select v.*
    from public.v_ledger v
    where v.date between p_from and p_to
      and (p_account is null or v.account_number = p_account)
      and (p_offset is null or v.offsetting_account_number = p_offset)
      and (p_side = 'all' or (p_side = 'debit' and v.debit > 0) or (p_side = 'credit' and v.credit > 0))
      -- strpos treats %, _ and backslash as ordinary characters, never as wildcard operators.
      and strpos(lower(concat_ws(' ', v.date::text, v.entry_number::text,
        v.account_number, v.account_name, v.offsetting_account_number,
        v.offsetting_account_name, v.notes,
        case when v.offset_is_split then 'split multiple accounts' end)), lower(btrim(p_query))) > 0
    order by v.date, v.entry_number, v.line_no
    limit p_take offset p_skip;
end
$function$;

revoke all on function public.search_ledger(date, date, text, text, text, text, bigint, integer) from public, anon;
grant execute on function public.search_ledger(date, date, text, text, text, text, bigint, integer) to authenticated;
