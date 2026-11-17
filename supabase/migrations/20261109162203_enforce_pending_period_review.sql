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
    if new.source_system='airtable' and new.source_record_id is not null then
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
        (case new.source_table when 'tblR61NG9i0giid28' then 'FIN payment:'
         when 'tblC0dbO5UMXzHma9' then 'FIN depreciation:' when 'tbl1LgiUYt7Gc492d' then 'FIN prepay:'
         else 'FIN invoice:' end) || new.source_record_id,0));
    end if;
    perform pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('ledger period:' || to_char(new.entry_date, 'YYYY-MM'), 0));
    if new.posting_request_id is not null then
      if not exists (select 1 from public.ledger_posting_requests r
        where r.id=new.posting_request_id and r.status='approved' and r.approval_txid=txid_current()
          and r.source_table=new.source_table and r.source_record_id=new.source_record_id
          and r.accounting_date=new.entry_date
          and ((r.kind='posting' and new.reverses_entry_id is null and r.event_type=new.source_event_type
            and exists (select 1 from jsonb_array_elements(r.payload->'categories') c
              where c->>'ruleCode'=new.rule_code and coalesce(c->>'entryKey','')=new.source_entry_key))
            or (r.kind='reversal' and new.reverses_entry_id=any(r.target_journal_ids)))) then
        raise exception 'Journal requires a matching approval in this transaction';
      end if;
    elsif exists (select 1 from public.ledger_posting_requests r
      where r.source_table=new.source_table and r.source_record_id=new.source_record_id
        and r.status in ('pending','rejected')
        and ((r.kind='posting' and new.reverses_entry_id is null and r.event_type=new.source_event_type
          and exists (select 1 from jsonb_array_elements(r.payload->'categories') c
            where c->>'ruleCode'=new.rule_code and coalesce(c->>'entryKey','')=new.source_entry_key))
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
    new.posted_at := now();
    new.posted_by := coalesce(auth.jwt() ->> 'email', current_user);
  end if;
  return new;
end $$;
