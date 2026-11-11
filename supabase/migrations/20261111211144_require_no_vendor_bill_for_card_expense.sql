-- Row 6 now has an explicit FIN invoice checkbox qualifier.
update public.ledger_rules set dev_notes = replace(dev_notes,
  'Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"',
  E'Invoices.Vendor Type (AP) = "AP - Expenses (Non-Sales Tax)"\nInvoices.Mark as No Vendor Bill? = true'), updated_at=now()
where rule_code='EXP-02' and position('Mark as No Vendor Bill?' in dev_notes)=0;
