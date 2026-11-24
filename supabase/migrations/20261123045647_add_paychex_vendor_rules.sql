insert into public.ledger_rules (
  sort_order, rule_code, display_code, chart_family, trigger_name, debit_label,
  credit_label, source_table, source_label, when_to_post, dev_notes,
  category, airtable_sources, reversible, active, enabled, implementation_status
) values
  (36, 'EXP-35', 'EXP-35', 'Paychex Payroll', 'Paychex vendor bill',
   E'005.301 Payroll Processing\n005.006 Payroll Taxes\n525.300 Workers Compensation',
   'Accounts Payable (211.100)', 'tbldQXuqNEp8G5pfs', 'Invoices', 'Paychex bill created',
   'Paychex AP non-sales-tax bill. Read each linked invoice line, using its account and signed amount. Use the invoice date and branch. Skip bills without eligible lines or with incomplete line coding. Line charges must reconcile to the invoice total. Use the line record ID as the journal entry key.',
   'expense', 'FIN: Invoices and Invoice Lines', true, true, true, 'fully'),
  (37, 'EXP-36', 'EXP-36', 'Paychex Payroll', 'Paychex vendor payment',
   'Accounts Payable (211.100)', 'Payment account linked', 'tblR61NG9i0giid28', 'Payments', 'Regular Payment marked Sent',
   'Settle only the eligible Paychex share of the actual sent payment. Use Payment Date and Account to Pay/Receive. Carry the linked invoice references and branches. EXP-01 and EXP-02 exclude Paychex.',
   'expense', 'FIN: Payments, Invoices and Invoice Lines', true, true, true, 'fully');

insert into public.ledger_rule_lines (rule_code, side, line_order, account_code, account_selector, label, is_optional)
values
  ('EXP-35', 'debit', 1, '005.301', null, 'Payroll Processing (005.301)', true),
  ('EXP-35', 'debit', 2, '005.006', null, 'Payroll Taxes (005.006)', true),
  ('EXP-35', 'debit', 3, '525.300', null, 'Workers Compensation (525.300)', true),
  ('EXP-35', 'credit', 1, '211.100', null, 'Accounts Payable (211.100)', false),
  ('EXP-36', 'debit', 1, '211.100', null, 'Accounts Payable (211.100)', false),
  ('EXP-36', 'credit', 1, null, 'expense_payment_account', 'Payment account linked', false);
