-- Chicago Brass ledger baseline, captured from DUAL ENTRY on 2026-11-05.
-- Complete public schema: types, tables, views, functions, guards, policies and privileges.
-- Fresh databases apply this once, then supabase/seed.sql for reference catalogs.
-- Existing DUAL ENTRY already has these objects: mark this version applied, never replay it there.
-- Supabase-managed auth/storage schemas and credentials are intentionally excluded.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "public";

ALTER SCHEMA "public" OWNER TO "pg_database_owner";

COMMENT ON SCHEMA "public" IS 'standard public schema';

-- Match the hosted project's restricted defaults before creating any objects.
-- PUBLIC's built-in function grant is global; a schema-only revoke cannot remove it.
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, public;

CREATE TYPE "public"."account_type" AS ENUM (
    'asset',
    'liability',
    'equity',
    'revenue',
    'expense'
);

ALTER TYPE "public"."account_type" OWNER TO "postgres";

CREATE TYPE "public"."balance_side" AS ENUM (
    'debit',
    'credit'
);

ALTER TYPE "public"."balance_side" OWNER TO "postgres";

CREATE TYPE "public"."entry_status" AS ENUM (
    'draft',
    'posted'
);

ALTER TYPE "public"."entry_status" OWNER TO "postgres";

CREATE TYPE "public"."rule_category" AS ENUM (
    'expense',
    'payment',
    'invoice_entry',
    'other'
);

ALTER TYPE "public"."rule_category" OWNER TO "postgres";

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
                                      invoice_ref, employee_ref, state_code, airtable_record_id)
    values (v_id, v_i, v_line->>'account_code', v_line->>'offset_account_code',
            coalesce((v_line->>'debit')::numeric, 0), coalesce((v_line->>'credit')::numeric, 0),
            v_line->>'notes', coalesce(v_line->>'audit_link', p_entry->>'audit_link'),
            v_line->>'vendor_ref', v_line->>'customer_ref', v_line->>'order_ref', v_line->>'po_ref',
            v_line->>'invoice_ref', v_line->>'employee_ref', v_line->>'state_code', v_line->>'airtable_record_id');
  end loop;

  if p_post then
    update public.journal_entries set status = 'posted' where id = v_id;
  end if;
  return v_id;
end $$;

ALTER FUNCTION "public"."create_journal_entry"("p_entry" "jsonb", "p_lines" "jsonb", "p_post" boolean) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."current_app_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$ select u.role from public.app_users u where u.email = lower((select auth.jwt() ->> 'email')) and u.active $$;

ALTER FUNCTION "public"."current_app_role"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_trial_balance"("p_as_of" "date" DEFAULT CURRENT_DATE, "p_from" "date" DEFAULT NULL::"date") RETURNS TABLE("account_number" "text", "account_name" "text", "account_type" "public"."account_type", "account_subtype" "text", "normal_balance" "public"."balance_side", "total_debit" numeric, "total_credit" numeric, "balance" numeric)
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
    on l.account_code = a.code
  group by a.code, a.name, a.account_type, a.subtype, a.normal_balance
  order by a.code
$$;

ALTER FUNCTION "public"."get_trial_balance"("p_as_of" "date", "p_from" "date") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."post_journal_entry"("p_entry_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  update public.journal_entries set status = 'posted' where id = p_entry_id and status = 'draft';
  if not found then raise exception 'Draft entry % not found', p_entry_id; end if;
  return p_entry_id;
end $$;

ALTER FUNCTION "public"."post_journal_entry"("p_entry_id" "uuid") OWNER TO "postgres";

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
                                    vendor_ref, customer_ref, order_ref, po_ref, invoice_ref, employee_ref, state_code, airtable_record_id)
  select v_id, l.line_no, l.account_code, l.offset_account_code, l.credit, l.debit, l.notes, l.audit_link,
         l.vendor_ref, l.customer_ref, l.order_ref, l.po_ref, l.invoice_ref, l.employee_ref, l.state_code, l.airtable_record_id
  from public.journal_lines l where l.entry_id = p_entry_id order by l.line_no;

  update public.journal_entries set status = 'posted' where id = v_id;
  return v_id;
end $$;

ALTER FUNCTION "public"."reverse_journal_entry"("p_entry_id" "uuid", "p_reversal_date" "date", "p_reason" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."tg_journal_entries_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare v_dr numeric; v_cr numeric; v_n int; v_orig_status public.entry_status;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then
      raise exception 'Journal entries must be created as draft and then posted (use public.create_journal_entry).';
    end if;
    new.posted_at := null; new.posted_by := null;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status = 'posted' then
      raise exception 'Posted journal entry #% cannot be deleted. Post a reversing entry instead.', old.entry_number;
    end if;
    return old;
  end if;

  -- UPDATE
  if old.status = 'posted' then
    raise exception 'Posted journal entry #% is immutable. Post a reversing entry instead.', old.entry_number;
  end if;

  if new.status = 'posted' then
    select coalesce(sum(l.debit),0), coalesce(sum(l.credit),0), count(*)
      into v_dr, v_cr, v_n
      from public.journal_lines l where l.entry_id = new.id;
    if v_n < 2 then
      raise exception 'Journal entry #% needs at least 2 lines to post', new.entry_number;
    end if;
    if v_dr <> v_cr then
      raise exception 'Journal entry #% is out of balance: debits % <> credits %', new.entry_number, v_dr, v_cr;
    end if;
    if exists (select 1 from public.accounting_periods p
               where p.period_month = date_trunc('month', new.entry_date::timestamp)::date
                 and p.status = 'closed') then
      raise exception 'Period % is closed; post the adjustment in an open period', to_char(new.entry_date, 'YYYY-MM');
    end if;
    if new.reverses_entry_id is not null then
      select e.status into v_orig_status from public.journal_entries e where e.id = new.reverses_entry_id;
      if v_orig_status is distinct from 'posted' then
        raise exception 'Only posted entries can be reversed';
      end if;
    end if;
    new.posted_at := now();
    new.posted_by := coalesce(auth.jwt() ->> 'email', current_user);
  end if;
  return new;
end $$;

ALTER FUNCTION "public"."tg_journal_entries_guard"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."tg_journal_lines_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare v_status public.entry_status;
begin
  if tg_op in ('UPDATE','DELETE') then
    select e.status into v_status from public.journal_entries e where e.id = old.entry_id;
    if v_status = 'posted' then
      raise exception 'Journal entry % is posted; its lines cannot be changed. Post a reversing entry instead.', old.entry_id;
    end if;
  end if;
  if tg_op in ('INSERT','UPDATE') then
    select e.status into v_status from public.journal_entries e where e.id = new.entry_id;
    if v_status = 'posted' then
      raise exception 'Journal entry % is posted; lines cannot be added or changed.', new.entry_id;
    end if;
    if not exists (select 1 from public.accounts a where a.code = new.account_code and a.active and a.is_postable) then
      raise exception 'Account % is inactive or not postable', new.account_code;
    end if;
    return new;
  end if;
  return old;
end $$;

ALTER FUNCTION "public"."tg_journal_lines_guard"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."tg_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin new.updated_at := now(); return new; end $$;

ALTER FUNCTION "public"."tg_set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."account_selector_members" (
    "selector" "text" NOT NULL,
    "account_code" "text" NOT NULL
);

ALTER TABLE "public"."account_selector_members" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."account_selectors" (
    "selector" "text" NOT NULL,
    "description" "text" NOT NULL
);

ALTER TABLE "public"."account_selectors" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."accounting_periods" (
    "period_month" "date" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "closed_at" timestamp with time zone,
    "closed_by" "text",
    "notes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "accounting_periods_period_month_check" CHECK ((EXTRACT("day" FROM "period_month") = (1)::numeric)),
    CONSTRAINT "accounting_periods_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text"])))
);

ALTER TABLE "public"."accounting_periods" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "account_type" "public"."account_type" NOT NULL,
    "subtype" "text",
    "normal_balance" "public"."balance_side" NOT NULL,
    "is_bank" boolean DEFAULT false NOT NULL,
    "is_postable" boolean DEFAULT true NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "description" "text",
    "airtable_record_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "accounts_code_check" CHECK (("code" ~ '^\d{3}\.\d{3}$'::"text"))
);

ALTER TABLE "public"."accounts" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."app_users" (
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_users_email_check" CHECK (("email" = "lower"("email"))),
    CONSTRAINT "app_users_role_check" CHECK (("role" = ANY (ARRAY['viewer'::"text", 'finance'::"text", 'admin'::"text"])))
);

ALTER TABLE "public"."app_users" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_number" bigint NOT NULL,
    "entry_date" "date" NOT NULL,
    "period_month" "date" GENERATED ALWAYS AS (("date_trunc"('month'::"text", ("entry_date")::timestamp without time zone))::"date") STORED,
    "rule_code" "text",
    "description" "text" NOT NULL,
    "notes" "text",
    "audit_link" "text",
    "status" "public"."entry_status" DEFAULT 'draft'::"public"."entry_status" NOT NULL,
    "reverses_entry_id" "uuid",
    "reversal_reason" "text",
    "source_system" "text" DEFAULT 'manual'::"text" NOT NULL,
    "source_table" "text",
    "source_record_id" "text",
    "external_ref" "text",
    "created_by" "text" DEFAULT ("auth"."jwt"() ->> 'email'::"text"),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "posted_at" timestamp with time zone,
    "posted_by" "text",
    "transaction_type" "text",
    "source_event_type" "text",
    CONSTRAINT "journal_entries_not_self_reversal" CHECK ((("reverses_entry_id" IS NULL) OR ("reverses_entry_id" <> "id"))),
    CONSTRAINT "journal_entries_source_system_check" CHECK (("source_system" = ANY (ARRAY['manual'::"text", 'airtable'::"text", 'system'::"text"])))
);

ALTER TABLE "public"."journal_entries" OWNER TO "postgres";

COMMENT ON COLUMN "public"."journal_entries"."transaction_type" IS 'Free-text T-Chart category title from column A, supplied by the Airtable trigger.';

COMMENT ON COLUMN "public"."journal_entries"."source_event_type" IS 'Airtable payment lifecycle event, such as sent, reconciled, cancelled or returned, for source-event replay isolation.';

ALTER TABLE "public"."journal_entries" ALTER COLUMN "entry_number" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."journal_entries_entry_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."journal_lines" (
    "id" bigint NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "line_no" smallint NOT NULL,
    "account_code" "text" NOT NULL,
    "offset_account_code" "text",
    "debit" numeric(18,2) DEFAULT 0 NOT NULL,
    "credit" numeric(18,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "audit_link" "text",
    "vendor_ref" "text",
    "customer_ref" "text",
    "order_ref" "text",
    "po_ref" "text",
    "invoice_ref" "text",
    "employee_ref" "text",
    "state_code" "text",
    "airtable_record_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "branch" "text",
    CONSTRAINT "journal_lines_credit_check" CHECK (("credit" >= (0)::numeric)),
    CONSTRAINT "journal_lines_debit_check" CHECK (("debit" >= (0)::numeric)),
    CONSTRAINT "journal_lines_one_side" CHECK ((("debit" > (0)::numeric) <> ("credit" > (0)::numeric))),
    CONSTRAINT "journal_lines_state_code_check" CHECK (("state_code" ~ '^[A-Z]{2}$'::"text"))
);

ALTER TABLE "public"."journal_lines" OWNER TO "postgres";

COMMENT ON COLUMN "public"."journal_lines"."branch" IS 'Reserved for future branch attribution. Nullable and unpopulated while consolidated reporting is used.';

ALTER TABLE "public"."journal_lines" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."journal_lines_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."ledger_rule_lines" (
    "id" bigint NOT NULL,
    "rule_code" "text" NOT NULL,
    "side" "public"."balance_side" NOT NULL,
    "line_order" smallint NOT NULL,
    "account_code" "text",
    "account_selector" "text",
    "label" "text" NOT NULL,
    "is_optional" boolean DEFAULT false NOT NULL,
    CONSTRAINT "ledger_rule_lines_one_target" CHECK (("num_nonnulls"("account_code", "account_selector") = 1))
);

ALTER TABLE "public"."ledger_rule_lines" OWNER TO "postgres";

ALTER TABLE "public"."ledger_rule_lines" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."ledger_rule_lines_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."ledger_rules" (
    "rule_code" "text" NOT NULL,
    "category" "public"."rule_category" NOT NULL,
    "sort_order" integer NOT NULL,
    "trigger_name" "text" NOT NULL,
    "when_to_post" "text",
    "fin_notes" "text",
    "dev_notes" "text",
    "audit_trail" "text",
    "airtable_sources" "text",
    "reversible" boolean,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."ledger_rules" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."v_account_monthly_activity" WITH ("security_invoker"='true') AS
 SELECT "e"."period_month",
    "l"."account_code",
    "a"."name" AS "account_name",
    "a"."account_type",
    "a"."subtype" AS "account_subtype",
    "a"."normal_balance",
    "sum"("l"."debit") AS "total_debit",
    "sum"("l"."credit") AS "total_credit",
    "sum"(("l"."debit" - "l"."credit")) AS "net_debit",
    "sum"(
        CASE
            WHEN ("a"."normal_balance" = 'debit'::"public"."balance_side") THEN ("l"."debit" - "l"."credit")
            ELSE ("l"."credit" - "l"."debit")
        END) AS "net_natural"
   FROM (("public"."journal_lines" "l"
     JOIN "public"."journal_entries" "e" ON ((("e"."id" = "l"."entry_id") AND ("e"."status" = 'posted'::"public"."entry_status"))))
     JOIN "public"."accounts" "a" ON (("a"."code" = "l"."account_code")))
  GROUP BY "e"."period_month", "l"."account_code", "a"."name", "a"."account_type", "a"."subtype", "a"."normal_balance";

ALTER VIEW "public"."v_account_monthly_activity" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."v_journal_entries" WITH ("security_invoker"='true') AS
 SELECT "e"."id",
    "e"."entry_number",
    "e"."entry_date",
    "e"."period_month",
    "e"."status",
    "e"."rule_code",
    "r"."category" AS "rule_category",
    "r"."trigger_name",
    "e"."description",
    "e"."notes",
    "e"."audit_link",
    COALESCE("t"."total_debit", (0)::numeric) AS "total_debit",
    COALESCE("t"."total_credit", (0)::numeric) AS "total_credit",
    COALESCE("t"."line_count", (0)::bigint) AS "line_count",
    (COALESCE("t"."total_debit", (0)::numeric) = COALESCE("t"."total_credit", (0)::numeric)) AS "is_balanced",
    "e"."reverses_entry_id",
    "orig"."entry_number" AS "reverses_entry_number",
    "rev"."id" AS "reversed_by_entry_id",
    "rev"."entry_number" AS "reversed_by_entry_number",
    ("rev"."id" IS NOT NULL) AS "is_reversed",
    "e"."source_system",
    "e"."source_table",
    "e"."source_record_id",
    "e"."external_ref",
    "e"."created_by",
    "e"."created_at",
    "e"."posted_by",
    "e"."posted_at"
   FROM (((("public"."journal_entries" "e"
     LEFT JOIN "public"."ledger_rules" "r" ON (("r"."rule_code" = "e"."rule_code")))
     LEFT JOIN ( SELECT "journal_lines"."entry_id",
            "sum"("journal_lines"."debit") AS "total_debit",
            "sum"("journal_lines"."credit") AS "total_credit",
            "count"(*) AS "line_count"
           FROM "public"."journal_lines"
          GROUP BY "journal_lines"."entry_id") "t" ON (("t"."entry_id" = "e"."id")))
     LEFT JOIN "public"."journal_entries" "orig" ON (("orig"."id" = "e"."reverses_entry_id")))
     LEFT JOIN "public"."journal_entries" "rev" ON ((("rev"."reverses_entry_id" = "e"."id") AND ("rev"."status" = 'posted'::"public"."entry_status"))));

ALTER VIEW "public"."v_journal_entries" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."v_ledger" WITH ("security_invoker"='true') AS
 WITH "lines" AS (
         SELECT "l_1"."id",
            "l_1"."entry_id",
            "l_1"."line_no",
            "l_1"."account_code",
            "l_1"."offset_account_code",
            "l_1"."debit",
            "l_1"."credit",
            "l_1"."notes",
            "l_1"."audit_link",
            "l_1"."vendor_ref",
            "l_1"."customer_ref",
            "l_1"."order_ref",
            "l_1"."po_ref",
            "l_1"."invoice_ref",
            "l_1"."employee_ref",
            "l_1"."state_code",
            "l_1"."airtable_record_id",
            "l_1"."created_at",
            ("l_1"."debit" > (0)::numeric) AS "is_debit"
           FROM "public"."journal_lines" "l_1"
        ), "offsets" AS (
         SELECT "l_1"."id" AS "line_id",
            "count"(DISTINCT "o"."account_code") AS "n_offset_accounts",
            "string_agg"(DISTINCT "o"."account_code", ', '::"text") AS "offset_codes",
            ("array_agg"("o"."account_code" ORDER BY ("o"."debit" + "o"."credit") DESC, "o"."line_no"))[1] AS "top_offset_code"
           FROM ("lines" "l_1"
             JOIN "lines" "o" ON ((("o"."entry_id" = "l_1"."entry_id") AND ("o"."is_debit" <> "l_1"."is_debit"))))
          GROUP BY "l_1"."id"
        )
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
   FROM (((((("lines" "l"
     JOIN "public"."journal_entries" "e" ON ((("e"."id" = "l"."entry_id") AND ("e"."status" = 'posted'::"public"."entry_status"))))
     JOIN "public"."accounts" "a" ON (("a"."code" = "l"."account_code")))
     LEFT JOIN "offsets" "off" ON (("off"."line_id" = "l"."id")))
     LEFT JOIN "public"."accounts" "oa_explicit" ON (("oa_explicit"."code" = "l"."offset_account_code")))
     LEFT JOIN "public"."accounts" "oa_single" ON (("oa_single"."code" = "off"."top_offset_code")))
     LEFT JOIN "public"."ledger_rules" "r" ON (("r"."rule_code" = "e"."rule_code")));

ALTER VIEW "public"."v_ledger" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."v_rule_conformance" WITH ("security_invoker"='true') AS
 SELECT "e"."id" AS "entry_id",
    "e"."entry_number",
    "e"."entry_date",
    "e"."rule_code",
    "l"."line_no",
    "l"."account_code",
    "s"."side",
    (EXISTS ( SELECT 1
           FROM ("public"."ledger_rule_lines" "rl"
             LEFT JOIN "public"."account_selector_members" "m" ON (("m"."selector" = "rl"."account_selector")))
          WHERE (("rl"."rule_code" = "e"."rule_code") AND ("rl"."side" = "s"."side") AND (("rl"."account_code" = "l"."account_code") OR ("m"."account_code" = "l"."account_code"))))) AS "matches_rule"
   FROM (("public"."journal_entries" "e"
     JOIN "public"."journal_lines" "l" ON (("l"."entry_id" = "e"."id")))
     CROSS JOIN LATERAL ( SELECT (
                CASE
                    WHEN (("l"."debit" > (0)::numeric) <> ("e"."reverses_entry_id" IS NOT NULL)) THEN 'debit'::"text"
                    ELSE 'credit'::"text"
                END)::"public"."balance_side" AS "side") "s")
  WHERE (("e"."rule_code" IS NOT NULL) AND ("e"."status" = 'posted'::"public"."entry_status"));

ALTER VIEW "public"."v_rule_conformance" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."v_t_chart" AS
SELECT
    NULL::"text" AS "rule_code",
    NULL::"public"."rule_category" AS "category",
    NULL::integer AS "sort_order",
    NULL::"text" AS "trigger_name",
    NULL::"text" AS "debit_accounts",
    NULL::"text" AS "credit_accounts",
    NULL::boolean AS "reversible",
    NULL::"text" AS "airtable_sources",
    NULL::"text" AS "when_to_post",
    NULL::"text" AS "fin_notes",
    NULL::"text" AS "dev_notes",
    NULL::"text" AS "audit_trail",
    NULL::boolean AS "active";

ALTER VIEW "public"."v_t_chart" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."v_trial_balance" WITH ("security_invoker"='true') AS
 SELECT "a"."code" AS "account_number",
    "a"."name" AS "account_name",
    "a"."account_type",
    "a"."subtype" AS "account_subtype",
    "a"."normal_balance",
    COALESCE("sum"("l"."debit"), (0)::numeric) AS "total_debit",
    COALESCE("sum"("l"."credit"), (0)::numeric) AS "total_credit",
    COALESCE("sum"(
        CASE
            WHEN ("a"."normal_balance" = 'debit'::"public"."balance_side") THEN ("l"."debit" - "l"."credit")
            ELSE ("l"."credit" - "l"."debit")
        END), (0)::numeric) AS "balance"
   FROM ("public"."accounts" "a"
     LEFT JOIN ("public"."journal_lines" "l"
     JOIN "public"."journal_entries" "e" ON ((("e"."id" = "l"."entry_id") AND ("e"."status" = 'posted'::"public"."entry_status")))) ON (("l"."account_code" = "a"."code")))
  GROUP BY "a"."code", "a"."name", "a"."account_type", "a"."subtype", "a"."normal_balance";

ALTER VIEW "public"."v_trial_balance" OWNER TO "postgres";

ALTER TABLE ONLY "public"."account_selector_members"
    ADD CONSTRAINT "account_selector_members_pkey" PRIMARY KEY ("selector", "account_code");

ALTER TABLE ONLY "public"."account_selectors"
    ADD CONSTRAINT "account_selectors_pkey" PRIMARY KEY ("selector");

ALTER TABLE ONLY "public"."accounting_periods"
    ADD CONSTRAINT "accounting_periods_pkey" PRIMARY KEY ("period_month");

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_airtable_record_id_key" UNIQUE ("airtable_record_id");

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("code");

ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_pkey" PRIMARY KEY ("email");

ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_entry_number_key" UNIQUE ("entry_number");

ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."journal_lines"
    ADD CONSTRAINT "journal_lines_entry_id_line_no_key" UNIQUE ("entry_id", "line_no");

ALTER TABLE ONLY "public"."journal_lines"
    ADD CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ledger_rule_lines"
    ADD CONSTRAINT "ledger_rule_lines_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ledger_rule_lines"
    ADD CONSTRAINT "ledger_rule_lines_rule_code_side_line_order_key" UNIQUE ("rule_code", "side", "line_order");

ALTER TABLE ONLY "public"."ledger_rules"
    ADD CONSTRAINT "ledger_rules_pkey" PRIMARY KEY ("rule_code");

CREATE INDEX "account_selector_members_account_idx" ON "public"."account_selector_members" USING "btree" ("account_code");

CREATE INDEX "journal_entries_date_idx" ON "public"."journal_entries" USING "btree" ("entry_date");

CREATE UNIQUE INDEX "journal_entries_one_reversal_idx" ON "public"."journal_entries" USING "btree" ("reverses_entry_id") WHERE ("reverses_entry_id" IS NOT NULL);

CREATE INDEX "journal_entries_period_idx" ON "public"."journal_entries" USING "btree" ("period_month");

CREATE INDEX "journal_entries_rule_idx" ON "public"."journal_entries" USING "btree" ("rule_code");

CREATE UNIQUE INDEX "journal_entries_source_uniq_idx" ON "public"."journal_entries" USING "btree" ("source_system", "source_table", "source_record_id", "rule_code") NULLS NOT DISTINCT WHERE (("source_record_id" IS NOT NULL) AND ("reverses_entry_id" IS NULL));

CREATE INDEX "journal_entries_status_idx" ON "public"."journal_entries" USING "btree" ("status");

CREATE INDEX "journal_lines_account_idx" ON "public"."journal_lines" USING "btree" ("account_code");

CREATE INDEX "journal_lines_offset_account_idx" ON "public"."journal_lines" USING "btree" ("offset_account_code");

CREATE INDEX "ledger_rule_lines_account_idx" ON "public"."ledger_rule_lines" USING "btree" ("account_code");

CREATE INDEX "ledger_rule_lines_selector_idx" ON "public"."ledger_rule_lines" USING "btree" ("account_selector");

CREATE OR REPLACE VIEW "public"."v_t_chart" WITH ("security_invoker"='true') AS
 SELECT "r"."rule_code",
    "r"."category",
    "r"."sort_order",
    "r"."trigger_name",
    "string_agg"("rl"."label", ' • '::"text" ORDER BY "rl"."line_order") FILTER (WHERE ("rl"."side" = 'debit'::"public"."balance_side")) AS "debit_accounts",
    "string_agg"("rl"."label", ' • '::"text" ORDER BY "rl"."line_order") FILTER (WHERE ("rl"."side" = 'credit'::"public"."balance_side")) AS "credit_accounts",
    "r"."reversible",
    "r"."airtable_sources",
    "r"."when_to_post",
    "r"."fin_notes",
    "r"."dev_notes",
    "r"."audit_trail",
    "r"."active"
   FROM ("public"."ledger_rules" "r"
     LEFT JOIN "public"."ledger_rule_lines" "rl" ON (("rl"."rule_code" = "r"."rule_code")))
  GROUP BY "r"."rule_code";

CREATE OR REPLACE TRIGGER "accounting_periods_updated_at" BEFORE UPDATE ON "public"."accounting_periods" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "accounts_updated_at" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "journal_entries_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."journal_entries" FOR EACH ROW EXECUTE FUNCTION "public"."tg_journal_entries_guard"();

CREATE OR REPLACE TRIGGER "journal_lines_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."journal_lines" FOR EACH ROW EXECUTE FUNCTION "public"."tg_journal_lines_guard"();

CREATE OR REPLACE TRIGGER "ledger_rules_updated_at" BEFORE UPDATE ON "public"."ledger_rules" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

ALTER TABLE ONLY "public"."account_selector_members"
    ADD CONSTRAINT "account_selector_members_account_code_fkey" FOREIGN KEY ("account_code") REFERENCES "public"."accounts"("code") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."account_selector_members"
    ADD CONSTRAINT "account_selector_members_selector_fkey" FOREIGN KEY ("selector") REFERENCES "public"."account_selectors"("selector") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_reverses_entry_id_fkey" FOREIGN KEY ("reverses_entry_id") REFERENCES "public"."journal_entries"("id");

ALTER TABLE ONLY "public"."journal_entries"
    ADD CONSTRAINT "journal_entries_rule_code_fkey" FOREIGN KEY ("rule_code") REFERENCES "public"."ledger_rules"("rule_code") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."journal_lines"
    ADD CONSTRAINT "journal_lines_account_code_fkey" FOREIGN KEY ("account_code") REFERENCES "public"."accounts"("code") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."journal_lines"
    ADD CONSTRAINT "journal_lines_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."journal_lines"
    ADD CONSTRAINT "journal_lines_offset_account_code_fkey" FOREIGN KEY ("offset_account_code") REFERENCES "public"."accounts"("code") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."ledger_rule_lines"
    ADD CONSTRAINT "ledger_rule_lines_account_code_fkey" FOREIGN KEY ("account_code") REFERENCES "public"."accounts"("code") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."ledger_rule_lines"
    ADD CONSTRAINT "ledger_rule_lines_account_selector_fkey" FOREIGN KEY ("account_selector") REFERENCES "public"."account_selectors"("selector") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."ledger_rule_lines"
    ADD CONSTRAINT "ledger_rule_lines_rule_code_fkey" FOREIGN KEY ("rule_code") REFERENCES "public"."ledger_rules"("rule_code") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."account_selector_members" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."account_selectors" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."accounting_periods" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin delete" ON "public"."account_selector_members" FOR DELETE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "admin delete" ON "public"."ledger_rule_lines" FOR DELETE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "admin insert" ON "public"."account_selector_members" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "admin insert" ON "public"."account_selectors" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "admin insert" ON "public"."accounts" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "admin insert" ON "public"."ledger_rule_lines" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "admin insert" ON "public"."ledger_rules" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "admin update" ON "public"."account_selectors" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text")) WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "admin update" ON "public"."accounts" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text")) WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "admin update" ON "public"."ledger_rule_lines" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text")) WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "admin update" ON "public"."ledger_rules" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text")) WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = 'admin'::"text"));

CREATE POLICY "app users read" ON "public"."account_selector_members" FOR SELECT TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") IS NOT NULL));

CREATE POLICY "app users read" ON "public"."account_selectors" FOR SELECT TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") IS NOT NULL));

CREATE POLICY "app users read" ON "public"."accounting_periods" FOR SELECT TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") IS NOT NULL));

CREATE POLICY "app users read" ON "public"."accounts" FOR SELECT TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") IS NOT NULL));

CREATE POLICY "app users read" ON "public"."journal_entries" FOR SELECT TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") IS NOT NULL));

CREATE POLICY "app users read" ON "public"."journal_lines" FOR SELECT TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") IS NOT NULL));

CREATE POLICY "app users read" ON "public"."ledger_rule_lines" FOR SELECT TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") IS NOT NULL));

CREATE POLICY "app users read" ON "public"."ledger_rules" FOR SELECT TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") IS NOT NULL));

ALTER TABLE "public"."app_users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance delete" ON "public"."journal_entries" FOR DELETE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"])));

CREATE POLICY "finance delete" ON "public"."journal_lines" FOR DELETE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"])));

CREATE POLICY "finance insert" ON "public"."accounting_periods" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"])));

CREATE POLICY "finance insert" ON "public"."journal_entries" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"])));

CREATE POLICY "finance insert" ON "public"."journal_lines" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"])));

CREATE POLICY "finance update" ON "public"."accounting_periods" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"]))) WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"])));

CREATE POLICY "finance update" ON "public"."journal_entries" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"]))) WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"])));

CREATE POLICY "finance update" ON "public"."journal_lines" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"]))) WITH CHECK ((( SELECT "public"."current_app_role"() AS "current_app_role") = ANY (ARRAY['finance'::"text", 'admin'::"text"])));

ALTER TABLE "public"."journal_entries" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."journal_lines" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ledger_rule_lines" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ledger_rules" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own row" ON "public"."app_users" FOR SELECT TO "authenticated" USING (("email" = "lower"(( SELECT ("auth"."jwt"() ->> 'email'::"text")))));

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

REVOKE ALL ON FUNCTION "public"."create_journal_entry"("p_entry" "jsonb", "p_lines" "jsonb", "p_post" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_journal_entry"("p_entry" "jsonb", "p_lines" "jsonb", "p_post" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."create_journal_entry"("p_entry" "jsonb", "p_lines" "jsonb", "p_post" boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."current_app_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_app_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_app_role"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_trial_balance"("p_as_of" "date", "p_from" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_trial_balance"("p_as_of" "date", "p_from" "date") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_trial_balance"("p_as_of" "date", "p_from" "date") TO "authenticated";

REVOKE ALL ON FUNCTION "public"."post_journal_entry"("p_entry_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."post_journal_entry"("p_entry_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."post_journal_entry"("p_entry_id" "uuid") TO "authenticated";

REVOKE ALL ON FUNCTION "public"."reverse_journal_entry"("p_entry_id" "uuid", "p_reversal_date" "date", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reverse_journal_entry"("p_entry_id" "uuid", "p_reversal_date" "date", "p_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."reverse_journal_entry"("p_entry_id" "uuid", "p_reversal_date" "date", "p_reason" "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."tg_journal_entries_guard"() TO "service_role";
GRANT ALL ON FUNCTION "public"."tg_journal_entries_guard"() TO PUBLIC;

GRANT ALL ON FUNCTION "public"."tg_journal_lines_guard"() TO "service_role";
GRANT ALL ON FUNCTION "public"."tg_journal_lines_guard"() TO PUBLIC;

GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO PUBLIC;

GRANT ALL ON TABLE "public"."account_selector_members" TO "service_role";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."account_selector_members" TO "authenticated";

GRANT ALL ON TABLE "public"."account_selectors" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."account_selectors" TO "authenticated";

GRANT ALL ON TABLE "public"."accounting_periods" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."accounting_periods" TO "authenticated";

GRANT ALL ON TABLE "public"."accounts" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."accounts" TO "authenticated";

GRANT ALL ON TABLE "public"."app_users" TO "service_role";
GRANT SELECT ON TABLE "public"."app_users" TO "authenticated";

GRANT ALL ON TABLE "public"."journal_entries" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."journal_entries" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."journal_entries_entry_number_seq" TO "service_role";

GRANT ALL ON TABLE "public"."journal_lines" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."journal_lines" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."journal_lines_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."ledger_rule_lines" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ledger_rule_lines" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."ledger_rule_lines_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."ledger_rules" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."ledger_rules" TO "authenticated";

GRANT ALL ON TABLE "public"."v_account_monthly_activity" TO "service_role";
GRANT SELECT ON TABLE "public"."v_account_monthly_activity" TO "authenticated";

GRANT ALL ON TABLE "public"."v_journal_entries" TO "service_role";
GRANT SELECT ON TABLE "public"."v_journal_entries" TO "authenticated";

GRANT ALL ON TABLE "public"."v_ledger" TO "service_role";
GRANT SELECT ON TABLE "public"."v_ledger" TO "authenticated";

GRANT ALL ON TABLE "public"."v_rule_conformance" TO "service_role";
GRANT SELECT ON TABLE "public"."v_rule_conformance" TO "authenticated";

GRANT ALL ON TABLE "public"."v_t_chart" TO "service_role";
GRANT SELECT ON TABLE "public"."v_t_chart" TO "authenticated";

GRANT ALL ON TABLE "public"."v_trial_balance" TO "service_role";
GRANT SELECT ON TABLE "public"."v_trial_balance" TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

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
