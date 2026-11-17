-- FIN uses its existing tax numbers; Supabase keeps 011.001 and 011.002 as destination accounts.
update public.ledger_rules set dev_notes = replace(replace(dev_notes,
  '011.001: Federal Income Tax Expense', '923100: Federal Income Tax'),
  '011.002: State Income Tax Expense', '923300: State Income Tax'), updated_at=now()
where rule_code in ('EXP-13','EXP-26');
