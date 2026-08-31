# OpmWiki backend parity

Audit baseline: 2026-08-28; architecture decision frozen in Phase 1 and implementation status updated through Phase 2 on 2026-08-29. This comparison does not migrate a database or claim that schema-gated routes are production-ready.

## Architecture decision

**DECISION RESOLVED: ASP.NET Core is the authoritative production backend. EF Core is the sole schema/migration owner. ASP.NET is the sole final auth, payment, and ledger owner.**

Node/Vercel Functions remain **LEGACY / TRANSITIONAL / ROLLBACK ONLY** until cutover. A permanent split backend is rejected. Detailed final ownership is frozen in [`API_OWNERSHIP.md`](API_OWNERSHIP.md).

## Feature matrix

| Feature | Node / Vercel Functions | ASP.NET Core | Cutover observation |
| --- | --- | --- | --- |
| Public characters/events | Read plus Admin CRUD | Read plus Admin CRUD | ASP.NET parity/cutover tests required. |
| Authentication | Register/login/me, password reset, email verification request/confirm, Admin bootstrap login | Register/login/me, password reset, email verification request/confirm, Admin bootstrap login | ASP.NET Phase 2 port complete; Phase 3 schema activation and one final issuer still required. |
| Admin core | Users, dashboard, characters, keepsakes, events, releases, top-ups | Same core areas | Core parity tests required. |
| Admin Tier/Community workspaces | Missing; frontend dev mocks only | Implemented at the six frozen routes | Admin Tier is schema-gated; Admin Community uses existing tables; production has no silent mock fallback. |
| Community | Event comments, forum, moderation, advisor | Same groups | ASP.NET behavior/cutover tests required. |
| Payment | Coupon orders, bank QR, SePay HMAC webhook, ledger | Same groups | Final owner is ASP.NET; exactly one webhook/writer. |
| Mastery | Missing | `GET /api/mastery`; `mastery_tiers` | ASP.NET-only final route. |
| Keepsake | Public route missing; Admin mutation exists | Public and Admin routes | ASP.NET-only public final route. |
| Insignia | Missing | `GET /api/insignias/*`; three tables | ASP.NET-only final route. |
| Backgear | Missing | `GET /api/backgears`; two tables | ASP.NET-only final route. |
| Tactics | Missing | `GET /api/tactics`; two tables | ASP.NET-only final route. |
| Release schedule | Public read and Admin CRUD | Public read and Admin CRUD | ASP.NET parity/cutover tests required. |
| Tier Ranking | `/api/tier-rankings`, `/mine`, immutable monthly vote write; `tier_ranking_votes` | Same canonical routes, application service, transaction-safe PostgreSQL repository, schema gate | Phase 2 port/tests complete; no migration; historical schema returns `503 SchemaNotReady`. |

## Current schema comparison

- ASP.NET EF Core owns 20 application tables plus `__EFMigrationsHistory` in the audited snapshot; ten tracked EF migrations produced the restored snapshot.
- Node defines 13 application tables through idempotent/runtime SQL. That DDL is legacy and cannot be part of the final production request path.
- Twelve application tables overlap: `characters`, `character_skills`, `character_effects`, `events`, `release_schedule`, `user_accounts`, `event_comments`, `forum_topics`, `forum_posts`, `top_up_requests`, `payment_transactions`, and `balance_ledger`.
- ASP.NET-only tables are `mastery_tiers`, `insignias`, `insignia_guides`, `insignia_guide_links`, `backgears`, `backgear_sets`, `tactic_cards`, and `tactic_frames`.
- The historical ten-migration snapshot has no Tier tables or contact-verification columns. Phase 2 models/repositories are intentionally not mapped into the historical EF model. Phase 3 must inventory any separate real Node Tier data before an additive EF migration; it must not seed over that data.

## Migration strategy

- EF Core is the only final migration authority.
- Production ASP.NET startup uses `Database__MigrateOnStartup=false` and `Database__SeedWhenEmpty=false`.
- Reviewed EF migrations run once through a separate CI/CD release migration job with a `MIGRATOR` credential.
- The API runtime uses an `APPLICATION` credential without DDL or `__EFMigrationsHistory` write permission.
- Node runtime DDL and Node migration endpoints must be removed from the final request path before cutover; Phase 1 does not delete them.

## Remaining parity gates

The architecture choice and Phase 2 API ports are complete; remaining work is now a cutover gate rather than an open backend alternative:

1. Create/review/rehearse the additive EF migration in Phase 3; do not use runtime DDL.
2. Inventory/preserve any real transitional Node Tier/contact data before migration or import.
3. Verify all frontend dynamic services against one ASP.NET origin in staging.
4. Disable Node writers before enabling ASP.NET writers, with one ASP.NET SePay webhook.

Until those gates and the deployment runbook pass, production remains **NOT READY TO DEPLOY**.
