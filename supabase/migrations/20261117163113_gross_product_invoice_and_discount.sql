-- Record product AP before discounts and clear the discount from its owning invoice line.
begin;
update public.ledger_rules set enabled=true,active=true,reversible=true,when_to_post='[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"',fin_notes='Accrue the product invoice before its discount; the payment and discount line clear AP separately.',dev_notes='[T-Chart]
Category - Expenses, row 4
[Implementation]
Fully

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Product"

[Field Mapping]
Amount = Invoices.Invoice Amount - Invoices.Discount Lines Total
Date = Invoices.Invoice Date
Branch = Invoices.Branch
Debit = 004.010
Credit = 211.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
004.010: Cost of Goods Sold -> Supabase 004.010
211.100: Standard Product -> Supabase 211.100

[Issues]
- Negative AP Product invoices also match this category. Should they use a different category?' where rule_code='EXP-15';
update public.ledger_rules set enabled=true,active=true,reversible=true,when_to_post='[Record]
Invoice Lines

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Invoice Lines.Line Type = "Discount"
Invoice Lines.Discount Line Status != "Expired"',fin_notes='Post only the negated discount line amount; the separate payment category records the bank movement.',dev_notes='[T-Chart]
Category - Payment, row 7
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
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Invoice Lines.Line Type = "Discount"
Invoice Lines.Discount Line Status != "Expired"

[Field Mapping]
Amount = -Invoice Lines.Line Amount
Date = Linked Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = 004.011

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
004.011: Purchased Discounts & Rebate -> Supabase 004.011',credit_label='Purchase Discounts & Rebates (004.011)' where rule_code='PAY-10';
update public.ledger_rule_lines set account_code='004.011',account_selector=null,label='Purchase Discounts & Rebates (004.011)' where rule_code='PAY-10' and side='credit' and line_order=1;
commit;
