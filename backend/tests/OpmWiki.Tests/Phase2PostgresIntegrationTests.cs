using Microsoft.EntityFrameworkCore;
using Npgsql;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.AdminCommunity;
using OpmWiki.Application.Common;
using OpmWiki.Application.EmailVerification;
using OpmWiki.Application.TierRanking;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class Phase2PostgresCollection : ICollectionFixture<object>
{
    public const string Name = "Phase 2 PostgreSQL integration";
}

public sealed class Phase2PostgresFactAttribute : FactAttribute
{
    public Phase2PostgresFactAttribute()
    {
        if (!string.Equals(
                Environment.GetEnvironmentVariable("OPMWIKI_PHASE2_ALLOW_TEST_SCHEMA"),
                "YES",
                StringComparison.Ordinal))
        {
            Skip = "Set OPMWIKI_PHASE2_ALLOW_TEST_SCHEMA=YES for the isolated PostgreSQL test database.";
        }
    }
}

[Collection(Phase2PostgresCollection.Name)]
public sealed class Phase2PostgresIntegrationTests
{
    private static readonly Guid UnverifiedUser = Guid.Parse("00000000-0000-0000-0000-000000009001");
    private static readonly Guid VerifiedUser = Guid.Parse("00000000-0000-0000-0000-000000009002");
    private static readonly Guid SameVoteUser = Guid.Parse("00000000-0000-0000-0000-000000009003");
    private static readonly Guid InactiveUser = Guid.Parse("00000000-0000-0000-0000-000000009004");

    [Phase2PostgresFact]
    public async Task Repositories_RunAgainstExplicitlyIsolatedPostgresSchema()
    {
        var connectionString = GetSafeConnectionString();
        await using var setup = new NpgsqlConnection(connectionString);
        await setup.OpenAsync();
        await ExecuteAsync(setup, HistoricalTestSchemaSql);

        await using (var oldSchemaContext = CreateContext(connectionString))
        {
            var oldSchemaGate = new PostgresSchemaCapabilityService(oldSchemaContext);
            Assert.False((await oldSchemaGate.CheckAsync(SchemaCapability.TierRanking)).IsAvailable);
            Assert.False((await oldSchemaGate.CheckAsync(SchemaCapability.EmailVerification)).IsAvailable);
        }

        await ExecuteAsync(setup, Phase2TestSchemaSql);
        await ExecuteAsync(setup, TestDataSql);

        await AssertCapabilitiesAsync(connectionString);
        await AssertTierVotingAsync(connectionString);
        await AssertTierConcurrencyAsync(connectionString);
        await AssertAdminTierAsync(connectionString);
        await AssertEmailVerificationAsync(connectionString);
        await AssertAdminCommunityAsync(connectionString);
    }

    private static async Task AssertCapabilitiesAsync(string connectionString)
    {
        await using var context = CreateContext(connectionString);
        var gate = new PostgresSchemaCapabilityService(context);
        Assert.True((await gate.CheckAsync(SchemaCapability.TierRanking)).IsAvailable);
        Assert.True((await gate.CheckAsync(SchemaCapability.EmailVerification)).IsAvailable);
    }

    private static async Task AssertTierVotingAsync(string connectionString)
    {
        var time = new TestTimeProvider(DateTimeOffset.Parse("2026-08-15T00:00:00Z"));
        await using var context = CreateContext(connectionString);
        var service = new TierRankingService(new PostgresTierRankingRepository(context), time);

        var empty = await service.GetPublicAsync();
        Assert.Equal("2026-08", empty.VoteMonth);
        Assert.Equal(0, empty.TotalVotes);

        var first = await service.VoteAsync(UnverifiedUser, "ur-1", true);
        var repeated = await service.VoteAsync(UnverifiedUser, "ur-1", true);
        Assert.Equal(TierServiceStatus.Success, first.Status);
        Assert.Equal(TierServiceStatus.Success, repeated.Status);
        Assert.Equal(1, repeated.Value!.Votes);
        Assert.Equal(0, repeated.Value.RemainingInRarity);
        Assert.Equal(TierServiceStatus.QuotaExceeded,
            (await service.VoteAsync(UnverifiedUser, "ur-2", true)).Status);
        Assert.Equal(TierServiceStatus.Success,
            (await service.VoteAsync(UnverifiedUser, "sr-1", true)).Status);
        Assert.Equal(TierServiceStatus.CharacterNotFound,
            (await service.VoteAsync(UnverifiedUser, "missing", true)).Status);
        Assert.Equal(TierServiceStatus.InvalidInput,
            (await service.VoteAsync(UnverifiedUser, "ineligible", true)).Status);
        Assert.Equal(TierServiceStatus.AccountUnavailable,
            (await service.VoteAsync(InactiveUser, "ur-1", true)).Status);
        Assert.Equal(TierServiceStatus.ImmutableVote,
            (await service.VoteAsync(UnverifiedUser, "ur-1", false)).Status);

        var mine = (await service.GetMineAsync(UnverifiedUser)).Value!;
        Assert.Equal(["sr-1", "ur-1"], mine.CharacterIds);
        Assert.Equal(1, mine.MaxVotesPerRarity);
        Assert.False(mine.HasVerifiedContact);

        var publicResult = await service.GetPublicAsync();
        Assert.Equal(2, publicResult.TotalVotes);
        Assert.Equal(1, publicResult.TotalVoters);
        Assert.Equal(2, publicResult.Votes.Sum(x => x.Votes));

        time.UtcNow = DateTimeOffset.Parse("2026-08-31T17:00:00Z");
        var rollover = await service.VoteAsync(UnverifiedUser, "ur-2", true);
        Assert.Equal(TierServiceStatus.Success, rollover.Status);
        Assert.Equal("2026-09", rollover.Value!.VoteMonth);
    }

    private static async Task AssertTierConcurrencyAsync(string connectionString)
    {
        var time = new TestTimeProvider(DateTimeOffset.Parse("2026-08-15T00:00:00Z"));
        for (var index = 1; index <= 7; index++)
        {
            await using var context = CreateContext(connectionString);
            var service = new TierRankingService(new PostgresTierRankingRepository(context), time);
            Assert.Equal(TierServiceStatus.Success,
                (await service.VoteAsync(VerifiedUser, $"ur-{index}", true)).Status);
        }

        var finalSlot = await Task.WhenAll(
            VoteWithFreshContextAsync(connectionString, time, VerifiedUser, "ur-8"),
            VoteWithFreshContextAsync(connectionString, time, VerifiedUser, "ur-9"));
        Assert.Equal(1, finalSlot.Count(x => x == TierServiceStatus.Success));
        Assert.Equal(1, finalSlot.Count(x => x == TierServiceStatus.QuotaExceeded));

        var sameCharacter = await Task.WhenAll(
            VoteWithFreshContextAsync(connectionString, time, SameVoteUser, "ur-10"),
            VoteWithFreshContextAsync(connectionString, time, SameVoteUser, "ur-10"));
        Assert.All(sameCharacter, status => Assert.Equal(TierServiceStatus.Success, status));

        await using var verify = new NpgsqlConnection(connectionString);
        await verify.OpenAsync();
        Assert.Equal(8, await ScalarIntAsync(verify,
            "SELECT COUNT(*)::integer FROM tier_ranking_votes WHERE \"UserId\" = '00000000-0000-0000-0000-000000009002' AND \"VoteMonth\" = '2026-08';"));
        Assert.Equal(1, await ScalarIntAsync(verify,
            "SELECT COUNT(*)::integer FROM tier_ranking_votes WHERE \"UserId\" = '00000000-0000-0000-0000-000000009003' AND \"CharacterId\" = 'ur-10' AND \"VoteMonth\" = '2026-08';"));
    }

    private static async Task<TierServiceStatus> VoteWithFreshContextAsync(
        string connectionString,
        TimeProvider time,
        Guid userId,
        string characterId)
    {
        await using var context = CreateContext(connectionString);
        var service = new TierRankingService(new PostgresTierRankingRepository(context), time);
        return (await service.VoteAsync(userId, characterId, true)).Status;
    }

    private static async Task AssertAdminTierAsync(string connectionString)
    {
        var time = new TestTimeProvider(DateTimeOffset.Parse("2026-08-15T00:00:00Z"));
        await using var context = CreateContext(connectionString);
        var service = new TierRankingService(new PostgresTierRankingRepository(context), time);
        var stats = (await service.GetAdminStatsAsync("2026-08", 1, 25)).Value!;

        Assert.Equal(11, stats.TotalItems);
        Assert.Equal(11, stats.Characters.Count);
        Assert.True(stats.TotalVotes >= 11);
        Assert.True(stats.TotalVoters >= 3);
        Assert.All(stats.Characters, row =>
        {
            Assert.Equal(row.BaseVotes + row.CommunityVotes, row.TotalScore);
            Assert.False(string.IsNullOrWhiteSpace(row.NameVi));
            Assert.False(string.IsNullOrWhiteSpace(row.NameEn));
            Assert.StartsWith("s1.", row.Version);
        });

        var current = stats.Characters.Single(x => x.CharacterId == "ur-1");
        var updated = await service.UpdateBaseVotesAsync(
            current.CharacterId,
            new UpdateBaseVotesRequest(42, current.Version),
            "admin:test");
        Assert.Equal(TierServiceStatus.Success, updated.Status);
        Assert.Equal(42, updated.Value!.BaseVotes);
        Assert.Equal(42 + updated.Value.CommunityVotes, updated.Value.TotalScore);
        Assert.NotEqual(current.Version, updated.Value.Version);
        Assert.Equal(TierServiceStatus.Conflict,
            (await service.UpdateBaseVotesAsync(
                current.CharacterId,
                new UpdateBaseVotesRequest(7, current.Version),
                "admin:test")).Status);
        Assert.Equal(TierServiceStatus.CharacterNotFound,
            (await service.UpdateBaseVotesAsync(
                "missing",
                new UpdateBaseVotesRequest(7, OpaqueVersion.FromSequence(1)),
                "admin:test")).Status);
    }

    private static async Task AssertEmailVerificationAsync(string connectionString)
    {
        var time = new TestTimeProvider(DateTimeOffset.Parse("2026-08-15T00:00:00Z"));
        await using var context = CreateContext(connectionString);
        var delivery = new CapturingDelivery();
        var service = new EmailVerificationService(
            new PostgresEmailVerificationRepository(context),
            delivery,
            new EmailVerificationOptions
            {
                PublicAppUrl = "https://phase2.test",
                ExposeTestUrl = true,
            },
            time);

        var issued = await service.RequestAsync(UnverifiedUser, "https://ignored.test");
        Assert.Equal(EmailVerificationRequestStatus.Accepted, issued.Status);
        Assert.Equal(1, delivery.Calls);
        Assert.NotNull(issued.VerificationUrl);
        var token = Uri.UnescapeDataString(new Uri(issued.VerificationUrl!).Query[7..]);

        await using var verify = new NpgsqlConnection(connectionString);
        await verify.OpenAsync();
        await using (var hashCommand = new NpgsqlCommand(
            "SELECT \"EmailVerificationTokenHash\" FROM user_accounts WHERE \"Id\" = @id;",
            verify))
        {
            hashCommand.Parameters.AddWithValue("id", UnverifiedUser);
            var stored = Assert.IsType<string>(await hashCommand.ExecuteScalarAsync());
            Assert.Equal(64, stored.Length);
            Assert.NotEqual(token, stored);
            Assert.Equal(EmailVerificationTokens.Hash(token), stored);
        }

        var resend = await service.RequestAsync(UnverifiedUser, "https://ignored.test");
        Assert.Equal(EmailVerificationRequestStatus.Throttled, resend.Status);
        Assert.Equal(1, delivery.Calls);
        Assert.Equal(EmailVerificationConfirmStatus.InvalidOrExpired,
            await service.ConfirmAsync(new string('x', 43)));
        Assert.Equal(EmailVerificationConfirmStatus.Confirmed,
            await service.ConfirmAsync(token));
        Assert.Equal(EmailVerificationConfirmStatus.InvalidOrExpired,
            await service.ConfirmAsync(token));
        Assert.True((await new PostgresEmailVerificationRepository(context)
            .GetStateAsync(UnverifiedUser))!.EmailVerified);
    }

    private static async Task AssertAdminCommunityAsync(string connectionString)
    {
        await using var context = CreateContext(connectionString);
        var repository = new AdminCommunityRepository(context);

        var all = await repository.GetFeedAsync(AdminCommunityKinds.All, 1, 2);
        Assert.Equal(4, all.TotalItems);
        Assert.Equal(2, all.Topics.Count + all.Comments.Count);
        var topics = await repository.GetFeedAsync(AdminCommunityKinds.Topics, 1, 1);
        Assert.Equal(2, topics.TotalItems);
        Assert.Single(topics.Topics);
        var comments = await repository.GetFeedAsync(AdminCommunityKinds.Comments, 2, 1);
        Assert.Equal(2, comments.TotalItems);
        Assert.Single(comments.Comments);

        var topic = (await repository.GetFeedAsync(AdminCommunityKinds.Topics, 1, 10))
            .Topics.Single(x => x.Id == 1);
        Assert.True(OpaqueVersion.TryGetTimestamp(topic.Version, out var topicVersion));
        var locked = await repository.SetTopicLockAsync(1, true, topicVersion);
        Assert.Equal(AdminCommunityMutationStatus.Success, locked.Status);
        Assert.True(locked.Topic!.IsLocked);
        Assert.Equal(AdminCommunityMutationStatus.Conflict,
            (await repository.SetTopicLockAsync(1, false, topicVersion)).Status);
        Assert.True(OpaqueVersion.TryGetTimestamp(locked.Topic.Version, out var lockedVersion));
        Assert.Equal(AdminCommunityMutationStatus.Success,
            await repository.SoftDeleteTopicAsync(1, lockedVersion));
        Assert.Equal(AdminCommunityMutationStatus.NotFound,
            await repository.SoftDeleteTopicAsync(1, lockedVersion));

        var comment = (await repository.GetFeedAsync(AdminCommunityKinds.Comments, 1, 10))
            .Comments.Single(x => x.Id == 11);
        Assert.True(OpaqueVersion.TryGetTimestamp(comment.Version, out var commentVersion));
        Assert.Equal(AdminCommunityMutationStatus.Conflict,
            await repository.SoftDeleteCommentAsync(11, commentVersion.AddSeconds(-1), VerifiedUser));
        Assert.Equal(AdminCommunityMutationStatus.Success,
            await repository.SoftDeleteCommentAsync(11, commentVersion, VerifiedUser));
        Assert.Equal(AdminCommunityMutationStatus.NotFound,
            await repository.SoftDeleteCommentAsync(11, commentVersion, VerifiedUser));
    }

    private static string GetSafeConnectionString()
    {
        var raw = Environment.GetEnvironmentVariable("OPMWIKI_PHASE2_TEST_CONNECTION")
            ?? throw new InvalidOperationException("OPMWIKI_PHASE2_TEST_CONNECTION is required.");
        var builder = new NpgsqlConnectionStringBuilder(raw);
        var safeHost = string.Equals(builder.Host, "localhost", StringComparison.OrdinalIgnoreCase) ||
                       string.Equals(builder.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                       string.Equals(builder.Host, "opmwiki-phase2-pg", StringComparison.OrdinalIgnoreCase);
        if (!safeHost || !string.Equals(builder.Database, "opmwiki_phase2_test", StringComparison.Ordinal))
            throw new InvalidOperationException(
                "Phase 2 integration tests refuse any host/database outside the isolated test target.");
        return builder.ConnectionString;
    }

    private static OpmWikiDbContext CreateContext(string connectionString) =>
        new(new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseNpgsql(connectionString)
            .EnableDetailedErrors()
            .Options);

    private static async Task ExecuteAsync(NpgsqlConnection connection, string sql)
    {
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }

    private static async Task<int> ScalarIntAsync(NpgsqlConnection connection, string sql)
    {
        await using var command = new NpgsqlCommand(sql, connection);
        return Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    private sealed class CapturingDelivery : IEmailVerificationDelivery
    {
        public int Calls { get; private set; }

        public Task<bool> SendAsync(
            string email,
            string verificationUrl,
            string idempotencyKey,
            CancellationToken cancellationToken = default)
        {
            Calls++;
            Assert.Equal("unverified@phase2.test", email);
            Assert.StartsWith("https://phase2.test/verify-email?token=", verificationUrl);
            Assert.StartsWith("email-verification-", idempotencyKey);
            return Task.FromResult(true);
        }
    }

    // Test-only DDL: this runs solely in the explicitly named disposable database above.
    // It is not an EF migration and is unreachable from production runtime code.
    private const string HistoricalTestSchemaSql = """
        CREATE TABLE user_accounts (
            "Id" uuid PRIMARY KEY,
            "Username" varchar(30) NOT NULL,
            "NormalizedUsername" varchar(30) NOT NULL,
            "Email" varchar(254) NOT NULL DEFAULT '',
            "NormalizedEmail" varchar(254) NOT NULL DEFAULT '',
            "DisplayName" varchar(60) NOT NULL,
            "PasswordHash" varchar(500) NOT NULL,
            "PasswordResetTokenHash" varchar(64),
            "PasswordResetExpiresAt" timestamptz,
            "Role" varchar(20) NOT NULL,
            "Balance" numeric(18,2) NOT NULL DEFAULT 0,
            "IsActive" boolean NOT NULL DEFAULT TRUE,
            "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "UpdatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE characters (
            "Id" varchar(80) PRIMARY KEY,
            "NameVi" varchar(200) NOT NULL,
            "NameEn" varchar(200) NOT NULL,
            "Tier" varchar(20) NOT NULL
        );

        CREATE TABLE forum_topics (
            "Id" bigint PRIMARY KEY,
            "UserId" uuid NOT NULL REFERENCES user_accounts("Id"),
            "Title" varchar(160) NOT NULL,
            "Content" varchar(5000) NOT NULL,
            "IsLocked" boolean NOT NULL DEFAULT FALSE,
            "IsDeleted" boolean NOT NULL DEFAULT FALSE,
            "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "UpdatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE forum_posts (
            "Id" bigint PRIMARY KEY,
            "TopicId" bigint NOT NULL REFERENCES forum_topics("Id"),
            "UserId" uuid NOT NULL REFERENCES user_accounts("Id"),
            "Content" varchar(3000) NOT NULL,
            "IsDeleted" boolean NOT NULL DEFAULT FALSE,
            "DeletedById" uuid,
            "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "UpdatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE event_comments (
            "Id" bigint PRIMARY KEY,
            "EventId" varchar(100) NOT NULL,
            "UserId" uuid NOT NULL REFERENCES user_accounts("Id"),
            "Content" varchar(1000) NOT NULL,
            "IsDeleted" boolean NOT NULL DEFAULT FALSE,
            "DeletedById" uuid,
            "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "UpdatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """;

    private const string Phase2TestSchemaSql = """
        ALTER TABLE user_accounts
            ADD COLUMN "EmailVerified" boolean NOT NULL DEFAULT FALSE,
            ADD COLUMN "PhoneVerified" boolean NOT NULL DEFAULT FALSE,
            ADD COLUMN "EmailVerificationTokenHash" varchar(64),
            ADD COLUMN "EmailVerificationExpiresAt" timestamptz;

        CREATE TABLE tier_ranking_votes (
            "UserId" uuid NOT NULL REFERENCES user_accounts("Id") ON DELETE RESTRICT,
            "CharacterId" varchar(80) NOT NULL REFERENCES characters("Id") ON DELETE RESTRICT,
            "VoteMonth" char(7) NOT NULL,
            "Rarity" varchar(20) NOT NULL,
            "VoteSlot" integer NOT NULL,
            "CreatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "PK_tier_ranking_votes"
                PRIMARY KEY ("UserId", "CharacterId", "VoteMonth"),
            CONSTRAINT "UQ_tier_ranking_votes_slot"
                UNIQUE ("UserId", "VoteMonth", "Rarity", "VoteSlot")
        );

        CREATE INDEX "IX_tier_ranking_votes_month_character"
            ON tier_ranking_votes ("VoteMonth", "CharacterId");

        CREATE TABLE tier_ranking_baselines (
            "CharacterId" varchar(80) PRIMARY KEY REFERENCES characters("Id") ON DELETE RESTRICT,
            "BaseVotes" integer NOT NULL DEFAULT 0,
            "IsCore" boolean NOT NULL DEFAULT FALSE,
            "BaseOrder" integer NOT NULL DEFAULT 0,
            "Version" bigint NOT NULL DEFAULT 1,
            "UpdatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "UpdatedBySubject" varchar(200) NOT NULL DEFAULT ''
        );
        """;

    private const string TestDataSql = """
        INSERT INTO user_accounts
            ("Id", "Username", "NormalizedUsername", "Email", "NormalizedEmail",
             "DisplayName", "PasswordHash", "Role", "IsActive", "EmailVerified", "PhoneVerified")
        VALUES
            ('00000000-0000-0000-0000-000000009001', 'unverified', 'UNVERIFIED',
             'unverified@phase2.test', 'UNVERIFIED@PHASE2.TEST', 'Unverified', 'test-only', 'User', TRUE, FALSE, FALSE),
            ('00000000-0000-0000-0000-000000009002', 'verified', 'VERIFIED',
             'verified@phase2.test', 'VERIFIED@PHASE2.TEST', 'Verified', 'test-only', 'User', TRUE, TRUE, FALSE),
            ('00000000-0000-0000-0000-000000009003', 'samevote', 'SAMEVOTE',
             'samevote@phase2.test', 'SAMEVOTE@PHASE2.TEST', 'Same Vote', 'test-only', 'User', TRUE, FALSE, FALSE),
            ('00000000-0000-0000-0000-000000009004', 'inactive', 'INACTIVE',
             'inactive@phase2.test', 'INACTIVE@PHASE2.TEST', 'Inactive', 'test-only', 'User', FALSE, FALSE, FALSE);

        INSERT INTO characters ("Id", "NameVi", "NameEn", "Tier") VALUES
            ('ur-1', 'UR Một', 'UR One', 'UR'), ('ur-2', 'UR Hai', 'UR Two', 'UR'),
            ('ur-3', 'UR Ba', 'UR Three', 'UR'), ('ur-4', 'UR Bốn', 'UR Four', 'UR'),
            ('ur-5', 'UR Năm', 'UR Five', 'UR'), ('ur-6', 'UR Sáu', 'UR Six', 'UR'),
            ('ur-7', 'UR Bảy', 'UR Seven', 'UR'), ('ur-8', 'UR Tám', 'UR Eight', 'UR'),
            ('ur-9', 'UR Chín', 'UR Nine', 'UR'), ('ur-10', 'UR Mười', 'UR Ten', 'UR'),
            ('sr-1', 'SR Một', 'SR One', 'SR'), ('ineligible', 'Không hợp lệ', 'Ineligible', 'N');

        INSERT INTO tier_ranking_baselines
            ("CharacterId", "BaseVotes", "IsCore", "BaseOrder", "Version", "UpdatedBySubject")
        SELECT "Id", CASE WHEN "Id" = 'ur-1' THEN 10 ELSE 0 END,
               "Id" = 'ur-2', ROW_NUMBER() OVER (ORDER BY "Id")::integer, 1, 'test-fixture'
          FROM characters
         WHERE "Tier" IN ('UR', 'SR');

        INSERT INTO forum_topics
            ("Id", "UserId", "Title", "Content", "IsLocked", "IsDeleted", "CreatedAt", "UpdatedAt")
        VALUES
            (1, '00000000-0000-0000-0000-000000009002', 'Older topic', repeat('a', 240), FALSE, FALSE,
             '2026-08-01T10:00:00Z', '2026-08-01T10:00:00Z'),
            (2, '00000000-0000-0000-0000-000000009002', 'Newest topic', 'topic', FALSE, FALSE,
             '2026-08-04T10:00:00Z', '2026-08-04T10:00:00Z');

        INSERT INTO forum_posts
            ("Id", "TopicId", "UserId", "Content", "IsDeleted", "CreatedAt", "UpdatedAt")
        VALUES
            (101, 1, '00000000-0000-0000-0000-000000009002', 'reply', FALSE,
             '2026-08-01T10:01:00Z', '2026-08-01T10:01:00Z');

        INSERT INTO event_comments
            ("Id", "EventId", "UserId", "Content", "IsDeleted", "CreatedAt", "UpdatedAt")
        VALUES
            (11, 'event-1', '00000000-0000-0000-0000-000000009002', 'comment one', FALSE,
             '2026-08-02T10:00:00Z', '2026-08-02T10:00:00Z'),
            (12, 'event-2', '00000000-0000-0000-0000-000000009002', 'comment two', FALSE,
             '2026-08-03T10:00:00Z', '2026-08-03T10:00:00Z');
        """;
}
