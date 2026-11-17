-- Keep product bank settlements separate from credit-card clearing settlements.
update public.ledger_rules set enabled=true,active=true,reversible=true,when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Account to Pay/Receive does not include "231.100: Credit Card Clearing"
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"',dev_notes='[T-Chart]
Category - Expenses, row 5
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Account to Pay/Receive does not include "231.100: Credit Card Clearing"
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"

[Field Mapping]
Amount = Payments.Amount
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
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200',credit_label='Payment account linked
Examples: Bank - Fifth Third (112.100), Nickel (0747), Fidelity (112.200)' where rule_code='EXP-16';

update public.ledger_rules set enabled=true,active=true,reversible=true,when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"',dev_notes='[T-Chart]
Category - Payment, row 5
[Implementation]
Fully

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = 231.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
231.100: Credit Card Clearing -> Supabase 231.100',credit_label='Credit Card Clearing (231.100)' where rule_code='PAY-08';
