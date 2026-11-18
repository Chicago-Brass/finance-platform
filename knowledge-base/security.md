# Security boundaries

The app serves approved Chicago Brass users. All approved users can read the ledger; database
RLS checks active membership. Administrators can enable rules. The separate `can_manage_periods`
permission controls closing, reopening and approving period exceptions. Signout remains available
when membership is removed. Browser clients use public keys and user sessions, never server keys.

Production and develop use the native seven-day Auth session limit described in
[environments](environments.md). Passwords, shared webhook credentials and Airtable tokens belong
in provider secret storage or gitignored local configuration. Removing a credential from source
does not invalidate it; exposed credentials require separate rotation.

Posting and reversal webhooks authenticate with the existing shared secret before parsing input.
The Period Management endpoint validates the user's bearer token and current permission. Reads
use caller permissions; privileged workers use parameterized SQL and source/period locks.

A valid reversal records source-level cancellation under the same lock as posting. It withdraws
pending posting requests for that source and blocks any new posting, including a packet prepared
before cancellation. Existing exact replays may repair links without creating journals. Reversal
retries and approved reversal exceptions remain available. Restoring a cancelled source is not
implemented. See [reversals](../docs/ledger-reversal.md).

Cancellation metadata lives in `ledger_private.ledger_source_cancellations`, with RLS and no
browser grants. The service role can select and insert markers, not update or delete them. A
deliberate test-data reset must account for this metadata; ordinary journal cleanup must not
silently make a cancelled source eligible again.

Security verification uses signed/anonymous reads, mocked transport and disposable PostgreSQL.
Do not create real postings, revoke users or reset passwords as routine release checks. Validate
the concrete failure case before changing behavior, and verify production and develop separately.
