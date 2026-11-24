-- EXP-08 display code. Keep the stable INV-08 posting identity.
update public.ledger_rules
set dev_notes=replace(replace(dev_notes, 'Amount = -Invoices.Invoice Amount', 'Amount = ABS(Invoices.Invoice Amount)'),
 'FIN stores vendor credits as negative invoice amounts.', 'Returned-goods credits always post a positive amount to the stated debit and credit accounts.'),
 updated_at=now()
where rule_code='INV-08' and retired_at is null;
