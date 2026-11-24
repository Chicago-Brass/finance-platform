-- Renumber public labels only. Journal and Airtable posting keys use rule_code.
do $migration$
begin
  if (select count(*) from public.ledger_rules where category='expense' and retired_at is null
      and display_code=any(array(select 'EXP-'||lpad(n::text,2,'0') from generate_series(1,31)n))) <> 31
     or not exists(select from public.ledger_rules where rule_code='PAY-13' and display_code='EXP-10')
     or exists(select from public.ledger_rules where rule_code in ('EXP-32','EXP-33','EXP-34')) then
    raise exception 'Unexpected expense catalog mapping';
  end if;
end
$migration$;

-- Clear labels temporarily to avoid conflicts with the immediate unique index.
update public.ledger_rules
set display_code = 'reorder:' || display_code
where category='expense' and retired_at is null and display_code between 'EXP-10' and 'EXP-31';

with shifted as (
  select rule_code, split_part(display_code,'-',2)::integer + 1 as number
  from public.ledger_rules where category='expense' and display_code like 'reorder:EXP-%'
)
update public.ledger_rules r
set display_code='EXP-' || lpad(s.number::text,2,'0'), sort_order=s.number+1
from shifted s where r.rule_code=s.rule_code;

insert into public.ledger_rules (sort_order,rule_code,display_code,chart_family,trigger_name,debit_label,credit_label,source_table,source_label,when_to_post,dev_notes,category,airtable_sources,reversible,active,enabled,implementation_status)
select v.*, 'expense', 'FIN: ' || v.source_label,true,true,false,'not_implemented'
from (values
  (11,'EXP-32','EXP-10','Vendor Credits and Refunds','AP Refund Invoice','Accounts Payable (211.100)','Cost of Goods Sold (004.010)','tbldQXuqNEp8G5pfs','Invoices','[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)','[Filters]
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Refund"
Invoices.Invoice Amount < 0

[Field Mapping]
Amount = -Invoices.Invoice Amount
Date = Invoices.Invoice Date
Branch = Invoices.Branch; if blank, use Invoices.Branch (from Linked Transaction) if one distinct value
Debit = 211.100
Credit = 004.010

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates
Source Record Name = Invoices.Invoice ID
Client Names = Primary names of linked client records, when available
Vendor Names = Primary names of linked vendor records, when available
Reference Number = Invoices.Invoice ID (Short), when one linked invoice is identified

[Account Mapping]
211.100: Accounts Payable -> Supabase 211.100
004.010: Cost of Goods Sold -> Supabase 004.010

[Notes]
- Applies when a product invoice is reclassified as AP - Refund. EXP-08 continues to handle AP Credit return memos.'),
  (34,'EXP-33','EXP-33','Sales Tax','AP Sales Tax Invoice','Sales Tax Expense (GL pending)','Accounts Payable (211.100)','tbldQXuqNEp8G5pfs','Invoices','[Record]
Invoices

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)','[Filters]
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Sales Tax)"

[Field Mapping]
Amount = Invoices.Invoice Amount
Date = Invoices.Invoice Date
Branch = Invoices.Branch; if blank, use Invoices.Branch (from Linked Transaction) if one distinct value
Debit = Sales Tax Expense (GL pending)
Credit = 211.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates
Source Record Name = Invoices.Invoice ID
Client Names = Primary names of linked client records, when available
Vendor Names = Primary names of linked vendor records, when available
Reference Number = Invoices.Invoice ID (Short), when one linked invoice is identified

[Account Mapping]
Sales Tax Expense -> Supabase GL pending
211.100: Accounts Payable -> Supabase 211.100

[Issues]
- Confirm the Sales Tax Expense GL. FIN links the state bills to sales tax payable accounts.'),
  (35,'EXP-34','EXP-34','Sales Tax','AP Sales Tax Payment','Accounts Payable (211.100)','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)','tblR61NG9i0giid28','Payments','[Record]
Payments

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)','[Filters]
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Expenses (Sales Tax)"
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"

[Field Mapping]
Amount = Payments.Amount * SUM(Matching Invoices.Payment Proportion For Batch Allocation)
Date = Payments.Payment Date
Branch = Invoices.Branch; if blank, use Invoices.Branch (from Linked Transaction) if one distinct value
Debit = 211.100
Credit = Payments.Account to Pay/Receive

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates
Source Record Name = Payments.Payment
Client Names = Primary names of linked client records, when available
Vendor Names = Primary names of linked vendor records, when available
Reference Number = Payments.Reference Number

[Account Mapping]
211.100: Accounts Payable -> Supabase 211.100
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200

[Notes]
- Retain the linked invoice and state references. Verify the bill and payment clear the same AP balance.')
) as v(sort_order,rule_code,display_code,chart_family,trigger_name,debit_label,credit_label,source_table,source_label,when_to_post,dev_notes);

update public.ledger_rules set trigger_name='AP Refund Payment',dev_notes='[Filters]
Invoices.Invoice Type = "AP"
Invoices.Vendor Type (AP) = "AP - Refund"
Payments.Sent = true
Payments.Payment Record Type = "Regular Payment"

[Field Mapping]
Amount = -(Payments.Amount * SUM(Matching Invoices.Payment Proportion For Batch Allocation))
Date = Payments.Payment Date
Branch = Invoices.Branch; if blank, use Invoices.Branch (from Linked Transaction) if one distinct value
Debit = Payments.Account to Pay/Receive
Credit = 211.100

[Other Field Mapping]
Vendor Reference = Invoices.Linked Vendors
Client Reference = Invoices.Linked Client
Staff Reference = Invoices.Linked Staff
Transaction Reference = Invoices.Linked Transaction
PO Reference = Invoices.Related Purchase Order
State References = Invoices.States & Sales Tax Rates
Source Record Name = Payments.Payment
Client Names = Primary names of linked client records, when available
Vendor Names = Primary names of linked vendor records, when available
Reference Number = Payments.Reference Number

[Account Mapping]
112.100: Fifth Third Bank -> Supabase 112.100
0747: Nickel Operating Account -> Supabase 112.300
112.200: Fidelity -> Supabase 112.200
211.100: Accounts Payable -> Supabase 211.100

[Notes]
- A negative refund share within a mixed payment reduces the net withdrawal. Validate both rules against the same payment total.'
where rule_code='PAY-13';

update public.ledger_rules r set dev_notes=
  regexp_replace(coalesce(r.dev_notes,''), E'\n\n\\[(Issues|Run Concerns)\\](.|\n)*$', '')
  || E'\n\n' || v.notes
from (values
  ('EXP-15','[Run Concerns]
- Reclassify confirmed mislabeled negative product invoices as AP - Refund. Reverse their existing EXP-04 journals before reposting under EXP-10.'),
  ('EXP-16','[Run Concerns]
- Excluded credits put 22 bank batches above net cash.
- For mixed batches, EXP-11 owns the AP Refund share. Rebuild affected existing settlements and verify the combined entries equal the bank withdrawal.'),
  ('PAY-08','[Run Concerns]
- An excluded vendor credit put one card batch above net.
- If a card batch includes a reclassified refund, validate both rule allocations against the net card settlement.')
) v(code,notes) where r.rule_code=v.code;

update public.ledger_rules set dev_notes=regexp_replace(
  regexp_replace(dev_notes,'Category - Expenses, row [0-9]+','Category - Expenses, row ' || sort_order),
  E'(\\[Code\\]\n)[A-Z]+-[0-9]+', E'\\1'||display_code)
where category='expense' and retired_at is null and dev_notes like '[T-Chart]%';
