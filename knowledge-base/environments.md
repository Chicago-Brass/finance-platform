# Finance environments

## Targets

| Use | Supabase branch | Project reference | Scheduling / Airtable |
| --- | --- | --- | --- |
| Production reporting and operational testing | main | `inzobaubbikyiekcfarj` | Daily 11 PM America/Chicago; all FIN automations target this project |
| Local development and isolated tests | develop (persistent) | `vaaykmqshkuunewjrxuy` | No cron; no production FIN writeback credentials |

Production is in an approximately two-month testing period as of 17 November 2026. It is still
separate from development. Do not reset production as part of ordinary development checks.
Accounts, rules, selectors, users and migrations are configuration, not disposable journal data.
The authorized clean start removed test journals, lines, review/history/checkpoint data and test
period states; it retained the reference catalog and users and opened the current month.

Production: [Supabase](https://supabase.com/dashboard/project/inzobaubbikyiekcfarj) and
[finance app](https://finance-platform-iota-bice.vercel.app).
Develop: [Supabase](https://supabase.com/dashboard/project/vaaykmqshkuunewjrxuy).
Supabase branches and Git branches are separate; a Git feature branch does not select a database.
Develop stages separate data, not a different implementation. Apply code, schema and rule-catalog
changes to both Supabase branches and verify both; keep their journal data, Auth, credentials and
production scheduling separate.

Both finance databases use Oregon (`us-west-2`). The daily, posting and reversal entrypoints
forward authenticated requests from other regions to the same project's Oregon runtime before
opening a transaction. Existing webhook URLs remain valid. `x-region: us-west-2` avoids the
forwarding hop. Recheck the shared `database-region.ts` constant if the databases move regions.
An unavailable pinned region returns an error; it must not retry a potentially completed posting.

## Local configuration

The gitignored `.env.development.local` contains the develop URL and its public publishable key.
The development config fails with a clear error when either is missing; it cannot silently use
production defaults. Restart the Next.js dev server after changing these public values.
Production builds retain their existing public configuration and Vercel overrides.

Backend tooling uses `DEVELOP_SUPABASE_URL` and `DEVELOP_SUPABASE_SECRET_KEY` in the shared,
gitignored scripts environment. Unprefixed `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and
`LEDGER_WEBHOOK_SECRET` continue to identify production. Check the target before a write.
Never expose a secret/server key through `NEXT_PUBLIC_` or commit any credentials.

Develop has its own Auth users and sessions. The branch began with no Auth users; production
passwords and sessions were not copied. Existing five finance app memberships were copied, but
an Auth account must exist separately before localhost sign-in can work. Its reference account,
selector and rule catalogs were aligned with production; journals remain empty.

Do not add production `AIRTABLE_PAT` or `LEDGER_WEBHOOK_SECRET` to develop Edge secrets.
Develop currently has no custom Edge secrets and rejects sync with 503 before reading/writing FIN.
Use disposable fixtures for writeback tests, or explicitly configure a separate Airtable test base
before enabling a development writer. Production FIN metadata must contain production journal IDs.

## Production scheduling

Production enables 46 fully implemented T-Chart rules: 22 Expense, eight Invoice Entry and sixteen
Payment, plus MAN-01 for direct manual journals. Partial, blocked, deferred and unrelated Other
rules stay disabled. Their code is retained for later work.
`supabase/operations/enable-fully-implemented.sql` captures this operational selection; migration
or seed defaults are not proof of hosted enablement. Reapply the reviewed selection after a
catalog seed/migration that changes enablement. Reversal remains available for stored originals.

The production-only `ledger-daily-dispatch` pg_cron job wakes every minute. Its private dispatcher
starts one full posting run during the 23:00 hour in America/Chicago, keyed by the Chicago date.
Subsequent ticks resume that same checkpoint until complete, including after midnight. Completed
days do not restart. A manual unfinished run retains ownership; its caller must resume it.
An active three-minute worker lease prevents overlap. The webhook remains usable manually.

Each new scheduled run freezes an accounting-date window from November 17, 2026 through its
Chicago day. This fixed start replaces the earlier rolling 30-day window; it does not move forward.
An existing scheduled checkpoint resumes with its original dates rather than changing scope mid-run.
The production cron additionally requires the owning Airtable record's `CREATED_TIME()` to be on
or after November 17, 2026 at 12:00 AM America/Chicago (`2026-11-17T06:00:00.000Z`). This fixed
`createdFrom` is included on every start and continuation; it is separate from accounting dates.
The API has no creation floor when that parameter is omitted, and explicit fromDate/toDate
still allow older accounting dates. This guard applies to the primary owner only, not its linked
invoice/payment/transaction records. Updating ledger metadata does not change its creation time.
Each batch posts at most 50 sources and uses the existing runtime/request budgets. Resume preserves
the mode, dates and category order; a failed source is reported while other sources continue.
Successful posting and reversal keep the existing verified source-owned Airtable metadata contract.

Vault holds `ledger_daily_url` and a copy of the existing `ledger_webhook_secret`; no shared secret
was rotated. Both branches have the dispatcher definition and clock-alignment migrations.
Supabase manages pg_net queue ACLs; its queue is outside exposed Data API schemas (verified
with an anonymous request returning 406). Headers temporarily contain the shared secret, so do
not expose `net` or add arbitrary-SQL RPCs for app users. See
[Supabase's managed pg_net permissions](https://supabase.com/kb/troubleshooting/revoking-access-to-pg_net-objects-has-no-effect-0bbc16). The dispatcher is invoker-only in
`ledger_private`; browser and service roles cannot execute it. Migrations install definitions, never a job or credentials. Develop must have no scheduled job.

Inspect `cron.job`, `cron.job_run_details`, `net._http_response` and `ledger_daily_runs` when checking
operation. A successful cron tick only confirms dispatch logic ran; after 11 PM also verify the
Edge response, completed checkpoint, posted journals and Airtable writeback. A cron 200 response
can still contain per-source errors. Preserve the existing webhook authentication and RLS.
