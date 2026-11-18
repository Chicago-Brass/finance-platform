# Repository knowledge base

Chicago Brass Finance is a Next.js reporting application and an Airtable-to-Supabase journal
pipeline. These guides describe the repository, data contracts and operating procedures.

## Guides

| Guide | Scope |
| --- | --- |
| [Environments](environments.md) | Production/develop database targets, local configuration and cron |
| [Security](security.md) | Approved-user access, credentials, session limits and cancellation guards |
| [Implementation](implementation.md) | Runtime architecture, source map, routes, data loading and UI |
| [Design patterns](design-patterns.md) | Accounting invariants, layer responsibilities and coding conventions |
| [Database](database.md) | Tables, read interfaces, writer, security and migrations |
| [Airtable triggers](airtable-triggers.md) | Automation editors, script ownership, mappings and unresolved categories |
| [Manual journals](../docs/manual-journals.md) | Approved parent journals, line pairs, invoice exclusions and cancellation |
| [Period management](../docs/period-management.md) | Closing, review queue, permissions, exceptions and audit history |
| [Rule progress](../docs/rule-progress.md) | Stable chart codes, grouped catalog, posted journals and sync-attempt analytics |
| [Testing](testing.md) | Local checks, browser review and release verification |
| [Ledger sync webhook](../supabase/functions/ledger-daily/README.md) | Deployed webhook for all three category sheets, global lock, checkpoints, writeback and production-only daily dispatch |

The full category/query/field mapping is in the [ledger sync plan](../docs/ledger-sync-plan.md).

## Source of truth

- Current code defines implemented behavior. Read the affected callers before changing it.
- The T-Chart's official trigger, debit and credit mappings define intended category behavior.
- Source files, saved Airtable editors, published automations and deployed Edge code are separate
  states. Verify the target deployment when publication is part of the task.
- [Airtable source reference](../airtable/README.md), [webhook contract](../docs/ledger-webhook-contract.md),
  [report mappings](../docs/ledger-reporting.md), [database baseline](../docs/database-baseline.md)
  and [Edge function](../supabase/functions/ledger-payment/README.md) hold detailed contracts.
- [Infrastructure audit](../docs/automation-infrastructure-audit.md) records the cross-automation
  review, working partial categories and unresolved accounting questions.
- [Ledger status](../docs/ledger-current-status.md) contains dated operational evidence. Re-read
  live state before treating any status observation as current.

## Environments and branches

- Repository: [Chicago-Brass/finance-platform](https://github.com/Chicago-Brass/finance-platform).
- Production: [Finance application](https://finance-platform-iota-bice.vercel.app), built from `main`.
- Use a feature branch from current `main`; there is no required persistent `develop` branch.
- Preserve `mae/testing`, the separate presentation/testing branch. Its account groupings use
  workbook data and older P&L codes; its amounts are not live-ledger fixtures.
- [DUAL ENTRY](https://supabase.com/dashboard/project/inzobaubbikyiekcfarj) is the hosted ledger.
  Local app development uses persistent Supabase develop, `vaaykmqshkuunewjrxuy`.
  See [environments](environments.md) for the required local settings and isolation.

The reporting app displays the existing ledger dataset. UI verification does not certify that the
ledger is a complete or reconciled copy of Airtable. Data migration or financial repair is a
separate, explicitly scoped operation.
