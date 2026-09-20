START TRANSACTION;
ALTER TABLE user_accounts ADD "EmailVerificationExpiresAt" timestamp with time zone;

ALTER TABLE user_accounts ADD "EmailVerificationTokenHash" character varying(64);

ALTER TABLE user_accounts ADD "EmailVerified" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE user_accounts ADD "PhoneVerified" boolean NOT NULL DEFAULT FALSE;

CREATE TABLE tier_ranking_baselines (
    "CharacterId" character varying(80) NOT NULL,
    "BaseVotes" integer NOT NULL DEFAULT 0,
    "IsCore" boolean NOT NULL DEFAULT FALSE,
    "BaseOrder" integer NOT NULL DEFAULT 0,
    "Version" bigint NOT NULL DEFAULT 1,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "UpdatedBySubject" character varying(200) NOT NULL,
    CONSTRAINT "PK_tier_ranking_baselines" PRIMARY KEY ("CharacterId"),
    CONSTRAINT "CK_tier_ranking_baselines_BaseOrder" CHECK ("BaseOrder" >= 0),
    CONSTRAINT "CK_tier_ranking_baselines_BaseVotes" CHECK ("BaseVotes" >= 0),
    CONSTRAINT "CK_tier_ranking_baselines_Version" CHECK ("Version" >= 1),
    CONSTRAINT "FK_tier_ranking_baselines_characters_CharacterId" FOREIGN KEY ("CharacterId") REFERENCES characters ("Id") ON DELETE RESTRICT
);

CREATE TABLE tier_ranking_votes (
    "UserId" uuid NOT NULL,
    "CharacterId" character varying(80) NOT NULL,
    "VoteMonth" character(7) NOT NULL,
    "Rarity" character varying(4) NOT NULL,
    "VoteSlot" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_tier_ranking_votes" PRIMARY KEY ("UserId", "CharacterId", "VoteMonth"),
    CONSTRAINT "CK_tier_ranking_votes_Rarity" CHECK ("Rarity" IN ('UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R')),
    CONSTRAINT "CK_tier_ranking_votes_VoteMonth" CHECK ("VoteMonth" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT "CK_tier_ranking_votes_VoteSlot" CHECK ("VoteSlot" BETWEEN 1 AND 8),
    CONSTRAINT "FK_tier_ranking_votes_characters_CharacterId" FOREIGN KEY ("CharacterId") REFERENCES characters ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_tier_ranking_votes_user_accounts_UserId" FOREIGN KEY ("UserId") REFERENCES user_accounts ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "IX_user_accounts_EmailVerificationTokenHash" ON user_accounts ("EmailVerificationTokenHash") WHERE "EmailVerificationTokenHash" IS NOT NULL;

ALTER TABLE user_accounts ADD CONSTRAINT "CK_user_accounts_EmailVerificationTokenHash" CHECK ("EmailVerificationTokenHash" IS NULL OR "EmailVerificationTokenHash" ~ '^[0-9a-f]{64}$');

ALTER TABLE user_accounts ADD CONSTRAINT "CK_user_accounts_EmailVerificationTokenPair" CHECK (("EmailVerificationTokenHash" IS NULL AND "EmailVerificationExpiresAt" IS NULL) OR ("EmailVerificationTokenHash" IS NOT NULL AND "EmailVerificationExpiresAt" IS NOT NULL));

CREATE INDEX "IX_tier_ranking_baselines_IsCore_BaseOrder_CharacterId" ON tier_ranking_baselines ("IsCore", "BaseOrder", "CharacterId");

CREATE INDEX "IX_tier_ranking_votes_CharacterId" ON tier_ranking_votes ("CharacterId");

CREATE UNIQUE INDEX "IX_tier_ranking_votes_UserId_VoteMonth_Rarity_VoteSlot" ON tier_ranking_votes ("UserId", "VoteMonth", "Rarity", "VoteSlot");

CREATE INDEX "IX_tier_ranking_votes_VoteMonth_CharacterId" ON tier_ranking_votes ("VoteMonth", "CharacterId");

CREATE INDEX "IX_tier_ranking_votes_VoteMonth_UserId" ON tier_ranking_votes ("VoteMonth", "UserId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260829145436_AddTierRankingAndEmailVerification', '10.0.0');

COMMIT;
