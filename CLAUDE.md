# Chicago Brass Finance Platform: rules for Claude

Replacing Airtable financial reporting with Next.js on Vercel and a double-entry ledger in Supabase.
Go-live: Dec 15, 2026, on live Supabase ledger data.

## People
- Ram (ramses.fernandez@): dev lead. The only person who merges to `main`.
- Jerrick (jeric.narte@): developer.
- Mae (mae.porras@): finance. Requests changes in plain English and does not code.

## Branches
- `main` is the live app: https://finance-platform-iota-bice.vercel.app. Only Ram merges into it.
- `mae/testing` is Mae's testing branch, a copy of `main`. Its preview is
  https://finance-platform-git-mae-testing-chicago-brass1.vercel.app
  and it uses the same login and the same approved-users list as the live app.

## When Mae asks for a change
1. Commit ONLY to the `mae/testing` branch. Never commit to, push to, or merge into `main`.
2. Keep to presentation and report content: `app/(reports)/`, `components/`, `app/globals.css`,
   `lib/format.ts`, `lib/reports/`. Do NOT touch `middleware.ts`, `app/auth/`, `app/login/`,
   `lib/supabase/`, `supabase/`, `package.json` or `next.config.mjs`.
3. Never create test logins, passwords, or any way around sign-in.
4. After each change, give Mae the preview link above (it updates about a minute after each commit).
5. When Mae says a change is approved, open (or update) a pull request from `mae/testing` into
   `main` and tell her Ram will review it. Never merge it yourself.
6. Database or accounting-engine design Mae asks for (schema, RPCs, period close, budgets) is a
   written proposal in the chat only. Ram and Jerrick build the database.

## Non-negotiables
- Report UI consumes the `Report` / `ReportLine` contract in `lib/reports/types.ts`. Keep that shape stable.
- Money: whole-dollar display, negatives in parentheses; in the DB `numeric(18,2)`, never float.
- Real Chicago Brass figures are approved (Ram, Oct 20, 2026). The repo stays private; preview links are confidential.
- Never put the Supabase service-role/secret key in code, `.env.*` files, or the browser.
- Schema changes go in as SQL files in `supabase/migrations/`, reviewed through a PR. RLS on every table;
  new tables have no default access for anon/authenticated (every grant is explicit).
- Posted journal entries are immutable (corrections by reversal). Every entry must balance.
- Reopening a closed period: admin role + required reason + audit log. No shared passwords.
