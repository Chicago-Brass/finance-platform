-- Preserve every existing linked-record reference and allow several links per journal line.
-- Recreate only the view and RPC return types that depend on these column types.
drop function public.search_ledger(date, date, text, text, text, text, bigint, integer);
drop function public.filter_ledger(date, date, text, text, text, text, text, text, numeric, numeric, bigint, integer);
drop view public.v_ledger;

alter table public.journal_lines alter column vendor_ref type text[] using case when vendor_ref is null then '{}'::text[] else array[vendor_ref] end, alter column vendor_ref set default '{}', alter column vendor_ref set not null;
alter table public.journal_lines alter column customer_ref type text[] using case when customer_ref is null then '{}'::text[] else array[customer_ref] end, alter column customer_ref set default '{}', alter column customer_ref set not null;
alter table public.journal_lines alter column order_ref type text[] using case when order_ref is null then '{}'::text[] else array[order_ref] end, alter column order_ref set default '{}', alter column order_ref set not null;
alter table public.journal_lines alter column po_ref type text[] using case when po_ref is null then '{}'::text[] else array[po_ref] end, alter column po_ref set default '{}', alter column po_ref set not null;
alter table public.journal_lines alter column invoice_ref type text[] using case when invoice_ref is null then '{}'::text[] else array[invoice_ref] end, alter column invoice_ref set default '{}', alter column invoice_ref set not null;
alter table public.journal_lines alter column employee_ref type text[] using case when employee_ref is null then '{}'::text[] else array[employee_ref] end, alter column employee_ref set default '{}', alter column employee_ref set not null;
alter table public.journal_lines add column state_ref text[] not null default '{}';

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
    "e"."posted_by",
    "l"."state_ref"
   FROM public.journal_lines l
   JOIN public.journal_entries e ON e.id = l.entry_id AND e.status = 'posted'::public.entry_status
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


alter view public.v_ledger owner to postgres;
grant select on public.v_ledger to authenticated;
grant all on public.v_ledger to service_role;

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
      and (p_side = 'all' or (p_side = 'debit' and v.debit <> 0) or (p_side = 'credit' and v.credit <> 0))
      -- strpos treats %, _ and backslash as ordinary characters, never as wildcard operators.
      and strpos(lower(concat_ws(' ', v.date::text, v.entry_number::text,
        v.account_number, v.account_name, v.offsetting_account_number,
        v.offsetting_account_name, v.notes,
        case when v.offset_is_split then 'split multiple accounts' end)), lower(btrim(p_query))) > 0
    order by v.date, v.entry_number, v.line_no
    limit p_take offset p_skip;
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

revoke all on function public.search_ledger(date, date, text, text, text, text, bigint, integer) from public, anon;
grant execute on function public.search_ledger(date, date, text, text, text, text, bigint, integer) to authenticated, service_role;
revoke all on function public.filter_ledger(date, date, text, text, text, text, text, text, numeric, numeric, bigint, integer) from public, anon;
grant execute on function public.filter_ledger(date, date, text, text, text, text, text, text, numeric, numeric, bigint, integer) to authenticated, service_role;

CREATE OR REPLACE FUNCTION "public"."create_journal_entry"("p_entry" "jsonb", "p_lines" "jsonb", "p_post" boolean DEFAULT true) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare v_id uuid; v_line jsonb; v_i bigint;
begin
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception 'p_lines must be a JSON array with at least 2 lines';
  end if;

  insert into public.journal_entries (entry_date, rule_code, description, notes, audit_link,
                                      source_system, source_table, source_record_id, external_ref)
  values ((p_entry->>'entry_date')::date, p_entry->>'rule_code', p_entry->>'description',
          p_entry->>'notes', p_entry->>'audit_link',
          coalesce(p_entry->>'source_system','manual'), p_entry->>'source_table',
          p_entry->>'source_record_id', p_entry->>'external_ref')
  returning id into v_id;

  for v_line, v_i in select x.val, x.ord from jsonb_array_elements(p_lines) with ordinality as x(val, ord) loop
    insert into public.journal_lines (entry_id, line_no, account_code, offset_account_code, debit, credit,
                                      notes, audit_link, vendor_ref, customer_ref, order_ref, po_ref,
                                      invoice_ref, employee_ref, state_ref, state_code, airtable_record_id, airtable_record_ids, branch)
    values (v_id, v_i, v_line->>'account_code', v_line->>'offset_account_code',
            coalesce((v_line->>'debit')::numeric, 0), coalesce((v_line->>'credit')::numeric, 0),
            v_line->>'notes', coalesce(v_line->>'audit_link', p_entry->>'audit_link'),
            array(select pg_catalog.jsonb_array_elements_text(coalesce(nullif(v_line->'vendor_ref', 'null'::jsonb), '[]'::jsonb))), array(select pg_catalog.jsonb_array_elements_text(coalesce(nullif(v_line->'customer_ref', 'null'::jsonb), '[]'::jsonb))), array(select pg_catalog.jsonb_array_elements_text(coalesce(nullif(v_line->'order_ref', 'null'::jsonb), '[]'::jsonb))), array(select pg_catalog.jsonb_array_elements_text(coalesce(nullif(v_line->'po_ref', 'null'::jsonb), '[]'::jsonb))),
            array(select pg_catalog.jsonb_array_elements_text(coalesce(nullif(v_line->'invoice_ref', 'null'::jsonb), '[]'::jsonb))), array(select pg_catalog.jsonb_array_elements_text(coalesce(nullif(v_line->'employee_ref', 'null'::jsonb), '[]'::jsonb))), array(select pg_catalog.jsonb_array_elements_text(coalesce(nullif(v_line->'state_ref', 'null'::jsonb), '[]'::jsonb))), v_line->>'state_code', v_line->>'airtable_record_id', array(select pg_catalog.jsonb_array_elements_text(coalesce(nullif(v_line->'airtable_record_ids', 'null'::jsonb), '[]'::jsonb))), v_line->>'branch');
  end loop;

  if p_post then
    update public.journal_entries set status = 'posted' where id = v_id;
  end if;
  return v_id;
end $$;

CREATE OR REPLACE FUNCTION "public"."reverse_journal_entry"("p_entry_id" "uuid", "p_reversal_date" "date" DEFAULT CURRENT_DATE, "p_reason" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare v_orig public.journal_entries; v_id uuid;
begin
  select * into v_orig from public.journal_entries where id = p_entry_id;
  if not found then raise exception 'Entry % not found', p_entry_id; end if;
  if v_orig.status <> 'posted' then raise exception 'Only posted entries can be reversed (draft entries can just be deleted)'; end if;
  if exists (select 1 from public.ledger_rules r where r.rule_code = v_orig.rule_code and r.reversible = false) then
    raise exception 'Rule % is marked not reversible', v_orig.rule_code;
  end if;

  insert into public.journal_entries (entry_date, rule_code, description, notes, audit_link, source_system,
                                      source_table, source_record_id, external_ref, reverses_entry_id, reversal_reason)
  values (p_reversal_date, v_orig.rule_code,
          'Reversal of JE #' || v_orig.entry_number || ': ' || v_orig.description,
          p_reason, v_orig.audit_link, v_orig.source_system, v_orig.source_table, v_orig.source_record_id,
          v_orig.external_ref, v_orig.id, p_reason)
  returning id into v_id;

  insert into public.journal_lines (entry_id, line_no, account_code, offset_account_code, debit, credit, notes, audit_link,
                                    vendor_ref, customer_ref, order_ref, po_ref, invoice_ref, employee_ref, state_ref, state_code, airtable_record_id, airtable_record_ids, branch)
  select v_id, l.line_no, l.account_code, l.offset_account_code, l.credit, l.debit, l.notes, l.audit_link,
         l.vendor_ref, l.customer_ref, l.order_ref, l.po_ref, l.invoice_ref, l.employee_ref, l.state_ref, l.state_code, l.airtable_record_id, l.airtable_record_ids, l.branch
  from public.journal_lines l where l.entry_id = p_entry_id order by l.line_no;

  update public.journal_entries set status = 'posted' where id = v_id;
  return v_id;
end $$;

notify pgrst, 'reload schema';
