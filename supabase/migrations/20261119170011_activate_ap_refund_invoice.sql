-- Apply after the ledger-daily worker supports the refund invoice and tax rules.
update public.ledger_rules
set enabled=true, implementation_status='fully'
where rule_code='EXP-32' and retired_at is null;

-- The tax payment can be tested, but must not clear AP before the bill rule is ready.
update public.ledger_rules
set enabled=false, implementation_status='partial'
where rule_code='EXP-34' and retired_at is null;
