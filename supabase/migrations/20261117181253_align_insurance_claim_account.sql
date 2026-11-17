-- Record insurance payouts once through PAY-23; exclude generic AR routes.
begin;
insert into public.accounts(code,name,account_type,subtype,normal_balance,is_bank,is_postable,active) values ('004.004','Insurance Claim Recoveries','revenue','other_income','credit',false,true,true) on conflict (code) do nothing;
update public.ledger_rules set when_to_post='[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"
Invoices.Linked Chart of Accounts does not include "004.004: Shipping Insurance Payouts Recieved"',dev_notes='[T-Chart]
Category - Invoice Entry, row 11
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
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"
Invoices.Linked Chart of Accounts does not include "004.004: Shipping Insurance Payouts Recieved"

[Field Mapping]
Amount = Invoices.Invoice Amount
Date = Invoices.Invoice Date
Branch = Invoices.Branch
Debit = 121.100
Credit = Invoices.Linked Chart of Accounts

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Accounts Receivable (121.100) -> Supabase 121.100
Invoices.Linked Chart of Accounts -> Supabase matching account
Example: 004.002: Coordination Fees Charged -> Supabase 004.002
525300: Workers Compensation -> Supabase 525.300
922000: Freight and Handling In -> Supabase 922.000

[Issues]
- Potential loan overlaps with Category - Payment rows 12/13 remain unresolved. Those handlers currently stop before posting.' where rule_code='INV-10';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"
Invoices.Linked Chart of Accounts does not include "004.004: Shipping Insurance Payouts Recieved"',dev_notes='[T-Chart]
Category - Invoice Entry, row 12
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
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"
Invoices.Linked Chart of Accounts does not include "311.200: Paid in Capital"
Invoices.Linked Chart of Accounts does not include "004.004: Shipping Insurance Payouts Recieved"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Payments.Account to Pay/Receive
Credit = 121.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100
Accounts Receivable (121.100) -> Supabase 121.100

[Notes]
- Product and Non-Product invoices are paid separately.

[Issues]
- Potential loan overlaps with Category - Payment rows 12/13 remain unresolved. Those handlers currently stop before posting.' where rule_code='INV-18';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.004: Shipping Insurance Payouts Recieved"',dev_notes='[T-Chart]
Category - Payment, row 16
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
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts includes "004.004: Shipping Insurance Payouts Recieved"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 112.100
Credit = 004.004

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
004.004: Shipping Insurance Payouts Recieved -> Supabase 004.004',enabled=true,active=true,reversible=true,credit_label='Insurance Claim Recoveries (004.004)',fin_notes='Record the Sent insurance payout directly to 004.004; generic AR entries exclude invoice account 004.004.' where rule_code='PAY-23';
update public.ledger_rule_lines set account_code='004.004',account_selector=null,label='Insurance Claim Recoveries (004.004)' where rule_code='PAY-23' and side='credit' and line_order=1;
commit;
