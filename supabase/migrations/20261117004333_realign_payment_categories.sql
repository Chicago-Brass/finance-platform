-- Existing hosted catalog targets, also available before seed on fresh installations.
insert into public.accounts(code,name,account_type,subtype,normal_balance,is_bank,is_postable,active,airtable_record_id)
select code,name,account_type::public.account_type,subtype,normal_balance::public.balance_side,is_bank,is_postable,active,airtable_record_id
from jsonb_to_recordset($targets$[{"code": "004.011", "name": "Purchase Discounts & Rebates", "account_type": "expense", "subtype": "contra_cogs", "normal_balance": "credit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "112.100", "name": "Bank \u2013 Fifth Third", "account_type": "asset", "subtype": "bank", "normal_balance": "debit", "is_bank": true, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "121.100", "name": "Accounts Receivable", "account_type": "asset", "subtype": "receivable", "normal_balance": "debit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "122.100", "name": "Insurance Claims Receivable", "account_type": "asset", "subtype": "receivable", "normal_balance": "debit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "143.200", "name": "Security Deposits", "account_type": "asset", "subtype": "other_asset", "normal_balance": "debit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "211.100", "name": "Accounts Payable", "account_type": "liability", "subtype": "payable", "normal_balance": "credit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "221.300", "name": "Client Credits on Account", "account_type": "liability", "subtype": "customer_funds", "normal_balance": "credit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "231.100", "name": "Credit Card Payable", "account_type": "liability", "subtype": "credit_card", "normal_balance": "credit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "311.200", "name": "Additional Paid-in Capital", "account_type": "equity", "subtype": "capital", "normal_balance": "credit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}, {"code": "316.100", "name": "Shareholder Distributions", "account_type": "equity", "subtype": "distributions", "normal_balance": "debit", "is_bank": false, "is_postable": true, "active": true, "airtable_record_id": null}]$targets$::jsonb) as a(code text,name text,account_type text,subtype text,normal_balance text,is_bank boolean,is_postable boolean,active boolean,airtable_record_id text) on conflict(code) do nothing;

-- Reordered Payment T-Charts. Retire only unreferenced rules; posted history stays reversible.
update public.ledger_rules r set active=false,enabled=false where r.category='payment' and r.rule_code not in ('PAY-03','PAY-28','PAY-29','PAY-08','PAY-09','PAY-10','PAY-11','PAY-12','PAY-30','PAY-13','PAY-31','PAY-16','PAY-20','PAY-21','PAY-23','PAY-32','PAY-24','PAY-27');
delete from public.ledger_rules r where r.category='payment' and r.rule_code not in ('PAY-03','PAY-28','PAY-29','PAY-08','PAY-09','PAY-10','PAY-11','PAY-12','PAY-30','PAY-13','PAY-31','PAY-16','PAY-20','PAY-21','PAY-23','PAY-32','PAY-24','PAY-27')
 and not exists(select 1 from public.journal_entries e where e.rule_code=r.rule_code)
 and not exists(select 1 from public.ledger_posting_requests p where p.status in ('pending','approved','rejected') and p.payload::text like '%'||r.rule_code||'%');

insert into public.ledger_rules(rule_code,category,sort_order,trigger_name,when_to_post,fin_notes,dev_notes,airtable_sources,reversible,active,enabled,debit_label,credit_label)
select rule_code,'payment',sort_order,trigger_name,when_to_post,fin_notes,dev_notes,airtable_sources,reversible,active,enabled,debit_label,credit_label
from jsonb_populate_recordset(null::public.ledger_rules,$payment$[
  {
    "rule_code": "PAY-03",
    "category": "payment",
    "sort_order": 2,
    "trigger_name": "Client OVERPAYS or pays with no invoice to apply it to",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Refund/Credit\"",
    "fin_notes": "Use the refund/credit payment amount to record credit available for another order.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 2\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nRecognize the AR refund/credit invoice, regardless of Method of Application.\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Refund/Credit\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount (sign pending)\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = Pending - funding account\nCredit = 221.300\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\nClient Credits on Account (221.300) -> Supabase 221.300\n\n[Issues]\n- The original receipt may already debit the bank through Invoice Entry row 3 or 6. Which account should fund this client credit instead?\n\n- The sampled credit invoices are negative. Should Amount negate Invoice Amount to credit the client-credit liability?",
    "airtable_sources": "FIN: Invoices",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "credit_label": "Client Credits on Account (221.300)"
  },
  {
    "rule_code": "PAY-28",
    "category": "payment",
    "sort_order": 3,
    "trigger_name": "When we apply AR Credits to Open invoices",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Credits Applied is not empty\nInvoices.Credits Applied != 0\nSource Credit Invoice.Method of Application = \"Credit to Another Order\"",
    "fin_notes": "",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 3\n[Implementation]\nFully\n\nApply client credit to the recipient AR invoice when Credits Applied is populated and nonzero.\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Credits Applied is not empty\nInvoices.Credits Applied != 0\nSource Credit Invoice.Method of Application = \"Credit to Another Order\"\n\n[Field Mapping]\nAmount = -Invoices.Credits Applied\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 221.300\nCredit = 121.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nClient Credits on Account (221.300) -> Supabase 221.300\n121.100: Accounts Receivable -> Supabase 121.100",
    "airtable_sources": "FIN: Invoices",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Client Credits on Account (221.300)",
    "credit_label": "Accounts Receivable (121.100)"
  },
  {
    "rule_code": "PAY-29",
    "category": "payment",
    "sort_order": 4,
    "trigger_name": "When we refund AR credits to customers (no remaining open invoices)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Refund/Credit\"\nInvoices.Method of Application = \"Cash Refund\"",
    "fin_notes": "",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 4\n[Implementation]\nFully\n\nRefund the client credit when the linked Cash Refund invoice payment is Sent.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Refund/Credit\"\nInvoices.Method of Application = \"Cash Refund\"\n\n[Field Mapping]\nAmount = -Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 221.300\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\nClient Credits on Account (221.300) -> Supabase 221.300\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Client Credits on Account (221.300)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)"
  },
  {
    "rule_code": "PAY-08",
    "category": "payment",
    "sort_order": 5,
    "trigger_name": "Pay a vendor with the company credit card",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"",
    "fin_notes": "Use Payment Date for AP Product payments made through Credit Card Clearing 231.100.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 5\n[Implementation]\nPartial - functioning; duplicate risk noted\n\nPay an AP Product invoice through Credit Card Clearing 231.100.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Product\"\nPayments.Account to Pay/Receive includes \"231.100: Credit Card Clearing\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 231.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n231.100: Credit Card Clearing -> Supabase 231.100\n\n[Issues]\n- Category - Expenses row 5 already matches these product card payments. Which category should own this entry so it posts only once?",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Credit Card Payable (231.100)"
  },
  {
    "rule_code": "PAY-09",
    "category": "payment",
    "sort_order": 6,
    "trigger_name": "Pay the credit-card statement",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"CC Batch Payment\"",
    "fin_notes": "When: When the card batch payment is sent (Payment Record Type = 'CC Batch Payment').",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 6\n[Implementation]\nFully\n\nPay the CC Batch Payment record from its selected payment account.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Payment Record Type = \"CC Batch Payment\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Linked Mini-Payments.Invoices.Branch\nDebit = 231.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Linked Mini-Payments.Invoices.Linked Vendors\nClient Reference = Linked Mini-Payments.Invoices.Linked Client\nStaff Reference = Linked Mini-Payments.Invoices.Linked Staff\nTransaction Reference = Linked Mini-Payments.Invoices.Linked Transaction\nPO Reference = Linked Mini-Payments.Invoices.Related Purchase Order\nState References = Linked Mini-Payments.Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n231.100: Credit Card Clearing -> Supabase 231.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Credit Card Payable (231.100)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)"
  },
  {
    "rule_code": "PAY-10",
    "category": "payment",
    "sort_order": 7,
    "trigger_name": "Early-payment discount taken when paying a vendor",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nLinked Payments.Sent = true\nInvoice Lines.Line Type = \"Discount\"\nInvoice Lines.Discount Line Status != \"Expired\"",
    "fin_notes": "Use non-expired discount lines from a Fully Paid AP invoice. Credit account mapping remains unresolved.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 7\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nRecord the early-payment discount line separately from the cash payment, if the invoice accrual has not already included it.\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nLinked Payments.Sent = true\nInvoice Lines.Line Type = \"Discount\"\nInvoice Lines.Discount Line Status != \"Expired\"\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount (sign pending)\nDate = Linked Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 004.011 (pending approval)\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n004.011: Purchased Discounts & Rebate -> Supabase 004.011\n\n[Issues]\n- Expense row 4 posts Invoice Amount after discount, and Expense row 5 clears that net amount. Should the invoice accrual use the gross amount before this separate discount entry?\n\n- Confirm this row credits only 004.011. The account column previously also included the bank, which the payment entry already credits.\n\n- Discount Line Amount is negative, for example -3.58. Should its amount be negated for debit AP / credit 004.011?",
    "airtable_sources": "FIN: Invoice Lines",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Purchase Discounts & Rebates (004.011) - pending approval"
  },
  {
    "rule_code": "PAY-11",
    "category": "payment",
    "sort_order": 8,
    "trigger_name": "Bill paid using vendor credits (no cash)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Credits Applied is not empty\nInvoices.Credits Applied != 0",
    "fin_notes": "Use Credits Applied from a Fully Paid AP invoice with a Sent payment. Keep separate bill and source-credit references.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 8\n[Implementation]\nFully\n\nSettle the linked AP bill using vendor credits. The Sent payment owns the journal and reversal.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nInvoices.Credits Applied is not empty\nInvoices.Credits Applied != 0\n\n[Field Mapping]\nAmount = -Invoices.Credits Applied\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100 (bill)\nCredit = 211.100 (source credit invoice)\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n\n[Notes]\n- A zero-cash Sent payment still qualifies. Do not require Payments.Amount to be nonzero.",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Accounts Payable (211.100)\nBill being settled",
    "credit_label": "Accounts Payable (211.100)\nSource credit invoice"
  },
  {
    "rule_code": "PAY-12",
    "category": "payment",
    "sort_order": 9,
    "trigger_name": "Vendor payment cancelled / returned (When Return Payment is marked)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Invoice Type = \"AP\"\nPayments.Return Payment (AP) = true",
    "fin_notes": "Record only a Sent AP returned payment using Payments.Amount and Payments.Payment Date. Cancellation is excluded.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 9\n[Implementation]\nFully\n\nRecord the returned AP payment. Cancellation is excluded from this category.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Invoice Type = \"AP\"\nPayments.Return Payment (AP) = true\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = blank\nDebit = 112.100\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n211.100: Standard Product -> Supabase 211.100",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Fifth Third Bank (112.100)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "PAY-30",
    "category": "payment",
    "sort_order": 10,
    "trigger_name": "Vendor Return Payment, Repaid",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Invoice Type = \"AP\"\nPayments.Repay = true (source record pending confirmation)",
    "fin_notes": "",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 10\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nRecord the replacement vendor payment after a returned payment.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nPayments.Invoice Type = \"AP\"\nPayments.Repay = true (source record pending confirmation)\n\n[Field Mapping]\nAmount = Payments.Amount (source record pending confirmation)\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = 112.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n\n[Issues]\n- Repay=true is on a negative -91.47 record between the original returned payment and a positive 91.47 replacement. Should this row post the positive replacement once Sent instead?",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Fifth Third Bank (112.100)"
  },
  {
    "rule_code": "PAY-13",
    "category": "payment",
    "sort_order": 11,
    "trigger_name": "Vendor sends us a refund, Invoice is not an AP-Credit, Negative payment record against an actual return invoice",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Refund\"",
    "fin_notes": "When: When the vendor refund is received.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 11\n[Implementation]\nFully\n\nReceive the vendor refund through a Sent payment linked to the new AP - Refund invoice type.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Refund\"\n\n[Field Mapping]\nAmount = -Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n211.100: Standard Product -> Supabase 211.100",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "PAY-31",
    "category": "payment",
    "sort_order": 12,
    "trigger_name": "AR Non-product created with a loan account",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Loan Records is not empty\nInvoices.Linked Chart of Accounts includes a loan liability account = Pending",
    "fin_notes": "",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 12\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nRecognize the borrowing linked to an AR Non-Product loan invoice.\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Loan Records is not empty\nInvoices.Linked Chart of Accounts includes a loan liability account = Pending\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 112.100\nCredit = Invoices.Linked Chart of Accounts\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\nLoan liability accounts -> Supabase matching account (list pending)\n\n[Issues]\n- Should the bank debit wait for the loan receipt payment? An invoice alone does not confirm cash received.\n\n- Which loan liability accounts qualify? The selected account is on the invoice, not on Loan Records.\n\n- The same AR Non-Product invoice/payment qualifies for Invoice Entry rows 11/12. Which flow should own the borrowing entry?",
    "airtable_sources": "FIN: Invoices",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Fifth Third Bank (112.100)",
    "credit_label": "Invoice loan account linked\nExample: Auto Loan Payable (232.100)"
  },
  {
    "rule_code": "PAY-16",
    "category": "payment",
    "sort_order": 13,
    "trigger_name": "Loan payment (principal + interest) ONLY scenario where AR invoice > AP Payment",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nMonthly loan invoice link = Pending\nPrincipal / interest source = Pending",
    "fin_notes": "Use separately coded principal and interest invoice lines. Date the entry with Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 13\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nPay the principal and interest linked to the AR Non-Product loan invoice, with one journal per account.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nMonthly loan invoice link = Pending\nPrincipal / interest source = Pending\n\n[Field Mapping]\nAmount = Pending - principal and interest amounts per account\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 232.100 (principal) or 007.003 (interest)\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n232.100: Auto Loan Payable -> Supabase 232.100\n007.003: Interest Expense -> Supabase 007.003\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n\n[Issues]\n- Which invoice link identifies a monthly repayment rather than the original borrowing: Loan Records or Loan Records 2?\n\n- Should principal and interest come from Invoice Lines.Line Amount or Debt Amortization Table.Principal and Interest?\n\n- Invoice Entry row 12 treats Sent payments on AR Non-Product invoices as cash receipts. How should this outgoing loan payment be separated?",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Invoice-line account linked\nAuto Loan Payable (232.100)\nInterest Expense (007.003)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)"
  },
  {
    "rule_code": "PAY-20",
    "category": "payment",
    "sort_order": 14,
    "trigger_name": "Owner distribution paid",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"316.100: Prior to Current Year Distributions\"",
    "fin_notes": "When: When the distribution is paid (approved by owners).",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 14\n[Implementation]\nFully\n\nPost the owner distribution when its AP expense payment is sent.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Expenses (Non-Sales Tax)\"\nInvoices.Linked Chart of Accounts includes \"316.100: Prior to Current Year Distributions\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 316.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n316.100: Prior to Current Year Distributions -> Supabase 316.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Shareholder Distributions (316.100)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)"
  },
  {
    "rule_code": "PAY-21",
    "category": "payment",
    "sort_order": 15,
    "trigger_name": "Owner puts money into the company",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"311.200: Paid in Capital\"",
    "fin_notes": "When: When the contribution is received.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 15\n[Implementation]\nPartial - functioning; duplicate risk noted\n\nRecord the owner cash contribution from its AR Non-Product payment.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"311.200: Paid in Capital\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = Payments.Account to Pay/Receive\nCredit = 311.200\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200\n311.200: Paid in Capital -> Supabase 311.200\n\n[Issues]\n- The invoice matches Invoice Entry row 11 and its payment matches row 12. Should those generic AR entries handle the contribution, or should this direct entry replace them?",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)",
    "credit_label": "Additional Paid-in Capital (311.200)"
  },
  {
    "rule_code": "PAY-23",
    "category": "payment",
    "sort_order": 16,
    "trigger_name": "Insurance claim payout received",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"122.100\" (FIN account pending)",
    "fin_notes": "Use Payment Date and the fixed Fifth Third debit. FIN account identity and overlap ownership remain unresolved.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 16\n[Implementation]\nPartial - not functioning; throws Not yet implemented\n\nReceive the insurance claim into Fifth Third, clearing Insurance Claims Receivable 122.100.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Linked Chart of Accounts includes \"122.100\" (FIN account pending)\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 112.100\nCredit = 122.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n112.100: Fifth Third Bank -> Supabase 112.100\nFIN insurance receivable account pending -> Supabase 122.100\n\n[Issues]\n- Supabase 122.100 exists, but FIN has no 122.100 account for the invoice filter. Which FIN account should identify the claim receivable?\n\n- The invoice/payment also matches Invoice Entry rows 11/12. Which route should own the claim receipt?",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Fifth Third Bank (112.100)",
    "credit_label": "Insurance Claims Receivable (122.100)"
  },
  {
    "rule_code": "PAY-32",
    "category": "payment",
    "sort_order": 17,
    "trigger_name": "Security Deposit with Chart of Account Security Deposit",
    "when_to_post": "[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Linked Chart of Accounts includes \"143.200: Security Deposits\"",
    "fin_notes": "",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 17\n[Implementation]\nFully\n\nRecord the security-deposit asset and AP when the asset invoice is recognized.\n\n[Record]\nInvoices\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Linked Chart of Accounts includes \"143.200: Security Deposits\"\n\n[Field Mapping]\nAmount = Invoices.Invoice Amount\nDate = Invoices.Invoice Date\nBranch = Invoices.Branch\nDebit = 143.200\nCredit = 211.100\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n143.200: Security Deposits -> Supabase 143.200\n211.100: Standard Product -> Supabase 211.100",
    "airtable_sources": "FIN: Invoices",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Security Deposits (143.200)",
    "credit_label": "Accounts Payable (211.100)"
  },
  {
    "rule_code": "PAY-24",
    "category": "payment",
    "sort_order": 18,
    "trigger_name": "Security deposit paid (lease)",
    "when_to_post": "[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Linked Chart of Accounts includes \"143.200: Security Deposits\"",
    "fin_notes": "Record the security-deposit payment using Payment Date.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 18\n[Implementation]\nFully\n\nPay the AP Asset security-deposit invoice, debiting AP and crediting the selected payment account.\n\n[Record]\nPayments\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nPayments.Sent = true\nInvoices.Invoice Type = \"AP\"\nInvoices.Vendor Type (AP) = \"AP - Assets\"\nInvoices.Linked Chart of Accounts includes \"143.200: Security Deposits\"\n\n[Field Mapping]\nAmount = Payments.Amount\nDate = Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 211.100\nCredit = Payments.Account to Pay/Receive\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n211.100: Standard Product -> Supabase 211.100\n112.100: Fifth Third Bank -> Supabase 112.100\n0747: Nickel Operating Account -> Supabase 112.300\n112.200: Fidelity -> Supabase 112.200",
    "airtable_sources": "FIN: Payments",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Accounts Payable (211.100)",
    "credit_label": "Payment account linked\nExamples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)"
  },
  {
    "rule_code": "PAY-27",
    "category": "payment",
    "sort_order": 19,
    "trigger_name": "Credit-card rebate earned (cash back)",
    "when_to_post": "[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nLinked Payments.Sent = true\nInvoice Lines.Line Type = \"Expense\"\nInvoice Lines.Chart of Accounts includes \"004.011: Purchased Discounts & Rebate\"\nInvoice Lines.Line Amount != 0",
    "fin_notes": "Use Invoice Lines.Line Amount from the matching rebate line on a Fully Paid AR Non-Product invoice linked to a Sent payment.",
    "dev_notes": "[T-Chart]\nCategory - Payment, row 19\n[Implementation]\nPartial - functioning; duplicate risk noted\n\nReduce the card liability using each matching 004.011 rebate line on the fully paid AR Non-Product invoice.\n\n[Record]\nInvoice Lines\n\n[Primary]\nEvery day at 11:00 PM America/Chicago\n\n[Secondary]\nDashboard Sync Button\nManual Webhook (full or single record)\n\n[Filters]\nInvoices.Invoice Type = \"AR\"\nInvoices.Vendor Type (AR) = \"AR - Non-Product\"\nInvoices.Payment Invoice Status = \"Fully Paid\"\nLinked Payments.Sent = true\nInvoice Lines.Line Type = \"Expense\"\nInvoice Lines.Chart of Accounts includes \"004.011: Purchased Discounts & Rebate\"\nInvoice Lines.Line Amount != 0\n\n[Field Mapping]\nAmount = Invoice Lines.Line Amount\nDate = Linked Payments.Payment Date\nBranch = Invoices.Branch\nDebit = 231.100\nCredit = 004.011\n\n[Other Field Mapping]\nVendor Reference = Invoices.Linked Vendors\nClient Reference = Invoices.Linked Client\nStaff Reference = Invoices.Linked Staff\nTransaction Reference = Invoices.Linked Transaction\nPO Reference = Invoices.Related Purchase Order\nState References = Invoices.States & Sales Tax Rates\n\n[Account Mapping]\n231.100: Credit Card Clearing -> Supabase 231.100\n004.011: Purchased Discounts & Rebate -> Supabase 004.011\n\n[Issues]\n- This invoice/payment also matches Invoice Entry rows 11/12. Which route should handle the card rebate so its credit and settlement are not recorded twice?",
    "airtable_sources": "FIN: Invoice Lines",
    "reversible": true,
    "active": true,
    "enabled": true,
    "debit_label": "Credit Card Payable (231.100)",
    "credit_label": "Purchase Discounts & Rebates (004.011)"
  }
]$payment$::jsonb)
on conflict(rule_code) do update set category=excluded.category,sort_order=excluded.sort_order,trigger_name=excluded.trigger_name,when_to_post=excluded.when_to_post,fin_notes=excluded.fin_notes,dev_notes=excluded.dev_notes,airtable_sources=excluded.airtable_sources,reversible=excluded.reversible,active=excluded.active,enabled=excluded.enabled,debit_label=excluded.debit_label,credit_label=excluded.credit_label;

delete from public.ledger_rule_lines where line_order<>1 and rule_code in ('PAY-03','PAY-28','PAY-29','PAY-08','PAY-09','PAY-10','PAY-11','PAY-12','PAY-30','PAY-13','PAY-31','PAY-16','PAY-20','PAY-21','PAY-23','PAY-32','PAY-24','PAY-27');
insert into public.ledger_rule_lines(rule_code,side,line_order,account_code,account_selector,label) values
('PAY-03','debit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-03','credit',1,'221.300',null,'Client Credits on Account (221.300)'),
('PAY-28','debit',1,'221.300',null,'Client Credits on Account (221.300)'),
('PAY-28','credit',1,'121.100',null,'Accounts Receivable (121.100)'),
('PAY-29','debit',1,'221.300',null,'Client Credits on Account (221.300)'),
('PAY-29','credit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-08','debit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-08','credit',1,'231.100',null,'Credit Card Payable (231.100)'),
('PAY-09','debit',1,'231.100',null,'Credit Card Payable (231.100)'),
('PAY-09','credit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-10','debit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-10','credit',1,'004.011',null,'Purchase Discounts & Rebates (004.011) - pending approval'),
('PAY-11','debit',1,'211.100',null,'Accounts Payable (211.100)
Bill being settled'),
('PAY-11','credit',1,'211.100',null,'Accounts Payable (211.100)
Source credit invoice'),
('PAY-12','debit',1,'112.100',null,'Fifth Third Bank (112.100)'),
('PAY-12','credit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-30','debit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-30','credit',1,'112.100',null,'Fifth Third Bank (112.100)'),
('PAY-13','debit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-13','credit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-31','debit',1,'112.100',null,'Fifth Third Bank (112.100)'),
('PAY-31','credit',1,null,'invoice_linked_account','Invoice loan account linked
Example: Auto Loan Payable (232.100)'),
('PAY-16','debit',1,null,'invoice_linked_account','Invoice-line account linked
Auto Loan Payable (232.100)
Interest Expense (007.003)'),
('PAY-16','credit',1,null,'invoice_linked_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-20','debit',1,'316.100',null,'Shareholder Distributions (316.100)'),
('PAY-20','credit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-21','debit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-21','credit',1,'311.200',null,'Additional Paid-in Capital (311.200)'),
('PAY-23','debit',1,'112.100',null,'Fifth Third Bank (112.100)'),
('PAY-23','credit',1,'122.100',null,'Insurance Claims Receivable (122.100)'),
('PAY-32','debit',1,'143.200',null,'Security Deposits (143.200)'),
('PAY-32','credit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-24','debit',1,'211.100',null,'Accounts Payable (211.100)'),
('PAY-24','credit',1,null,'invoice_payment_account','Payment account linked
Examples: Fifth Third Bank (112.100), Nickel (0747), Fidelity (112.200)'),
('PAY-27','debit',1,'231.100',null,'Credit Card Payable (231.100)'),
('PAY-27','credit',1,'004.011',null,'Purchase Discounts & Rebates (004.011)')
on conflict(rule_code,side,line_order) do update set account_code=excluded.account_code,account_selector=excluded.account_selector,label=excluded.label,is_optional=false;
