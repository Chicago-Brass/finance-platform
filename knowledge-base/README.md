# Repository knowledge base

Chicago Brass Finance is a Next.js reporting application and an Airtable-to-Supabase journal
pipeline. These guides describe the repository, data contracts and operating procedures.

## Guides

| Guide | Scope |
| --- | --- |
| [Implementation](implementation.md) | Runtime architecture, source map, routes, data loading and UI |
| [Design patterns](design-patterns.md) | Accounting invariants, layer responsibilities and coding conventions |
| [Database](database.md) | Tables, read interfaces, writer, security and migrations |
| [Airtable triggers](airtable-triggers.md) | Automation editors, script ownership, mappings and unresolved categories |
| [Testing](testing.md) | Local checks, browser review and release verification |

## Source of truth

- Current code defines implemented behavior. Read the affected callers before changing it.
- The T-Chart's official trigger, debit and credit mappings define intended category behavior.
- Source files, saved Airtable editors, published automations and deployed Edge code are separate
  states. Verify the target deployment when publication is part of the task.
- [Airtable source reference](../airtable/README.md), [webhook contract](../docs/ledger-webhook-contract.md),
  [report mappings](../docs/ledger-reporting.md), [database baseline](../docs/database-baseline.md)
  and [Edge function](../supabase/functions/ledger-payment/README.md) hold detailed contracts.
- [Ledger status](../docs/ledger-current-status.md) contains dated operational evidence. Re-read
  live state before treating any status observation as current.

## Environments and branches

- Repository: [Chicago-Brass/finance-platform](https://github.com/Chicago-Brass/finance-platform).
- Production: [Finance application](https://finance-platform-iota-bice.vercel.app), built from `main`.
- Use a feature branch from current `main`; there is no required persistent `develop` branch.
- Preserve `mae/testing`, the separate presentation/testing branch. Its account groupings use
  workbook data and older P&L codes; its amounts are not live-ledger fixtures.
- [DUAL ENTRY](https://supabase.com/dashboard/project/inzobaubbikyiekcfarj) is the hosted ledger.
  Local app development uses the configured hosted project unless explicitly configured otherwise.

The reporting app displays the existing ledger dataset. UI verification does not certify that the
ledger is a complete or reconciled copy of Airtable. Data migration or financial repair is a
separate, explicitly scoped operation.
