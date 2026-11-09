# Direct Edge payment posting checks

The runner also executes `reverse-airtable-ledger.test.mjs` for the locally prepared dedicated
`ledger-reversal` endpoint. Its seven database tests cover multi-journal and signed reversal,
preserved metadata, concurrent retries, payment/invoice ownership, incomplete cached ID lists,
dates, closed periods, nonreversible rules and rollback after a later failure. The legacy
reversal database function is removed before these tests run. No hosted journals are touched.

Reversal setup and native mock checks: [reversal guide](../../docs/ledger-reversal.md).

The runner also executes `daily-payment-worker.test.mjs`: new categories on an existing source,
strict existing-journal replay, UTC journal metadata, bulk preflight, exclusive run leases,
checkpoint recovery and private backend-only checkpoint access. The daily worker is not deployed
or scheduled. Its API/reader/runner and native-calculation parity checks are documented in the
[worker README](../functions/ledger-daily/README.md).

Run from the repository root:

```sh
sh supabase/tests/check-payment-posting.sh
```

The runner creates a disposable PostgreSQL 17 container using the pinned Supabase image. It binds an automatically selected port to loopback only, uses no project credentials, and removes its own container. It does not reset existing local Supabase instances or call a hosted project.

The runner loads `fixtures/supabase-platform.sql` for Supabase-managed auth dependencies, the actual
`initial_ledger` migration, and `supabase/seed.sql` for reference accounts/rules. It then removes the
legacy journal-creation/reversal RPCs, so those functions cannot write on behalf of the Edge code.
Before removing them, a rolled-back SQL fixture verifies their reference-array preservation.
Existing table constraints and trigger guards remain active. Tests call the Edge `postPayment()`
TypeScript function using a real Postgres.js connection. No new stored posting or mapping function
is loaded. The posting tests therefore verify the schema that a fresh installation actually uses.

The checks pass explicit Airtable-selected debit/credit pairs for 21 category fixtures and prove that an unfamiliar free-text transaction type and arbitrary valid account pair can be posted without a new PAY mapping. They also cover actual cancellation/return categories without an original journal, exact money/date validation, zero pairs, account identity resolution, split allocations, unchanged and changed retries, whole-event category-set conflicts, zero-after-post conflicts, closed periods, all-category rollback and concurrent retries. Synthetic journals exist only in the disposable database, which is removed on exit.

Idempotency compares stored financial date, transaction type, source event type, accounts, amounts,
references and optional notes. Audit URLs identify the triggering payment and do not affect replay
equality; retries retain the originally saved URL. A cancellation replayed as a return conflicts
even when its date, transaction wording and lines are unchanged. Source event type also scopes the
complete category set. A header payment-name rename alone returns the original journal without
changing its static description. The receiver retains notes support, while Airtable does not send
notes. Supplied branches persist as nullable line values and participate in replay equality.
Account-keyed expense tests cover separate journals under one category, same-account source lines,
concurrent deduplication, missing/changed components, legacy whole-category conflicts, malformed
keys/branches and atomic rollback. New account fixtures verify FIN IDs and report classifications.

Invoice-source tests cover a discount alongside the triggering payment's cash settlement, exact
replay, replay through a different triggering payment, strict changed-discount/date/line conflicts,
invoice attribution and concurrent different-payment delivery. Source tables are restricted to FIN
Payments and Invoices. All supported event names use the same actual-pair posting path. The tests
make explicit that a cancellation category does not change an original payment or invoice journal.
No migration or stored function is needed for this optional source-identity extension.

Invoice-created tests use the existing INV catalog identities and exercise all five resolved
account pairs. They require an invoice ID without a payment ID, verify invoice audit links and
line attribution, reject mismatched source/identity and changed replays, and test concurrent
delivery. Catalog rows come from the reference seed; hosted catalog/account data is not changed.

Vendor-credit application tests use Dr AP / Cr AP with separate bill and credit-memo invoice
references and payment-targeted audit URLs. They verify payment, bill or credit ownership, strict changed-leg replay
conflicts, rejection of an unrelated invoice source and preservation of legacy shared references. All business references, including states, persist as
arrays. Tests cover multi-reference replay, inactive account labels, non-postable rejection and
unknown branch attribution. The posting suite has 35 tests.
One complete invoice packet also posts PAY-10 and PAY-11 together, rolls back both for invalid
data, deduplicates them together across payment triggers and rejects an incomplete replay.

# Report read checks

Ledger filter checks cover account type and T-Chart rule selection, inclusive debit/credit amount
limits, zero maximum, combined journal-number search, pagination before/after the first 100 rows,
matching full counts for both lean and search/offset paths, invalid inputs and approved-viewer
versus unapproved/anonymous access. `filter_ledger` is the
application's unified read; `search_ledger` remains available for older callers.

```sh
sh supabase/tests/check-report-reads.sh
```

Same disposable, loopback-only container pattern. It loads the platform dependencies, complete initial
migration and reference seed. It posts 59
synthetic balanced journals and one draft, then proves that every `get_trial_balances` set equals a
single `get_trial_balance` call in request order, that sums match the posted lines independently
and exclude drafts, that invalid batches fail with SQLSTATE 22023, that `anon` cannot execute it,
and that it runs as SECURITY INVOKER under the caller's real allowlist policies. It also checks all
nine tables have RLS, six views are security invoker, and new tables/functions are not accessible
to anon/authenticated by default. There are five report/security tests.

Signed-amount regression checks preserve negative invoice pairs without swapping accounts, verify
exact replay and changed-sign conflicts, and check ledger side filters, offsets, counts and trial
balance totals. Every test journal remains inside the disposable local database.
# Native posting/reversal metadata writeback

`journal-deletion.test.mjs` verifies whole-journal deletion with cascading lines, preservation of
unrelated journals, posted edit/direct-line protection, reversal references and anonymous access.
It runs only in the same disposable local database; no hosted financial records are deleted.

`ledger-writeback.test.mjs` runs through the disposable `check-payment-posting.sh` runner. It
uses real local journal transactions with a mocked Airtable transport: payment/invoice ownership,
multiple account journals, UTC posting metadata, complete cross-event links, readback verification,
writeback failure/retry, reversal retry and source-lock serialization. It makes no live Airtable writes.

The writeback suite injects lost PATCH responses both before and after save, confirmed rejections,
partial metadata saves, unreadable verification and failed compensating deletes. It checks that
only new journals/lines are removed and that prior journals survive. Runner checks include a
failure on source 10 of 100, continued processing, correct counts and later normal-run eligibility.
All financial writes in these checks use disposable local PostgreSQL and synthetic Airtable mocks.
