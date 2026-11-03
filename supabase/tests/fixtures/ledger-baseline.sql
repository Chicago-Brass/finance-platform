-- Test-only ledger baseline captured read-only from DUAL ENTRY on 2026-10-30.

-- Includes configuration and financial guards; contains no journal records.

create schema if not exists auth;

create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;

do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if; if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if; if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if; end $$;

create type public.account_type as enum ('asset', 'liability', 'equity', 'revenue', 'expense');

create type public.balance_side as enum ('debit', 'credit');

create type public.entry_status as enum ('draft', 'posted');

create type public.rule_category as enum ('expense', 'payment', 'invoice_entry', 'other');

create table public.account_selector_members (
  selector text not null,
  account_code text not null
);

create table public.account_selectors (
  selector text not null,
  description text not null
);

create table public.accounting_periods (
  period_month date not null,
  status text default 'open'::text not null,
  closed_at timestamp with time zone,
  closed_by text,
  notes text,
  updated_at timestamp with time zone default now() not null
);

create table public.accounts (
  code text not null,
  name text not null,
  account_type account_type not null,
  subtype text,
  normal_balance balance_side not null,
  is_bank boolean default false not null,
  is_postable boolean default true not null,
  active boolean default true not null,
  description text,
  airtable_record_id text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.journal_entries (
  id uuid default gen_random_uuid() not null,
  entry_number bigint generated always as identity not null,
  entry_date date not null,
  period_month date generated always as ((date_trunc('month'::text, (entry_date)::timestamp without time zone))::date) stored,
  rule_code text,
  description text not null,
  notes text,
  audit_link text,
  status entry_status default 'draft'::entry_status not null,
  reverses_entry_id uuid,
  reversal_reason text,
  source_system text default 'manual'::text not null,
  source_table text,
  source_record_id text,
  external_ref text,
  created_by text default (auth.jwt() ->> 'email'::text),
  created_at timestamp with time zone default now() not null,
  posted_at timestamp with time zone,
  posted_by text
);

create table public.journal_lines (
  id bigint generated always as identity not null,
  entry_id uuid not null,
  line_no smallint not null,
  account_code text not null,
  offset_account_code text,
  debit numeric(18,2) default 0 not null,
  credit numeric(18,2) default 0 not null,
  notes text,
  audit_link text,
  vendor_ref text,
  customer_ref text,
  order_ref text,
  po_ref text,
  invoice_ref text,
  employee_ref text,
  state_code text,
  airtable_record_id text,
  created_at timestamp with time zone default now() not null
);

create table public.ledger_rule_lines (
  id bigint generated always as identity not null,
  rule_code text not null,
  side balance_side not null,
  line_order smallint not null,
  account_code text,
  account_selector text,
  label text not null,
  is_optional boolean default false not null
);

create table public.ledger_rules (
  rule_code text not null,
  category rule_category not null,
  sort_order integer not null,
  trigger_name text not null,
  when_to_post text,
  fin_notes text,
  dev_notes text,
  audit_trail text,
  airtable_sources text,
  reversible boolean,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.account_selector_members add constraint account_selector_members_pkey PRIMARY KEY (selector, account_code);

alter table public.account_selectors add constraint account_selectors_pkey PRIMARY KEY (selector);

alter table public.accounting_periods add constraint accounting_periods_period_month_check CHECK (EXTRACT(day FROM period_month) = 1::numeric);

alter table public.accounting_periods add constraint accounting_periods_pkey PRIMARY KEY (period_month);

alter table public.accounting_periods add constraint accounting_periods_status_check CHECK (status = ANY (ARRAY['open'::text, 'closed'::text]));

alter table public.accounts add constraint accounts_airtable_record_id_key UNIQUE (airtable_record_id);

alter table public.accounts add constraint accounts_code_check CHECK (code ~ '^\d{3}\.\d{3}$'::text);

alter table public.accounts add constraint accounts_pkey PRIMARY KEY (code);

alter table public.journal_entries add constraint journal_entries_entry_number_key UNIQUE (entry_number);

alter table public.journal_entries add constraint journal_entries_not_self_reversal CHECK (reverses_entry_id IS NULL OR reverses_entry_id <> id);

alter table public.journal_entries add constraint journal_entries_pkey PRIMARY KEY (id);

alter table public.journal_entries add constraint journal_entries_source_system_check CHECK (source_system = ANY (ARRAY['manual'::text, 'airtable'::text, 'system'::text]));

alter table public.journal_lines add constraint journal_lines_credit_check CHECK (credit >= 0::numeric);

alter table public.journal_lines add constraint journal_lines_debit_check CHECK (debit >= 0::numeric);

alter table public.journal_lines add constraint journal_lines_entry_id_line_no_key UNIQUE (entry_id, line_no);

alter table public.journal_lines add constraint journal_lines_one_side CHECK ((debit > 0::numeric) <> (credit > 0::numeric));

alter table public.journal_lines add constraint journal_lines_pkey PRIMARY KEY (id);

alter table public.journal_lines add constraint journal_lines_state_code_check CHECK (state_code ~ '^[A-Z]{2}$'::text);

alter table public.ledger_rule_lines add constraint ledger_rule_lines_one_target CHECK (num_nonnulls(account_code, account_selector) = 1);

alter table public.ledger_rule_lines add constraint ledger_rule_lines_pkey PRIMARY KEY (id);

alter table public.ledger_rule_lines add constraint ledger_rule_lines_rule_code_side_line_order_key UNIQUE (rule_code, side, line_order);

alter table public.ledger_rules add constraint ledger_rules_pkey PRIMARY KEY (rule_code);

alter table public.account_selector_members add constraint account_selector_members_account_code_fkey FOREIGN KEY (account_code) REFERENCES accounts(code) ON UPDATE CASCADE;

alter table public.account_selector_members add constraint account_selector_members_selector_fkey FOREIGN KEY (selector) REFERENCES account_selectors(selector) ON UPDATE CASCADE ON DELETE CASCADE;

alter table public.journal_entries add constraint journal_entries_reverses_entry_id_fkey FOREIGN KEY (reverses_entry_id) REFERENCES journal_entries(id);

alter table public.journal_entries add constraint journal_entries_rule_code_fkey FOREIGN KEY (rule_code) REFERENCES ledger_rules(rule_code) ON UPDATE CASCADE;

alter table public.journal_lines add constraint journal_lines_account_code_fkey FOREIGN KEY (account_code) REFERENCES accounts(code) ON UPDATE CASCADE;

alter table public.journal_lines add constraint journal_lines_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;

alter table public.journal_lines add constraint journal_lines_offset_account_code_fkey FOREIGN KEY (offset_account_code) REFERENCES accounts(code) ON UPDATE CASCADE;

alter table public.ledger_rule_lines add constraint ledger_rule_lines_account_code_fkey FOREIGN KEY (account_code) REFERENCES accounts(code) ON UPDATE CASCADE;

alter table public.ledger_rule_lines add constraint ledger_rule_lines_account_selector_fkey FOREIGN KEY (account_selector) REFERENCES account_selectors(selector) ON UPDATE CASCADE;

alter table public.ledger_rule_lines add constraint ledger_rule_lines_rule_code_fkey FOREIGN KEY (rule_code) REFERENCES ledger_rules(rule_code) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX account_selector_members_account_idx ON public.account_selector_members USING btree (account_code);

CREATE INDEX journal_entries_date_idx ON public.journal_entries USING btree (entry_date);

CREATE UNIQUE INDEX journal_entries_one_reversal_idx ON public.journal_entries USING btree (reverses_entry_id) WHERE (reverses_entry_id IS NOT NULL);

CREATE INDEX journal_entries_period_idx ON public.journal_entries USING btree (period_month);

CREATE INDEX journal_entries_rule_idx ON public.journal_entries USING btree (rule_code);

CREATE UNIQUE INDEX journal_entries_source_uniq_idx ON public.journal_entries USING btree (source_system, source_table, source_record_id, rule_code) NULLS NOT DISTINCT WHERE ((source_record_id IS NOT NULL) AND (reverses_entry_id IS NULL));

CREATE INDEX journal_entries_status_idx ON public.journal_entries USING btree (status);

CREATE INDEX journal_lines_account_idx ON public.journal_lines USING btree (account_code);

CREATE INDEX journal_lines_offset_account_idx ON public.journal_lines USING btree (offset_account_code);

CREATE INDEX ledger_rule_lines_account_idx ON public.ledger_rule_lines USING btree (account_code);

CREATE INDEX ledger_rule_lines_selector_idx ON public.ledger_rule_lines USING btree (account_selector);

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin new.updated_at := now(); return new; end $function$;

CREATE OR REPLACE FUNCTION public.tg_journal_entries_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.tg_journal_lines_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.create_journal_entry(p_entry jsonb, p_lines jsonb, p_post boolean DEFAULT true)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.reverse_journal_entry(p_entry_id uuid, p_reversal_date date DEFAULT CURRENT_DATE, p_reason text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$;

CREATE TRIGGER accounting_periods_updated_at BEFORE UPDATE ON accounting_periods FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

CREATE TRIGGER journal_entries_guard BEFORE INSERT OR DELETE OR UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION tg_journal_entries_guard();

CREATE TRIGGER journal_lines_guard BEFORE INSERT OR DELETE OR UPDATE ON journal_lines FOR EACH ROW EXECUTE FUNCTION tg_journal_lines_guard();

CREATE TRIGGER ledger_rules_updated_at BEFORE UPDATE ON ledger_rules FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

insert into public.accounts (code, name, account_type, normal_balance, active, is_bank, is_postable, airtable_record_id) select code, name, account_type, normal_balance, active, is_bank, is_postable, airtable_record_id from json_populate_recordset(null::public.accounts, '[{"code":"004.001","name":"Product Revenue \u2013 Brass Hardware","active":true,"is_bank":false,"is_postable":true,"account_type":"revenue","normal_balance":"credit","airtable_record_id":null},{"code":"004.003","name":"Freight Charged to Clients","active":true,"is_bank":false,"is_postable":true,"account_type":"revenue","normal_balance":"credit","airtable_record_id":null},{"code":"004.004","name":"Insurance Claim Recoveries","active":true,"is_bank":false,"is_postable":true,"account_type":"revenue","normal_balance":"credit","airtable_record_id":null},{"code":"004.005","name":"Restocking & Cancellation Fees","active":true,"is_bank":false,"is_postable":true,"account_type":"revenue","normal_balance":"credit","airtable_record_id":null},{"code":"004.006","name":"Sales Returns & Allowances","active":true,"is_bank":false,"is_postable":true,"account_type":"revenue","normal_balance":"debit","airtable_record_id":null},{"code":"004.010","name":"Cost of Goods Sold","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"004.011","name":"Purchase Discounts & Rebates","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"credit","airtable_record_id":null},{"code":"004.013","name":"Freight & Handling Cost","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"004.015","name":"Inventory / Purchase Price Variance","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"005.001","name":"Staff \u2013 Owners","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"005.002","name":"Salary \u2013 W2","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"005.003","name":"Staff \u2013 1099","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"005.005","name":"401(k) Employer Contribution","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"005.006","name":"Payroll Taxes","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"005.101","name":"Staff \u2013 Offshore","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"005.201","name":"Bonus & Commission","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"006.002","name":"Utilities","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"007.002","name":"Bank, Wire & FX Fees","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"007.003","name":"Interest Expense","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"007.005","name":"Bad Debt Expense","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"007.006","name":"Sales Tax Miscalculations","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"007.011","name":"General Insurance","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"008.001","name":"Software Licensing","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"009.101","name":"Depreciation Expense","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"010.001","name":"Miscellaneous Income","active":true,"is_bank":false,"is_postable":true,"account_type":"revenue","normal_balance":"credit","airtable_record_id":null},{"code":"010.003","name":"Interest & Dividend Income","active":true,"is_bank":false,"is_postable":true,"account_type":"revenue","normal_balance":"credit","airtable_record_id":null},{"code":"011.001","name":"Federal Income Tax Expense","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"011.002","name":"State Income Tax Expense","active":true,"is_bank":false,"is_postable":true,"account_type":"expense","normal_balance":"debit","airtable_record_id":null},{"code":"112.100","name":"Bank \u2013 Fifth Third","active":true,"is_bank":true,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"112.200","name":"Cash \u2013 Fidelity","active":true,"is_bank":true,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"112.300","name":"Bank \u2013 Nickel","active":true,"is_bank":true,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"121.100","name":"Accounts Receivable","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"121.900","name":"Allowance for Doubtful Accounts","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"credit","airtable_record_id":null},{"code":"122.100","name":"Insurance Claims Receivable","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"131.100","name":"Inventory \u2013 Committed to Client Orders","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"131.300","name":"Inventory \u2013 On-Hand Stock (Uncommitted)","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"131.400","name":"Inventory \u2013 Pending Return Processing","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"132.100","name":"Vendor Deposits / PO Pre-Payments","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"135.000","name":"Prepaid Expenses","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"143.200","name":"Security Deposits","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"143.300","name":"Display Fixtures & Equipment","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null},{"code":"161.000","name":"Accumulated Depreciation","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"credit","airtable_record_id":null},{"code":"211.100","name":"Accounts Payable","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"211.200","name":"Received Not Invoiced (GRNI)","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"212.100","name":"Sales Tax Payable","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"221.100","name":"Customer Deposits","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"221.300","name":"Client Credits on Account","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"231.100","name":"Credit Card Payable","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"231.200","name":"Line of Credit Payable","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"232.100","name":"Auto Loan Payable","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"241.100","name":"Accrued Salaries & Wages","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"241.200","name":"Accrued Payroll Taxes","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"241.300","name":"Accrued Bonus & Commission","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"241.400","name":"Accrued 401(k)","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"241.500","name":"Accrued PTO","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"241.600","name":"Employee Benefit Deductions Payable","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"242.100","name":"Accrued Federal Income Tax","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"242.200","name":"Accrued State Income Tax","active":true,"is_bank":false,"is_postable":true,"account_type":"liability","normal_balance":"credit","airtable_record_id":null},{"code":"311.200","name":"Additional Paid-in Capital","active":true,"is_bank":false,"is_postable":true,"account_type":"equity","normal_balance":"credit","airtable_record_id":null},{"code":"316.100","name":"Shareholder Distributions","active":true,"is_bank":false,"is_postable":true,"account_type":"equity","normal_balance":"debit","airtable_record_id":null},{"code":"999.999","name":"Suspense \u2013 Under Investigation","active":true,"is_bank":false,"is_postable":true,"account_type":"asset","normal_balance":"debit","airtable_record_id":null}]');

insert into public.account_selectors (selector, description) select selector, description from json_populate_recordset(null::public.account_selectors, '[{"selector":"bank","description":"Operating bank: Nickel or Fifth Third"},{"selector":"cogs_or_expense","description":"COGS, or the original expense account for expense credits"},{"selector":"credit_card","description":"Credit Card Payable (AMEX or Visa)"},{"selector":"customer_deposit_or_ar","description":"Customer Deposits or AR, depending on what the payment was applied to"},{"selector":"staff_expense","description":"Staff expense by Employment Type: Offshore / 1099 / Owners"},{"selector":"tech_allowance","description":"Tech Allowance expense (no account code assigned yet in T-Chart)"},{"selector":"vendor_expense","description":"Expense account chosen on the vendor bill / receipt line (any opex; never bank or revenue)"}]');

insert into public.account_selector_members (selector, account_code) select selector, account_code from json_populate_recordset(null::public.account_selector_members, '[{"selector":"bank","account_code":"112.100"},{"selector":"bank","account_code":"112.300"},{"selector":"cogs_or_expense","account_code":"004.010"},{"selector":"cogs_or_expense","account_code":"004.013"},{"selector":"cogs_or_expense","account_code":"004.015"},{"selector":"cogs_or_expense","account_code":"006.002"},{"selector":"cogs_or_expense","account_code":"007.002"},{"selector":"cogs_or_expense","account_code":"007.003"},{"selector":"cogs_or_expense","account_code":"007.005"},{"selector":"cogs_or_expense","account_code":"007.006"},{"selector":"cogs_or_expense","account_code":"007.011"},{"selector":"cogs_or_expense","account_code":"008.001"},{"selector":"credit_card","account_code":"231.100"},{"selector":"customer_deposit_or_ar","account_code":"121.100"},{"selector":"customer_deposit_or_ar","account_code":"221.100"},{"selector":"staff_expense","account_code":"005.001"},{"selector":"staff_expense","account_code":"005.003"},{"selector":"staff_expense","account_code":"005.101"},{"selector":"vendor_expense","account_code":"005.001"},{"selector":"vendor_expense","account_code":"005.002"},{"selector":"vendor_expense","account_code":"005.003"},{"selector":"vendor_expense","account_code":"005.005"},{"selector":"vendor_expense","account_code":"005.006"},{"selector":"vendor_expense","account_code":"005.101"},{"selector":"vendor_expense","account_code":"005.201"},{"selector":"vendor_expense","account_code":"006.002"},{"selector":"vendor_expense","account_code":"007.002"},{"selector":"vendor_expense","account_code":"007.003"},{"selector":"vendor_expense","account_code":"007.005"},{"selector":"vendor_expense","account_code":"007.006"},{"selector":"vendor_expense","account_code":"007.011"},{"selector":"vendor_expense","account_code":"008.001"},{"selector":"vendor_expense","account_code":"009.101"}]');

insert into public.ledger_rules (rule_code, category, sort_order, trigger_name, when_to_post, fin_notes, dev_notes, audit_trail, airtable_sources, reversible, active) select rule_code, category, sort_order, trigger_name, when_to_post, fin_notes, dev_notes, audit_trail, airtable_sources, reversible, active from json_populate_recordset(null::public.ledger_rules, '[{"active":true,"category":"payment","dev_notes":null,"fin_notes":"CRITICAL gap today: only the bank side is recorded. Nothing tracks the deposit as money owed to the client.","rule_code":"PAY-01","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":1,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Customer deposit received (before the order is processed)","when_to_post":"When the client payment is saved and the order has NOT shipped yet. This payment is what turns ''Clear to Purchase'' to YES.","airtable_sources":"FIN \u203a Payments; AR \u203a Payments - NEW; Schedules & Transactions \u203a Transaction"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-02","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":2,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Customer payment AFTER the order shipped (credit-terms clients)","when_to_post":"When the payment is applied to an invoice whose goods have already shipped.","airtable_sources":"FIN \u203a Payments; AR \u203a Payments - NEW; AR \u203a Invoices"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-03","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":3,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Client OVERPAYS or pays with no invoice to apply it to","when_to_post":"When a payment has unapplied money left over.","airtable_sources":"AR \u203a Payments - NEW"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":"If the client OVERPAID by cents: Dr 121.100 / Cr 010.001.","rule_code":"PAY-04","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":4,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Small short-pay / rounding difference written off","when_to_post":"When the payment is applied with a small difference (policy limit, e.g., \u2264 $5).","airtable_sources":"FIN \u203a Payments; AR \u203a Payments - NEW"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-05","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":5,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Refund to a client \u2013 by bank / check","when_to_post":"When the refund payment is sent.","airtable_sources":"FIN \u203a Invoices; FIN \u203a Payments"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":"Never delete the original. Post this reversing entry linked to it.","rule_code":"PAY-06","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":6,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Client payment voided / bounced","when_to_post":"When Void Payment or Cancel Payment = true.","airtable_sources":"FIN \u203a Payments"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-07","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":7,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Pay a vendor / bill from the bank (ACH, wire, check, Nickel, Wise)","when_to_post":null,"airtable_sources":"AP \u203a Payments - NEW; FIN \u203a Payments"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-08","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":8,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Pay a vendor with the company credit card","when_to_post":"When the payment is saved with Method - AP = ''CC - Amex'' or ''CC - Visa''.","airtable_sources":"AP \u203a Payments - NEW; FIN \u203a Payments"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-09","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":9,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Pay the credit-card statement","when_to_post":"When the card batch payment is sent (Payment Record Type = ''CC Batch Payment'').","airtable_sources":"FIN \u203a Payments"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-10","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":10,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Early-payment discount taken when paying a vendor","when_to_post":"When paying within the vendor''s discount window.","airtable_sources":"FIN \u203a Invoice Lines; FIN \u203a Vendors"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":"Net zero in the ledger, but the application record must exist so each vendor''s balance is right.","rule_code":"PAY-11","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":11,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Bill paid using vendor credits (no cash)","when_to_post":"When Method - AP = ''Paid via Credits''.","airtable_sources":"AP \u203a Payments - NEW; FIN \u203a Invoices"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":"Post as a reversing entry. Do not overwrite the original payment.","rule_code":"PAY-12","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":12,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Vendor payment cancelled / returned","when_to_post":"When Cancel Payment = true or Return Payment (AP) = true.","airtable_sources":"AP \u203a Payments - NEW"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-13","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":13,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Vendor sends us a refund","when_to_post":"When the vendor refund is received.","airtable_sources":"FIN \u203a Payments"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-14","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":14,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Payroll \u2013 pay employees and remit taxes/deductions","when_to_post":"When the payroll processor debits the bank (pay date / remittance dates).","airtable_sources":"FIN \u203a Payments"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-15","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":15,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Pay offshore / 1099 / owner staff (Wise, ACH)","when_to_post":"When the payment is sent.","airtable_sources":"FIN \u203a Payments"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":"Gap today: loan bills are coded 100% to the loan account. Always split using the amortization table.","rule_code":"PAY-16","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":16,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Loan payment (principal + interest)","when_to_post":"When the scheduled loan payment clears.","airtable_sources":"FIN \u203a Debt Amortization Table; FIN \u203a Debt Holder"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-17","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":17,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Line of credit \u2013 borrow (draw)","when_to_post":"When the draw hits the bank.","airtable_sources":"None today (new feed / manual)"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-18","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":18,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Line of credit \u2013 repay","when_to_post":"When the repayment leaves the bank.","airtable_sources":"None today (new feed / manual)"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-19","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":19,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Move money between our own bank accounts","when_to_post":"When the transfer is recorded (both sides in ONE entry).","airtable_sources":"FIN \u203a Chart of Accounts"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-20","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":20,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Owner distribution paid","when_to_post":"When the distribution is paid (approved by owners).","airtable_sources":"FIN \u203a Direct Journal Entries"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-21","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":21,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Owner puts money into the company","when_to_post":"When the contribution is received.","airtable_sources":"FIN \u203a Direct Journal Entries"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-22","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":22,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Income tax payment","when_to_post":"When the tax payment is made.","airtable_sources":"None today (new feed / manual)"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-23","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":23,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Insurance claim payout received","when_to_post":"When Claim Status = ''Paid'' and the money arrives.","airtable_sources":"Schedules & Transactions \u203a Claims Manager"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-24","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":24,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Security deposit paid (lease)","when_to_post":"When paid. (Refund = the reverse entry.)","airtable_sources":"FIN \u203a Direct Journal Entries"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-25","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":25,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Interest / dividends received (Fidelity)","when_to_post":"When it appears on the statement.","airtable_sources":"FIN \u203a Income Statement - NEW"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-26","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":26,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Bank reconciliation rounding difference","when_to_post":"During bank reconciliation (limit e.g. \u2264 $5; larger amounts go to 999.999 for investigation).","airtable_sources":"AP \u203a Payments - NEW; FIN \u203a Payments"},{"active":true,"category":"payment","dev_notes":null,"fin_notes":null,"rule_code":"PAY-27","created_at":"2026-10-20T17:28:55.783475+00:00","reversible":true,"sort_order":27,"updated_at":"2026-10-20T17:28:55.783475+00:00","audit_trail":null,"trigger_name":"Credit-card rebate earned (cash back)","when_to_post":"When the card statement is closed.","airtable_sources":"FIN \u203a Payments"}]');

insert into public.ledger_rule_lines (rule_code, side, line_order, account_code, account_selector, label, is_optional) select rule_code, side, line_order, account_code, account_selector, label, is_optional from json_populate_recordset(null::public.ledger_rule_lines, '[{"id":34,"side":"debit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-01","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":35,"side":"credit","label":"Customer Deposits (221.100)","rule_code":"PAY-01","line_order":1,"is_optional":false,"account_code":"221.100","account_selector":null},{"id":36,"side":"debit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-02","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":37,"side":"credit","label":"AR (121.100)","rule_code":"PAY-02","line_order":1,"is_optional":false,"account_code":"121.100","account_selector":null},{"id":38,"side":"debit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-03","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":39,"side":"credit","label":"Client Credits on Account (221.300)","rule_code":"PAY-03","line_order":1,"is_optional":false,"account_code":"221.300","account_selector":null},{"id":40,"side":"debit","label":"Bank, Wire & FX Fees (007.002)","rule_code":"PAY-04","line_order":1,"is_optional":false,"account_code":"007.002","account_selector":null},{"id":41,"side":"credit","label":"AR (121.100)","rule_code":"PAY-04","line_order":1,"is_optional":false,"account_code":"121.100","account_selector":null},{"id":42,"side":"debit","label":"Customer Deposits (221.100)","rule_code":"PAY-05","line_order":1,"is_optional":false,"account_code":"221.100","account_selector":null},{"id":43,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-05","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":44,"side":"debit","label":"Customer Deposits (221.100) or AR (121.100)","rule_code":"PAY-06","line_order":1,"is_optional":false,"account_code":null,"account_selector":"customer_deposit_or_ar"},{"id":45,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-06","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":46,"side":"debit","label":"AP (211.100)","rule_code":"PAY-07","line_order":1,"is_optional":false,"account_code":"211.100","account_selector":null},{"id":47,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-07","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":48,"side":"debit","label":"AP (211.100)","rule_code":"PAY-08","line_order":1,"is_optional":false,"account_code":"211.100","account_selector":null},{"id":49,"side":"credit","label":"Credit Card Payable (AMEX or Visa)","rule_code":"PAY-08","line_order":1,"is_optional":false,"account_code":null,"account_selector":"credit_card"},{"id":50,"side":"debit","label":"Credit Card Payable (AMEX or Visa)","rule_code":"PAY-09","line_order":1,"is_optional":false,"account_code":null,"account_selector":"credit_card"},{"id":51,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-09","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":52,"side":"debit","label":"AP (211.100)","rule_code":"PAY-10","line_order":1,"is_optional":false,"account_code":"211.100","account_selector":null},{"id":53,"side":"credit","label":"Bank \u2013 Fifth Third/Nickel","rule_code":"PAY-10","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":54,"side":"credit","label":"Purchase Discounts & Rebates (004.011)","rule_code":"PAY-10","line_order":2,"is_optional":false,"account_code":"004.011","account_selector":null},{"id":55,"side":"debit","label":"AP (211.100)","rule_code":"PAY-11","line_order":1,"is_optional":false,"account_code":"211.100","account_selector":null},{"id":56,"side":"credit","label":"AP (211.100)","rule_code":"PAY-11","line_order":1,"is_optional":false,"account_code":"211.100","account_selector":null},{"id":57,"side":"debit","label":"Bank \u2013 Fifth Third (112.100)","rule_code":"PAY-12","line_order":1,"is_optional":false,"account_code":"112.100","account_selector":null},{"id":58,"side":"credit","label":"AP (211.100)","rule_code":"PAY-12","line_order":1,"is_optional":false,"account_code":"211.100","account_selector":null},{"id":59,"side":"debit","label":"Bank \u2013 Fifth Third (112.100)","rule_code":"PAY-13","line_order":1,"is_optional":false,"account_code":"112.100","account_selector":null},{"id":60,"side":"credit","label":"AP (211.100)","rule_code":"PAY-13","line_order":1,"is_optional":false,"account_code":"211.100","account_selector":null},{"id":61,"side":"debit","label":"Accrued Salaries & Wages (241.100)","rule_code":"PAY-14","line_order":1,"is_optional":false,"account_code":"241.100","account_selector":null},{"id":62,"side":"debit","label":"Accrued Payroll Taxes (241.200)","rule_code":"PAY-14","line_order":2,"is_optional":false,"account_code":"241.200","account_selector":null},{"id":63,"side":"debit","label":"Accrued 401(k) (241.400)","rule_code":"PAY-14","line_order":3,"is_optional":false,"account_code":"241.400","account_selector":null},{"id":64,"side":"debit","label":"Employee Benefit Deductions Payable (241.600)","rule_code":"PAY-14","line_order":4,"is_optional":false,"account_code":"241.600","account_selector":null},{"id":65,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-14","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":66,"side":"debit","label":"Accrued Salaries & Wages (241.100)","rule_code":"PAY-15","line_order":1,"is_optional":false,"account_code":"241.100","account_selector":null},{"id":67,"side":"debit","label":"Bank, Wire & FX Fees (007.002)","rule_code":"PAY-15","line_order":2,"is_optional":true,"account_code":"007.002","account_selector":null},{"id":68,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-15","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":69,"side":"debit","label":"Auto Loan Payable (232.100)","rule_code":"PAY-16","line_order":1,"is_optional":false,"account_code":"232.100","account_selector":null},{"id":70,"side":"debit","label":"Interest Expense (007.003)","rule_code":"PAY-16","line_order":2,"is_optional":false,"account_code":"007.003","account_selector":null},{"id":71,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-16","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":72,"side":"debit","label":"Bank (Fifth Third/Nickel)","rule_code":"PAY-17","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":73,"side":"credit","label":"Line of Credit Payable (231.200)","rule_code":"PAY-17","line_order":1,"is_optional":false,"account_code":"231.200","account_selector":null},{"id":74,"side":"debit","label":"Line of Credit Payable (231.200)","rule_code":"PAY-18","line_order":1,"is_optional":false,"account_code":"231.200","account_selector":null},{"id":75,"side":"debit","label":"Interest Expense (007.003)","rule_code":"PAY-18","line_order":2,"is_optional":false,"account_code":"007.003","account_selector":null},{"id":76,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-18","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":77,"side":"debit","label":"Bank \u2013 Nickel (112.300) [receiving account]","rule_code":"PAY-19","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":78,"side":"credit","label":"Bank (Nickel/Fifth Third) [sending account]","rule_code":"PAY-19","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":79,"side":"debit","label":"Shareholder Distributions (316.100)","rule_code":"PAY-20","line_order":1,"is_optional":false,"account_code":"316.100","account_selector":null},{"id":80,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-20","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":81,"side":"debit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-21","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":82,"side":"credit","label":"Additional Paid-in Capital (311.200)","rule_code":"PAY-21","line_order":1,"is_optional":false,"account_code":"311.200","account_selector":null},{"id":83,"side":"debit","label":"Accrued Federal Income Tax (242.100)","rule_code":"PAY-22","line_order":1,"is_optional":false,"account_code":"242.100","account_selector":null},{"id":84,"side":"debit","label":"Accrued State Income Tax (242.200)","rule_code":"PAY-22","line_order":2,"is_optional":false,"account_code":"242.200","account_selector":null},{"id":85,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-22","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":86,"side":"debit","label":"Bank \u2013 Fifth Third (112.100)","rule_code":"PAY-23","line_order":1,"is_optional":false,"account_code":"112.100","account_selector":null},{"id":87,"side":"debit","label":"Insurance Claim Recoveries (004.004)","rule_code":"PAY-23","line_order":2,"is_optional":false,"account_code":"004.004","account_selector":null},{"id":88,"side":"credit","label":"Insurance Claims Receivable (122.100)","rule_code":"PAY-23","line_order":1,"is_optional":false,"account_code":"122.100","account_selector":null},{"id":89,"side":"debit","label":"Security Deposits (143.200)","rule_code":"PAY-24","line_order":1,"is_optional":false,"account_code":"143.200","account_selector":null},{"id":90,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-24","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":91,"side":"debit","label":"Cash \u2013 Fidelity (112.200)","rule_code":"PAY-25","line_order":1,"is_optional":false,"account_code":"112.200","account_selector":null},{"id":92,"side":"credit","label":"Interest & Dividend Income (010.003)","rule_code":"PAY-25","line_order":1,"is_optional":false,"account_code":"010.003","account_selector":null},{"id":93,"side":"debit","label":"Bank, Wire & FX Fees (007.002)","rule_code":"PAY-26","line_order":1,"is_optional":false,"account_code":"007.002","account_selector":null},{"id":94,"side":"credit","label":"Bank (Nickel/Fifth Third)","rule_code":"PAY-26","line_order":1,"is_optional":false,"account_code":null,"account_selector":"bank"},{"id":95,"side":"debit","label":"Credit Card Payable (231.100)","rule_code":"PAY-27","line_order":1,"is_optional":false,"account_code":null,"account_selector":"credit_card"},{"id":96,"side":"credit","label":"Purchase Discounts & Rebates (004.011)","rule_code":"PAY-27","line_order":1,"is_optional":false,"account_code":"004.011","account_selector":null}]');

alter table public.account_selector_members enable row level security;

alter table public.account_selectors enable row level security;

alter table public.accounting_periods enable row level security;

alter table public.accounts enable row level security;

alter table public.journal_entries enable row level security;

alter table public.journal_lines enable row level security;

alter table public.ledger_rule_lines enable row level security;

alter table public.ledger_rules enable row level security;

grant usage on schema public, auth to service_role;

grant select, insert, update, delete on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to service_role;

-- Expense rules are already present in the hosted catalog; include the exercised cases locally.
insert into public.ledger_rules (rule_code, category, sort_order, trigger_name, active) values
  ('EXP-07', 'expense', 7, 'Payroll - offshore / 1099 / owner staff invoice', true),
  ('EXP-09', 'expense', 9, 'Month-end accrual - bonus & commission earned', true)
on conflict (rule_code) do nothing;
