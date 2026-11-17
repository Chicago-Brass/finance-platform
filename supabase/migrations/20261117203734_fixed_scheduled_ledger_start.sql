-- Scheduled accounting dates start November 17, 2026; manual webhook dates stay caller-controlled.
-- Keep the owning-record creation guard and every existing checkpoint's original scope.
do $$
declare
  definition text := pg_get_functiondef('ledger_private.dispatch_daily_ledger(timestamptz)'::regprocedure);
  date_marker text := '''fromDate'',(local_day-29)::text,''toDate'',local_day::text';
  hour_marker text := 'if local_hour<>23 then return null; end if;';
begin
  if strpos(definition,date_marker)=0 or strpos(definition,hour_marker)=0 then
    raise exception 'Expected rolling-window dispatcher definition';
  end if;
  definition := replace(definition,date_marker,'''fromDate'',''2026-11-17'',''toDate'',local_day::text');
  definition := replace(definition,hour_marker,'if local_hour<>23 or local_day<date ''2026-11-17'' then return null; end if;');
  execute definition;
end;
$$;
