-- Keep the applied baseline immutable. Optimize read plans without changing results or privileges.
-- Materialize posted activity once for all requested periods; retain caller RLS.
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
    with requests as (
      select request.as_of, request.from_date, request.ord::integer as ord
      from unnest(p_as_of, p_from) with ordinality as request(as_of, from_date, ord)
    ), activity as materialized (
      select l.account_code, e.entry_date, l.debit, l.credit
      from public.journal_entries e
      join public.journal_lines l on l.entry_id = e.id
      where e.status = 'posted'::public.entry_status
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

-- Default privileges already withhold new functions; grant only signed-in report users.
revoke all on function public.get_trial_balances(date[], date[]) from public, anon;
grant execute on function public.get_trial_balances(date[], date[]) to authenticated;

-- Resolve offsets only within the candidate journal entry, allowing account/date filters to push down.
CREATE OR REPLACE VIEW "public"."v_ledger" WITH ("security_invoker"='true') AS
 SELECT "e"."entry_date" AS "date",
    "l"."account_code" AS "account_number",
    "a"."name" AS "account_name",
        CASE
            WHEN ("l"."offset_account_code" IS NOT NULL) THEN "l"."offset_account_code"
            WHEN ("off"."n_offset_accounts" = 1) THEN "off"."top_offset_code"
            ELSE "off"."offset_codes"
        END AS "offsetting_account_number",
        CASE
            WHEN ("l"."offset_account_code" IS NOT NULL) THEN "oa_explicit"."name"
            WHEN ("off"."n_offset_accounts" = 1) THEN "oa_single"."name"
            ELSE ('Split: '::"text" || ( SELECT "string_agg"((("x"."code" || ' '::"text") || "x"."name"), '; '::"text" ORDER BY "x"."code") AS "string_agg"
               FROM "public"."accounts" "x"
              WHERE ("x"."code" = ANY ("string_to_array"("off"."offset_codes", ', '::"text")))))
        END AS "offsetting_account_name",
    "l"."debit",
    "l"."credit",
    COALESCE("l"."notes", "e"."notes", "e"."description") AS "notes",
    COALESCE("l"."audit_link", "e"."audit_link") AS "audit_link",
    (("l"."offset_account_code" IS NULL) AND ("off"."n_offset_accounts" > 1)) AS "offset_is_split",
    "e"."id" AS "entry_id",
    "e"."entry_number",
    "l"."line_no",
    "l"."id" AS "line_id",
    "e"."period_month",
    "e"."description",
    "e"."rule_code",
    "r"."category" AS "rule_category",
    "r"."trigger_name",
    "a"."account_type",
    "a"."subtype" AS "account_subtype",
    "a"."normal_balance",
    ("l"."debit" - "l"."credit") AS "net_amount",
    "e"."reverses_entry_id",
    "e"."source_system",
    "e"."source_table",
    "e"."source_record_id",
    "e"."external_ref",
    "l"."vendor_ref",
    "l"."customer_ref",
    "l"."order_ref",
    "l"."po_ref",
    "l"."invoice_ref",
    "l"."employee_ref",
    "l"."state_code",
    "e"."posted_at",
    "e"."posted_by"
   FROM public.journal_lines l
   JOIN public.journal_entries e ON e.id = l.entry_id AND e.status = 'posted'::public.entry_status
   JOIN public.accounts a ON a.code = l.account_code
   LEFT JOIN LATERAL (
     SELECT count(DISTINCT o.account_code) AS n_offset_accounts,
            string_agg(DISTINCT o.account_code, ', ') AS offset_codes,
            (array_agg(o.account_code ORDER BY (o.debit + o.credit) DESC, o.line_no))[1] AS top_offset_code
     FROM public.journal_lines o
     WHERE o.entry_id = l.entry_id AND (o.debit > 0) <> (l.debit > 0)
   ) off ON true
   LEFT JOIN public.accounts oa_explicit ON oa_explicit.code = l.offset_account_code
   LEFT JOIN public.accounts oa_single ON oa_single.code = off.top_offset_code
   LEFT JOIN public.ledger_rules r ON r.rule_code = e.rule_code;
