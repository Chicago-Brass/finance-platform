# Design patterns and invariants

## Responsibility split

| Layer | Owns | Does not own |
| --- | --- | --- |
| Airtable native automation | Primary event and trigger record ID | Database journal persistence |
| Airtable CORE handlers | Category filters, amount components, account pairs, relevant references | Generic SQL persistence |
| Airtable UTILS | ID-based linked reads, caching/batching, cents/date helpers, webhook sender | New accounting assumptions |
| Airtable HELPER | Human-readable logs | Filters, amounts, posting behavior |
| Edge HTTP handler | Shared-secret authentication, JSON boundary, safe HTTP results | Category matching |
| Edge posting service | Validation, account identity resolution, replay checks, one SQL transaction | T-Chart-specific allocation or inferred splits |
| Report frontend | Authorized reads, mapping/grouping, display and interaction | Source-record migration or financial corrections |

## Airtable category structure

Keep a readable `main()` and named category handlers. A handler checks its own category filters,
loads additional data when required, calculates its actual posting pairs and pushes a result.
Main evaluates all eligible handlers. A payment can legitimately create several categories.

Do not restore the discarded generic descriptor/predicate engine or an exclusive first-match
`if/else` router. Do not split every one-line expression into a wrapper. Reuse substantive shared
reads and helpers while keeping each category's business intent visible.

Prepare all categories before the first webhook. A matching unresolved handler throws before
posting that run's prepared packet. Several source packets still mean separate transactions:
a later network failure can occur after an earlier acknowledgement. Log every acknowledgement
immediately and retry only with the same identity and financial payload.

## Financial decisions

- Use actual single-select/rollup values and stable FIN IDs, not approximate wording from old notes.
- In payment classification, read Invoice Type and Vendor Type from Payments. Multiple distinct
  vendor types are an error rather than an invented normalization path.
- For a payment shared across invoices without explicit allocation, weight by Invoice Amount To Pay.
  Allocate integer cents deterministically and conserve the payment total.
- Do not duplicate a whole invoice or line amount across multiple linked accounts. Missing split
  definitions remain blocked. Legacy records are not automatically retrofitted into a new schema.
- Blank first-shipment date or Payment Date on/before first shipment is a customer deposit. A later
  payment is post-shipment settlement. Equal dates mean deposit. Clear to Purchase is not required.
- Cancellation and return categories create their supplied actual entries. There is no automatic
  search/reversal/deletion of the original journal in this implementation.
- Zero posting amounts are no-ops. Invalid/missing required amounts fail. Display rounding and
  historical Airtable status tolerances are not permission to change ledger amounts.

## Source identity, retries and references

The durable source/rule identity uses source system, source table, source record ID and rule code.
Exact retries return existing entries. Changed dates, amounts, accounts, references or category sets
conflict instead of editing posted records. `eventType` is metadata and scopes complete event-category
checks; it is not an extra uniqueness dimension that permits duplicate source/rule journals.

Payment-owned and invoice-owned packets are separate even inside the consolidated Sent script.
Vendor credits/rebates use invoice ownership so a later triggering payment does not repost an
invoice total. A bill and its applied credit can have different invoice references on each leg.

Payment-triggered audit URLs point to the triggering FIN payment. Invoice-created/Create Entry
events have no payment and point to the source invoice. Invoice labels and references are separate
from audit-link ownership. Renaming a source does not rewrite an old posted description.

Airtable no longer constructs or sends notes. The receiver retains optional notes support for a
future defined implementation. Structured singular references populate the current columns; plural
reference arrays and branch can remain payload context without being converted into notes.

## Backend layout

`index.ts` configures the runtime and verified-TLS database connection. `handler.ts` authorizes and
returns safe errors. `ledger.ts` validates and persists generic pairs in a transaction. `errors.ts`
defines safe owned errors. Fixed account references and FIN source-number aliases are resolved
there; names and free-text category titles do not choose account identities.

Do not add a stored accounting router or one Edge Function per category. Database constraints,
posting-period checks and guard triggers remain defense in depth. Authentication/validation is
not removed merely because the caller is an Airtable script with typed inputs.

## Presentation patterns

Use the shared report contract, renderers, formatters and icons. Keep the navy/white/neutral palette,
compact desktop text, aligned numeric columns and consistent radius hierarchy. Charts must respect
signed values: negative composition values render as a signed list rather than misleading slices.
Zero denominators show N/A; shares above 100% remain truthful and are not clipped into a normal gauge.

The full-screen landing uses a background image only for artwork. Brand copy, inputs, errors, button
states and password visibility are live accessible elements. Preserve keyboard focus and reduce
animation for reduced-motion users. Do not bake text or form controls into a screenshot background.
