# Airtable ledger webhook

`ledger-payment` accepts a POST from FIN payment and invoice-created automations. Airtable supplies its transaction
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

Invoice packets use invoiceRecordId instead of paymentRecordId and eventType created or entry_requested.
They default to FIN Invoices as source; an explicit source must identify that same invoice.
No payment is fabricated. Their audit URL opens the invoice, while payment-triggered entries
continue to open the triggering payment. No schema change or category-specific backend mapping
is required. See the full contract for the invoice-created envelope.

entry_requested represents the FIN Invoices.Create Entry checkbox. It uses the same supplied-pair
writer, source validation and invoice audit attribution. Its category-set replay checks are separate
from created, so both triggers can post their distinct rule codes for one invoice. The source/rule
identity still prevents duplicate expense journals. The receiver does not classify expense accounts
or calculate invoice-line amounts; those decisions remain in the Airtable category functions.

Amounts are positive decimal strings with cents precision calculated by Airtable. Each posting
provides both account references and can carry the relevant invoice, vendor, client, staff,
transaction, PO, tax state, source-line and branch values. `transactionType` is the free-text T-Chart
title; `ruleCode` is stable source metadata. The database stores transaction and source-event types
without using them to choose posting accounts. The nullable journal_lines.branch text field is reserved for future attribution. The writer
does not populate it while branch reporting is deferred.

`invoiceRecordId` is the shared invoice reference. Optional `debitInvoiceRecordId` and
`creditInvoiceRecordId` override it per leg. This can preserve a
vendor bill on the AP debit and its applied credit memo on the AP credit. An invoice-owned source
must appear on at least one leg of each posting pair.

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
