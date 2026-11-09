# Chicago Brass Finance

Internal financial reporting (income statement, balance sheet) on Next.js + Vercel, backed by Supabase.

**Status:** Mae's original report layout now reads posted ledger actuals from DUAL ENTRY
(`inzobaubbikyiekcfarj`). Income Statement and Balance Sheet no longer use workbook amounts.

## How it works
- Sign-in: Supabase Auth (email link now; Microsoft SSO once the Entra app is registered).
- Access: only emails in `public.app_users` with `active = true` can see reports (checked in `middleware.ts`).
- Reports: `lib/reports/live-data.ts` reads `get_trial_balances` and counts posted entries as the
  signed-in user. Existing RLS and approved-user controls apply. No service key is used.
- The report builders use the live account catalog and checked integer cents. Balance Sheet
  includes prior-year and current-year earnings. The existing renderer and exports stay intact.
- Reports are consolidated. Historical branch controls are hidden because the current read RPC
  does not return branch balances. Static workbook modules remain unused historical reference.
- This connection does not change Supabase schema, Airtable automations or journal records.

## Focused checks
```
node --test lib/reports/reporting.test.cjs lib/reports/live-data.test.cjs lib/format.test.cjs
npm run typecheck
```

## Develop locally
```
npm install
npm run dev
```

## Change process
All changes go through a pull request. Vercel posts a preview link on every PR. Only Ram merges to `main`.
See `CLAUDE.md` for the rules Claude follows in this repo.
