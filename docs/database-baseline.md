# Database baseline and main consolidation

Date: 2026-11-05. Project: DUAL ENTRY (`inzobaubbikyiekcfarj`).

## Starting point

`main` contains the merged report UI, Airtable senders and generic Edge writer. Jeric authorized
this consolidation and retirement of `develop`. `mae/testing` and other existing branches remain.
Jeric subsequently recreated `develop` from this baseline for performance work and authorized
deleting the merged `ram/ledger-test` branch. `mae/testing` remains separate.

`supabase/migrations/20261105141013_initial_ledger.sql` is the single schema baseline. It includes
the original hosted-only schema and all six previously tracked increments: nine public tables,
four enums, six views, nine functions, constraints, indexes, financial guards, RLS and privileges.
It also includes the batched trial-balance function required by the current statement loaders.
Earlier migration files remain available in Git history, before this consolidation.

`supabase/seed.sql` contains reference configuration only: 61 accounts, 7 selectors, 33 selector
members, 58 rules and 141 rule lines. It does not contain journal entries/lines, users, auth data,
accounting periods or credentials. Re-running the seed does not overwrite existing catalog rows.

## Fresh database

Use normal Supabase migration/reset tooling only against a new or disposable local database.
The CLI applies the initial migration once and records its version. Local reset also loads the seed.
On a new hosted project, apply the migration and load the reference seed separately. Provision
the intended `app_users` membership securely; no production users are seeded from source control.
Deploy `ledger-payment` with that project's own runtime secrets and configure frontend public keys.
Auth provider settings, Edge secrets and managed auth/storage schemas are not SQL migrations.

## Existing DUAL ENTRY

Do not execute the initial CREATE statements on DUAL ENTRY. Do not reset the hosted database.

1. Capture the current public schema, migration history and reference configuration outside Git.
2. Apply only real missing changes: `get_trial_balances`, its grants, and the global future-function
   PUBLIC execute revoke. PostgreSQL's implicit global function grant cannot be removed by the
   old schema-scoped default-privilege statement alone. Existing function privileges remain intact.
3. Restore the baseline and seed into a disposable database. Compare live and restored definitions:
   types, columns, relations and ACLs, constraints, indexes, functions and ACLs, views, triggers,
   policies and postgres default privileges. All ten groups must match.
4. Replace old migration-history markers using `supabase migration repair --status reverted`
   for the captured old versions, then `--status applied 20261105141013` for this baseline.
   Repair changes migration tracking only; it does not replay the SQL or change ledger rows.
5. Verify `supabase migration list --linked` shows the baseline on both sides and
   `supabase db push --linked --dry-run` finds nothing to apply.

Future schema work gets a new migration. Do not edit the applied initial baseline or reuse its version.
The old history had nine hosted versions, while three local allowlist/default-permission increments
had been applied directly without matching history markers. The baseline resolves both mismatches.

## Release checks

- 75 frontend/HTTP tests, TypeScript and an isolated production Next.js build pass.
- All five Airtable mock runners pass. These do not execute live financial events.
- 26 direct Edge posting tests and 5 report/security tests pass against the actual initial schema.
- Fresh restore matches the hosted schema in all ten comparison groups above.
- Existing hosted journal counts before consolidation: 101 entries and 232 lines.
- Downloaded Edge source matches local functional code; one branch comment differs, with no behavior change.
- Hosted SQL lint reports no errors. Security advisors report only the existing Auth setting:
  leaked-password protection is disabled. Authentication settings were not changed by this task.

## Deliberately unfinished

This baseline does not resolve accounting decisions left pending in the official T-Chart.
Explicit `Not yet implemented` handlers stay blocked. See
[the current blocker list](../knowledge-base/airtable-triggers.md#explicit-implementation-limits)
for account/split/trigger decisions. Branch reporting and Microsoft SSO setup also remain deferred.
No Airtable data reconciliation, historical posting or hosted journal cleanup is part of this release.
