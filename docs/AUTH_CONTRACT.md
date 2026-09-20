# OpmWiki authentication contract

Status: **CONTRACT FROZEN IN PHASE 1; ASP.NET PHASE 2 IMPLEMENTED**
Final authentication authority: **ASP.NET Core only**.

Node retains a compatible transitional email-verification implementation for rollback only; it is not a second final issuer. ASP.NET Phase 2 implements the same request/confirm contract behind a safe Phase 3 schema capability gate.

## JWT contract

| Field | Frozen value/behavior |
| --- | --- |
| Issuer (`iss`) | `OpmWiki.Api` |
| Audience (`aud`) | `OpmWiki.Web` |
| Algorithm (`alg`) | `HS256` / HMAC-SHA256 only |
| Lifetime | Configured server-side; ASP.NET validation includes lifetime validation and bounded clock skew |
| Subject (`sub`) | Stable account subject |
| Name identifier | Same value as `sub`; .NET claim URI `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier` |
| Role | `User`, `Staff`, or `Admin`; authoritative .NET type `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`; transition tokens/clients also recognize short `role` |
| Name/display | Username/name claim plus `display_name` metadata |
| Token ID | Unique `jti` per issued access token |

No signing key or example signing value is recorded in this contract.

### Subject behavior

- Database-backed accounts use their immutable account UUID string as both `sub` and name identifier.
- The configured bootstrap Admin uses `admin:<configured-username>` and is not a database account UUID.
- Protected ASP.NET requests for database subjects re-read `IsActive` and `Role`. Missing/inactive accounts or a token with a stale role are rejected. ASP.NET authorization must resolve the role semantics above; it does not trust a frontend role field.
- Authorization is enforced server-side; Vue route guards are only user experience controls.

## Password compatibility

Existing hashes remain compatible across the transition:

```text
v1.<iterations>.<base64-salt>.<base64-hash>
```

- Algorithm: PBKDF2-HMAC-SHA256.
- New-hash iteration count: 120,000.
- Salt: 16 random bytes.
- Derived hash: 32 bytes.
- Verification reads the stored iteration count and compares in constant time.
- Phase 1 does not rehash, reset, read, or modify any user password.

## Account routes

### `POST /api/auth/register`

Request DTO: `username`, `email`, and `password`. Success returns `201` with the standard access-token/account response. Username and normalized Gmail uniqueness, password policy, active state, and existing account invariants remain server-enforced.

### `POST /api/auth/login`

Request DTO: `username` and `password`; `username` may be the accepted account identifier defined by the current implementation. Success returns `200` with:

```json
{
  "accessToken": "opaque-jwt",
  "expiresAt": "ISO-8601 instant",
  "userId": "subject",
  "username": "string",
  "displayName": "string",
  "role": "User",
  "balance": 0
}
```

Invalid credentials use a generic unauthorized response and must not disclose which credential failed.

### `GET /api/auth/me`

Requires a valid Bearer access token. Success returns current account metadata (`userId`, `username`, `displayName`, `role`, `balance`, active/verification metadata supported by the account contract).

`/api/auth/me` refreshes account metadata. It is **NOT an access-token refresh endpoint**, does not extend token lifetime, and does not issue a replacement access token.

### `POST /api/auth/forgot-password`

Request DTO: `email`. The response is intentionally generic whether or not the account exists. Server stores only a one-way token hash with a bounded expiry. Production delivery requires valid server-side email and `PublicAppUrl` configuration.

### `POST /api/auth/reset-password`

Request DTO: `token` and `password`. A valid single-use, unexpired token replaces the password hash and consumes the reset token atomically. Invalid/expired/used tokens return a generic validation response.

## ASP.NET email-verification routes

These exact Node-compatible routes are implemented in ASP.NET Phase 2. On the historical schema they return explicit `503 SchemaNotReady`; they become active only after the additive Phase 3 EF migration:

| Method | Route | Auth | Contract |
| --- | --- | --- | --- |
| `POST` | `/api/auth/email-verification/request` | Active database account | Issue/send one single-use verification link; generic response, rate limited |
| `POST` | `/api/auth/email-verification/confirm` | Token in request DTO | Validate token, mark normalized account email verified atomically, consume token |

Request DTO for confirm:

```json
{ "token": "opaque-one-time-token" }
```

The request route has an empty JSON body; account identity comes from the Bearer token. Local test-only responses may expose a test URL only in a clearly non-production environment. Production responses never expose the raw token or verification URL.

## Status and security conventions

- `200`/`201`: successful operation as described above.
- `400`: invalid DTO, expired/used reset or verification token, or policy validation failure.
- `401`: missing/invalid/expired JWT, inactive account, stale role, or invalid login.
- `403`: valid identity without the required role.
- `409`: uniqueness/concurrency conflict where revealing a conflict is safe.
- `429`: rate limit exceeded for protected auth flows.

Auth cutover remains blocked until the Phase 3 additive schema is reviewed/rehearsed/applied, staging verifies delivery and replay behavior, all frontend auth services point to ASP.NET, and Node issuance/write routes are disabled before ASP.NET becomes the sole writer.
