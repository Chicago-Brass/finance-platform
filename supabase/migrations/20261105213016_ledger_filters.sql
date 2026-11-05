-- One caller-scoped read applies every filter before stable pagination.
create or replace function public.filter_ledger(
  p_from date,
  p_to date,
  p_query text default '',
  p_account text default null,
  p_offset text default null,
  p_side text default 'all',
  p_account_type text default null,
  p_category text default null,
  p_min numeric default null,
  p_max numeric default null,
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
  if p_from is null or p_to is null or p_query is null or char_length(p_query) > 200
     or p_side is null or p_side not in ('all', 'debit', 'credit')
     or p_skip is null or p_skip < 0 or p_skip > 9007199254740991
     or p_take is null or p_take not between 1 and 501 then
    raise exception 'Invalid ledger dates, search or page bounds' using errcode = '22023';
  end if;
  if (p_account is not null and p_account !~ '^\d{3}\.\d{3}$')
     or (p_offset is not null and p_offset !~ '^\d{3}\.\d{3}$')
     or (p_account_type is not null and p_account_type not in ('asset', 'liability', 'equity', 'revenue', 'expense'))
     or (p_category is not null and p_category !~ '^[A-Z][A-Z0-9_-]{0,49}$') then
    raise exception 'Invalid ledger account type, category or account code' using errcode = '22023';
  end if;
  if (p_min is not null and (p_min < 0 or p_min > 90071992547409.91 or p_min <> round(p_min, 2)))
     or (p_max is not null and (p_max < 0 or p_max > 90071992547409.91 or p_max <> round(p_max, 2))) then
    raise exception 'Amount limits must be nonnegative amounts with at most two decimal places' using errcode = '22023';
  end if;

  return query
    select v.* from public.v_ledger v
    where v.date between p_from and p_to
      and (p_account is null or v.account_number = p_account)
      and (p_offset is null or v.offsetting_account_number = p_offset)
      and (p_account_type is null or v.account_type::text = p_account_type)
      and (p_category is null or v.rule_code = p_category)
      and (p_side = 'all' or (p_side = 'debit' and v.debit > 0) or (p_side = 'credit' and v.credit > 0))
      and (p_min is null or v.debit + v.credit >= p_min)
      and (p_max is null or v.debit + v.credit <= p_max)
      and (btrim(p_query) = '' or strpos(lower(concat_ws(' ', v.date::text, v.entry_number::text,
        v.account_number, v.account_name, v.offsetting_account_number,
        v.offsetting_account_name, v.notes,
        case when v.offset_is_split then 'split multiple accounts' end)), lower(btrim(p_query))) > 0)
    order by v.date, v.entry_number, v.line_no
    limit p_take offset p_skip;
end
$function$;

revoke all on function public.filter_ledger(date, date, text, text, text, text, text, text, numeric, numeric, bigint, integer) from public, anon;
grant execute on function public.filter_ledger(date, date, text, text, text, text, text, text, numeric, numeric, bigint, integer) to authenticated;
