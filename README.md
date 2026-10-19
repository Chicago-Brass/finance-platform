# Chicago Brass Finance

Internal financial reporting (income statement, balance sheet) on Next.js + Vercel, backed by Supabase.

**Status:** Stage 1. Reports show **sample data** and are not yet connected to the ledger.

## How it works
- Sign-in: Supabase Auth (email link now; Microsoft SSO once the Entra app is registered).
- Access: only emails in `public.app_users` with `active = true` can see reports (checked in `middleware.ts`).
- Reports: `lib/reports/sample-data.ts` builds `Report` objects (`lib/reports/types.ts`). In Stage 3 the same
  shape comes from ledger views, so the UI does not change.

## Develop locally
```
npm install
npm run dev
```

## Change process
All changes go through a pull request. Vercel posts a preview link on every PR. Only Ram merges to `main`.
See `CLAUDE.md` for the rules Claude follows in this repo.
