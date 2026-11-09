-- Optional branch scope preserves consolidated reads for existing callers.
drop function public.get_trial_balances(date[],date[]);
drop function public.get_trial_balance(date,date);
drop function public.filter_ledger(date,date,text,text,text,text,text,text,numeric,numeric,bigint,integer);
drop function public.count_ledger(date,date,text,text,text,text,text,text,numeric,numeric);

CREATE OR REPLACE FUNCTION "public"."get_trial_balance"("p_as_of" "date" DEFAULT CURRENT_DATE, "p_from" "date" DEFAULT NULL::"date", "p_branch" text DEFAULT NULL) RETURNS TABLE("account_number" "text", "account_name" "text", "account_type" "public"."account_type", "account_subtype" "text", "normal_balance" "public"."balance_side", "total_debit" numeric, "total_credit" numeric, "balance" numeric)
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select a.code, a.name, a.account_type, a.subtype, a.normal_balance,
         coalesce(sum(l.debit), 0), coalesce(sum(l.credit), 0),
         coalesce(sum(case when a.normal_balance = 'debit' then l.debit - l.credit else l.credit - l.debit end), 0)
  from public.accounts a
  left join (public.journal_lines l
             join public.journal_entries e on e.id = l.entry_id and e.status = 'posted'
                                          and e.entry_date <= p_as_of
                                          and (p_from is null or e.entry_date >= p_from))
    on l.account_code = a.code and (p_branch is null or l.branch = p_branch)
  group by a.code, a.name, a.account_type, a.subtype, a.normal_balance
  order by a.code
$$;

-- Keep the applied baseline immutable. Optimize read plans without changing results or privileges.
-- Materialize posted activity once for all requested periods; retain caller RLS.
create or replace function public.get_trial_balances(p_as_of date[], p_from date[], p_branch text default null)
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
    with requests as (
      select request.as_of, request.from_date, request.ord::integer as ord
      from unnest(p_as_of, p_from) with ordinality as request(as_of, from_date, ord)
    ), activity as materialized (
      select l.account_code, e.entry_date, l.debit, l.credit
      from public.journal_entries e
      join public.journal_lines l on l.entry_id = e.id
      where e.status = 'posted'::public.entry_status
        and (p_branch is null or l.branch = p_branch)
        and e.entry_date <= (select max(r.as_of) from requests r)
        and ((select bool_or(r.from_date is null) from requests r)
             or e.entry_date >= (select min(r.from_date) from requests r))
    ), totals as (
      select r.ord, l.account_code, sum(l.debit) as debit, sum(l.credit) as credit
      from requests r join activity l on l.entry_date <= r.as_of
        and (r.from_date is null or l.entry_date >= r.from_date)
      group by r.ord, l.account_code
    )
    select r.ord, coalesce(jsonb_agg(jsonb_build_object(
      'account_number', a.code, 'account_name', a.name,
      'account_type', a.account_type, 'account_subtype', a.subtype,
      'normal_balance', a.normal_balance,
      'total_debit', coalesce(t.debit, 0), 'total_credit', coalesce(t.credit, 0),
      'balance', case when a.normal_balance = 'debit'
        then coalesce(t.debit, 0) - coalesce(t.credit, 0)
        else coalesce(t.credit, 0) - coalesce(t.debit, 0) end
    ) order by a.code) filter (where a.code is not null), '[]'::jsonb)
    from requests r left join public.accounts a on true
    left join totals t on t.ord = r.ord and t.account_code = a.code
    group by r.ord order by r.ord;
end
$function$;


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
  p_take integer default 101,
  p_branch text default null
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
      and (p_branch is null or exists (select 1 from public.journal_lines bl where bl.id = v.line_id and bl.branch = p_branch))
      and (p_account is null or v.account_number = p_account)
      and (p_offset is null or v.offsetting_account_number = p_offset)
      and (p_account_type is null or v.account_type::text = p_account_type)
      and (p_category is null or v.rule_code = p_category)
      and (p_side = 'all' or (p_side = 'debit' and v.debit <> 0) or (p_side = 'credit' and v.credit <> 0))
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
  p_max numeric default null,
  p_branch text default null
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
        and (p_branch is null or l.branch = p_branch)
        and (p_account is null or l.account_code = p_account)
        and (p_account_type is null or a.account_type::text = p_account_type)
        and (p_category is null or e.rule_code = p_category)
        and (p_side = 'all' or (p_side = 'debit' and l.debit <> 0) or (p_side = 'credit' and l.credit <> 0))
        and (p_min is null or l.debit + l.credit >= p_min)
        and (p_max is null or l.debit + l.credit <= p_max)
    );
  end if;

  return (
    select count(*) from public.v_ledger v
    where v.date between p_from and p_to
      and (p_branch is null or exists (select 1 from public.journal_lines bl where bl.id = v.line_id and bl.branch = p_branch))
      and (p_account is null or v.account_number = p_account)
      and (p_offset is null or v.offsetting_account_number = p_offset)
      and (p_account_type is null or v.account_type::text = p_account_type)
      and (p_category is null or v.rule_code = p_category)
      and (p_side = 'all' or (p_side = 'debit' and v.debit <> 0) or (p_side = 'credit' and v.credit <> 0))
      and (p_min is null or v.debit + v.credit >= p_min)
      and (p_max is null or v.debit + v.credit <= p_max)
      and (btrim(p_query) = '' or strpos(lower(concat_ws(' ', v.date::text, v.entry_number::text,
        v.account_number, v.account_name, v.offsetting_account_number,
        v.offsetting_account_name, v.notes,
        case when v.offset_is_split then 'split multiple accounts' end)), lower(btrim(p_query))) > 0)
  );
end
$function$;

create index if not exists journal_lines_branch_entry_idx on public.journal_lines(branch, entry_id);
revoke all on function public.get_trial_balances(date[],date[],text) from public, anon;
grant execute on function public.get_trial_balances(date[],date[],text) to authenticated, service_role;
revoke all on function public.get_trial_balance(date,date,text) from public, anon;
grant execute on function public.get_trial_balance(date,date,text) to authenticated, service_role;
revoke all on function public.filter_ledger(date,date,text,text,text,text,text,text,numeric,numeric,bigint,integer,text) from public, anon;
grant execute on function public.filter_ledger(date,date,text,text,text,text,text,text,numeric,numeric,bigint,integer,text) to authenticated, service_role;
revoke all on function public.count_ledger(date,date,text,text,text,text,text,text,numeric,numeric,text) from public, anon;
grant execute on function public.count_ledger(date,date,text,text,text,text,text,text,numeric,numeric,text) to authenticated, service_role;
