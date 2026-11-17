-- The controlled clock must govern both the Chicago day and start hour.
do $$
declare definition text := pg_get_functiondef('ledger_private.dispatch_daily_ledger(timestamptz)'::regprocedure);
begin
 if strpos(definition,'extract(hour from now() at time zone')=0 then raise exception 'Expected dispatcher hour expression'; end if;
 execute replace(definition,'extract(hour from now() at time zone','extract(hour from p_now at time zone');
end;
$$;
