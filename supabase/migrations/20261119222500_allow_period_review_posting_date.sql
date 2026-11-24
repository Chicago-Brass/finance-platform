-- Keep the original accounting date and request fingerprint for replay and audit.
alter table public.ledger_posting_requests add column approved_entry_date date;

do $$
declare
  definition text := pg_get_functiondef('public.tg_journal_entries_guard()'::regprocedure);
  frozen text := $guard$or (to_jsonb(new) - array['status','period_month']) is distinct from (to_jsonb(old) - array['status','period_month'])$guard$;
  review_date text := $guard$and r.accounting_date=new.entry_date$guard$;
begin
  if strpos(definition, frozen)=0 or strpos(definition, review_date)=0 then
    raise exception 'Unexpected pending journal guard';
  end if;
  definition := replace(definition, frozen, $guard$or (new.status='rejected' and new.entry_date is distinct from old.entry_date)
       or (to_jsonb(new) - array['status','period_month','entry_date']) is distinct from (to_jsonb(old) - array['status','period_month','entry_date'])$guard$);
  execute replace(definition, review_date, $guard$and new.entry_date=case when new.status='posted' then coalesce(r.approved_entry_date,r.accounting_date) else r.accounting_date end
          and (r.approved_entry_date is null or (new.status='posted' and exists (
            select 1 from public.accounting_periods p where p.period_month=date_trunc('month',new.entry_date::timestamp)::date and p.status='open'
          )))$guard$);
end
$$;
