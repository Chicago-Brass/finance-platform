insert into public.ledger_rule_lines (rule_code, side, line_order, account_code, label, is_optional)
values ('EXP-15', 'debit', 2, '922.000', 'Freight In (922.000)', true)
on conflict (rule_code, side, line_order) do update
set account_code = excluded.account_code,
    label = excluded.label,
    is_optional = excluded.is_optional;
