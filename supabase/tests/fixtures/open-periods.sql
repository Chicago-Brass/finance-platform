-- Synthetic test periods only. Production requires explicit period opening.
insert into public.accounting_periods(period_month,status)
 select generate_series('2025-01-01'::date,'2099-12-01'::date,interval '1 month')::date,'open'
 on conflict(period_month) do nothing;
