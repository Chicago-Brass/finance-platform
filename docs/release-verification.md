# Report cleanup and release verification

Date: 2026-11-06. Scope: current local `develop` report/UI changes.

## Result

Source review, automated checks, production build and both statement exports pass. Final all-page
visual sign-off remains incomplete because browser control intermittently returns stale captures
and then times out. This document does not certify a remote deployment or hosted schema state.

## Cleanup

- Statements require `get_trial_balances`; missing RPCs surface a data error instead of invoking
  the obsolete per-period retry path.
- Balance Sheet builders require each snapshot year's prior-year baseline. Missing baselines
  fail explicitly rather than assuming a zero baseline.
- Removed the sample-data flag and its unused UI/export branches, the whole-dollar formatter,
  the retired Trial Balance activity option, unused T-Chart date props and unused styles/assets.
- TypeScript now rejects unused locals and parameters.
- Active input validation, financial guards, auth/error boundaries and the public `/login`
  bookmark redirect remain. Applied schema history and existing database APIs were not deleted.
  The current application does not call the older `search_ledger` or posting/reversal RPCs.

## Export verification

Excel and PDF buttons exist on Income Statement and Balance Sheet. Trial Balance, General Ledger
and T-Chart have no export buttons; this pass does not add new export features.

- Excel uses the same visible rows as the report, retaining the report's complete financial
  totals. Hidden detail rows are disclosed in the workbook.
- Text remains literal inline strings; monetary/percentage values remain numeric, and missing
  values remain blank. Invalid XML controls are removed. Long labels wrap.
- The independent synthetic workbook read checked 120 rows, 14 columns, cents, percentages,
  blanks, frozen panes, repeated headers, the logo and absence of formulas.
- Real Chrome downloads for both statements were opened as ZIP/XML. The Income Statement's
  13 numeric columns matched its displayed final net. All 11 monthly Balance Sheet columns
  reconciled assets to liabilities plus equity.
- Native Chrome PDF previews were inspected for full-year monthly Income Statement details
  (3 pages) and monthly Balance Sheet details (6 pages). All columns were present and table
  headers repeated. The skip link no longer overlays printed rows. Navigation, filters and
  analytics are hidden. Chrome's own header/footer settings remain user-controlled.

## Checks

| Check | Result |
| --- | --- |
| App, component, report, export and middleware tests | 148 passed |
| Edge HTTP/auth/error tests | 9 passed |
| Disposable database reporting/security tests | 11 passed |
| Disposable database direct-posting tests | 26 passed |
| Airtable mock validators | All 5 runners passed; no live events |
| TypeScript, including unused-code checks | Passed |
| Whitespace check | Passed |
| Isolated optimized Next.js production build | Passed |
| Independent final source review | No release blocker found |

The disposable database runners loaded the migration chain and reference seed, and removed their
own containers. They did not reset a shared database or write hosted journal records.

## Browser coverage and remaining limits

Chrome used the Jeric profile and the signed-in account. Checks covered the navy header,
Income Statement annual view and prior-year Movement, Balance Sheet date presets, annual
snapshots and prior-quarter Movement, analytics collapse/restore, and account drilldown totals.
The optimized build was served separately from the development server for export verification.

The current Trial Balance loaded 61 accounts and its balanced totals. Remaining checks are a
complete General Ledger/T-Chart interaction pass, narrow-layout review, and reliable console/network
inspection. Native control timed out during the final Trial Balance interaction, so cleanup of
the remaining agent QA tab could not be verified. Do not describe these unfinished checks as passed.

No commit, push, hosted schema change, Airtable publication or Vercel deployment was performed.

## Release preflight

Authenticated live reads against DUAL ENTRY verified `get_trial_balances`, `filter_ledger` and
`count_ledger` with their current input signatures. Full counts match the independent ledger
view, and journal search plus account-type/amount filtering match their counts. No missing
runtime database update was found. The management token is expired, so this check establishes
deployed reporting behavior rather than a fresh migration-history or full-schema comparison.

The verification above preceded the separately authorized main release. Its browser limits
remain applicable; merging or deployment does not turn unfinished visual checks into passed ones.
