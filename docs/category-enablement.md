# Category enablement

`public.ledger_rules.enabled` controls new journals. The writer checks it inside the posting
transaction; the worker also checks it before discovery. The separate `active` field is a label.

## Current configuration

- 21 fully implemented Expense rules and six Invoice Entry rules are enabled.
- Four working partials and six red deferred rules are disabled.
- Three black definitions and five obsolete Invoice Entry definitions are removed from the worker.
  Unreferenced catalog rows are deleted; a referenced historical rule remains inactive/disabled.
- Payment and Other category switches remain unchanged and disabled.
- Six superseded native Expense/Invoice posting automations are OFF. Reversal stays ON.
- No external scheduler has been activated. Full and single-record sync use the same webhook.

Disabling rejects a new packet atomically, including a mixed packet with another enabled category.
Exact replays and dedicated reversals remain available. A newly disabled category is skipped on
resume, even if its candidate IDs were captured earlier. Enable it and start a new run to rediscover.
A switch does not cancel an already running transaction.

`test:true` has no database access, so it does not consult operational switches. Use explicit
categoryCodes to preview a selected scope. The test still enforces source/category filters and
accounting-date bounds; it cannot confirm database account postability or open periods.

The final catalog migration updates only Expense/Invoice Entry controls and current metadata.
The seed ends with the same authoritative cleanup. Migration replay does not delete journals or
change Payment/Other metadata. Raw debit/credit labels match the reviewed workbook; structured
account associations remain available for conformance.

See the [webhook contract](../supabase/functions/ledger-daily/README.md) for source selection,
date overrides, lock/resume and writeback. Checks include `finalized-catalog.test.mjs`, the
worker/handler tests and `sh supabase/tests/check-payment-posting.sh`, which uses a disposable
local database only.

The final remote readback verified 37 current Expense/Invoice definitions, 27 enabled and eight
obsolete/black rows absent. Payment/Other switches were unchanged. Financial counts remained
132 journal headers and 264 lines. `ledger-daily` version 15 was downloaded and all 27 runtime
files matched the repo; invalid authentication returned 401. No hosted posting or reversal test
was run in this finalization. The default 30-day window and explicit date/source overrides remain.
