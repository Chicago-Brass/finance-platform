# Rule progress and grouped T-Charts

The Progress page shows the retained rule catalog, source-record owners, account labels,
implementation/enabled status, and actual journal and sync-attempt counts. Existing `rule_code`
values are permanent posting identities. A rule can move to another sheet/family without changing
its code, source owner, category function, posted journals or reversals.

## Catalog organization

The grouped workbook retains 50 non-black rules across Expenses, Invoice Entry and Payment.
Invoice/payment/usage counterparts are adjacent within a named family. Customer-credit flows join
AR invoice families; vendor credits, discounts, fixed assets and security deposits join their AP
expense families. The seven Other Transactions reference rows and MAN-01 manual rule remain separate.
Black rows stay at the bottom of their workbook sheets for reference, with no active posting route.

`ledger_rules` already supplies the code. Its category, family, sort order, source label and
implementation status supply the UI; its enabled switch still controls posting. The five remaining
unreferenced black rules are removed by the grouped-catalog migration. If a later cleanup encounters
posted/review references, it disables and marks the rule retired instead of deleting journal history.
Progress excludes retired rules. Historical journal/reversal reads retain their original codes.

The refreshed workbook is a separately generated review/copy artifact. It does not overwrite the
live SharePoint workbook. The two unrelated workbook sheets are preserved.

## Counts and dates

- Posted counts are original posted journal headers; reversal counts are shown separately.
- Succeeded, failed and pending attempts describe real daily/full/targeted sync outcomes recorded
  after the displayed tracking start. They are not reconstructed from old truncated run errors.
- One run/source/rule attempt is stored once. Resuming a checkpoint updates that same attempt.
  A later separately requested sync is a new attempt, even if it only confirms an existing journal.
- No-write previews and skipped/non-matching candidates create no attempt rows.
- Legacy direct-writer and native reversal failures are not sync-attempt counts. Successful
  reversals are still included in the real journal activity list and reversal counts.
- Activity date filters use Chicago calendar boundaries over posting/attempt timestamps. The
  journal drawer also displays the accounting date, which can be older than the posting date.

Attempts are saved in the existing run-checkpoint transaction. There are no new Airtable requests
or per-source HTTP calls. The financial writer, locks, retries and readback/compensation contract
are unchanged. A failed checkpoint rolls back its queued attempt metadata as well.

## Reads and access

`/api/progress` uses the signed-in approved user's Supabase session and the invoker-only
`get_ledger_rule_progress` / `get_ledger_rule_journals` RPCs. Catalog and journal data retain existing
RLS. The new attempt table grants approved users read access and no browser write access. Only
owned, sanitized validation messages are shown; raw SQL/transport details and financial packets
are not stored in telemetry.

The list is paginated at 50 rules. Each normal-width drawer page contains 25 full journals, every
line in each journal, exact General Ledger drawer links (`entry=<entry number>`) and source Airtable links. The Attempts tab
explicitly shows the latest 20 attempts. Filtering and navigation reuse the shared static controls,
request cache, loading/error states and outside-click drawer behavior.

The table places implementation status beneath the permanent code and shows source types and
account mappings as compact pills. Explicit mappings of up to five accounts retain separate pills;
open-ended invoice mappings and longer lists use a Multiple accounts label. Activity displays
succeeded / failed / posted counts in that order, with reversal counts separate.
The table and drawer lay out account pills horizontally and wrap onto another line when full.
Only an individual pill longer than its column truncates. The drawer's labeled Posting switch sits in the overview body, and every journal card
has distinct Ledger and Airtable links.

The Enabled switch is available to administrators only. `PATCH /api/progress` accepts exactly
`{ruleCode, enabled}` from the same-origin signed-in UI and updates only the retained rule's enabled
flag using the existing admin RLS policy. Automatic update timestamps still apply. It uses no
service key, new grant or schema change. Switching a rule does not change its existing journals
or reversals; it controls its eligibility for subsequent worker processing.

## Checks

- `node --test lib/progress/query.test.mjs components/progress-workspace.test.cjs`
- `node --test lib/periods/ranges.test.cjs components/report-application.test.cjs middleware.test.cjs`
- `sh supabase/tests/check-payment-posting.sh` includes real disposable posting/reversal, RLS,
  Chicago date boundaries, telemetry deduplication/rollback and grouped-catalog preservation.
- Browser review uses localhost connected to Supabase develop. Do not create production financial
  entries or change real period states merely to demonstrate this interface.
