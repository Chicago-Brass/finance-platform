# Chicago Brass Finance - agent instructions

Start with [knowledge-base/README.md](knowledge-base/README.md). Read the relevant source, callers
and detailed owner docs before changing behavior. The knowledge base contains repository
architecture, data contracts and operating guidance; do not add chat summaries or session paths.

## Scope and Git

- Inspect `git status` first and preserve concurrent work. Commit, push, merge and deploy only
  when authorized by the current task.
- `main` is the production baseline. Start feature branches from current `main`; do not assume
  a persistent `develop` exists. Preserve `mae/testing` and follow [CLAUDE.md](CLAUDE.md) when Mae
  requests presentation work.
- Treat this repository as public. Never commit secrets, raw tool/chat logs, private financial
  extracts or unreviewed screenshots of business records. Use synthetic fixtures.
- Keep [knowledge-base/](knowledge-base/) and the owning implementation docs accurate. Source,
  saved automation code, published Airtable state and deployed Edge code are separate evidence.
- Use a plain hyphen in generated prose and comments.

## Architecture

1. The official T-Chart defines category filters, amounts and account pairs.
2. `supabase/functions/ledger-daily/` owns current Expense and Invoice Entry discovery,
   linked-record reads and category calculations. Named handlers supply final posting pairs.
3. The shared `ledger-payment` writer authenticates, validates, resolves accounts and records
   supplied pairs atomically. It does not recategorize or infer amount splits. Shipping alone
   rechecks its linked deposit cap under the funding invoice lock before using that writer.
4. Airtable owns source data and source-owned Reverse Ledger checkbox events. Native reversal
   scripts send only source/date to `ledger-reversal`; Supabase writes journal metadata back.
5. The frontend reads posted data as the signed-in user through RLS. Never expose a server key
   or database credential to browser code.

The sync webhook uses a global run lock, resumable batches and the existing shared secret.
Production Supabase main (`inzobaubbikyiekcfarj`) runs the daily 11 PM America/Chicago job.
The production cron selects accounting dates from November 17, 2026 through its Chicago day,
and only owning records created on/after November 17, 2026 midnight America/Chicago. Existing
checkpoints retain their original dates. Manual API calls can omit the creation floor and override
accounting dates to process older records.
The 46 fully implemented T-Chart rules and MAN-01 manual journal rule are enabled; partial,
blocked, deferred and unrelated Other rules are off.
Superseded native posting senders are off; seven source-owned reversal automations remain on and
point to production. Local development uses persistent Supabase develop (`vaaykmqshkuunewjrxuy`),
not the production database. Never copy production FIN writeback credentials or schedules there.
Read [environments](knowledge-base/environments.md) for local configuration, Auth separation,
production-only scheduling and the current two-month testing period. Check the actual target
before tests or resets; an explicitly requested production test is different from local development.

Follow the T-Chart's official trigger, debit and credit mappings. A matched unresolved category
must throw `Not yet implemented` before prepared data is sent. Do not add unstated conditions,
reverse earlier entries automatically or retrofit source records to make a test pass.

Manual journals use the parent Direct Journal Entry, all linked Journal Lines, Date Approved and
parent Branch. Its Cancel Entry checkbox reverses the whole journal. Ordinary T-Charts exclude
manual-linked invoices and skip their whole payments. See [manual journals](docs/manual-journals.md).

The writer uses parameterized direct SQL. Existing database guards, period checks, read RPCs and
legacy posting/reversal functions remain unless their removal is explicitly authorized.

## Data and UI contracts

- Keep `Report` / `ReportLine` stable. Calculate money in checked integer cents, store numerics,
  show two decimals, `$0.00` and parentheses for negatives. Missing is distinct from zero.
- IDs establish identity; invoice/payment names are labels. Exact retries deduplicate and changed
  financial packets conflict. Do not edit posted journals.
- Unspecified multi-account splits fail. Account `active` is a label; `is_postable`, valid identity,
  balance, period guards, authentication and approved-user checks remain functional.
- Supplied branch attribution is nullable; empty stays NULL. All four financial reports filter stored journal-line branches; Consolidated includes every branch and unassigned lines.
- Keep destination headers/controls independent of data loading. Reuse shared controls, request
  caches, modal behavior and currency/date formatters.
- Preserve full-viewport reports, internal scrolling, keyboard support and Position/Movement tabs.
  General Ledger pages contain 100 lines. Full-journal detail must fetch every entry line.
- Account and journal drawers share a responsive 640px width. Keep vertical scrolling over the
  journal table chained to its drawer; only the outer boundary stops background scrolling.
- `/` owns sign-in; authenticated visitors go to Income Statement. Signup and custom cooldown
  flows are outside the implemented scope.

## Browser and live operations

Use the Chrome profile specified by the current request; enumerate available profiles first.
Never click Request access. Reuse a task tab, close completed agent-created tabs, preserve user
sessions/tabs and restore viewport overrides. Report connection or visual-verification limits.

Airtable writes, checkbox retriggers, webhook tests, journal cleanup and schema/grant changes need
explicit task scope. Test buttons can create financial effects. Historical sample queries use
Payment Date, not Created Time. Deployment of this app does not publish Airtable or apply migrations.

## Checks and documentation

Use [knowledge-base/testing.md](knowledge-base/testing.md). Changed frontend logic needs focused
regression checks and `npm run typecheck`; UI needs browser review where available. Use relevant
native-script checks for automation changes and disposable database tests for financial read/writer
changes. Do not run hosted financial tests or database resets as routine frontend verification.

Describe what changed, what was verified and any remaining limitations. Include a review link.
Keep knowledge-base pages about the repository, infrastructure and data, without conversation
history or device-specific paths to previous sessions.
