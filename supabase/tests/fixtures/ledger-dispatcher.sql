-- Disposable database only. Replace pg_net with a capturing stub so no HTTP request leaves this test.
drop table if exists dispatched;
create temp table dispatched(id bigserial, body jsonb, headers jsonb, url text, timeout_ms integer);
create or replace function net.http_post(url text,body jsonb default '{}'::jsonb,params jsonb default '{}'::jsonb,
 headers jsonb default '{"Content-Type":"application/json"}'::jsonb,timeout_milliseconds integer default 5000)
returns bigint language sql as $$ insert into dispatched(body,headers,url,timeout_ms) values(body,headers,url,timeout_milliseconds) returning id $$;
-- The standalone image has no hosted Vault encryption key. Keep the same read interface.
alter schema vault rename to vault_platform;
create schema vault;
create table vault.secrets(name text,decrypted_secret text);
create view vault.decrypted_secrets as select * from vault.secrets;
insert into vault.secrets values ('ledger_webhook_secret','test-only-secret'),('ledger_daily_url','https://example.invalid/ledger-daily');
do $$ declare b jsonb; begin
 if ledger_private.dispatch_daily_ledger('2026-11-17 05:00:00Z') is not null then raise exception 'Started before accounting cutoff'; end if;
 if ledger_private.dispatch_daily_ledger('2026-11-18 04:59:00Z') is not null then raise exception 'Started before 23:00 Chicago'; end if;
 perform ledger_private.dispatch_daily_ledger('2026-11-18 05:00:00Z');
 select body into b from dispatched order by id desc limit 1;
 if b is distinct from jsonb_build_object('runKey','scheduled:2026-11-17','dryRun',false,'maxRecords',50,'createdFrom','2026-11-17T06:00:00.000Z','fromDate','2026-11-17','toDate','2026-11-17') then raise exception 'Wrong winter scope: %',b; end if;
 perform ledger_private.dispatch_daily_ledger('2027-07-02 04:00:00Z');
 select body into b from dispatched order by id desc limit 1;
 if b->>'runKey' is distinct from 'scheduled:2027-07-01' or b->>'fromDate' is distinct from '2026-11-17' or b->>'toDate' is distinct from '2027-07-01' then raise exception 'Wrong summer DST date'; end if;
end $$;
insert into public.ledger_daily_runs(run_key,state) values ('scheduled:2026-11-17','{"done":true}');
do $$ begin if ledger_private.dispatch_daily_ledger('2026-11-18 05:01:00Z') is not null then raise exception 'Repeated completed daily run'; end if; end $$;
insert into public.ledger_daily_runs(run_key,state,locked_until) values ('scheduled:2026-11-15','{"done":false,"dryRun":false,"categoryIds":["EXP-01","PAY-09"],"dateRange":{"from":"2026-10-17","to":"2026-11-15"}}','2026-11-17 06:05:00Z');
do $$ declare b jsonb; begin
 if ledger_private.dispatch_daily_ledger('2026-11-17 06:00:00Z') is not null then raise exception 'Dispatched active lease'; end if;
 perform ledger_private.dispatch_daily_ledger('2026-11-17 06:06:00Z');
 select body into b from dispatched order by id desc limit 1;
 if b is distinct from jsonb_build_object('runKey','scheduled:2026-11-15','dryRun',false,'categoryCodes',jsonb_build_array('EXP-01','PAY-09'),'maxRecords',50,'createdFrom','2026-11-17T06:00:00.000Z','fromDate','2026-10-17','toDate','2026-11-15') then raise exception 'Resume scope changed: %',b; end if;
end $$;
update public.ledger_daily_runs set run_key='manual-test' where run_key='scheduled:2026-11-15';
do $$ begin if ledger_private.dispatch_daily_ledger('2026-11-17 07:00:00Z') is not null then raise exception 'Resumed manual work'; end if; end $$;
delete from public.ledger_daily_runs;
delete from vault.secrets;
do $$ begin if ledger_private.dispatch_daily_ledger('2026-11-18 05:00:00Z') is not null then raise exception 'Dispatched without credentials'; end if;
 if has_function_privilege('authenticated','ledger_private.dispatch_daily_ledger(timestamptz)','EXECUTE') or has_function_privilege('anon','ledger_private.dispatch_daily_ledger(timestamptz)','EXECUTE') or has_function_privilege('service_role','ledger_private.dispatch_daily_ledger(timestamptz)','EXECUTE') then raise exception 'Dispatcher is publicly executable'; end if;
 if exists(select 1 from dispatched where headers->>'x-ledger-secret'<>'test-only-secret' or timeout_ms<>120000) then raise exception 'Wrong HTTP settings'; end if;
end $$;
do $$ begin if exists(select 1 from dispatched where body->>'createdFrom' is distinct from '2026-11-17T06:00:00.000Z') then raise exception 'Cron lost its hard creation cutoff'; end if; if (select count(*) from dispatched)<>3 then raise exception 'Expected exactly three captured requests'; end if; end $$;
select 'Dispatcher passed: fixed start, Chicago DST, daily dedupe, leases, immutable resume scope, manual ownership, credentials and grants' as result;
