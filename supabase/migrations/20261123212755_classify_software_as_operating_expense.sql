do $$
begin
  if exists (
    select from public.journal_lines
    where account_code = '151.200' and exists (
      select from public.accounts where code = '151.200' and account_type <> 'expense'
    )
  ) then
    raise exception 'Software account has existing journals; review historical classification first';
  end if;
end $$;

update public.accounts
set account_type = 'expense', subtype = 'opex', normal_balance = 'debit'
where code = '151.200' and airtable_record_id = 'rec9dmL357HF378Pa';

insert into public.account_selector_members (selector, account_code)
values ('operating_expense', '151.200')
on conflict do nothing;

update public.account_selectors
set description = 'The reviewed operating invoice accounts, including Software (151.200).'
where selector = 'operating_expense';

update public.ledger_rules
set dev_notes = replace(dev_notes, 'The 37 operating accounts', 'The operating accounts')
    || E'\nSoftware 151.200 is an operating expense when linked to an eligible AP Expense invoice.'
where rule_code in ('EXP-01', 'EXP-14')
  and dev_notes not like '%Software 151.200 is an operating expense%';

update public.ledger_rules
set trigger_name = replace(trigger_name, 'vehicle, fixtures, software', 'vehicle or fixtures'),
    dev_notes = replace(replace(dev_notes, '143.100, 143.300, 151.100, or 151.200', '143.100, 143.300, or 151.100'),
        E'\n151.200: Software -> Supabase 151.200', '')
where rule_code in ('INV-07', 'INV-17');
