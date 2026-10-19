# Chicago Brass Finance Platform: rules for Claude

Replacing Airtable financial reporting with Next.js on Vercel and a double-entry ledger in Supabase.
Go-live: Dec 15, 2026, on live Supabase ledger data.

## People
- Ram (ramses.fernandez@): dev lead. The only person who merges to `main`.
- Jerrick (jeric.narte@): developer.
- Mae (mae.porras@): finance. Requests UI changes in plain English and does not code.

## When Mae asks for a change
1. Make the change on a new branch named `mae/<short-description>`. Never commit to `main`.
2. Keep it to presentation: `components/`, `app/`, `app/globals.css`, `lib/format.ts`. Do not touch
   `middleware.ts`, `lib/supabase/`, `supabase/migrations/`, auth routes, or env files.
3. Open a pull request with a plain-English summary, then give Mae the Vercel preview link.
4. Never merge. Tell Mae that Ram or Jerrick will review it.

## Non-negotiables
- Report UI consumes the `Report` / `ReportLine` contract in `lib/reports/types.ts`. Keep that shape stable.
- Money: whole-dollar display, negatives in parentheses; in the DB `numeric(18,2)`, never float.
- No real financial figures in the repo or in previews before Gate G1 (Vercel Pro + Supabase backups).
- Never put the Supabase service-role/secret key in code, `.env.*` files, or the browser.
- Schema changes go in as SQL files in `supabase/migrations/`, reviewed through a PR. RLS on every table.
- Posted journal entries are immutable (corrections by reversal). Every entry must balance.
