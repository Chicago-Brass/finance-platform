insert into public.accounts
  (code, name, account_type, subtype, normal_balance, airtable_record_id)
values
  ('231.101', 'AMEX Credit Card', 'liability', 'credit_card', 'credit', 'rec4ttjhKLoc2Sgcy'),
  ('231.102', 'Chase Credit Card', 'liability', 'credit_card', 'credit', 'rec8YQ0zVFlN5QWda')
on conflict (code) do update
set name = excluded.name,
    account_type = excluded.account_type,
    subtype = excluded.subtype,
    normal_balance = excluded.normal_balance,
    airtable_record_id = excluded.airtable_record_id,
    active = true,
    is_postable = true;
