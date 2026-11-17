-- Route replacement payments through PAY-30 using FIN Repayment, preserving signed amounts.
begin;
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = true
Invoices.Linked Chart of Accounts is not empty
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"',dev_notes='[T-Chart]
Category - Expenses, row 6
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
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = true
Invoices.Linked Chart of Accounts is not empty
Payments.Account to Pay/Receive includes "231.100: Credit Card Clearing"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = Invoices.Linked Chart of Accounts
Credit = 231.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
Invoices.Linked Chart of Accounts -> Supabase matching expense account
008.001: Software Licensing -> Supabase 008.001
009.002: Travel -> Supabase 009.002
009.006: Dues & Organization Subscription -> Supabase 009.006
231.100: Credit Card Clearing -> Supabase 231.100
525300: Workers Compensation -> Supabase 525.300
922000: Freight and Handling In -> Supabase 922.000' where rule_code='EXP-02';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes any of "004.012", "004.013", "005.004", "005.301", "005.302", "006.001", "006.002", "006.003", "006.004", "007.001", "007.003", "007.004", "007.006", "007.007", "007.011", "007.012", "008.001", "008.002", "008.003", "008.004", "009.001", "009.002", "009.003", "009.004", "009.005", "009.006", "009.007", "009.008", "009.009", "009.010", "009.011", "009.012", "009.013", "009.102", "010.002", "525300", "922000"',dev_notes='[T-Chart]
Category - Expenses, row 3
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
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes any of "004.012", "004.013", "005.004", "005.301", "005.302", "006.001", "006.002", "006.003", "006.004", "007.001", "007.003", "007.004", "007.006", "007.007", "007.011", "007.012", "008.001", "008.002", "008.003", "008.004", "009.001", "009.002", "009.003", "009.004", "009.005", "009.006", "009.007", "009.008", "009.009", "009.010", "009.011", "009.012", "009.013", "009.102", "010.002", "525300", "922000"

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
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-14';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
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
Payments.Repayment = false
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
112.200: Fidelity -> Supabase 112.200' where rule_code='EXP-16';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoices.Mark as Prepaid Asset? = true
Invoices.Linked Chart of Accounts is not empty',dev_notes='[T-Chart]
Category - Expenses, row 8
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
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoices.Mark as Prepaid Asset? = true
Invoices.Linked Chart of Accounts is not empty

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
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-17';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.102: Tech Allowance"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 11
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
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.102: Tech Allowance"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch Employee
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
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-18';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "005.001: Salary - Owners", "005.002: Salary - W2", "005.003: Salary - 1099", "005.005: 401K", "005.006: Payroll Taxes"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 13
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
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "005.001: Salary - Owners", "005.002: Salary - W2", "005.003: Salary - 1099", "005.005: 401K", "005.006: Payroll Taxes"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
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
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-19';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.101: Salary - Offshore"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 15
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
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.101: Salary - Offshore"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
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
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-20';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.201: Bonus"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 17
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
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.201: Bonus"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
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
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-21';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.103: 13th Month"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 19
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
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Staff"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes "005.103: 13th Month"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 241.300
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
241.300: Accrued Bonus & Commission -> Supabase 241.300
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-23';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "923100: Federal Income Tax", "923300: State Income Tax"
Invoice Lines.Line Amount is not empty',dev_notes='[T-Chart]
Category - Expenses, row 27
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
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Invoice Status (AP) = "Fully Paid"
Invoice Lines.Chart of Accounts includes any of "923100: Federal Income Tax", "923300: State Income Tax"
Invoice Lines.Line Amount is not empty

[Field Mapping]
Amount = Sum of matching Invoice Lines.Line Amount per invoice and account
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
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-26';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes "007.002: Bank / Misc. Service Charges"',dev_notes='[T-Chart]
Category - Expenses, row 22
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
Payments.Repayment = false
Payments.Return Payment (AP) = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Mark as No Vendor Bill? = false
Invoices.Linked Chart of Accounts includes "007.002: Bank / Misc. Service Charges"

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
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='EXP-27';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
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
Payments.Repayment = false
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
231.100: Credit Card Clearing -> Supabase 231.100' where rule_code='PAY-08';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Invoices.Credits Applied is not empty
Invoices.Credits Applied != 0',dev_notes='[T-Chart]
Category - Payment, row 8
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
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Payment Invoice Status = "Fully Paid"
Invoices.Credits Applied is not empty
Invoices.Credits Applied != 0

[Field Mapping]
Amount = -Invoices.Credits Applied
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100 (bill)
Credit = 211.100 (source credit invoice)

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100

[Notes]
- A zero-cash Sent payment still qualifies. Do not require Payments.Amount to be nonzero.' where rule_code='PAY-11';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Linked Chart of Accounts includes "316.100: Prior to Current Year Distributions"',dev_notes='[T-Chart]
Category - Payment, row 14
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
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"
Invoices.Linked Chart of Accounts includes "316.100: Prior to Current Year Distributions"

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 316.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
316.100: Prior to Current Year Distributions -> Supabase 316.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200' where rule_code='PAY-20';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Linked Chart of Accounts includes "143.200: Security Deposits"',dev_notes='[T-Chart]
Category - Payment, row 18
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
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Linked Chart of Accounts includes "143.200: Security Deposits"

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
112.200: Fidelity -> Supabase 112.200' where rule_code='PAY-24';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Mark as Prepaid Asset? = false
Invoices.Linked Chart of Accounts includes "143.300: Display Fixtures & Equipment"',dev_notes='[T-Chart]
Category - Invoice Entry, row 8
[Implementation]
Partially

[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Repayment = false
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Assets"
Invoices.Mark as Prepaid Asset? = false
Invoices.Linked Chart of Accounts includes "143.300: Display Fixtures & Equipment"

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
Accounts Payable (211.100) -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
231.100: Credit Card Clearing -> Supabase 231.100

[Issues]
- Which asset accounts should qualify beyond Display Fixtures & Equipment 143.300?' where rule_code='INV-17';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Invoice Type = "AP"
Payments.Return Payment (AP) = true',dev_notes='[T-Chart]
Category - Payment, row 9
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
Payments.Invoice Type = "AP"
Payments.Return Payment (AP) = true

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = blank
Debit = 112.100
Credit = 211.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
211.100: Standard Product -> Supabase 211.100' where rule_code='PAY-12';
update public.ledger_rules set when_to_post='[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Payments.Sent = true
Payments.Invoice Type = "AP"
Payments.Repayment = true',dev_notes='[T-Chart]
Category - Payment, row 10
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
Payments.Invoice Type = "AP"
Payments.Repayment = true

[Field Mapping]
Amount = Payments.Amount
Date = Payments.Payment Date
Branch = Invoices.Branch
Debit = 211.100
Credit = 112.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates

[Account Mapping]
211.100: Standard Product -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100',enabled=true,active=true,reversible=true where rule_code='PAY-30';
update public.ledger_rules set fin_notes='Record the replacement Sent AP payment marked Repayment; ordinary settlement rules exclude it.' where rule_code='PAY-30';
commit;
