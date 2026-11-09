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

1. Airtable owns the native event, category filters, component calculations and final account pairs.
2. Each CORE handler checks its category and pushes results; evaluate all eligible handlers.
   UTILS owns substantive reads/calculation/transport helpers; HELPER owns logging only.
3. The generic `ledger-payment` Edge Function authenticates, validates, resolves account identity
   and records supplied pairs atomically. It does not recategorize or infer amount splits.
4. The frontend reads posted data as the signed-in user through RLS. Never expose a server key
   or database credential to browser code.

The staged `supabase/functions/ledger-daily/` worker moves Payment, Expense and Invoice Entry discovery and
calculations into Edge code. Query definitions separate direct filters from linked-record
queries, and it reuses the generic journal writer. It is an externally triggered webhook with a global run lock; native
automations remain the live baseline until cutover. Read its README before changing this worker.

Follow the T-Chart's official trigger, debit and credit mappings. A matched unresolved category
must throw `Not yet implemented` before prepared data is sent. Do not add unstated conditions,
reverse earlier entries automatically or retrofit source records to make a test pass.

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
