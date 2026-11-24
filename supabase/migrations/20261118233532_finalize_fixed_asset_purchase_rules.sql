-- Post current FIN fixed assets as property and equipment.
insert into public.accounts(code,name,account_type,subtype,normal_balance,airtable_record_id)
values
 ('143.100','Leasehold Improvements','asset','fixed_asset','debit','recFJ4VqOAF9ywdrJ'),
 ('143.300','Display Fixtures & Equipment','asset','fixed_asset','debit','rec212rPWpVSmXh8X'),
 ('151.100','Automobiles','asset','fixed_asset','debit','recMMetXo1rbkC23L'),
 ('151.200','Software','asset','fixed_asset','debit','rec9dmL357HF378Pa')
on conflict (code) do update set airtable_record_id=excluded.airtable_record_id
where accounts.airtable_record_id is null and accounts.account_type='asset'
  and accounts.subtype='fixed_asset' and accounts.normal_balance='debit' and accounts.is_postable;

update public.ledger_rules set implementation_status='fully',enabled=true,dev_notes=v.notes,updated_at=now()
from (values
 ('INV-07',$notes$[T-Chart]
Category - Expenses, row 15

[Code]
INV-07

[Family]
Fixed Assets

[Implementation]
Fully

[Debit]
Invoice account linked
Example: Display Fixtures & Equipment (143.300)

[Credit]
Accounts Payable (211.100)

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Mark as Prepaid Asset? = false
Invoices.Linked Chart of Accounts is one of 143.100, 143.300, 151.100, or 151.200 (matched by FIN record ID)

[Field Mapping]
Amount = Invoices.Invoice Amount
Date = Invoices.Invoice Date
Branch = Invoices.Branch
Debit = Invoices.Linked Chart of Accounts
Credit = 211.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
143.100: Leasehold Improvements -> Supabase 143.100
143.300: Display Fixtures & Equipment -> Supabase 143.300
151.100: Automobiles -> Supabase 151.100
151.200: Software -> Supabase 151.200
Accounts Payable (211.100) -> Supabase 211.100$notes$),
 ('INV-17',$notes$[T-Chart]
Category - Expenses, row 16

[Code]
INV-17

[Family]
Fixed Assets

[Implementation]
Fully

[Debit]
Accounts Payable (211.100)

[Credit]
Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200), Credit Card Clearing (231.100)

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Mark as Prepaid Asset? = false
Invoices.Linked Chart of Accounts is one of 143.100, 143.300, 151.100, or 151.200 (matched by FIN record ID)

[Field Mapping]
Amount = Payments.Amount * SUM(Matching Invoices.Payment Proportion For Batch Allocation)
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Accounts Payable (211.100) -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100$notes$)
) as v(code,notes)
where rule_code=v.code and retired_at is null;
