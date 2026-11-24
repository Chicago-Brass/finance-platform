-- Production dates follow the ledger date. Resume any older checkpoint with its original creation floor.
do $$
declare
  definition text := pg_get_functiondef('ledger_private.dispatch_daily_ledger(timestamptz)'::regprocedure);
  marker text := '  request_body := request_body || jsonb_build_object(''createdFrom'',''2026-11-17T06:00:00.000Z'');';
begin
  if strpos(definition, marker) = 0 then
    if strpos(definition, 'run.state ? ''createdFrom''') > 0 then return; end if;
    raise exception 'Expected fixed dispatcher creation floor';
  end if;
  execute replace(definition, marker,
    '  if run.state ? ''createdFrom'' then' || chr(10) ||
    '    request_body := request_body || jsonb_build_object(''createdFrom'',run.state->>''createdFrom'');' || chr(10) ||
    '  end if;');
end;
$$;
