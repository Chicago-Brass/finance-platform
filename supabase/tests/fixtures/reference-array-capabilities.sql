-- Disposable database proof only. Keep the existing manual helpers compatible with array references.
begin;
do $test$
declare v_entry_id uuid; reversed_id uuid;
begin
  v_entry_id := public.create_journal_entry(
    '{"entry_date":"2026-10-29","description":"Array references capability check"}'::jsonb,
    '[{"account_code":"211.100","debit":2,"vendor_ref":["vendorA","vendorB"],"invoice_ref":["invoiceA","invoiceB"],"state_ref":["stateA"],"airtable_record_ids":["lineA","lineB"],"branch":"Chicago"},
      {"account_code":"112.100","credit":2,"vendor_ref":["vendorA","vendorB"],"invoice_ref":["invoiceA","invoiceB"],"state_ref":["stateA"],"airtable_record_ids":["lineA","lineB"],"branch":"Chicago"}]'::jsonb
  );
  if (select count(*) from public.journal_lines where journal_lines.entry_id = v_entry_id and vendor_ref = array['vendorA','vendorB'] and invoice_ref = array['invoiceA','invoiceB'] and state_ref = array['stateA']) <> 2 then
    raise exception 'Manual journal lost array references';
  end if;
  reversed_id := public.reverse_journal_entry(v_entry_id, '2026-10-30'::date, 'Disposable capability check');
  if (select count(*) from public.journal_lines where journal_lines.entry_id = reversed_id and state_ref = array['stateA'] and airtable_record_ids = array['lineA','lineB'] and branch = 'Chicago') <> 2 then
    raise exception 'Existing reversal helper lost reference context';
  end if;
end
$test$;
rollback;
