insert into public.account_selectors (selector, description)
values ('statement_mini_payment_card_account', 'The single AMEX or Chase account selected by all linked mini-payments.'),
       ('credit_card', 'The linked AMEX (231.101) or Chase (231.102) credit-card liability.')
on conflict (selector) do update set description=excluded.description;

update public.ledger_rules
set debit_label = regexp_replace(debit_label, 'Credit Card (Clearing|Payable) \(231\.100\)', 'AMEX Credit Card (231.101) • Chase Credit Card (231.102)', 'g'),
    credit_label = regexp_replace(credit_label, 'Credit Card (Clearing|Payable) \(231\.100\)', 'AMEX Credit Card (231.101) • Chase Credit Card (231.102)', 'g'),
    dev_notes = regexp_replace(
      replace(
        replace(
          replace(
            replace(
              replace(dev_notes, 'Payments.Account to Pay/Receive does not include "231.100: Credit Card Clearing"',
                                'Payments.Account to Pay/Receive is neither AMEX 231.101 nor Chase 231.102'),
              'Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"',
              'Payments.Account to Pay/Receive is AMEX 231.101 or Chase 231.102'),
            'Credit = 231.100', 'Credit = Payments.Account to Pay/Receive (AMEX 231.101 or Chase 231.102)'),
          'Debit = 231.100', case when rule_code='PAY-09' then 'Debit = The account shared by all linked mini-payments (AMEX 231.101 or Chase 231.102)'
                                  else 'Debit = Payments.Account to Pay/Receive (AMEX 231.101 or Chase 231.102)' end),
        '231.100: Credit Card Clearing -> Supabase 231.100',
        E'231.101: AMEX Credit Card -> Supabase 231.101\n231.102: Chase Credit Card -> Supabase 231.102'),
      'Credit Card (Clearing|Payable) \(231\.100\)', 'AMEX Credit Card (231.101), Chase Credit Card (231.102)', 'g')
where retired_at is null and
  (debit_label like '%231.100%' or credit_label like '%231.100%' or dev_notes like '%231.100%');

update public.ledger_rule_lines
set account_selector = case
      when rule_code='PAY-09' and account_code='231.100' then 'statement_mini_payment_card_account'
      when account_code='231.100' then 'credit_card'
      else account_selector end,
    account_code = nullif(account_code,'231.100'),
    label = regexp_replace(label, 'Credit Card (Clearing|Payable) \(231\.100\)', 'AMEX Credit Card (231.101) • Chase Credit Card (231.102)', 'g')
where rule_code in (select rule_code from public.ledger_rules where retired_at is null)
  and (account_code='231.100' or label like '%231.100%');

update public.ledger_rules
set dev_notes = replace(dev_notes, E'[Filters]\nPayments.Sent = true',
                                   E'[Filters]\nPayments.Method - AP = "Credit Card"\nPayments.Sent = true')
where rule_code in ('EXP-02','PAY-08')
  and dev_notes not like '%Method - AP = "Credit Card"%';

update public.ledger_rules
set dev_notes = replace(dev_notes, 'Payments.Payment Record Type = "CC Batch Payment"',
    E'Payments.Payment Record Type = "CC Batch Payment"\nAll linked mini-payments use the same AMEX 231.101 or Chase 231.102 account\nThe batch payment account is the funding bank')
where rule_code='PAY-09' and dev_notes not like '%All linked mini-payments use the same%';

update public.ledger_rules
set dev_notes = replace(replace(dev_notes, 'Only AP - Product invoices qualify for a separate early-payment discount journal.',
    'AP - Product and AP - Expenses (Sales Tax) qualify for a separate early-payment discount journal.'),
    E'[Filters]\nInvoices.Invoice Type = "AP"',
    E'[Filters]\nInvoices.Invoice Type = "AP"\nInvoices.Vendor Type (AP) is AP - Product or AP - Expenses (Sales Tax)')
where rule_code='PAY-10' and dev_notes not like '%Invoices.Vendor Type (AP) is AP - Product or AP - Expenses (Sales Tax)%';

update public.ledger_rules
set dev_notes = replace(dev_notes, E'Amount = Invoices.Invoice Amount\n', E'Amount = Invoices.Invoice Amount minus the signed Discount Lines Total (gross before discount)\n')
where rule_code='EXP-33';

update public.ledger_rules
set dev_notes = replace(dev_notes, 'Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"',
  E'Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"\nA Misc. Income invoice linked to an Amex or Chase rebate payment is handled by PAY-10')
where rule_code in ('INV-10','INV-18') and dev_notes not like '%Amex or Chase rebate payment%';

update public.ledger_rules
set credit_label = 'Misc. Income (010.001)',
    dev_notes = replace(
      replace(
        replace(
          replace(dev_notes,
            E'Invoices.Invoice Type = "AR"\nInvoices.Vendor Type (AR) = "AR - Non-Product"',
            E'Invoice is AR - Non-Product cashback, or a negative AP - Expenses (Non-Sales Tax) statement discount paid by Credit Card'),
          '004.011: Purchased Discounts & Rebate', '010.001: Misc. Income'),
        'Supabase 004.011', 'Supabase 010.001'),
      'Credit = 004.011', 'Credit = 010.001')
where rule_code='PAY-27';

update public.ledger_rules
set dev_notes = replace(dev_notes,
   'Amount = Payments.Amount * SUM(Matching Invoices.Payment Proportion For Batch Allocation)',
   'Amount = allocated payment share; negate the negative AP statement discount share to reduce the card balance')
where rule_code='PAY-27';

update public.ledger_rule_lines
set account_code='010.001', account_selector=null, label='Misc. Income (010.001)'
where rule_code='PAY-27' and side::text='credit' and line_order=1;
