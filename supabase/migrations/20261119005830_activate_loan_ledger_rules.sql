-- Preserve posting identities while inserting financed purchases next to cash funding.
begin;

update public.ledger_rules set display_code=null
where rule_code in ('PAY-16','PAY-21','PAY-20','PAY-23','PAY-27','PAY-33');

update public.ledger_rules r
set display_code=v.display, sort_order=v.sort_order,
    dev_notes=regexp_replace(r.dev_notes, 'Category - Payments?, row [0-9]+', 'Category - Payments, row ' || v.sort_order::text)
from (values ('PAY-21','PAY-07',8),('PAY-20','PAY-08',9),('PAY-23','PAY-09',10),('PAY-27','PAY-10',11))
  as v(rule,display,sort_order)
where r.rule_code=v.rule;

insert into public.ledger_rules(rule_code,category,display_code,sort_order,trigger_name,source_label,source_table,
  debit_label,credit_label,when_to_post,dev_notes,chart_family,implementation_status,airtable_sources,reversible,active,enabled)
select v.rule_code,'payment',v.display_code,v.sort_order,v.trigger_name,v.source_label,v.source_table,
  v.debit_label,v.credit_label,v.when_to_post,v.dev_notes,'Loans','fully','FIN: '||v.source_label,true,true,false
from (values
  ('PAY-31', 'PAY-04', 5, 'Loan Funding Recorded', 'Loan Records', 'tblzYDob4qF6Kha8u', 'Fifth Third Bank (112.100)', 'Loan Records.Chart of Accounts', '[Record]
Loan Records

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)', '[T-Chart]
Category - Payments, row 5

[Code]
PAY-04

[Family]
Loans

[Implementation]
Fully

[Record]
Loan Records

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Loan Records.Make Active = true
Loan Records.Loan Setup = "(AR) Received Money - Paid by Month"
Loan Records.Loan Amount > 0

[Field Mapping]
Amount = Loan Records.Loan Amount
Date = Override Loan Start Date, otherwise Original Loan Start Date
Branch = Linked source invoice.Branch, if present
Debit = Fifth Third Bank (112.100)
Credit = Loan Records.Chart of Accounts

[Other Field Mapping]
Use the linked source invoice’s Vendor, Client, Staff, Transaction, PO and State references when available.

[Notes]
- The Loan Record owns Ledger References and explicit Reverse Ledger. Clearing Make Active does not reverse posted funding.'),
  ('PAY-33', 'PAY-05', 6, 'Financed Purchase Recorded', 'Loan Records', 'tblzYDob4qF6Kha8u', 'Linked Asset.Asset Account', 'Loan Records.Chart of Accounts', '[Record]
Loan Records

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)', '[T-Chart]
Category - Payments, row 6

[Code]
PAY-05

[Family]
Loans

[Implementation]
Fully

[Record]
Loan Records

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Loan Records.Make Active = true
Loan Records.Loan Setup = "(AP) Purchase - Paid by Month"
Loan Records.Loan Amount > 0
Loan Records.Asset identifies one asset

[Field Mapping]
Amount = Loan Records.Loan Amount
Date = Override Loan Start Date, otherwise Original Loan Start Date
Branch = Blank
Debit = Linked Asset.Asset Account
Credit = Loan Records.Chart of Accounts

[Other Field Mapping]
Use the Loan Record as the audit source.

[Notes]
- This rule records the directly financed asset once. The Loan Record owns Ledger References and explicit Reverse Ledger. Clearing Make Active does not reverse posted funding.'),
  ('PAY-16', 'PAY-06', 7, 'Monthly Loan Repayment (Principal and Interest)', 'Invoice Lines', 'tblV26TC0f6CKDneL', 'Invoice Lines.Chart of Accounts', 'Linked Payment.Account to Pay/Receive', '[Record]
Invoice Lines

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)', '[T-Chart]
Category - Payments, row 7

[Code]
PAY-06

[Family]
Loans

[Implementation]
Fully

[Record]
Invoice Lines

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Loan Records 2 identifies one loan
Invoices.Payment Invoice Status = "Fully Paid"
Invoice Lines.Chart of Accounts is the linked loan liability or Interest Expense (007.003)
Exactly one sent, uncancelled, unreversed regular payment

[Field Mapping]
Amount = Invoice Lines.Line Amount
Date = Linked Payment.Payment Date
Branch = Linked Invoice.Branch
Debit = Invoice Lines.Chart of Accounts
Credit = Linked Payment.Account to Pay/Receive

[Other Field Mapping]
Use the parent invoice’s Vendor, Client, Staff, Transaction, PO and State references.

[Notes]
- Each principal or interest line owns its journal and reversal. The linked payment supplies the date and bank only.')
) as v(rule_code, display_code, sort_order, trigger_name, source_label, source_table, debit_label, credit_label, when_to_post, dev_notes)
on conflict (rule_code) do update set
  category=excluded.category,display_code=excluded.display_code,sort_order=excluded.sort_order,
  trigger_name=excluded.trigger_name,source_label=excluded.source_label,source_table=excluded.source_table,
  debit_label=excluded.debit_label,credit_label=excluded.credit_label,when_to_post=excluded.when_to_post,
  dev_notes=excluded.dev_notes,chart_family=excluded.chart_family,implementation_status=excluded.implementation_status,
  airtable_sources=excluded.airtable_sources,reversible=true,active=true,retired_at=null,updated_at=now();

commit;
