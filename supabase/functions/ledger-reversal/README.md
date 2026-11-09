# Ledger reversal endpoint

Dedicated payment/invoice reversal, separate from `ledger-payment`. `index.ts` provides the
existing authenticated HTTP layer; `reversal.ts` reads stored journals and writes all required
reversals in one direct SQL transaction. No stored posting/reversal function is called or created.

Use the existing `SUPABASE_DB_URL` and `LEDGER_WEBHOOK_SECRET` secrets. The function-specific
`verify_jwt = false` configuration requires the existing `x-ledger-secret` check before service
work. Database TLS remains verified. Source tables are restricted to FIN Payments and Invoices.

Setup, contract, manual date behavior, deferred restoration and checks:
[Reversal guide](../../../docs/ledger-reversal.md).

The `service.ts` extension runs the unchanged reversal transaction, then synchronizes
`Ledger Postings`, original IDs and reversal IDs through `../_shared/ledger-links.ts`. It requires
the same server-only `AIRTABLE_PAT` as native posting and independently verifies Airtable
before returning success. Metadata contains original journals only; reversal IDs remain separate.
Failed writeback returns 503; retrying the same source/date repairs links without another reversal.
The existing native reversal script and its manual date remain compatible. This extension was
published as version 5 on 9 November 2026. Downloaded runtime source matched local code, and
live metadata permissions/readback passed for a payment and an invoice without creating a
journal or reversal. The evidence below describes the earlier reversal-only version's live tests.

Deployed to DUAL ENTRY (`inzobaubbikyiekcfarj`) on 9 November 2026: ACTIVE, version 1.
Native Airtable authentication was verified using an invalid-source request that stopped before
database work. Authorized live checks then reversed five test journals (14 lines) from two
payments and one invoice, preserving all originals. Retrying the three-journal payment returned
zero new journals and three existing reversals. No migration was required.
