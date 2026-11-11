# Airtable ledger webhook

`ledger-payment` accepts a POST from FIN payment, invoice, invoice-line, depreciation and prepaid-use sources. Airtable supplies its transaction
type and final debit/credit posting pairs, including calculated amounts. The Edge Function
authenticates, resolves account references to ledger accounts and saves the journal through
parameterized SQL in one database transaction. Transaction types are metadata; the backend has no
category-specific posting rules or amount calculations. No RPC or database function is called or created.

## Authentication and configuration

- Airtable sends `x-ledger-secret` from its `input.secret()` value.
- The matching Edge Function secret is `LEDGER_WEBHOOK_SECRET`.
- Supabase injects `SUPABASE_DB_URL` in the Edge runtime. The database connection string stays in
  that runtime; it is never sent to Airtable or the reporting frontend. No service-role/API key is used.
- This webhook uses its own secret check, so its function-specific configuration needs
  `verify_jwt = false`. This does not change JWT verification for other functions.
- POST only. No browser CORS surface or user-session client is needed.

No real secret belongs in source or a repository env file.

## Request

The common envelope is:

```text
paymentRecordId, eventType, entryDate, paymentName, referenceNumber,
source?: {tableId, recordId, recordName?},
categories: [{
  ruleCode,
  transactionType,
  postings: [{debitAccount: {recordId?, number?}, creditAccount: {recordId?, number?}, amount, ...references}]
}]
```

Invoice packets use invoiceRecordId instead of paymentRecordId and eventType created, entry_requested or paid.
They default to FIN Invoices as source; an explicit source must identify that same invoice.
No payment is fabricated. Their audit URL opens the invoice, while payment-triggered entries
continue to open the triggering payment. No schema change or category-specific backend mapping
is required. See the full contract for the invoice-created envelope.

entry_requested represents the FIN Invoices.Create Entry checkbox. It uses the same supplied-pair
writer, source validation and invoice audit attribution. Its category-set replay checks are separate
from created, so both triggers can post their distinct rule codes for one invoice. The source/rule
identity still prevents duplicate expense journals. The receiver does not classify expense accounts
or calculate invoice-line amounts; those decisions remain in the Airtable category functions.

The local `ledger-daily` worker reuses this writer with `allowAdditionalCategories` enabled so
separate category queries can add journals to one source. Existing journal values stay immutable.
The public endpoint keeps its strict whole-event replay checks. See [the worker guide](../ledger-daily/README.md)
for its staged configuration; no cron or hosted deployment is enabled by that implementation.

## Airtable journal links

The native webhook now uses `service.ts` to post through the existing writer, then synchronize
all five FIN source tables through `../_shared/ledger-links.ts`. Configure server secret `AIRTABLE_PAT`
with FIN record read/write access before publishing this version. Missing configuration fails
before posting any supported source. Invoice Lines, depreciation and prepaid logs own their metadata.

After the journal transaction commits, the service reads all original posted journals owned by
that exact source and writes `Ledger Postings` as `{rule, key, datetime, id}` objects, the complete
`Ledger Journal IDs` array, and `Reversal Journal IDs`. It independently reads Airtable back before
returning success. Posting responses retain their original per-event counts/IDs and add
`ledgerPostings`. Invoice-owned payment packets update the invoice's fields, not the payment's.

The source lock serializes metadata verification and compensation with posting and reversal.
Writeback uses one PATCH followed by a filtered GET of the source's three ledger fields. A lost
PATCH response is resolved by that read, without blindly sending another write. Verification reads
can make up to three attempts within the writeback deadline.

If the read confirms the new IDs are absent, the service deletes only journals newly created by
this call, cascading their lines. It preserves earlier/duplicate journals. The response is HTTP 503
with `code: airtable_writeback_failed` and `outcome: rolled_back`; an identical retry can post again.
If a read cannot complete, a partial save references new IDs, or the delete cannot be confirmed,
the response uses `outcome: unconfirmed`. It does not claim a clean rollback. Exact replays still
deduplicate. There is no repair queue. Supabase and Airtable do not share a transaction; a late
server-side Airtable save after the verification read or an interrupted invocation can remain
uncertain. Depreciation/prepaid native senders and review/reversal services retain their separate
existing contracts. Accounting replay, source ownership and period guards remain enforced.

Current writeback deployment: `ledger-payment` version 18 and `ledger-daily` version 6 were
verified ACTIVE on 10 November 2026. All 33 downloaded runtime modules matched local source;
invalid-secret requests returned HTTP 401. Failure scenarios used disposable PostgreSQL and
synthetic Airtable responses. No hosted financial test or cron activation was executed.

Previous writeback deployment on 9 November 2026: `ledger-payment` version 16 and `ledger-reversal`
version 5 are ACTIVE. All nine downloaded runtime modules matched local source. The supplied
PAT was saved as `AIRTABLE_PAT`; live metadata writes and independent readback passed for one
existing payment and one invoice. No native script/trigger replacement or cron activation occurred.
The live check did not create or reverse journals; posting/reversal failure and retry paths were
verified with real disposable PostgreSQL transactions and mocked Airtable requests.

The depreciation extension accepts `depreciationRecordId` with eventType `created` and
source table `tblC0dbO5UMXzHma9`. It uses the same generic writer with its own source lock and
audit link. It does not require or invent a payment/invoice. The optional asset note remains a
header note. This extension is published. The sender posts on creation with Date unchanged,
including future dates.

Amounts are signed decimal strings with cents precision calculated by Airtable. Negative amounts
stay negative on the supplied debit and credit sides; accounts are not swapped. The signed-journal
migration allows exactly one nonzero side per line and retains balance/period/immutability guards.
Each posting
provides both account references and can carry the relevant invoice, vendor, client, staff,
transaction, PO, tax state, source-line and branch values. Business reference columns are text
arrays; single and multiple supplied links normalize to sorted unique arrays. State record IDs
persist in state_ref, separately from the optional two-letter state_code. `transactionType` is the free-text T-Chart
title; `ruleCode` is stable source metadata. The database stores transaction and source-event types
without using them to choose posting accounts. The local branch update persists a supplied
branch string or single distinct array value in journal_lines.branch. Empty or partially unknown attribution remains NULL.
Aggregate payment components spanning distinct branches retain NULL attribution without changing
amounts or choosing one branch. Malformed values fail. Branch is part of replay equality;
report branch filters remain deferred.

The local account-entry extension accepts optional category entryKey. It is stored as
journal_entries.source_entry_key and included in the source/rule unique identity. Expense Create
Entry sends one account group per entryKey, keeping repeated lines for that account together.
The schema migration must precede receiver and sender deployment. Existing whole-category
journals cannot be split or combined by replay; they require review. No historical data is changed.

`invoiceRecordId` is the shared invoice reference. Optional `debitInvoiceRecordId` and
`creditInvoiceRecordId` override it per leg. This can preserve a
vendor bill on the AP debit and its applied credit memo on the AP credit. The plural invoiceRecordIds,
debitInvoiceRecordIds and creditInvoiceRecordIds retain multiple links on the respective legs. An invoice-owned source
must appear on at least one leg of each posting pair.

Account active is a label and does not control posting. Existing account identity and is_postable
checks remain, along with balance, accounting-period, immutable-posted-record and authorization guards.

Omitted `source` keeps the existing payment-owned identity. A FIN Invoice source
(`tableId = tbldQXuqNEp8G5pfs`) lets a payment trigger post an invoice-owned discount separately from
its cash settlement. The source invoice owns the lock and journal identity; another
triggering payment cannot post the same invoice/category again. The first trigger payment remains
in the static description. Accounting dates, amounts, account pairs and line references still must
match on retry. Event names are metadata: Sent, Cancelled, Returned and Reconciled all use the same
supplied-pair writer. A cancellation/return category creates an actual entry; it does not find,
reverse or change an original journal. See the [full contract](../../../docs/ledger-webhook-contract.md).

Every payment-triggered journal header and line audit_link opens the triggering FIN payment identified by
paymentRecordId. Invoice references remain separate. Audit URLs are excluded from replay equality
so historical invoice URLs and different payment triggers do not repost an invoice total. A retry
keeps the originally stored URL; existing journals are not rewritten or backfilled.

The HTTP handler forwards the packet unchanged. `ledger.ts` validates the supplied pairs, resolves
their account references and saves them atomically. Postgres.js is pinned to `3.4.9`; the Edge isolate has at most one connection, with
prepared statements disabled and idle connections closed after 20 seconds.
The production connection requires TLS with certificate verification. If an additional trusted CA
is needed for the hosted connection, configure that CA; do not disable verification.

## Response and retries

Successful posting results are returned unchanged, including per-category posted/duplicate/no-op
outcomes and journal IDs. Invalid JSON is HTTP 400, invalid webhook credentials 401, wrong method
405, and unavailable configuration/database 503. Posting validation errors return 400 with their
safe owned `PostingError` message/code; changed-payload/source conflicts return 409. Native database
errors return fixed text and their code. Connection credentials and internal details are not returned.

The HTTP handler makes one posting attempt. The caller can retry the same event; transaction-scoped
identity and duplicate handling protect the whole atomic event. No payment payload or credential is logged.
Unexpected service failures emit one console.error with a sanitized error code and a valid FIN
source record ID, when supplied. Raw error messages, stacks, headers and request payloads are omitted.

## Deployment

With this project's scoped Management API token supplied to the CLI, deploy only this function:

```sh
supabase functions deploy ledger-payment --project-ref inzobaubbikyiekcfarj --use-api
```

`--use-api` bundles on the server without Docker. The function-specific JWT setting is in
`supabase/config.toml`; the webhook's own secret check remains mandatory. Keep verified TLS for
the database connection. Do not change a global CLI login or deploy other functions.

## Local check

With Node 26 (native TypeScript type stripping):

```sh
node --test supabase/functions/ledger-payment/handler.test.mjs
```

The test injects a mocked posting callback. It exercises authorization before parsing/service work,
transparent final-pair forwarding, posted/duplicate/no-op results, invalid input and database failures. It writes no
live data. Deno checking and an authenticated no-post request verified the deployed runtime and
database connection in the [2026-10-30 rollout](../../../docs/ledger-rollout-2026-10-30.md).

## Expense record sources

The published receiver supports depreciationRecordId and prepayLogRecordId for created events,
and invoiceRecordId for created/entry_requested/paid. Mixed owner types fail. Depreciation and
prepay logs have their own audit links, rather than fabricated invoice/payment identities.

Migration 20261106191953 adds source_entry_key and journal_lines.airtable_record_ids. Apply it
before this receiver. Sender account keys create one journal per category/account, and grouped
source-line IDs persist in the line reference array. Supplied branches persist; missing or mixed
attribution remains NULL. Exact replays deduplicate, and changed grouping/branch/refs conflict.

## Expense line-owned packets

`invoiceLineRecordId` with eventType `entry_requested` identifies a FIN Invoice Lines source
(`tblV26TC0f6CKDneL`). Its explicit source, when supplied, must match that line. Do not also set
paymentRecordId or header invoiceRecordId; retain the parent invoice in each posting's invoice
references. Lines, invoices, payments and both log tables have distinct source locks and audit URLs.
All five source types require the same AIRTABLE_PAT writeback verification. This changes source
support, not the Payment or Invoice Entry category filters/account mappings.

Shipping Record (`tblAxlsdmJN0X0sQs`) events use `shippingRecordId` and `eventType: "created"`.
The source owns its audit link and ledger writeback; its linked MTAs are amount inputs, not journal
owners. Source identity, replay, period review and signed amounts use the same generic writer.
