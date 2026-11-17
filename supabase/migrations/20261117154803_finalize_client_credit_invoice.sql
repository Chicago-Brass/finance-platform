-- Finalize invoice-owned client credit creation using the chart's payment account and approved sign.
update public.ledger_rules set enabled=true,active=true,reversible=true,
 fin_notes='Use the negated credit Invoice Amount to record client credit available.',
 dev_notes='[T-Chart]
Category - Payment, row 2
[Implementation]
Fully

Recognize the AR refund/credit invoice, regardless of Method of Application.

[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Invoices.Invoice Type = "AR"
Invoices.Vendor Type (AR) = "AR - Refund/Credit"

[Field Mapping]
Amount = -Invoices.Invoice Amount
Date = Invoices.Invoice Date
Branch = Invoices.Branch
Debit = Invoices.Linked Payments.Account to Pay/Receive
Credit = 221.300

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
Client Credits on Account (221.300) -> Supabase 221.300'
where rule_code='PAY-03';
