# OpmWiki Phase 3 Schema Requirements

## Status and scope

This document is a requirements hand-off only. Phase 2 does not create or apply an EF migration, execute DDL, seed data, alter the restored historical database, or deploy production. Until Phase 3 is deliberately approved and completed, every Phase 2 API that depends on the additions below must return the explicit `503 SchemaNotReady` problem response.

The restored PostgreSQL baseline remains authoritative: 20 application tables mapped by the current EF model, plus `__EFMigrationsHistory`, for 21 physical tables in the `public` schema. It contains the exact 10 historical EF migrations listed below. Phase 3 must add one migration after those 10; it must not edit, squash, rename, or replay an old migration.

## Verified historical baseline

The filesystem migration classes, `OpmWikiDbContextModelSnapshot.cs`, `OPMWIKI_RESTORE_TEST.md`, and `OPMWIKI_DATABASE_AUDIT.md` agree on these exact applied IDs, in order:

1. `20260717081811_InitialCreate`
2. `20260717144809_AddMastery`
3. `20260717154944_AddInsignias`
4. `20260718144832_AddBackgears`
5. `20260718150431_AddTactics`
6. `20260718173132_AddCommunityPortals`
7. `20260718175455_AddReleaseSchedule`
8. `20260726210005_AddSePayPaymentLedger`
9. `20260728061622_AddCouponReviewAudit`
10. `20260729180016_AddAccountEmailAndPasswordReset`

The current snapshot maps exactly these 20 application tables: `characters`, `events`, `character_effects`, `character_skills`, `mastery_tiers`, `insignia_guides`, `insignias`, `insignia_guide_links`, `backgear_sets`, `backgears`, `tactic_cards`, `tactic_frames`, `user_accounts`, `event_comments`, `forum_topics`, `top_up_requests`, `forum_posts`, `release_schedule`, `payment_transactions`, and `balance_ledger`. EF maintains `__EFMigrationsHistory` separately as physical table 21.

The historical snapshot/migrations contain none of the four verification columns below and contain neither `tier_ranking_votes` nor `tier_ranking_baselines`. The completed restore validation independently confirmed the same absence through read-only PostgreSQL catalog checks. Docker was unavailable during Phase 2.5, so this validation did not start the restored cluster or repeat that catalog query.

## Required additive `user_accounts` columns

The existing `UserAccount` mapping must remain compatible with the historical schema until the Phase 3 migration is present. Phase 3 must add and then map these columns:

| Column | PostgreSQL requirement | Nullability/default | Purpose |
| --- | --- | --- | --- |
| `EmailVerified` | `boolean` | `NOT NULL DEFAULT false` | Contact-verification policy |
| `PhoneVerified` | `boolean` | `NOT NULL DEFAULT false` | Contact-verification policy; no phone flow is implemented in Phase 2 |
| `EmailVerificationTokenHash` | `varchar(64)` | nullable | Lowercase SHA-256 token hash only; never store the raw token |
| `EmailVerificationExpiresAt` | `timestamptz` | nullable | UTC expiry instant |

Required constraints and index:

- Token hash and expiry are either both null or both non-null.
- A non-null token hash is exactly 64 lowercase hexadecimal characters.
- A partial unique index covers non-null `EmailVerificationTokenHash` values.
- Existing accounts backfill safely to `EmailVerified = false` and `PhoneVerified = false`; no account is silently marked verified.

No password hash, reset token, role, balance, or historical account identifier is rewritten as part of this additive change.

## Required `tier_ranking_votes` table

| Column | PostgreSQL requirement | Notes |
| --- | --- | --- |
| `UserId` | `uuid NOT NULL` | FK to `user_accounts(Id)`, delete behavior `RESTRICT` |
| `CharacterId` | `varchar(80) NOT NULL` | FK to `characters(Id)`, delete behavior `RESTRICT` |
| `VoteMonth` | `char(7) NOT NULL` | Vietnam calendar month formatted `YYYY-MM` |
| `Rarity` | `varchar(4) NOT NULL` | One of `UR+`, `UR`, `SSR+`, `SSR`, `SR`, `R` |
| `VoteSlot` | `integer NOT NULL` | Matches the Phase 2 C# `int` model/test schema; allocated slot from 1 through 8 |
| `CreatedAt` | `timestamptz NOT NULL` | UTC creation instant |

Required keys, constraints, and indexes:

- Primary key `PK_tier_ranking_votes`: (`UserId`, `CharacterId`, `VoteMonth`). This makes a repeated confirmation idempotent and prevents changing/removing a vote in the same month.
- Unique enforcement `IX_tier_ranking_votes_UserId_VoteMonth_Rarity_VoteSlot`: (`UserId`, `VoteMonth`, `Rarity`, `VoteSlot`). Implement it as an EF unique index, matching the historical model's unique-index convention. This is the database backstop that prevents concurrent requests exceeding the per-rarity quota.
- Check `CK_tier_ranking_votes_VoteMonth` against `^[0-9]{4}-(0[1-9]|1[0-2])$`.
- Check `CK_tier_ranking_votes_Rarity` against the exact frozen set.
- Check `CK_tier_ranking_votes_VoteSlot` for `VoteSlot BETWEEN 1 AND 8`.
- FK `FK_tier_ranking_votes_user_accounts_UserId` with `RESTRICT`.
- FK `FK_tier_ranking_votes_characters_CharacterId` with `RESTRICT`.
- Index `IX_tier_ranking_votes_CharacterId` for the character FK.
- Index `IX_tier_ranking_votes_VoteMonth_CharacterId` for public/admin aggregation.
- Index `IX_tier_ranking_votes_VoteMonth_UserId` for the authenticated user's monthly selection.

The application continues to compute month boundaries in IANA zone `Asia/Ho_Chi_Minh`; PostgreSQL stores UTC instants. The schema must not introduce a server-local-time dependency.

## Required `tier_ranking_baselines` table

| Column | PostgreSQL requirement | Notes |
| --- | --- | --- |
| `CharacterId` | `varchar(80) NOT NULL` | PK and FK to `characters(Id)`, delete behavior `RESTRICT` |
| `BaseVotes` | `integer NOT NULL DEFAULT 0` | Check from 0 through `2147483647` |
| `IsCore` | `boolean NOT NULL DEFAULT false` | Admin ranking configuration |
| `BaseOrder` | `integer NOT NULL DEFAULT 0` | Check `>= 0` |
| `Version` | `bigint NOT NULL DEFAULT 1` | Opaque optimistic-concurrency value; check `>= 1` |
| `UpdatedAt` | `timestamptz NOT NULL` | UTC update instant |
| `UpdatedBySubject` | `varchar(200) NOT NULL` | Auditable authenticated Admin subject |

Required physical objects are PK `PK_tier_ranking_baselines`, FK `FK_tier_ranking_baselines_characters_CharacterId` with `RESTRICT`, checks `CK_tier_ranking_baselines_BaseVotes`, `CK_tier_ranking_baselines_BaseOrder`, and `CK_tier_ranking_baselines_Version`, plus index `IX_tier_ranking_baselines_IsCore_BaseOrder_CharacterId`. Base-vote updates must atomically compare the expected `Version`, update the row, increment `Version`, and record updater/time. API clients continue to treat the encoded `version` as opaque.

## Physical naming conventions

The historical EF migrations establish these conventions:

- Schema: implicit/default `public`; Phase 2 capability checks explicitly inspect `public`.
- Tables: lower snake_case, such as `user_accounts` and `payment_transactions`.
- Columns: quoted PascalCase property names, such as `"UserId"`, `"CreatedAt"`, and `"NormalizedEmail"`.
- Primary keys: `PK_<table>`.
- Foreign keys: `FK_<dependent_table>_<principal_table>_<Column>`.
- Indexes, including unique indexes: `IX_<table>_<Column[_Column...]>`.

There is no historical check-constraint naming precedent. Phase 3 must therefore use the explicit deterministic `CK_<table>_<Rule>` names specified in this document rather than provider-generated or ad hoc names.

For `user_accounts`, use checks `CK_user_accounts_EmailVerificationTokenPair` and `CK_user_accounts_EmailVerificationTokenHash`, and partial unique index `IX_user_accounts_EmailVerificationTokenHash` with filter `"EmailVerificationTokenHash" IS NOT NULL`.

## Migration order

**CURRENT LAST MIGRATION:** `20260729180016_AddAccountEmailAndPasswordReset`

**PLANNED NEXT MIGRATION NAME ONLY:** `AddTierRankingAndEmailVerification`

No timestamp/ID is assigned and no migration is generated in Phase 2.5. When separately authorized in Phase 3, its generated ID must sort after the current last migration.

## EF Core mapping requirements

- Add mappings and `DbSet`s only in the new Phase 3 change, after the physical schema plan is approved.
- Use the exact physical naming conventions and explicit object names above; do not apply a global snake_case column convention because historical columns are quoted PascalCase.
- Keep delete behaviors restrictive and explicit.
- Preserve all existing `user_accounts` columns and queries; the migration is additive.
- Generate one reviewable migration and review both `Up` and `Down` before any application. Do not generate or apply it during Phase 2.
- Application startup must continue to honor `Database:MigrateOnStartup=false` and `Database:SeedWhenEmpty=false`; production must not perform runtime DDL or seeding.

## Transitional Node baseline inventory

Phase 3 must inventory the legacy Node Tier baseline source before deciding whether any data is imported. If legacy baseline values are needed, produce a reviewed, immutable manifest containing character identifier, base votes, core flag, base order, source revision, row count, and checksum.

Any approved one-time import is an operator-run, separately reviewed release action after schema migration. It is not a runtime seed, is not inferred from development mocks, does not create users or votes, and must be idempotent with an auditable before/after report. Phase 2 does not perform this inventory or import.

## Migration rehearsal and validation gates

Before production approval, Phase 3 must rehearse on an isolated copy/target that cannot affect the restored historical volume:

1. Record server/database identity, schema/table counts, all 10 migration IDs, selected row counts, and a source backup/checksum.
2. Apply the reviewed additive migration using a least-privileged migration role, never the runtime role.
3. Verify all new columns, tables, foreign keys, unique/check constraints, indexes, defaults, and EF history entry.
4. Verify all 20 historical application tables retain their exact pre-migration row counts and representative read contracts; verify `__EFMigrationsHistory` changes only from 10 to 11 entries by adding the reviewed Phase 3 ID.
5. Run the complete ASP.NET unit/integration suite, Node contract suite, Vite production build, and targeted Playwright suite.
6. Exercise email token hashing/expiry/replay, vote idempotency/quota/month rollover, and concurrent vote/base-update conflicts against real PostgreSQL.
7. Verify the runtime role can perform required DML but cannot create/alter/drop schema objects.
8. Record elapsed migration time, locks, deployment ordering, monitoring checks, and a tested rollback/forward-fix decision.

Production application and migration credentials must remain separate. Secrets must come from the approved secret store and must never enter source control, logs, reports, test fixtures, or command output.

## Rollback and release ordering requirements

The preferred release is expand-first: take a verified backup, apply the additive schema with the migration role, validate capabilities, then deploy the already schema-gated backend and frontend. If validation fails before application traffic is enabled, stop and restore/forward-fix according to the reviewed runbook; do not improvise destructive rollback against production.

Because Phase 2 remains compatible with the 10-migration database and returns `SchemaNotReady`, the safe pre-Phase-3 fallback is to keep the schema unchanged. Phase 3 approval requires named owners for backup/restore, migration execution, validation, rollback decision, and incident communication.

## Phase 3 acceptance checklist

- [ ] New migration reviewed; no historical migration edited.
- [ ] No runtime DDL, `EnsureCreated`, automatic migration, or runtime seed.
- [ ] Historical backup/checksum and row-count baseline recorded for 20 application tables plus the EF history table (21 physical tables total).
- [ ] Four additive account columns and their constraints/index verified.
- [ ] `tier_ranking_votes` keys, quota constraint, checks, FKs, and indexes verified.
- [ ] `tier_ranking_baselines` concurrency/audit fields, checks, FK, and index verified.
- [ ] Optional legacy baseline manifest/import independently approved and audited.
- [ ] Least-privilege migration/runtime roles verified.
- [ ] Real-PostgreSQL concurrency and verification security tests pass.
- [ ] Full build, unit, contract, integration, and browser evidence passes.
- [ ] Deployment, monitoring, and rollback/forward-fix runbooks approved.

Phase 3 has not started. This file defines its schema and operational prerequisites only.
