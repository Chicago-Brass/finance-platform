-- Test-only: public.get_trial_balance as defined on DUAL ENTRY, read back on 2026-10-30.
-- The hosted function predates the tracked migrations; get_trial_balances calls it.
CREATE OR REPLACE FUNCTION public.get_trial_balance(p_as_of date DEFAULT CURRENT_DATE, p_from date DEFAULT NULL::date)
 RETURNS TABLE(account_number text, account_name text, account_type account_type, account_subtype text, normal_balance balance_side, total_debit numeric, total_credit numeric, balance numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select a.code, a.name, a.account_type, a.subtype, a.normal_balance,
         coalesce(sum(l.debit), 0), coalesce(sum(l.credit), 0),
         coalesce(sum(case when a.normal_balance = 'debit' then l.debit - l.credit else l.credit - l.debit end), 0)
  from public.accounts a
  left join (public.journal_lines l
             join public.journal_entries e on e.id = l.entry_id and e.status = 'posted'
                                          and e.entry_date <= p_as_of
                                          and (p_from is null or e.entry_date >= p_from))
    on l.account_code = a.code
  group by a.code, a.name, a.account_type, a.subtype, a.normal_balance
  order by a.code
$function$

;

revoke all on function public.get_trial_balance(date, date) from public, anon;
grant execute on function public.get_trial_balance(date, date) to authenticated;
