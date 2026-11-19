alter table public.journal_entries
  add column if not exists source_record_name text,
  add column if not exists client_names text[],
  add column if not exists vendor_names text[],
  add column if not exists reference_number text;

-- Both the Edge reversal and the manual database reversal keep the original labels.
create function ledger_private.copy_reversal_display_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  select source_record_name, client_names, vendor_names, reference_number
    into new.source_record_name, new.client_names, new.vendor_names, new.reference_number
    from public.journal_entries where id = new.reverses_entry_id;
  return new;
end;
$$;

create trigger journal_reversal_display_fields
before insert on public.journal_entries
for each row when (new.reverses_entry_id is not null)
execute function ledger_private.copy_reversal_display_fields();
