-- Keep the reviewed W2 accrual/payment issue with both category definitions.
update public.ledger_rules
set dev_notes = rtrim(coalesce(dev_notes,'')) || E'\n\n[Issues]\n- Confirm how to record 005.004 insurance deductions. They are excluded from this W2 pair and can make bank postings exceed the actual payment.'
where rule_code in ('EXP-06','EXP-19')
  and position('Confirm how to record 005.004 insurance deductions.' in coalesce(dev_notes,'')) = 0;
