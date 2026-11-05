# Chicago Brass Finance

Internal financial reporting (income statement, balance sheet) on Next.js + Vercel, backed by Supabase.

Agents: start with [AGENTS.md](AGENTS.md) and the [knowledge base](knowledge-base/README.md).
The [conversation summary](knowledge-base/conversation-context.md) records design decisions;
[session handoff](knowledge-base/session-handoff.md) locates the full conversation on Jeric's device.

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
- Reports: authenticated server reads use `get_trial_balance` and the ledger views. The builders under
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
New changes use task branches and pull requests. Vercel posts a preview link on every PR. Ram normally
owns releases; Jeric authorized the Nov 5 baseline merge and retirement of `develop`.
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

The database integration check uses a disposable local PostgreSQL container. These checks do not install the
hosted functions, replace Airtable scripts, enable automations or post hosted ledger records.
