-- November 17, 2026 midnight America/Chicago is 06:00 UTC (CST).
-- The cron supplies this fixed creation floor; ordinary API calls have no creation floor.
do $$
declare definition text := pg_get_functiondef('ledger_private.dispatch_daily_ledger(timestamptz)'::regprocedure);
 marker text := '  select decrypted_secret into endpoint';
begin
 if strpos(definition,marker)=0 then raise exception 'Expected dispatcher endpoint lookup'; end if;
 execute replace(definition,marker,
   '  request_body := request_body || jsonb_build_object(''createdFrom'',''2026-11-17T06:00:00.000Z'');' || chr(10) || marker);
end;
$$;
