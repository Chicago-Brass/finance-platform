update public.ledger_rule_lines
set account_code = '005.004',
    account_selector = null,
    label = 'Insurance Expense - employee deductions (005.004)'
where rule_code = 'EXP-06' and side::text = 'credit' and line_order = 2;

update public.ledger_rules
set credit_label = replace(credit_label, '241.600 Employee Benefit Deductions Payable', '005.004 Insurance Expense - employee deductions'),
    dev_notes = replace(
      replace(
        coalesce(dev_notes, ''),
        E'\n\n[Issues]\n- Confirm how to record 005.004 insurance deductions. They are excluded from this W2 pair and can make bank postings exceed the actual payment.',
        ''
      ),
      'For a negative FIN 005.004 line on an AP Staff invoice, debit 211.100 and credit 241.600 for the absolute line amount. The employee payment remains tied to the actual net cash. Apply verified deductions to carrier premiums through a MAN-01 direct journal: debit 241.600 and credit 005.004 without a bank line.',
      'For a negative FIN 005.004 line on an AP Staff invoice, debit 211.100 and credit 005.004 for the absolute line amount. The deduction reduces payroll AP and offsets carrier insurance expense. The employee payment remains tied to the actual net cash.'
    )
where rule_code = 'EXP-06';

update public.ledger_rules
set dev_notes = replace(
  coalesce(dev_notes, ''),
  E'\n\n[Issues]\n- Confirm how to record 005.004 insurance deductions. They are excluded from this W2 pair and can make bank postings exceed the actual payment.',
  E'\n\n[Notes]\nWhen a negative 005.004 insurance line applies, post net payroll per invoice and require the total to match Payments.Amount.'
)
where rule_code = 'EXP-19';
