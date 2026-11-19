-- Only the operational General Ledger opts into pending rows. The existing
-- posted-only view remains the source for legacy reads and financial reporting.
CREATE OR REPLACE VIEW public.v_ledger_reviewable WITH ("security_invoker"='true') AS
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
    "e"."posted_by",
    "l"."state_ref",
    e.status
   FROM public.journal_lines l
   JOIN public.journal_entries e ON e.id = l.entry_id AND e.status in ('posted', 'pending')
   JOIN public.accounts a ON a.code = l.account_code
   LEFT JOIN LATERAL (
     SELECT count(DISTINCT o.account_code) AS n_offset_accounts,
            string_agg(DISTINCT o.account_code, ', ') AS offset_codes,
            (array_agg(o.account_code ORDER BY (o.debit + o.credit) DESC, o.line_no))[1] AS top_offset_code
     FROM public.journal_lines o
     WHERE o.entry_id = l.entry_id AND (o.debit <> 0) <> (l.debit <> 0)
   ) off ON true
   LEFT JOIN public.accounts oa_explicit ON oa_explicit.code = l.offset_account_code
   LEFT JOIN public.accounts oa_single ON oa_single.code = off.top_offset_code
   LEFT JOIN public.ledger_rules r ON r.rule_code = e.rule_code;



revoke all on public.v_ledger_reviewable from public, anon;
grant select on public.v_ledger_reviewable to authenticated, service_role;

drop function public.filter_ledger(date,date,text,text,text,text,text,text,numeric,numeric,bigint,integer,text);
drop function public.count_ledger(date,date,text,text,text,text,text,text,numeric,numeric,text);

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
  p_branch text default null,
  p_include_pending boolean default false
)
returns setof public.v_ledger_reviewable
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
    select v.* from public.v_ledger_reviewable v
    where v.date between p_from and p_to
      and (v.status = 'posted' or p_include_pending is true)
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
  p_branch text default null,
  p_include_pending boolean default false
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
      join public.journal_entries e on e.id = l.entry_id and (e.status = 'posted' or (p_include_pending is true and e.status = 'pending'))
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
    select count(*) from public.v_ledger_reviewable v
    where v.date between p_from and p_to
      and (v.status = 'posted' or p_include_pending is true)
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

revoke all on function public.filter_ledger(date,date,text,text,text,text,text,text,numeric,numeric,bigint,integer,text,boolean) from public, anon;
grant execute on function public.filter_ledger(date,date,text,text,text,text,text,text,numeric,numeric,bigint,integer,text,boolean) to authenticated, service_role;
revoke all on function public.count_ledger(date,date,text,text,text,text,text,text,numeric,numeric,text,boolean) from public, anon;
grant execute on function public.count_ledger(date,date,text,text,text,text,text,text,numeric,numeric,text,boolean) to authenticated, service_role;
