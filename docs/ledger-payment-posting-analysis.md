# FIN payment posting analysis - 2026-10-30

Refreshed after the 30 October 2026 consolidation and live Sent test. This analysis uses the
DUAL ENTRY schema (`inzobaubbikyiekcfarj`), native FIN fields, the T-Chart and current source.
Implementation follows the
user's final generic-pair design in [ledger-webhook-contract.md](ledger-webhook-contract.md).

## Final separation of responsibility

Airtable owns the category decision, component calculations, proportional allocation and final
debit/credit account choices. It sends the T-Chart title as `transactionType` and balanced posting
pairs with amounts and relevant source references.

The Edge Function authorizes the caller, resolves the supplied account identities, validates the
pairs and saves the journals directly in one PostgreSQL transaction. It does not infer accounts
from a PAY code, reclassify refunds, recompute invoice proportions or call a stored posting function.
The existing database constraints and immutable-posting guards remain in place.

## Data to send

| Packet data | Storage / purpose |
|---|---|
| FIN payment ID, event type and effective date | Payment-owned identity, `source_event_type`, `entry_date` and every new header/line audit link. Invoice-owned totals retain invoice identity. |
| `ruleCode` and free-text `transactionType` | Stable category metadata plus header `transaction_type`; no backend accounting switch. |
| Payment label and bank/reference number | Readable description and external reference. |
| `postings[].debitAccount`, `creditAccount`, `amount` | Supplied pair expands into two equal positive-magnitude journal lines after account-reference resolution. |
| Invoice, customer/vendor/staff, transaction, PO, tax-state and source-line IDs | Applicable scalar journal references. Audit links open the triggering payment. Plural arrays travel in the payload but are not yet persisted. |
| Branch values | Included in the packet; structured branch persistence will be added later. |

One normal payment/category has one journal header and all its allocation pairs. Supabase generates
the journal UUID/number, reporting month and timestamps. Account names and offsetting-account labels
come from catalog/reporting joins. The metadata migration adds `transaction_type` and
`source_event_type`; it does not add a database posting function.

Account references retain FIN IDs/numbers. The generic resolver uses configured Airtable identities,
exact ledger codes and explicit aliases such as Nickel `0747` to `112.300`. Generic resolution does
not choose the accounting side. The Airtable function already supplies that side.

## FIN fields that matter

| FIN field | Field ID | Use |
|---|---|---|
| Payments.Amount | `fldhP2S68pT3XkZmX` | Current payment movement amount; recent samples populate this while legacy Cash Sent Out is blank. Retain the source sign for interpretation. |
| Payments.Payment Date | `fld0mYG8IMrDaNzdE` | Sent/returned event's financial date; date-only. |
| Payments.Reference Number | `fldxjaur2SnqKmRfN` | Human/bank reference for external_ref. |
| Payments.Account to Pay/Receive | `fldCIQSOdytBGi91S` | Actual bank/card account identity; resolve through the account crosswalk. |
| Payments.Master Invoice Table | `fldzPDwsJ1ZT2tVIs` | FIN invoice links for allocations and audit dimensions. |
| Invoices.Invoice ID | `fldMZyzqDidRujeZS` | Primary display field selected for invoice/source-credit names. |
| Payments.Overpaid Amount | `fldjsHZCoUYnnc2fV` | Excess component, including its override. Not the entire cash movement. |
| Payments.Reconciled Amount | `fldT1UF3K2uO9mFjB` | Actual reconciliation amount. |
| Payments.Reconciled Amount Discrepancy | `fldo8tnQ820K5aYyv` | Magnitude supplies PAY-26 amount; the chart fixes Dr 007.002 / Cr payment bank without a sign-based direction change. |
| Payments.Cash Sent Out | `fldBS2Xlb6K5OftcS` | Separate editable legacy field. No automatic fallback or substitution is established. |

The sender's CORE handlers read the amount, reference, dimensions and split data after qualification,
then prepare final posting pairs. Console-formatted values remain display-only.

## Amount and allocation findings

- Recent FIN samples populate Payments.Amount while legacy Cash Sent Out is blank; they are separate editable fields.
- Invoice Total Paid Amount is cumulative batch allocation, not this payment event's amount.
- Airtable handles signed source values and sends positive magnitudes on its selected account sides.
- Partial multi-invoice payments use the user-approved proportional Invoice Amount To Pay basis, with integer-cent allocation and deterministic remainder handling.
- All qualifying categories run. Each applies its chart-defined amount; no uncharted exclusion or netting is inferred. Payment shares conserve the movement within a category. Invoice-owned credits/rebates use their full authoritative totals and invoice identity.
- A true zero is distinct from a missing amount. Zero-only matches return a no-op rather than create invalid zero journal lines.
- PAY-16/PAY-18 use separate principal/interest invoices, one account per invoice, weighted by Amount To Pay. Ambiguous shared interest and multi-account repayment invoices fail rather than inventing a split.
- PAY-10 discount, PAY-15 salary/fees and PAY-23 insurance remain blocked for account/split decisions. PAY-14/PAY-25 remain unmapped. Tax can use separate single-account invoices; rebate and reconciliation use their explicit amount fields.
- Card purchase mini-payments and a later statement payment represent different movements. A batch-family total is not an extra cash event.

## Dates and cancellation/return entries

Sent and returned use Payment Date. Cancellation uses Payment Cancelled Date; reconciliation uses
Reconciliation Date - Combined. Native dates remain date-only; timestamps use America/Chicago.
Future-dated Sent records remain on their source financial date rather than being silently dated today.

Cancellation and return supply their own actual account pairs using current Payments.Amount.
They do not copy or reverse an original entry. AP returns run through Sent + Return Payment (AP),
and cancellations through Cancel Payment. The standalone Returned automation was deleted.
Posted data stays immutable. Identical replays return prior results; changed financial data or
historically reversed source journals require review rather than editing an old journal.

## Deferred work

- Branch is carried now; its structured journal field will be added later.
- Multiple linked references still need structured storage; current journal columns store one ID each.
- Airtable omits notes. The receiver retains optional notes support for future implementation.
- UI account layout and live ledger/report adapters will be refactored separately. They do not control webhook posting choices.
- Other invoice/revenue/inventory event streams, historical coverage and opening balances are separate from this payment connection.
- A currency/FX or new event-version lifecycle would require an explicit storage design when introduced.

## Evidence

Fresh source evidence is in the scripts workspace at `outputs/ledger-payload-analysis-2026-10-30/`:
`schema/`, `fin/`, `categories/` and `reporting.md`. The [category matrix](ledger-payment-category-matrix.md)
records the current implemented T-Chart mapping; it is not a backend router. See the
[current status](ledger-current-status.md) for the latest verified deployment and test scope.

Current implementation source and the webhook contract take precedence over earlier analysis snapshots.
Local checks cover mocked Airtable records, HTTP authorization and direct posting against disposable
PostgreSQL. Hosted deployment state is verified separately.
