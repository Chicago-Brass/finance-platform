# Chicago Brass Finance - agent instructions

Read [knowledge-base/README.md](knowledge-base/README.md) first. It connects the current source,
architecture, financial contracts, Airtable editors and the original local conversation.

## Working scope

- Inspect the actual source and callers before changing behavior. Source, deployed Airtable code,
  deployed Edge code and dated test evidence are different states.
- Check `git status` and preserve concurrent changes. Use `develop` for Jeric's current work.
  Do not commit, push or deploy unless the task authorizes it. Only Ram merges to `main`.
- Preserve `mae/testing`, the separate UI/testing branch. Read [CLAUDE.md](CLAUDE.md) for the
  additional rules that apply specifically when Mae requests work.
- This repository was observed public on 2026-11-04. Never commit credentials, raw Codex session
  logs, customer/payment extracts or unreviewed screenshots of financial records.
- Keep relevant knowledge-base pages and their linked implementation guides current when code changes.
  Put historical evidence in dated records; do not present it as today's live state.
- Use a plain hyphen in generated prose and comments.

## Architectural boundaries

1. Airtable owns the native event, category filters, component calculations and final debit/credit pairs.
2. Each Airtable category function checks its own filters and pushes a result. Evaluate all applicable
   categories, not a first-match `else if` chain. CORE / UTILS / HELPER remain the shared structure.
3. The generic `ledger-payment` Edge Function authenticates, validates, resolves account identities
   and writes the supplied pairs atomically. It does not recategorize transactions or calculate amounts.
4. The frontend reads posted data as the signed-in user through RLS. Never put a database credential
   or a Supabase secret/service-role key in the frontend.

Follow the T-Chart's official Actual Triggers, Debit and Credit columns. Do not infer missing filters,
account splits, reversal behavior or suspense rules from old notes. A matching unresolved category
must fail explicitly with `Not yet implemented` before the sender posts its prepared packet.

The Edge writer uses direct parameterized SQL. Existing database guard triggers and read RPCs are
still important. Legacy posting RPCs exist, but this writer does not call them; do not delete them
or any guard merely because they are outside the current path.

## Financial and UI contracts

- Keep `Report` / `ReportLine` in `lib/reports/types.ts` stable.
- Calculate in integer cents; show USD with two decimals, `$0.00`, and parentheses for negatives.
  Missing values remain distinct from zero. Do not use display rounding to alter financial totals.
- Invoice/payment names are labels. Record IDs and structured source references establish identity.
- Unspecified multi-account splits fail rather than allocating a whole amount to every account.
- Exact posting retries deduplicate; changed financial payloads conflict. Do not edit posted journals.
- `active` account flags are labels for this workflow. `is_postable`, valid accounts, balanced lines,
  posting-period guards, authentication and application access checks remain functional.
- Branch attribution is deferred. The nullable database field exists but stays unpopulated by this writer.
- Preserve the approved full-viewport report layout, internal table/sidebar scrolling and accessible
  Position/Movement tabs. General Ledger loads 100 records per page.
- The landing page is `/`; authenticated visitors go to Income Statement. `/login` is a compatibility
  redirect. Signup and custom cooldown rules are outside the implemented scope.

## Browser and live changes

- On Jeric's device, use Chrome's Jeric profile, `jericnarte912@gmail.com`; enumerate profiles first.
  Never click Request access. Recheck the account instead.
- Use browser tooling, reuse one working tab, close completed agent-created task tabs and preserve
  pre-existing user tabs. Restore temporary viewport overrides.
- Airtable financial writes, checkbox retriggers, journal cleanup and tests that send webhooks need
  explicit task authorization. A Test button can perform real writes.
- Never retrofit legacy records merely to make a category test pass. Query by Payment Date when
  looking for historical payment samples; Created Time is not a substitute.

## Verification

Run the smallest relevant checks from [knowledge-base/testing.md](knowledge-base/testing.md).
At minimum, changed frontend logic needs its focused tests and `npm run typecheck`. UI changes need
browser inspection at desktop and narrow widths. Explain what was actually checked and any limits.
Do not run hosted financial tests or database resets as part of routine frontend verification.

## Jeric's local paths

- App: `/Users/jeric/Documents/GitHub/finance-platform`
- Original scripts/evidence: `/Users/jeric/Documents/GitHub/scripts`
- Full conversation: see [knowledge-base/session-handoff.md](knowledge-base/session-handoff.md).
  The repository contains a summary, not a copied transcript.
