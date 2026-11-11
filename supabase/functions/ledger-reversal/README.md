# Ledger reversal endpoint

Dedicated source-record reversal, separate from `ledger-payment`. `index.ts` authenticates;
`reversal.ts` reverses all original journals owned by the exact source in one direct SQL
transaction. It copies stored lines, swaps debit/credit and preserves signed amounts and
original records. No stored posting/reversal function is called or created.

Supported FIN owners: Payments, Invoices, Invoice Lines, Prepay Expenses Log and Depreciation
Table. Linked records are not reversed merely because the source references them.

```json
{
  "source": { "tableId": "tblR61NG9i0giid28", "recordId": "rec00000000000001" },
  "reversalDate": "2026-11-12"
}
```

`journalEntryIds` is optional for older callers. Supabase finds the complete source-owned set;
supplied IDs cannot expand it. Native senders supply only source and date, stamping a blank
manual Reverse Date once before calling. Unchecking/restoration is not implemented.

Use existing `SUPABASE_DB_URL`, `LEDGER_WEBHOOK_SECRET` and server-only `AIRTABLE_PAT` secrets.
The function has `verify_jwt = false` and requires `x-ledger-secret` before service work.
Database TLS remains verified. Exact source/date retries deduplicate; changed dates conflict.

`service.ts` commits the reversal, then synchronizes `Ledger Postings`, original journal IDs
and reversal IDs through `../_shared/ledger-links.ts` under the shared source lock. It reads
Airtable back before success. Failed writeback returns an error without deleting the reversal;
the same retry restores links without reposting. Native scripts do not rewrite those fields.

Closed-period reversals await explicit exception approval through the JWT-authenticated
`ledger-periods` endpoint. Pending/rejected requests do not create reversal journals or new
posting markers. Approval uses the same five-source ownership, lock and writeback code.

Published on 12 November 2026: `ledger-payment` v20, `ledger-reversal` v8,
`ledger-periods` v3 (JWT verification enabled) and `ledger-daily` v12. All 42 downloaded runtime
modules matched local source. All five native reversal automations were reloaded ON with
saved scripts/inputs matching the source/date-only contract.

Current isolated verification passed 11 native cases, 91 disposable database checks, 56 focused
checks, 17 report checks and TypeScript, plus an all-five-source closed-period approval/retry
proof. Authorized live verification covered 62 Expense sources across 15 rules: 66 original
journals and 66 native-checkbox reversals. All source writebacks were verified, a two-journal
replay created no additional journals, and report results reconciled to stored lines across date windows
and branches. Prior-year originals reversed in the current year retain the expected period
shift. Live coverage gaps are listed in the [Expense review](../../../docs/expense-audit.md).
Historical 9 November live checks covered Payments/Invoices only.

Field maps, automation links, manual date behavior and full verification scope:
[Reversal guide](../../../docs/ledger-reversal.md).
