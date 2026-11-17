-- Cashback posts only through PAY-27; generic AR non-product entries exclude its invoice account.
begin;
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
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"',dev_notes='[T-Chart]
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
- Possible duplicate with Category - Payment rows 12/13/15/16 if those rules are enabled.' where rule_code='INV-10';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"',dev_notes='[T-Chart]
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
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Non-Product"
Invoices.Linked Chart of Accounts does not include "004.011: Purchased Discounts & Rebate"

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
- Possible duplicate with Category - Payment rows 12/13/15/16 if those rules are enabled.' where rule_code='INV-18';
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
Invoices.Linked Chart of Accounts includes "004.011: Purchased Discounts & Rebate"
Invoices.Payment Invoice Status = "Fully Paid"
Linked Payments.Sent = true
Linked Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"
Invoices.Invoice Amount != 0',dev_notes='[T-Chart]
Category - Payment, row 19
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
004.011: Purchased Discounts & Rebate -> Supabase 004.011',enabled=true,active=true,reversible=true where rule_code='PAY-27';
commit;
