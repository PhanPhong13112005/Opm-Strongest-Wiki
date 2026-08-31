# OpmWiki production deployment runbook

Status: **PHASE 1 CONTRACT ONLY — DO NOT DEPLOY**
Architecture: [`PRODUCTION_ARCHITECTURE.md`](PRODUCTION_ARCHITECTURE.md)

This runbook freezes prerequisites and hand-off gates. It does not authorize a deployment, database migration, seed, role change, webhook call, or production write.

## Deployment target

- Frontend: Vue/Vite on Vercel.
- Backend: ASP.NET Core on the selected container/application host.
- Database: PostgreSQL.
- Frontend API routing: `VITE_API_BASE_URL` points to the ASP.NET public origin.
- Node/Vercel Functions: legacy/transitional rollback surface only until cutover; never a permanent feature split.

## Required production configuration

Only variable names are recorded here. Values belong in the deployment platform's secret/config store.

| Component | Required names | Rule |
| --- | --- | --- |
| Vue/Vite | `VITE_API_BASE_URL` | Exact HTTPS ASP.NET origin, embedded at frontend build time |
| ASP.NET runtime | `ASPNETCORE_ENVIRONMENT`, platform listener setting, `ConnectionStrings__OpmWiki` | Runtime uses the `APPLICATION` DB credential |
| Startup safety | `Database__MigrateOnStartup=false`, `Database__SeedWhenEmpty=false` | Both remain disabled in production |
| Auth | `ADMINAUTH__USERNAME`, `ADMINAUTH__PASSWORD`, `ADMINAUTH__JWTSIGNINGKEY` | Platform secrets; signing material is never documented or exposed to the client |
| Account links | `PublicAppUrl` | Exact direct ASP.NET runtime key for the Vue origin |
| CORS | `CORS__ALLOWEDORIGINS__0` plus indexed siblings | Exact frontend origins only |
| Email, when enabled | `EMAIL__RESENDAPIKEY`, `EMAIL__FROM` | Must pass provider-domain and delivery verification |
| Bank top-up, when enabled | `BANKTRANSFER__BANKID`, `BANKTRANSFER__ACCOUNTNUMBER`, `BANKTRANSFER__ACCOUNTNAME` | Server-only destination configuration |
| SePay, when enabled | `SEPAY__WEBHOOKSECRET` | Server-only; final callback terminates at ASP.NET |

Direct deployment supplies `PublicAppUrl`. Local Docker Compose accepts a host-side wrapper named `PUBLIC_APP_URL` and maps it into the container as `PublicAppUrl`; the wrapper is not the direct ASP.NET key.

Run the value-free checklist before any staging/release review:

```powershell
npm run validate:config -- --target=dotnet
```

The checklist prints only `OK`/`MISSING`, variable names, and requirements.

## Database release model

Production API startup never migrates or seeds. The release workflow is:

1. Inventory the exact target database and applied EF migration IDs with read-only access.
2. Confirm recoverable backup and point-in-time recovery for the target.
3. Review the generated EF migration and its SQL; explicitly assess locks, runtime, data transforms, reversibility, and historical-row preservation.
4. Rehearse the migration and rollback/forward-fix plan against an isolated staging clone.
5. Stop or disable every Node write path for the affected domains before ASP.NET writes are enabled.
6. Run the reviewed EF migration once from a dedicated CI/CD release migration job using the `MIGRATOR` credential.
7. Verify migration history and schema inventory read-only.
8. Roll out ASP.NET using the `APPLICATION` credential, which has no DDL or migration-history write permission.
9. Point the Vercel build at the ASP.NET origin and run staging smoke/contract checks.

Phase 1 performs none of these operational steps.

## Database roles

- `MIGRATOR`: reviewed schema DDL and `__EFMigrationsHistory` writes for the release job only.
- `APPLICATION`: application `SELECT`/`INSERT`/`UPDATE`/`DELETE`; no `CREATE`/`ALTER`/`DROP` and no migration-history modification.
- `READ_ONLY_AUDIT`: approved `SELECT` and catalog inventory only.

Provisioning or changing real roles is outside Phase 1.

## Phase 2 gate

Phase 2 may be declared complete only when:

- Tier Ranking public/mine/vote contracts are implemented in ASP.NET with EF-owned `TierRankingVote` and `TierRankingBaseline` models.
- Existing live Tier votes, if any, have a reviewed preservation/import plan; no blind seed is used.
- ASP.NET email-verification request/confirm routes match the frozen auth contract.
- Admin Tier Ranking and Admin Community Feed endpoints match the frozen DTO/status/concurrency contract.
- Unit and contract tests cover quota, month boundary, immutability, verification, authorization, concurrency, and explicit unavailable behavior.
- No Node or ASP.NET production writer has been enabled by the implementation work.

## Phase 3 gate

Phase 3 may be declared complete only when:

- A single reviewed additive EF migration covers all approved Phase 2 schema changes.
- Migration SQL, locks, indexes, uniqueness, data preservation, and rollback/forward-fix behavior are reviewed.
- Node runtime DDL is excluded from the target production request path.
- The ASP.NET application role is proven unable to run DDL or modify `__EFMigrationsHistory`.
- Auth, payment, ledger, Tier, and Admin route contract tests pass against the ASP.NET implementation.
- Cutover routing and one-writer sequencing are documented with named owners and timestamps.

## Staging gate

Staging is eligible for cutover rehearsal only when:

- The environment is an isolated production-like database, not the historical database or backup artifact.
- Backup/restore and point-in-time recovery have been exercised.
- The release migration job succeeds with `MIGRATOR`; the API succeeds with `APPLICATION` and cannot migrate.
- `VITE_API_BASE_URL`, `PublicAppUrl`, CORS, HTTPS/forwarded headers, email delivery, and provider callbacks are validated.
- Tier, email verification, Admin Tier, Admin Community, auth, community, top-up, payment sandbox, and webhook tests pass.
- Production builds expose explicit unavailable UI for unavailable dynamic features; no dev mock appears.
- Node and ASP.NET dual-writer prevention and rollback are rehearsed.

## Production cutover gate

Every item is mandatory:

- [ ] Tier Ranking ASP.NET implementation complete.
- [ ] Email verification ASP.NET implementation complete.
- [ ] Admin Tier Ranking implementation complete.
- [ ] Admin Community Feed implementation complete.
- [ ] EF migration reviewed, rehearsed, and approved.
- [ ] Real target database inventoried immediately before release.
- [ ] Backup and point-in-time recovery confirmed.
- [ ] `MIGRATOR` and `APPLICATION` credentials/permissions separated and verified.
- [ ] Production configuration passes value-free validation.
- [ ] Exact production CORS origins verified.
- [ ] Production email sender and request/confirm flow verified.
- [ ] Payment flow verified in the provider sandbox without real funds.
- [ ] The single ASP.NET SePay webhook tested for HMAC, timestamp, replay, idempotency, and atomic ledger behavior.
- [ ] Rollback/forward-fix procedure rehearsed with decision owners identified.
- [ ] No dual Node/ASP.NET writer exists for auth, Tier, community mutation, top-up, payment, or ledger.

Until all boxes pass, the only correct verdict is **NOT READY TO DEPLOY**.

## Cutover and rollback invariants

- Disable/deny Node writes before enabling ASP.NET writes. There is no overlap window for writable ownership.
- Route health reads may overlap during validation, but user/auth/payment mutations may not.
- Exactly one provider callback targets ASP.NET `POST /api/webhooks/sepay`; the Node webhook must not remain active as a second receiver.
- Rollback means routing back only to a pre-declared compatible version. It must not re-enable a retired Node writer after EF schema/data changes unless the compatibility rehearsal explicitly proved that path safe.
- Never repair a failed cutover by seeding the production or historical database.

## Verification commands for an approved future release

The following repository checks are safe before deployment; they do not execute a database migration:

```powershell
npm test
npm run build
dotnet build backend/OpmWiki.sln -c Release
dotnet test backend/tests/OpmWiki.Tests/OpmWiki.Tests.csproj -c Release
```

Provider smoke tests and any migration command require a separate approved release operation and are intentionally absent from Phase 1.
