# Finance knowledge base

Last consolidated: 2026-11-05. This is the handoff for Chicago Brass Finance and the FIN-to-ledger
integration. It contains technical context, not customer/payment exports or a conversation transcript.

## Read in this order

| Document | Purpose |
| --- | --- |
| [Implementation](implementation.md) | App entry points, report data flow, modules and local setup |
| [Design patterns](design-patterns.md) | Responsibilities, source identity, accounting and UI conventions |
| [Database](database.md) | Live-verified schema, reporting views, guards and migrations |
| [Airtable triggers](airtable-triggers.md) | T-Chart, all ledger automation links, inputs and blockers |
| [Conversation summary](conversation-context.md) | Decisions, changes in direction, scope and unresolved work |
| [Session handoff](session-handoff.md) | Exact Codex session file and evidence locations on Jeric's device |
| [Testing](testing.md) | Focused checks, browser review and safe integration-test boundaries |

## Source authority

- The current user request defines scope. Earlier conversation decisions may have been superseded.
- The live T-Chart's official Actual Triggers, Debit and Credit columns define intended category behavior.
- Actual code defines implemented behavior. A chart row being approved does not prove it is implemented.
- A saved source file and a passing mock do not prove Airtable publication or Edge deployment.
- [Airtable source guide](../airtable/README.md), [webhook contract](../docs/ledger-webhook-contract.md),
  [report mappings](../docs/ledger-reporting.md) and [Edge README](../supabase/functions/ledger-payment/README.md)
  retain their detailed contracts. Update those owners alongside this index when behavior changes.
- [Ledger status](../docs/ledger-current-status.md) and rollout reports are dated evidence. Verify live
  automation ON/OFF status before relying on it. The new frontend work was verified locally.

## Project and branches

- Repository: [Chicago-Brass/finance-platform](https://github.com/Chicago-Brass/finance-platform).
- Consolidated baseline: `main`. Jeric authorized merging `develop` and retiring it on 2026-11-05.
  New development uses task branches. See [baseline guide](../docs/database-baseline.md).
- Preserve `mae/testing`, the separate UI/testing branch. Do not infer that it can be deleted because
  some commits are reachable from `develop`.
- `feature/data-upload` was confirmed fully contained in `develop`; its remote was already absent
  during this consolidation. The requested cleanup removes the remaining local branch.
- GitHub reported the repository public on 2026-11-04. Credentials, raw sessions and private financial
  extracts must stay out of commits. The owner requested a conversation summary and a local session path.

## Current implementation boundary

The frontend is being tested against the existing ledger dataset. This does not certify that the
database is a complete or reconciled copy of Airtable. Do not turn frontend work into an unrequested
data migration, source-record repair or historical posting exercise.
