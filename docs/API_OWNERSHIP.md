# OpmWiki API ownership and port contracts

Status: **CONTRACT FROZEN IN PHASE 1; ASP.NET PHASE 2 IMPLEMENTED**
Final owner for every dynamic route group: **ASP.NET Core**.

`Present` means a matching implementation exists in source; it does not mean production readiness. Phase 2 schema-dependent routes are present but deliberately return `503 SchemaNotReady` on the historical ten-migration schema until the additive Phase 3 EF migration is reviewed and applied.

## Route ownership matrix

| Route group / canonical route | Current Node | Current ASP.NET | Final owner | Cutover status |
| --- | --- | --- | --- | --- |
| `/api/auth/*` | Present, including email verification | Present, including email verification | ASP.NET | Phase 2 contract tests pass; verification remains schema-gated until Phase 3 |
| `/api/characters/*` | Present | Present | ASP.NET | Cutover/parity test required |
| `/api/events/*` | Present | Present | ASP.NET | Cutover/parity test required |
| `/api/release-schedule/*` | Present | Present | ASP.NET | Cutover/parity test required |
| `/api/mastery/*` | Missing | Present | ASP.NET | Route exists; production data/config test required |
| `/api/keepsakes/*` | Public route missing; Admin mutation exists | Present | ASP.NET | Public route already ASP.NET; cutover test required |
| `/api/insignias/*` | Missing | Present | ASP.NET | Route exists; cutover test required |
| `/api/backgears/*` | Missing | Present | ASP.NET | Route exists; cutover test required |
| `/api/tactics/*` | Missing | Present | ASP.NET | Route exists; cutover test required |
| `/api/tier-ranking/*` requested group | Current canonical Node path is plural `/api/tier-rankings/*` | Present at the plural canonical routes | ASP.NET | Phase 2 implementation is complete; Phase 3 schema activation remains required |
| `/api/forum/*` | Present | Present | ASP.NET | Cutover/parity test required |
| `/api/event-comments/*` requested group | Implemented at `/api/events/{eventId}/comments` | Implemented at `/api/events/{eventId}/comments` | ASP.NET | Exact nested route is canonical; cutover/parity test required |
| `/api/admin/*` | Partial | Present for core plus frozen Tier/Community routes | ASP.NET | Admin Tier is schema-gated; Admin Community runs on the historical schema; cutover tests still required |
| `/api/top-up/*` requested group | Current canonical path is plural `/api/top-ups/*` | Current canonical path is plural `/api/top-ups/*` | ASP.NET | Exact plural route is canonical; one-writer cutover required |
| `/api/payments/*` | No direct public route; payment lifecycle is under top-ups/webhook | No direct public route; payment lifecycle is under top-ups/webhook | ASP.NET | `PORT REQUIRED` only if a separate public payment resource is approved; do not invent one |
| `POST /api/webhooks/sepay` | Present | Present | ASP.NET | One ASP.NET receiver only; Node receiver must be disabled before cutover |
| `/api/advisor/*` | `POST /api/advisor/ask` present | `POST /api/advisor/ask` present | ASP.NET | Behavior/capability cutover test required |

The final API does not use aliases `/api/tier-ranking/*`, `/api/event-comments/*`, or `/api/top-up/*` merely because those labels appear in planning text. Consumers use the exact canonical paths above unless a separately approved compatibility alias is implemented and tested.

## Current core Admin surface

Both implementations already cover substantial Admin operations for users, characters, keepsakes, events, releases, dashboard, and top-ups. ASP.NET Phase 2 now implements the six exact frozen Tier/Community routes below. Development mocks remain development-only; production failures are explicit.

## Tier Ranking port contract

### Canonical routes

| Method | Route | Auth | Frozen behavior |
| --- | --- | --- | --- |
| `GET` | `/api/tier-rankings` | Public | Totals for the current Vietnam month |
| `GET` | `/api/tier-rankings/mine` | Authenticated active account | Current account selections and vote policy |
| `PUT` | `/api/tier-rankings/votes/{characterId}` | Authenticated active non-bootstrap account | Confirm an immutable current-month vote |

No singular-route alias is required by this contract.

### Public response

`GET /api/tier-rankings` returns HTTP `200`:

```json
{
  "voteMonth": "YYYY-MM",
  "resetsAt": "ISO-8601 instant",
  "totalVotes": 0,
  "totalVoters": 0,
  "votes": [{ "characterId": "string", "votes": 0 }]
}
```

### Current-user response

`GET /api/tier-rankings/mine` returns HTTP `200`:

```json
{
  "characterIds": ["string"],
  "voteMonth": "YYYY-MM",
  "resetsAt": "ISO-8601 instant",
  "maxVotesPerRarity": 1,
  "hasVerifiedContact": false,
  "emailVerified": false,
  "phoneVerified": false
}
```

### Vote request and response

Request DTO for `PUT /api/tier-rankings/votes/{characterId}`:

```json
{ "active": true }
```

Only `true` creates/confirms a vote. `false` returns `409` because a confirmed vote is immutable for that month. Success returns HTTP `200` with `characterId`, `active`, `voteMonth`, `resetsAt`, `rarity`, `votes`, `totalVotes`, `totalVoters`, `selectedInRarity`, `remainingInRarity`, and the verification-policy fields above.

### Rules

- Eligible rarities are exactly `UR+`, `UR`, `SSR+`, `SSR`, `SR`, and `R`.
- Quota is per account, per rarity, per Vietnam calendar month.
- A verified contact (`EmailVerified` or `PhoneVerified`) allows up to 8 distinct characters in each rarity per month; an unverified account allows 1.
- Month calculation and reset boundary use IANA zone `Asia/Ho_Chi_Minh`. `voteMonth` is `YYYY-MM`; reset is midnight at the start of the next local month.
- One account/character/month vote is unique. Slot allocation must also prevent concurrent requests from exceeding the rarity quota.
- A confirmed vote cannot be removed or changed during the current month. Repeating the same confirmation is idempotent.
- The configured bootstrap Admin subject cannot vote; voting requires a database-backed active account.
- Phase 2 implements the `TierRankingVote` and `TierRankingBaseline` domain models without mapping them into the historical `DbContext`; Phase 3 owns the additive EF mapping and migration.

## Shared Admin conventions

- All six routes require the `Admin` role. Unauthenticated requests return `401`; authenticated non-Admin requests return `403`.
- JSON field names are camelCase. Timestamps are ISO-8601 UTC instants.
- `version` is an opaque concurrency token. Clients must echo it as `expectedVersion` for PUT or as an `If-Match` header for DELETE. They must not parse it.
- Invalid DTO/query values return `400`; missing resources return `404`; stale versions return `409`; missing required `If-Match` returns `428`; unexpected failures use the standard problem response.
- Reads are stable-sorted by creation time descending, then ID descending where ties occur.

## Admin Tier Ranking contracts

### `GET /api/admin/tier-ranking/stats`

Query DTO:

| Field | Type | Rule |
| --- | --- | --- |
| `voteMonth` | optional string | `YYYY-MM`; omitted means current Vietnam month |
| `page` | optional integer | default 1, minimum 1 |
| `pageSize` | optional integer | default 25, range 1–100 |

HTTP `200` response DTO:

```json
{
  "voteMonth": "YYYY-MM",
  "resetsAt": "ISO-8601 instant",
  "page": 1,
  "pageSize": 25,
  "totalItems": 0,
  "totalVotes": 0,
  "totalVoters": 0,
  "characters": [
    {
      "characterId": "string",
      "nameVi": "string",
      "nameEn": "string",
      "rarity": "UR+",
      "tier": "SS",
      "baseVotes": 0,
      "communityVotes": 0,
      "totalScore": 0,
      "version": "opaque-string"
    }
  ]
}
```

### `PUT /api/admin/tier-ranking/{characterId}/base-votes`

Request DTO:

```json
{ "baseVotes": 0, "expectedVersion": "opaque-string" }
```

`baseVotes` is an integer from 0 through 2,147,483,647. Success returns HTTP `200` with the updated character item shape above. The update is a single optimistic-concurrency operation; a stale `expectedVersion` returns `409` and never overwrites the newer value.

## Admin Community Feed contracts

### `GET /api/admin/community/feed`

Query DTO:

| Field | Type | Rule |
| --- | --- | --- |
| `kind` | optional enum | `all`, `topics`, or `comments`; default `all` |
| `page` | optional integer | default 1, minimum 1 |
| `pageSize` | optional integer | default 25, range 1–100 |

HTTP `200` response DTO:

```json
{
  "kind": "all",
  "page": 1,
  "pageSize": 25,
  "totalItems": 0,
  "topics": [
    {
      "id": 1,
      "title": "string",
      "contentSnippet": "string",
      "author": "string",
      "postCount": 0,
      "isLocked": false,
      "createdAt": "ISO-8601 instant",
      "version": "opaque-string"
    }
  ],
  "comments": [
    {
      "id": 1,
      "eventId": "string",
      "content": "string",
      "author": "string",
      "createdAt": "ISO-8601 instant",
      "version": "opaque-string"
    }
  ]
}
```

When `kind` is not `all`, the non-requested collection is empty and `totalItems` counts the requested kind. For `all`, one combined stable-ordered page is partitioned into `topics` and `comments`, and `totalItems` counts both kinds.

### `PUT /api/admin/community/topics/{id}/lock`

Request DTO:

```json
{ "isLocked": true, "expectedVersion": "opaque-string" }
```

Success returns HTTP `200` with the updated topic item. The conditional update is atomic; a stale version returns `409`.

### `DELETE /api/admin/community/topics/{id}`

Request body: none. Required header: `If-Match` containing the latest opaque `version`. Success returns `204`. The topic deletion/soft-deletion and any existing forum-post behavior must execute transactionally and preserve current repository invariants. A stale token returns `409`.

### `DELETE /api/admin/community/comments/{id}`

Request body: none. Required header: `If-Match` containing the latest opaque `version`. Success returns `204`. The deletion/soft-deletion is conditional on the version; a stale token returns `409`.

Phase 2 adds the controllers, application services/contracts, domain models, repositories, schema capability gates, frontend integration, and tests for these contracts. It adds or applies no EF migration. Tier Ranking and email verification therefore return `503 SchemaNotReady` on the historical schema until Phase 3; existing routes and Admin Community continue to run.
