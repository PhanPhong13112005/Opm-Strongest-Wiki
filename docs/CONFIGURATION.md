# OpmWiki configuration matrix

This file lists names and requirements only. Never put real credentials, tokens, connection strings, payment details, or production-like fake secrets in documentation or source control.

Run `npm run validate:config` to print a value-free readiness checklist. The validator reports only `OK`/`MISSING`, variable names, and requirements.

## Final production target

| Capability | Node / Vercel Functions (legacy/transitional) | Direct ASP.NET deployment (authoritative) | Requirement |
| --- | --- | --- | --- |
| PostgreSQL | `DATABASE_URL` or `NEON_DATABASE_URL` | `ConnectionStrings__OpmWiki` | Required for dynamic routes. Final API runtime uses the DML-only application credential. |
| JWT signing | `ADMINAUTH__JWTSIGNINGKEY` or `JWT_SIGNING_KEY` | `ADMINAUTH__JWTSIGNINGKEY` | Required in production/outside Development and server-only. |
| Bootstrap Admin | `ADMINAUTH__USERNAME`, `ADMINAUTH__PASSWORD` | `ADMINAUTH__USERNAME`, `ADMINAUTH__PASSWORD` | Required in production/outside Development. Development defaults must not be deployed. |
| Public Vue URL | `PUBLIC_APP_URL` | `PublicAppUrl` | Required for canonical verification/reset links. `PublicAppUrl` is the exact key read by `Program.cs`. |
| Email delivery | `EMAIL__RESENDAPIKEY`, `EMAIL__FROM` | Same | Required only when email delivery is enabled; missing settings fail the send operation. |
| Bank destination | `BANKTRANSFER__BANKID`, `BANKTRANSFER__ACCOUNTNUMBER`, `BANKTRANSFER__ACCOUNTNAME` | Same | Required only when bank top-up is enabled. |
| SePay webhook | `SEPAY__WEBHOOKSECRET` | Same | Required only when the webhook is enabled; never expose it to the frontend. |
| CORS | Same-origin during legacy Vercel routing | `CORS__ALLOWEDORIGINS__0` and indexed siblings | Required because final Vercel frontend and ASP.NET API use different origins. |
| Frontend API origin | Same-origin `/api` only during transition | Frontend build uses `VITE_API_BASE_URL` | Final value points to the ASP.NET public origin; no per-feature split. |
| Startup schema changes | Not authoritative | `Database__MigrateOnStartup=false` | Production startup migration is disabled; CI/CD release migration job only. |
| Startup seed | Not authoritative | `Database__SeedWhenEmpty=false` | Production startup seed is disabled. |

## Docker Compose wrapper mapping

`backend/docker-compose.yml` is a local Development wrapper. It accepts host-side `PUBLIC_APP_URL` and maps it inside the API container as:

```text
PUBLIC_APP_URL (Compose input) -> PublicAppUrl (ASP.NET configuration key)
```

Direct ASP.NET deployment must set `PublicAppUrl`; it must not rely on the Compose wrapper name.

## Database credentials

- Release migration job: separate `MIGRATOR` credential with reviewed DDL and `__EFMigrationsHistory` write permissions.
- ASP.NET runtime: `APPLICATION` credential with approved `SELECT`/`INSERT`/`UPDATE`/`DELETE` only.
- Inventory/audit: `READ_ONLY_AUDIT` credential with approved `SELECT` and catalog access only.

Phase 1 documents these permission models but does not create roles or values. See [`DEPLOYMENT_RUNBOOK.md`](DEPLOYMENT_RUNBOOK.md).
