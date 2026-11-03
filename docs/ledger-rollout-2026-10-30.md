# Ledger webhook rollout - 2026-10-30

Historical rollout evidence: the version-2/OFF state and reversal discussions below describe an
earlier stage. They are superseded by [current status](ledger-current-status.md) and the
[current webhook contract](ledger-webhook-contract.md). Original evidence is retained unchanged.

Project: DUAL ENTRY (`inzobaubbikyiekcfarj`). Source branch: `feature/data-upload`.
Changes are saved locally and are not committed or pushed.

## Published

- Edge Function `ledger-payment`, version 2, ACTIVE.
- URL: `https://inzobaubbikyiekcfarj.supabase.co/functions/v1/ledger-payment`.
- Migration `20261029182556_add_journal_transaction_type.sql` applied and read back.
  It adds nullable text columns `transaction_type` and `source_event_type` only.
- Supabase secret `LEDGER_WEBHOOK_SECRET` and Airtable secret
  `Dual Ledger Webhook Secret` configured with the same credential.
  It is a webhook credential, not a Supabase project API key.
- FIN Payment Sent, Cancelled, Returned and Reconciled script actions updated.
  The trigger record-ID mappings and event-type inputs are preserved.
  Each has the deployed URL input and the shared secret attached.
- All four automations remain OFF. No Airtable financial records were updated.
  One approved manual script-action test created the hosted journal recorded below.

Airtable qualifies categories, calculates amounts and sends final debit/credit pairs.
The Edge Function resolves account references, validates, and saves the pairs generically.
No new database posting functions were created. Existing database financial guards remain active.

## Initial verification before a real payment

- 23 native-shaped Airtable category checks passed.
- 8 HTTP handler checks passed.
- 16 PostgreSQL integration checks passed, including atomic writes, duplicate retries,
  reversals and cancelled/returned event conflicts. These used a disposable local database.
- Deno runtime check and app TypeScript check passed.
- The initial four saved Airtable scripts were copied back and compared with local source.
  Native Airtable editor diagnostics were cleared before a real payment was selected.
- Hosted authenticated empty-category request returned HTTP 200 with `postedCount: 0`
  and no journal IDs. This exercised authentication and the production database connection.
- Hosted unauthenticated request returned HTTP 401.
- Independent database readback confirmed 0 journal headers and 0 journal lines afterward.

These empty/authentication checks are historical preflight results. They preceded the approved
financial posting below.

## First approved Airtable-to-hosted posting

The approved test used the existing Sent payment for Top Knobs:

| Item | Verified value |
|---|---|
| FIN payment | `recWzJTMY7ds87daI` |
| Payment / journal date | `2025-01-03` |
| Amount | `$753.01` |
| Category | `PAY-07` - vendor bank payment |
| Hosted journal ID | `170f4583-043b-4759-925b-cc87da372579` |
| Entry number / status | `1` / `posted` |
| Debit line | `211.100` - `$753.01` |
| Credit line | `112.100` - `$753.01` |
| Debit minus credit | `$0.00` |
| Invoice reference | `rec3Gb3x7pgApuJ1T` |
| Vendor reference | `recpElwdOf15QyjsJ` |
| PO reference | `rec4YrkNkJMrltzR1` |

Independent database readback found exactly one header and two lines for this test, with the
matching source payment, references, amounts and balanced totals.

The first native attempt failed in about 0.4 seconds because the entrypoint called `input.config()`
twice. It failed before the HTTP request; the hosted database still contained no journal entries.
Both scripts were corrected to read the native input configuration once, and entrypoint regression
checks were added. The corrected Sent action was saved before rerunning the same approved payment.

The rerun succeeded in about 2.7 seconds. Supabase invocation metadata independently shows:

- HTTP `200` at `2026-10-29T18:51:20.716Z`, deployment version `2`.
- Execution duration `2,287 ms`.
- Request ID `01a18900-921d-7edb-997f-c4be64aff4ec`.
- Execution ID `74f71028-c5f5-4752-a48b-15a3162364e2`.
- Invocation log ID `093f555d-e548-4131-b5c1-d4c1141cb623`.
- Corresponding Boot event at `2026-10-29T18:51:18.647Z`; no new error-level runtime event in the
  retrieved metadata.

The read-only log evidence is in the scripts workspace at
`outputs/ledger-test-preflight-2026-10-30/logs/metadata-20261029T185139Z.json`.
Invocation logs omit payment bodies; the database readback establishes the financial result.

## Source verification after the native input fix

After the input fix and before the return-routing update below, the corrected source was saved in
all four Airtable script actions. Each was copied back and compared with the local file at that point.
Native editor diagnostics were empty. Record-ID mappings, event-type inputs, webhook URL and attached
shared secret were preserved. All four automations remained OFF.

Historical saved source SHA256 after that fix:

| Source | SHA256 |
|---|---|
| Sent | `9705b5593d397696e15cbb06e028bf2b0bbae2dc242cad7407739c69a4fb5496` |
| Cancelled / Returned / Reconciled | `b437fa3bf30a5f100aeb30254ca9cb19ce477452fefe2a9287132c19a836765c` |

## Return-routing update

H13 / PAY-12, "Vendor payment cancelled / returned", has the shared filter
`Payments.Invoice Type = "AP"`. Its primary trigger is either Cancel Payment, or Sent with
Return Payment (AP) checked. The Sent path sends the financial `eventType: "returned"` for the
same original FIN payment ID, with empty postings, before ordinary Sent categories or invoice/account
reads. The console primary trigger stays Sent. Payment Date remains the event date.

The standalone Returned action remains OFF. The Events script accepts its legacy returned input as
a logged no-op and sends no request. Cancelled and Reconciled retain their separate paths.
This is an Airtable routing update only; no Edge Function or schema change is needed.

Updated saved source SHA256:

| Source | SHA256 |
|---|---|
| Sent | `b18567c6fe142439454fa1debfc4d5082f38fc4c78c3515a17b9ca6829926eb0` |
| Cancelled / legacy Returned / Reconciled | `6dd83165f46e917c8845efc4393d40911fb636107b9b306711f37c5b633a7719` |

`node airtable/check.cjs` passed all 23 category checks, targeted return-routing checks and full
native entrypoint checks. This verifies local behavior, not a live return posting.

All four updated Airtable actions were copied back at `2026-10-29T19:45:22.620Z` and matched these
local hashes. Each retained its attached secret, had empty native editor diagnostics, and remained
OFF. The readback is recorded in `saved-action-readback.json`, the four saved source files and
`automations-updated-off.png` in the evidence folder below. No Test button was used, no webhook
request was made, and no new financial journal was created during this routing update.

Read-only FIN evidence found two flagged positive originals and their separate negative counterparts:

| Original payment | Original amount | Negative counterpart | Counterpart amount |
|---|---:|---|---:|
| `rec5NY728M60IBf12` | `$91.47` | `recjyH2U602F3O0yW` | `-$91.47` |
| `recN9ruxcP6Mw5nz4` | `$340.00` | `recuPuqe93aVyWKbu` | `-$340.00` |

Both originals link Fifth Third `112.100`; both negative counterparts link Nickel `0747`
(ledger `112.300`). This unresolved source-bank difference does not change the generic reversal:
it reverses the original posted journal's bank and amount. The record links alone do not establish
which bank actually received funds. The separate Original Payment link (`fldJJsrFnqWsEMox5`)
is evidence of these chains; the flagged-original path uses the original's own payment ID.

Evidence is in the scripts workspace under `outputs/ledger-return-routing-2026-10-30/`:
`review.md`, `summary.json` and `payment-chains.csv`. No returned journal has been written or tested
live for this change. The approved Top Knobs journal above is untouched.

## Remaining

Only PAY-07 has a real Airtable-to-hosted financial posting test so far. Other categories have local
coverage but have not yet been exercised as real hosted financial postings. Enabling the automations
remains a separate action. Branch-column storage and connecting the reporting UI are deferred as agreed.
