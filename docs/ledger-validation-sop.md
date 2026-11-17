# Ledger validation SOP

Validate the current live T-Chart against both deployed environments before testing. Production and
develop must share schema, rules, accounts and function code. Production alone owns its cron and
FIN credentials. Do not point develop at production ledger metadata or reversal automations.

## Preparation

- Confirm the Airtable test base, its source table/field IDs, writeback fields and reversal endpoint.
- Read current counts before the authorized journal-data reset. Preserve accounts, rules, selectors,
  users, accounting periods, credentials and production scheduling. If already empty, record that.
- Download the live T-Chart. Match each row by category, row number and name; compare filters,
  amount, date, branch, accounts, references, status and reversal support against current code.
- Record proposed chart corrections locally during the campaign, then apply them to the live workbook in one final sweep. Correct confirmed code discrepancies in both Supabase branches and retest. Keep deferred
  and partial rows disabled. Do not change an accounting decision merely to make a test pass.
- Capture selected source IDs and existing metadata, then obtain the exact Airtable write-set
  confirmation required by the workspace policy before posting or toggling checkboxes.

## Read-only sample discovery

Run from the repository with private credentials and an output outside the repository:

```sh
node --env-file=/path/to/gitignored/.env supabase/operations/find-validation-samples.mjs /tmp/ledger-validation-samples.json
```

Optional trailing rule codes restrict discovery. The script reuses actual category filters and
handlers, finds up to five eligible sources per implemented rule, checks other implemented rules
on the same source and writes progress after every row. It is GET-only and never posts journals.
It searches from 2020 onward, newest first, bounded to three candidate/related pages per rule.
Invoice-line sampling starts with the specific line-account filter and lets the handler validate its parent, avoiding a scan of unrelated invoices. A shortage is a coverage limit, not a passing test. Shipping requires a posted deposit prerequisite;
its zero clean-ledger preview is recorded separately. Raw examples contain private financial data. Optional `--include-prior-tests` masks only the ledger cache/reversal controls during read-only discovery; those results need explicit source-metadata reset approval and must never be treated as currently eligible without that reset.

## Row-by-row live test

1. Capture the baseline by account, invoice reference, branch, report date window and journal count.
2. Preview all enabled rules for each selected owning table/record ID. Distinguish legitimate
   invoice/credit combinations from two rules recording the same bank movement or expense twice.
   Resolve unexpected hits before posting; do not hide them by testing only one category.
3. Post the selected row through the develop webhook with `dryRun:false`, `categoryCodes:[rule]`,
   explicit accounting-date range and `source:{tableId,recordId}`. Resume its run key until done.
   Keep the source amount, accounts, status, Sent flag and accounting date unchanged.
4. Independently query stored originals and lines. Compare source/rule/entry-key identity, cent
   amounts, account mappings, date, branch and all supplied reference arrays with source values.
   Every journal must balance. Compare report deltas with these lines and show every used account.
5. Read back Airtable Ledger Postings, Ledger Journal IDs and Reversal Journal IDs. Every UUID
   must belong to the same source in develop. Retry one representative posting per row with a fresh run key and confirm
   that neither journals nor financial totals increase.
6. Review the develop dashboard Income Statement, Balance Sheet, Trial Balance and General Ledger.
   Refresh report caches and select the same dates/branch as the database checks. Check that account
   groups, earnings and totals reconcile, including negative amounts and Nickel account mapping.
7. Set the owning test source's actual Reverse Ledger checkbox, one record at a time. Its test
   automation must call develop and preserve/stamp Reverse Date. Wait for completion and inspect
   the stored opposite entries, source/rule linkage, date and verified Airtable reversal UUIDs.
8. Retry one representative reversal per row and verify no extra entries. After all examples in this row are reversed,
   each account and invoice-reference balance must return to its baseline. Originals remain stored.
9. Record examples, money, expected/actual hits, journal IDs, writeback/reversal checks, report checks,
   timing, errors and coverage limits. Finish one row before advancing.

## Prerequisites and dates

- Shipping: post its linked deposit invoice first, verify partial release and remaining cap, reverse
  the shipment to restore deposit availability, then reverse the prerequisite to restore baseline.
- Invoice/payment pairs: validate invoice recognition followed by payment clearing, then reverse
  both. Include deposit/full-invoice allocation and discount/credit counterpart families.
- Reversal on today's date offsets the original cumulatively. An earlier month's statement retains
  the original activity; the reversal appears in its actual month. The net-zero comparison must
  include both dates. Never backdate a reversal simply to force a monthly report to zero.
- AP invoices have one payment under the approved company assumption. Preserve this scope; flag
  contradictory data rather than inventing allocations. AR batch allocation follows the approved
  matching-invoice proportions.

## Stop conditions

Stop the affected row on an account mismatch, unexpected duplicate, unbalanced journal, wrong
source/branch/reference, failed writeback, pending period review or nonzero unexplained reversal
balance. Continue independent rows only when their source records are distinct. Do not silently
uncheck an old reversal, erase unrelated postings, reopen periods or change source financial data.

Use the project database region for development webhook tests (`x-region: us-west-2` for DUAL ENTRY), and record response region/timing. Wait for Airtable's draft banner and Saving indicator to clear, reload, then verify the published endpoint before checking any source. Native input values that look saved can still be unpublished.

Wait for both stored reversal entries and verified Airtable reversal IDs before declaring a native run complete. A journal commit can precede its asynchronous writeback. Check one source and await that confirmation before checking the next, keeping FIN REST traffic within its shared rate limit.

## Explicitly approved shared-FIN isolation

The default is a separate test base. If the user explicitly approves reusing FIN for an isolated
campaign, capture the exact source IDs and their five ledger/reversal fields first. Pause the
production dispatcher, configure only the required develop secrets, and temporarily publish the
used source-table reversal endpoints to develop. Confirm the published values after reloading.
Keep unrelated source records and all business fields unchanged.

Finish by stopping the runner, confirming original/reversal pairs and the report baseline, restoring
the selected five source fields with independent readback, and publishing the original production
endpoints. Remove the temporary develop secrets, restore the previous production dispatcher state,
and independently verify all cleanup. Keep the develop original/reversal journals as test evidence.
Do not report cleanup as complete while routing, credentials or source metadata are still temporary.
