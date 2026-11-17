-- Cashback belongs to its qualifying AR non-product invoice; keep disabled until ownership is resolved.
begin;
update public.ledger_rules set enabled=false,active=true,reversible=true,airtable_sources='FIN: Invoices',when_to_post='[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Invoices.Invoice Amount != 0',fin_notes='Use Invoice Amount from the Fully Paid AR Non-Product invoice; its Sent card-clearing payment supplies the date.',dev_notes='[T-Chart]
Category - Payment, row 19
[Implementation]
Partial - functioning; disabled pending ownership

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Invoices.Invoice Amount != 0

[Field Mapping]
Amount = Invoices.Invoice Amount
Date = Linked Payments.Payment Date
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
004.011: Purchased Discounts & Rebate -> Supabase 004.011

[Issues]
- Can duplicate Invoice Entry rows 11/12; choose which route owns cashback.',debit_label='Credit Card Clearing (231.100)',credit_label='Purchase Discounts & Rebates (004.011)' where rule_code='PAY-27';
update public.ledger_rule_lines set account_code='231.100',account_selector=null,label='Credit Card Clearing (231.100)' where rule_code='PAY-27' and side='debit' and line_order=1;
update public.ledger_rule_lines set account_code='004.011',account_selector=null,label='Purchase Discounts & Rebates (004.011)' where rule_code='PAY-27' and side='credit' and line_order=1;
commit;
