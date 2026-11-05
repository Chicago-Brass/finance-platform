# Chicago Brass Finance

Internal financial reporting (income statement, balance sheet) on Next.js + Vercel, backed by Supabase.

Agents: start with [AGENTS.md](AGENTS.md) and the [knowledge base](knowledge-base/README.md).
The knowledge base covers architecture, data contracts, source ownership and verification.

The current [dashboard PR](https://github.com/Chicago-Brass/finance-platform/pull/1) separates the
immediate report shell from authenticated JSON data reads. See its [implementation spec](docs/dashboard-controls-spec.md)
for the request/cache design, measurements and outstanding browser verification.

**Status:** On `main`, Income Statement and Balance Sheet read posted Supabase ledger data.
The local app uses the DUAL ENTRY project. Current testing verifies page queries, field mappings,
account groupings and filters against the existing database records. The report redesign adds a
full-viewport workspace, compact controls and a dark Position/Movement sidebar. These UI changes
are consolidated on `main`; verification was local and does not establish a hosted frontend
deployment. Branch reporting is deferred.

## How it works
- Sign-in: `/` is the public landing page with the email/password form. Existing browser sessions
  redirect to Income Statement. `/login` is a compatibility redirect to `/`; signout and failed
  callbacks also return to the landing page. Supabase Auth and the approved-user check remain in
  place; Microsoft SSO is still controlled by its existing environment flag.
- Access: only emails in `public.app_users` with `active = true` can see reports (checked in `middleware.ts`).
- Reports: the header/filters render first; `/api/reports/data` supplies authenticated JSON afterward.
  Navigation switches the client workspace immediately, with a private five-minute response cache.
  Server reads use required batched trial balances plus the filtered ledger/count RPCs. The builders under
  `lib/reports/` return the existing `Report` / `ReportLine` contract for the UI and Excel/PDF exports.
  Income Statement supports selectable years and monthly/quarterly/annual actuals. Balance Sheet uses
  cumulative as-of, monthly, quarterly or annual snapshots, with prior-year and current-year earnings
  separated for each column. Both reports display dollars with cents and explicit `$0.00` zeros.
  Position shows funding/cash composition or expense composition/net margin. Movement compares the
  Balance Sheet with the previous quarter-end and Income Statement with the same months a year earlier.
  See [report data and account mapping](docs/ledger-reporting.md).

## Develop locally
```
npm install
npm run dev
```

The landing uses the approved full-screen architectural concept: a generated text-free background
at `public/images/finance-landing-background.png`, live form/branding in `app/page.tsx`, and styles
scoped in `app/landing.css`. Source Serif 4 and Manrope are self-hosted under `app/fonts/`, with
their OFL licenses alongside them. No signup workflow or custom cooldown rules were added.
Run `node --test app/landing.test.cjs` for routing, access and form checks. Visual checks use the
signed-out `http://127.0.0.1:3010/` and signed-in `http://localhost:3010/` hosts independently.

## Change process
Create feature branches from current `main`. Vercel produces previews for feature branches and
Production deployments from `main`. Merge and publish only within the current authorized task.
See `CLAUDE.md` for the rules Claude follows in this repo.

## Database baseline

[One initial migration](supabase/migrations/20261105141013_initial_ledger.sql) contains the complete
public schema, including reporting functions, RLS, guards and permissions. [Reference seed](supabase/seed.sql)
contains accounts and rule catalogs only. Users and journals are deliberately excluded.
The existing DUAL ENTRY database is baselined in migration history without recreating its objects.
Never run a hosted reset. See [migration and release guide](docs/database-baseline.md).

## Airtable payment posting

The posting source is in [airtable/](airtable/README.md) and
[the ledger-payment Edge Function](supabase/functions/ledger-payment/README.md).
Airtable qualifies categories, calculates amounts and sends final debit/credit posting pairs.
The Edge Function authenticates, resolves account references and saves the supplied pairs generically
in one database transaction. Transaction types are metadata; there is no PAY/category accounting router
or database posting function. The initial schema includes `transaction_type` and `source_event_type`
on journal headers. See the
[webhook contract](docs/ledger-webhook-contract.md). Report reads are documented separately in
[ledger reporting](docs/ledger-reporting.md).
Current deployment and live-test scope: [ledger status](docs/ledger-current-status.md).
Earlier setup evidence: [initial 2026-10-30 rollout](docs/ledger-rollout-2026-10-30.md).

Checks:

```sh
node --test app/landing.test.cjs components/*.test.cjs lib/reports/*.test.cjs
node airtable/check.cjs
node airtable/check-invoice-settlement.cjs
node --test supabase/functions/ledger-payment/handler.test.mjs
sh supabase/tests/check-payment-posting.sh
sh supabase/tests/check-report-reads.sh
npm run typecheck
```

See [release verification](docs/release-verification.md) for the current cleanup, export and QA scope.
TypeScript rejects unused code. The live report loaders do not fall back to the older database API.

The database integration check uses a disposable local PostgreSQL container. These checks do not install the
hosted functions, replace Airtable scripts, enable automations or post hosted ledger records.

The report application renders destination headers/controls immediately and reads financial JSON
separately. Account totals/lines load in parallel and successful data is reused within its scoped
cache. Vercel server functions run in Oregon near the database. The read-query migration is applied to DUAL ENTRY and preserves existing
financial results. See [reporting and performance details](docs/ledger-reporting.md).

Report pages share compact left-aligned filters with right-side actions, accessible searchable
selects, data-only loading and ledger-wide search. Ledger rows open full journal details;
statement account rows open account activity. Both drawers share width and modal behavior.
See [implementation spec and review results](docs/dashboard-controls-spec.md). Visual/browser
verification must be checked separately from source tests and HTTP/build results.
