-- Cashback is owned by its Sent Regular Payment and records Payment Amount once.
begin;
update public.ledger_rules set enabled=true,active=true,reversible=true,airtable_sources='FIN: Payments',when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Payments.Amount != 0
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"',fin_notes='Use Payment Amount and Payment Date from the Sent Regular Payment through Credit Card Clearing, linked to a Fully Paid AR Non-Product 004.011 invoice.',dev_notes='[T-Chart]
Category - Payment, row 19
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
Payments.Payment Record Type = "Regular Payment"
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Payments.Amount != 0
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 231.100
Credit = 004.011

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
231.100: Credit Card Clearing -> Supabase 231.100
004.011: Purchased Discounts & Rebate -> Supabase 004.011' where rule_code='PAY-27';
commit;
