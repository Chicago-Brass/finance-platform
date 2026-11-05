-- Count the same visible journal lines without sorting, paging or returning line details.
create or replace function public.count_ledger(
  p_from date,
  p_to date,
  p_query text default '',
  p_account text default null,
  p_offset text default null,
  p_side text default 'all',
  p_account_type text default null,
  p_category text default null,
  p_min numeric default null,
  p_max numeric default null
)
returns bigint
language plpgsql
stable
security invoker
set search_path to ''
as $function$
begin
  if p_from is null or p_to is null or p_query is null or char_length(p_query) > 200
     or p_side is null or p_side not in ('all', 'debit', 'credit') then
    raise exception 'Invalid ledger dates or search' using errcode = '22023';
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

  -- Most counts need no offset-name lookup or journal-line hydration.
  if btrim(p_query) = '' and p_offset is null then
    return (
      select count(*) from public.journal_lines l
      join public.journal_entries e on e.id = l.entry_id and e.status = 'posted'
      join public.accounts a on a.code = l.account_code
      where e.entry_date between p_from and p_to
        and (p_account is null or l.account_code = p_account)
        and (p_account_type is null or a.account_type::text = p_account_type)
        and (p_category is null or e.rule_code = p_category)
        and (p_side = 'all' or (p_side = 'debit' and l.debit > 0) or (p_side = 'credit' and l.credit > 0))
        and (p_min is null or l.debit + l.credit >= p_min)
        and (p_max is null or l.debit + l.credit <= p_max)
    );
  end if;

  return (
    select count(*) from public.v_ledger v
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
  );
end
$function$;

revoke all on function public.count_ledger(date, date, text, text, text, text, text, text, numeric, numeric) from public, anon;
grant execute on function public.count_ledger(date, date, text, text, text, text, text, text, numeric, numeric) to authenticated;
