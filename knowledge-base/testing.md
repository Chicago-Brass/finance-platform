# Verification and release workflow

## Payment sender checks

Run `node airtable/check.cjs`, `node airtable/check-payment-lines.cjs` and
`node airtable/check-invoice-settlement.cjs` for current payment contracts. The older settlement
snapshots lack invoice-line records; their incomplete cases are reported separately, not treated
as live API or line-mapping proof. The synthetic fixtures cover current line grouping and signs.
`sh supabase/tests/check-payment-posting.sh` uses a disposable local database only.

## Application checks

```sh
node --test app/landing.test.cjs components/*.test.cjs lib/reports/*.test.cjs middleware.test.cjs supabase/functions/ledger-payment/handler.test.mjs
npm run typecheck
git diff --check
npm run build
```

Use focused subsets during implementation; run the relevant release cohort before publication.
TypeScript rejects unused locals and parameters. Statements require the batched read RPC and a
complete per-year Balance Sheet baseline map; no old-database retry path is used.

Tests cover cents/signs, grouping, earnings baselines, period modes, exports, auth gates, private
cache isolation, stale requests, pagination/search, control behavior and drawer interaction.
Mocked/component checks do not prove browser geometry or deployed permissions.

Build in an isolated directory when a dev server owns the same checkout's `.next`. Keep local
source, test outputs, preview deployment and production deployment evidence distinct.

## Browser review

Use the requested signed-in Chrome profile and preserve its session. Reuse one task tab and close
agent-created tabs when done; preserve pre-existing tabs. Never request website access.

Check desktop and narrow layouts: immediate destination headers/filters, data-only loading and
errors, Back/Forward, cached revisits, search on blur/Enter, keyboard controls, outside-click and
Escape dismissal, focus trapping/restoration, and independent table/sidebar scrolling. In the
journal drawer, test vertical wheel scrolling with the pointer over the table, not only blank
space. Verify the shared drawer width, compact header, source links and section/table borders.

Review console/network errors and measure warm reads separately from dev compilation and browser
rendering. Restore viewport/print overrides. If browser access is unavailable, state the limit;
do not present source tests, HTTP timings or screenshots from another build as current visual proof.

## Native Airtable checks

```sh
node airtable/check.cjs
node airtable/check-invoice-settlement.cjs
node airtable/check-invoice-created.cjs
node airtable/check-expense-entry.cjs
node airtable/check-expense-fully-paid.cjs
node airtable/check-prepay-created.cjs
node airtable/check-depreciation-created.cjs
```

These mock native records and webhook fetches. They do not publish scripts or create hosted
journals. Use the checks for affected handlers; expense-entry includes bank mapping, shared-bank
payments, cents/no-op behavior and failure-before-post regressions.

Airtable Test can run actual actions. Retriggering Sent/Create Entry or sending a webhook needs
explicit task authorization even when the script does not write back to Airtable. Search historical
samples by Payment Date; never change legacy records to fit a test case.

## Database checks

[Integration-test guide](../supabase/tests/README.md) documents disposable loopback PostgreSQL tests:

```sh
sh supabase/tests/check-payment-posting.sh
sh supabase/tests/check-report-reads.sh
```

They restore the tracked migration/seed and use synthetic data. Run them for relevant writer,
financial query or schema changes. Never reset a hosted database as routine frontend QA. A
service-key schema read does not prove signed-in viewer RLS access; test that context separately.

Current release evidence: [release verification](../docs/release-verification.md).

## Publication

1. Inspect Git status and the entire authorized change set. Preserve concurrent work and keep
   credentials, private extracts, raw logs and temporary artifacts out of commits.
2. Validate affected behavior and update its repository documentation.
3. Push a feature branch and open a PR to `main`. Publish/merge only when task authorization permits.
4. Confirm the merged commit and Vercel's Production environment/status; a successful Preview is
   not production proof. Verify the production URL and relevant auth/error behavior.
5. For Airtable/Edge publication, read back the saved/published code and configuration separately.
   A frontend deployment does not publish automation scripts or apply database migrations.

Production journal cleanup, financial repairs, schema/grant changes and live posting tests require
explicit scope. No test or release command implies permission for adjacent financial mutations.
