-- Preserve the current financial guard; add the manual parent's distinct source lock.
do $migration$
declare definition text; updated text;
begin
  definition := pg_get_functiondef('public.tg_journal_entries_guard()'::regprocedure);
  if position('FIN manual journal:' in definition)=0 then
    updated := replace(definition, 'case new.source_table when',
      'case new.source_table when ''tblCoBk0WB46B662R'' then ''FIN manual journal:'' when');
    if updated=definition then raise exception 'Unexpected journal source guard'; end if;
    execute updated;
  end if;
end
$migration$;

insert into public.ledger_rules(rule_code,category,sort_order,trigger_name,when_to_post,dev_notes,airtable_sources,reversible,active,enabled,debit_label,credit_label)
values ('MAN-01','other',1,'Manual Journal Entry',
'[Record]
Direct Journal Entries

[Primary]
Every day at 11:00 PM America/Chicago

[Secondary]
Dashboard Sync Button
Manual Webhook (full or single record)

[Filters]
Date Approved is not empty
Posted Entry = false
Cancel Entry = false',
'[Field Mapping]
Date = Direct Journal Entries.Date Approved
Branch = Direct Journal Entries.Branch
Amount = Journal Lines.Line Amount
Debit = Journal Lines.Debit Accounts
Credit = Journal Lines.Credit Accounts

[Notes]
One parent entry creates one journal containing all linked line pairs. Optional linked invoices supply reference arrays only.',
'FIN: Direct Journal Entries',true,true,true,'Journal Lines.Debit Accounts','Journal Lines.Credit Accounts')
on conflict(rule_code) do update set trigger_name=excluded.trigger_name,when_to_post=excluded.when_to_post,dev_notes=excluded.dev_notes,
 airtable_sources=excluded.airtable_sources,reversible=true,active=true,enabled=true,debit_label=excluded.debit_label,credit_label=excluded.credit_label;
