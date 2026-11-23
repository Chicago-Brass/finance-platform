create function public.get_account_activity_page(
  p_account text,
  p_from date,
  p_to date,
  p_branch text,
  p_page integer
)
returns setof public.v_ledger_reviewable
language sql
stable
security invoker
set search_path = ''
as $$
  select v.*
  from public.v_ledger_reviewable v
  where p_page between 1 and 4
    and v.account_number = p_account
    and v.date between p_from and p_to
    and v.status = 'posted'
    and (
      p_branch is null or exists (
        select 1 from public.journal_lines l
        where l.id = v.line_id
          and (l.branch = nullif(p_branch, 'no-branch') or (p_branch = 'no-branch' and l.branch is null))
      )
    )
  order by v.date desc, v.entry_number desc, v.line_no
  limit 501 offset (greatest(p_page::bigint, 1) - 1) * 500;
$$;

revoke execute on function public.get_account_activity_page(text, date, date, text, integer) from public, anon;
grant execute on function public.get_account_activity_page(text, date, date, text, integer) to authenticated;
