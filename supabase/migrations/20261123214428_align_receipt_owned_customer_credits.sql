update public.ledger_rules
set source_table='tblR61NG9i0giid28', source_label='Payments', airtable_sources='FIN: Payments',
    trigger_name='Client Overpayment Received',
    when_to_post=replace(when_to_post,E'[Record]\nInvoices',E'[Record]\nPayments'),
    fin_notes='Post excess from the original receipt, with the AR settlement in the same posting event. A credit invoice does not trigger another deposit.',
    dev_notes=E'[Filters]\nSent, uncancelled Regular Payment for a verified AR Full or Balance invoice group.\n[Field Mapping]\nDebit the receipt bank and credit 221.300 for cash above the posted open AR. Use Payment Date.'
where rule_code='PAY-03';

update public.ledger_rules
set dev_notes=E'[Filters]\nSent, uncancelled Regular Payment for an AR Product Full or Balance invoice.\n[Field Mapping]\nDebit the receipt bank. Credit 121.100 up to the posted open balance of each invoice. Any verified excess posts to 221.300 under INV-08 in the same event.'
where rule_code='INV-16';

update public.ledger_rules
set dev_notes=E'[Filters]\nOne funded AR Refund/Credit with Method of Application = Credit to Another Order, linked to the recipient invoice. Use the source transaction branch and verify the recipient branch matches.\n[Field Mapping]\nDebit 221.300 and credit 121.100 for the allocated Credits Applied, within both available credit and posted open AR.'
where rule_code='PAY-28';

update public.ledger_rules
set dev_notes=E'[Filters]\nSent, uncancelled Regular Payment with a negative refund amount, linked to one funded AR Refund/Credit with Method of Application = Cash Refund.\n[Field Mapping]\nDebit 221.300 and credit the refund bank for the amount sent. Use the credit invoice transaction branch and refund payment date.'
where rule_code='PAY-29';
