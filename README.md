# Chicago Brass Finance

Internal financial reporting (income statement, balance sheet) on Next.js + Vercel, backed by Supabase.

**Status:** Stage 1. Reports show **sample data** and are not yet connected to the ledger.

## How it works
- Sign-in: Supabase Auth; Microsoft SSO can be enabled once the Entra app is registered.
- Access: only emails in `public.app_users` with `active = true` can see reports (checked in `middleware.ts`).
- Reports: the builders under `lib/reports/` currently read checked-in data and return the
  `Report` / `ReportLine` contract in `lib/reports/types.ts`. Connecting the ledger is separate work.

## Develop locally
```
npm install
npm run dev
```

## Change process
All changes go through a pull request. Vercel posts a preview link on every PR. Only Ram merges to `main`.
See `CLAUDE.md` for the rules Claude follows in this repo.

## Airtable payment posting

The posting source is in [airtable/](airtable/README.md) and
[the ledger-payment Edge Function](supabase/functions/ledger-payment/README.md).
Airtable qualifies categories, calculates amounts and sends final debit/credit posting pairs.
The Edge Function authenticates, resolves account references and saves the supplied pairs generically
in one database transaction. Transaction types are metadata; there is no PAY/category accounting router
or database posting function. A migration adds `transaction_type` and `source_event_type` to journal
headers. See the
[webhook contract](docs/ledger-webhook-contract.md). This does not connect the report UI yet.
Current deployment and live-test scope: [ledger status](docs/ledger-current-status.md).
Earlier setup evidence: [initial 2026-10-30 rollout](docs/ledger-rollout-2026-10-30.md).

Checks:

```sh
node airtable/check.cjs
node airtable/check-invoice-settlement.cjs
node --test supabase/functions/ledger-payment/handler.test.mjs
sh supabase/tests/check-payment-posting.sh
npm run typecheck
```

The database integration check uses a disposable local PostgreSQL container. These checks do not install the
hosted functions, replace Airtable scripts, enable automations or post hosted ledger records.
