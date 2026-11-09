-- Account active is a label. Preserve posted-line immutability and is_postable enforcement.
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
    if not exists (select 1 from public.accounts a where a.code = new.account_code and a.is_postable) then
      raise exception 'Account % is not postable', new.account_code;
    end if;
    return new;
  end if;
  return old;
end $$;
