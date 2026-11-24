-- Apply the same durable review restriction to retained manual/direct posting capabilities.
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
    if old.status = 'pending' then raise exception 'Reject the pending journal through period review'; end if;
    return old;
  end if;

  if old.status in ('posted', 'rejected') then
    raise exception 'Final journal entry #% is immutable.', old.entry_number;
  end if;
  if old.status = 'pending' then
    if current_user <> 'service_role'
       or new.status not in ('posted', 'rejected')
       or (to_jsonb(new) - array['status','period_month']) is distinct from (to_jsonb(old) - array['status','period_month']) then
      raise exception 'Pending journals can only be decided through period review';
    end if;
    if new.status = 'rejected' then
      if not exists (select 1 from public.ledger_posting_requests r
        where r.id=old.posting_request_id and r.status in ('rejected','superseded')) then
        raise exception 'Journal requires a matching rejection';
      end if;
      return new;
    end if;
  elsif new.status = 'rejected' then
    raise exception 'Only pending journals can be rejected';
  end if;

  if new.status in ('posted', 'pending') then
    select coalesce(sum(l.debit),0), coalesce(sum(l.credit),0), count(*)
      into v_dr, v_cr, v_n
      from public.journal_lines l where l.entry_id = new.id;
    if v_n < 2 then
      raise exception 'Journal entry #% needs at least 2 lines to post', new.entry_number;
    end if;
    if old.status = 'pending' and exists (
      select 1 from public.journal_lines l join public.accounts a on a.code=l.account_code
      where l.entry_id=new.id and not a.is_postable
    ) then
      raise exception 'Pending journal contains an account that is no longer postable';
    end if;
    if v_dr <> v_cr then
      raise exception 'Journal entry #% is out of balance: debits % <> credits %', new.entry_number, v_dr, v_cr;
    end if;
    if new.source_system='airtable' and new.source_record_id is not null then
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
        (case new.source_table when 'tblCoBk0WB46B662R' then 'FIN manual journal:'
         when 'tblV26TC0f6CKDneL' then 'FIN invoice line:' when 'tblrnXm1HN9y6HPxY' then 'FIN shipping:' when 'tblR61NG9i0giid28' then 'FIN payment:'
         when 'tblC0dbO5UMXzHma9' then 'FIN depreciation:' when 'tbl1LgiUYt7Gc492d' then 'FIN prepay:'
         else 'FIN invoice:' end) || new.source_record_id,0));
    end if;
    perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('ledger period:' || to_char(new.entry_date, 'YYYY-MM'), 0));
    if new.posting_request_id is not null then
      if not exists (select 1 from public.ledger_posting_requests r
        where r.id=new.posting_request_id and ((new.status='posted' and r.status='approved' and r.approval_txid=txid_current()
          and (old.status <> 'pending' or new.id=any(r.journal_ids)))
          or (new.status='pending' and current_user='service_role' and r.status='pending'))
          and r.source_table=new.source_table and r.source_record_id=new.source_record_id
          and r.accounting_date=new.entry_date
          and ((r.kind='posting' and new.reverses_entry_id is null and r.event_type=new.source_event_type
            and exists (select 1 from jsonb_array_elements(r.payload->'categories') c
              where c->>'ruleCode'=new.rule_code and coalesce(c->>'entryKey','')=new.source_entry_key))
            or (r.kind='reversal' and new.reverses_entry_id=any(r.target_journal_ids)))) then
        raise exception 'Journal requires a matching approval in this transaction';
      end if;
    elsif new.status = 'pending' then
      raise exception 'Pending journal requires a review request';
    elsif exists (select 1 from public.ledger_posting_requests r
      where r.source_table=new.source_table and r.source_record_id=new.source_record_id
        and r.status in ('pending','rejected')
        and ((r.kind='posting' and new.reverses_entry_id is null and r.event_type=new.source_event_type
          and exists (select 1 from jsonb_array_elements(r.payload->'categories') c
            where c->>'ruleCode'=new.rule_code))
          or (r.kind='reversal' and new.reverses_entry_id=any(r.target_journal_ids)))) then
      raise exception 'Source requires explicit review, even when the period is open';
    elsif not exists (select 1 from public.accounting_periods p
      where p.period_month=date_trunc('month',new.entry_date::timestamp)::date and p.status='open') then
      raise exception 'Period % is not open; submit the entry for review', to_char(new.entry_date,'YYYY-MM');
    end if;
    if new.reverses_entry_id is not null then
      select e.status into v_orig_status from public.journal_entries e where e.id = new.reverses_entry_id;
      if v_orig_status is distinct from 'posted' then
        raise exception 'Only posted entries can be reversed';
      end if;
    end if;
    if new.status = 'posted' then
      new.posted_at := now();
      new.posted_by := coalesce(auth.jwt() ->> 'email', current_user);
    else
      new.posted_at := null;
      new.posted_by := null;
    end if;
  end if;
  return new;
end $$;

-- Account active is a label. Preserve posted-line immutability and is_postable enforcement.
CREATE OR REPLACE FUNCTION "public"."tg_journal_lines_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare v_status public.entry_status;
begin
  if tg_op in ('UPDATE','DELETE') then
    select e.status into v_status from public.journal_entries e where e.id = old.entry_id;
    if v_status in ('posted','pending','rejected') then
      raise exception 'Journal entry % is finalized or pending; its lines cannot be changed. Post a reversing entry instead.', old.entry_id;
    end if;
  end if;
  if tg_op in ('INSERT','UPDATE') then
    select e.status into v_status from public.journal_entries e where e.id = new.entry_id;
    if v_status in ('posted','pending','rejected') then
      raise exception 'Journal entry % is finalized or pending; lines cannot be added or changed.', new.entry_id;
    end if;
    if not exists (select 1 from public.accounts a where a.code = new.account_code and a.is_postable) then
      raise exception 'Account % is not postable', new.account_code;
    end if;
    return new;
  end if;
  return old;
end $$;

drop index public.journal_entries_source_uniq_idx;
create unique index journal_entries_source_uniq_idx
 on public.journal_entries(source_system,source_table,source_record_id,rule_code,source_entry_key,posting_cycle)
 nulls not distinct where source_record_id is not null and reverses_entry_id is null and status <> 'rejected';

create or replace function ledger_private.current_airtable_journals(p_table text,p_record text)
returns setof public.journal_entries
language sql stable security invoker set search_path='' as $$
 with originals as (
   select e.* from public.journal_entries e
   where e.source_system='airtable' and e.source_table=p_table
     and e.source_record_id=p_record and e.reverses_entry_id is null and e.status in ('posted','pending')
 ), latest as (
   select distinct on (o.rule_code) o.rule_code,o.posting_cycle
   from originals o order by o.rule_code,o.entry_number desc
 )
 select o.* from originals o join latest l
   on o.rule_code is not distinct from l.rule_code and o.posting_cycle is not distinct from l.posting_cycle
$$;
revoke all on function ledger_private.current_airtable_journals(text,text) from public,anon,authenticated;
grant execute on function ledger_private.current_airtable_journals(text,text) to service_role;
drop index public.journal_entries_one_reversal_idx;
create unique index journal_entries_one_reversal_idx on public.journal_entries(reverses_entry_id)
 where reverses_entry_id is not null and status <> 'rejected';
