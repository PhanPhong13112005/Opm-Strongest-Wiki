# OpmWiki payment and ledger ownership

Status: **FROZEN FOR PHASE 1**
Final payment writer count: **ONE**
Final payment writer: **ASP.NET Core**

Node/Vercel payment routes and webhook are legacy/transitional only. They may remain in the repository for rollback preparation, but they must be disabled as writers before the ASP.NET payment path is enabled. Permanent dual writing is forbidden.

## Owned records

ASP.NET is the sole future writer for the logical records and their PostgreSQL tables:

| Logical EF/domain record | Current PostgreSQL table | Ownership rule |
| --- | --- | --- |
| `TopUpRequests` / `TopUpRequest` | `top_up_requests` | ASP.NET request/review/payment lifecycle only |
| `PaymentTransactions` / `PaymentTransaction` | `payment_transactions` | ASP.NET provider reconciliation only |
| `BalanceLedgerEntries` / `BalanceLedgerEntry` | `balance_ledger` | ASP.NET append/credit logic only |

EF Core is the schema owner. The production ASP.NET application uses an application credential with DML only; schema changes use the separate release migration job.

## Public payment surface

- Top-up lifecycle remains under canonical `/api/top-ups/*` and `/api/admin/top-ups/*` routes.
- Final provider callback: exactly one `POST /api/webhooks/sepay`, implemented and hosted by ASP.NET.
- A separate `/api/payments/*` public resource is not currently implemented. Phase 1 does not invent one.
- The frontend must not call a Node payment endpoint after cutover and must never select a writer by feature.

## Webhook guarantees

The final ASP.NET SePay handler must satisfy all of these as one contract:

1. Read the exact raw request representation required by the provider signature scheme.
2. Validate HMAC before interpreting the event as trusted.
3. Validate the provider timestamp against the approved bounded replay window.
4. Reject missing/invalid configuration and malformed or unsigned requests without changing data.
5. Normalize the provider name and external transaction identifier.
6. Enforce uniqueness for the provider plus external transaction identifier and any existing top-up/payment uniqueness invariant.
7. Treat a replay of an already applied valid event idempotently: no second balance credit and no duplicate ledger entry.
8. Lock/conditionally update the eligible top-up state so concurrent callbacks cannot both win.
9. Insert/update the payment record, update the user balance, and insert the balance-ledger entry in the same PostgreSQL transaction.
10. Roll back every related write if any part of that transaction fails.
11. Never log HMAC secrets, account credentials, full sensitive provider payloads, or user auth tokens.

## One-writer cutover

The required order is:

1. Confirm payment sandbox tests and an isolated webhook replay test against ASP.NET.
2. Confirm backup/PITR and the reviewed EF migration state.
3. Remove/disable the provider callback targeting Node.
4. Deny Node top-up/payment/ledger write routes at routing or deployment level.
5. Verify there is no in-flight callback/write overlap.
6. Configure exactly one provider callback to ASP.NET `POST /api/webhooks/sepay`.
7. Enable ASP.NET payment writes and monitor idempotency/ledger invariants.

There is no permitted period in which Node and ASP.NET both write payment or ledger data.

## Failure and rollback policy

- An unavailable/misconfigured payment service returns an explicit unavailable/error response; the frontend does not synthesize success or a mock transaction.
- Retrying a valid request/event must use its original idempotency identity.
- Rollback must not re-enable Node payment writes after ASP.NET has accepted real writes unless a rehearsed compatibility plan proves the schema and idempotency state safe.
- No seed, manual balance edit, direct ledger rewrite, or historical-data rewrite is an acceptable rollback mechanism.

## Phase 1 boundary

Phase 1 does not call a payment API or webhook, create a provider transaction, change a balance, alter any payment table, create an EF migration, or configure a real provider secret.
