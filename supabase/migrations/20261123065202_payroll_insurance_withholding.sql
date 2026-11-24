update public.accounts
set airtable_record_id = 'recxSbstaiAZqwqTW'
where code = '241.600' and airtable_record_id is null;

insert into public.ledger_rule_lines (rule_code, side, line_order, account_code, label, is_optional)
values
  ('EXP-06', 'debit', 2, '211.100', 'Accounts Payable - employee insurance withholding (211.100)', true),
  ('EXP-06', 'credit', 2, '241.600', 'Employee Benefit Deductions Payable (241.600)', true)
on conflict (rule_code, side, line_order) do update
set account_code = excluded.account_code,
    account_selector = null,
    label = excluded.label,
    is_optional = excluded.is_optional;

update public.ledger_rules
set debit_label = concat_ws(E'\n', nullif(debit_label,''), '211.100 Accounts Payable for employee insurance deductions'),
    credit_label = concat_ws(E'\n', nullif(credit_label,''), '241.600 Employee Benefit Deductions Payable'),
    dev_notes = concat_ws(E'\n\n', nullif(dev_notes,''), '[Employee insurance deductions]
For a negative FIN 005.004 line on an AP Staff invoice, debit 211.100 and credit 241.600 for the absolute line amount. The employee payment remains tied to the actual net cash. Apply verified deductions to carrier premiums through a MAN-01 direct journal: debit 241.600 and credit 005.004 without a bank line.')
where rule_code = 'EXP-06'
  and position('[Employee insurance deductions]' in coalesce(dev_notes,'')) = 0;
