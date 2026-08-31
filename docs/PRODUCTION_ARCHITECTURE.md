# OpmWiki production architecture

Status: **FROZEN FOR PHASE 1**
Decision record: [`../OPMWIKI_PRODUCTION_ARCHITECTURE.md`](../OPMWIKI_PRODUCTION_ARCHITECTURE.md)

This document is the concise operational contract derived from the decision record. If older project history conflicts with it, the decision record and this contract win. Production remains **NOT READY TO DEPLOY** until every production cutover gate in [`DEPLOYMENT_RUNBOOK.md`](DEPLOYMENT_RUNBOOK.md) passes.

## Architecture authority

| Concern | Frozen authority |
| --- | --- |
| Frontend host/runtime | Vercel-hosted Vue 3/Vite SPA |
| Authoritative backend | ASP.NET Core |
| Database | PostgreSQL |
| Schema and migration owner | EF Core only |
| Production migration execution | Separate CI/CD release migration job using the migrator role |
| Authentication owner | ASP.NET Core only |
| Payment and ledger owner | ASP.NET Core only |
| Node/Vercel Functions | **LEGACY / TRANSITIONAL / ROLLBACK ONLY** until cutover is complete |
| Permanent per-feature backend split | Rejected |

“Authoritative” means the only implementation allowed to define the final production contract and to write the corresponding production data after cutover. Coexistence in the repository does not imply shared authority.

## Target topology

```text
Browser
  -> Vercel Vue/Vite SPA
  -> VITE_API_BASE_URL
  -> ASP.NET Core API
  -> PostgreSQL
```

- All dynamic frontend services use one ASP.NET origin.
- The same-origin Vercel `/api` rewrite to Node is transitional only. It is not the final production path.
- Public JSON may remain a clearly identified content fallback where already designed. Account, community, Tier Ranking, Admin, payment, and ledger operations must never silently fall back to writable mock/local data in production.
- Node and ASP.NET must never be simultaneous writers for the same production domain.

## Ownership invariants

1. EF Core is the sole versioned schema authority. Node runtime DDL cannot be part of the final production path.
2. The ASP.NET application process starts with `Database__MigrateOnStartup=false` and `Database__SeedWhenEmpty=false` in production.
3. A release migration job runs reviewed EF migrations once, before application rollout, with a separate credential.
4. ASP.NET is the single JWT issuer and the single account/password authority after cutover.
5. ASP.NET is the single writer for `TopUpRequests`, `PaymentTransactions`, and `BalanceLedgerEntries` after cutover.
6. Exactly one public SePay webhook remains after cutover: `POST /api/webhooks/sepay` on ASP.NET.
7. Missing ASP.NET routes are labeled `PORT REQUIRED`; documentation does not imply an implementation exists.
8. Phase 1 creates no database role, migration, schema object, account, payment, or production secret.

## Database role model

These are permission contracts, not roles created by Phase 1.

| Role model | Allowed | Forbidden |
| --- | --- | --- |
| `MIGRATOR` | Connect; read required catalogs; `CREATE`/`ALTER` and other reviewed schema-migration permissions; write `__EFMigrationsHistory` | Application request handling; normal long-lived API traffic |
| `APPLICATION` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` on approved application objects and required sequence usage | `CREATE`, `ALTER`, `DROP`, ownership changes, extension management, or writes to `__EFMigrationsHistory` |
| `READ_ONLY_AUDIT` | `SELECT` on approved data and PostgreSQL catalogs needed for inventory | DML, DDL, migration-history writes, role/permission changes |

Production credentials for these roles must be separate. The API receives only the `APPLICATION` credential; the release job receives only the short-lived/scoped `MIGRATOR` credential; audits use `READ_ONLY_AUDIT`.

## Configuration contract

| Context | Exact key | Meaning |
| --- | --- | --- |
| Frontend build | `VITE_API_BASE_URL` | ASP.NET public origin; required for final production routing |
| Direct ASP.NET deployment | `PublicAppUrl` | Public Vue origin used for canonical account links |
| Docker Compose host wrapper | `PUBLIC_APP_URL` | Compose input mapped inside the API container as `PublicAppUrl` |
| ASP.NET database | `ConnectionStrings__OpmWiki` | Application PostgreSQL connection supplied at runtime |
| ASP.NET CORS | `CORS__ALLOWEDORIGINS__0` and indexed siblings | Exact allowed Vue origins |
| Production startup migration | `Database__MigrateOnStartup=false` | Must remain disabled |
| Production startup seed | `Database__SeedWhenEmpty=false` | Must remain disabled |

ASP.NET configuration is case-insensitive on common providers, but documentation and validation intentionally use the exact source-level key `PublicAppUrl`. No configuration value belongs in this document.

## Production mock policy

- Production frontend **MUST NOT silently use development mock data**.
- If an ASP.NET feature is unavailable or still `PORT REQUIRED`, production shows an explicit unavailable/error state and performs no synthetic success or write.
- Development mocks may remain only behind an explicit development-only guard and must be visibly identifiable as mock/dev data.
- A failed production request is rethrown/handled as unavailable; it must never activate a development mock fallback.
- This policy does not remove public bundled JSON content fallbacks already designed for read-only wiki pages, but those fallbacks cannot represent account, community, Tier, Admin, payment, or ledger mutations.

## Contract index

- Route ownership, Tier Ranking, and Admin DTOs: [`API_OWNERSHIP.md`](API_OWNERSHIP.md)
- JWT/password/account contract: [`AUTH_CONTRACT.md`](AUTH_CONTRACT.md)
- Payment and webhook single-writer contract: [`PAYMENT_OWNERSHIP.md`](PAYMENT_OWNERSHIP.md)
- Configuration and release procedure: [`DEPLOYMENT_RUNBOOK.md`](DEPLOYMENT_RUNBOOK.md)
- Current implementation gaps: [`BACKEND_PARITY.md`](BACKEND_PARITY.md)

## Change control

Any change to the authoritative backend, migration owner, auth owner, payment owner, final API origin, or single-writer rule requires a new explicit architecture decision. A README, deployment example, or legacy Node route cannot override this contract.
