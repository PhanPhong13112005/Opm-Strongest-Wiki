using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;
using OpmWiki.Application.TierRanking;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class PostgresTierRankingRepository(OpmWikiDbContext dbContext)
    : ITierRankingRepository
{
    public async Task<TierRankingPublicDto> GetPublicAsync(
        VoteMonth voteMonth,
        CancellationToken cancellationToken = default)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = await OpenIfNeededAsync(connection, cancellationToken);
        try
        {
            await using var totalsCommand = CreateCommand(connection, null, """
                SELECT COUNT(*)::integer,
                       COUNT(DISTINCT "UserId")::integer
                  FROM tier_ranking_votes
                 WHERE "VoteMonth" = @voteMonth;
                """);
            AddParameter(totalsCommand, "voteMonth", voteMonth.Value);
            await using var totalsReader = await totalsCommand.ExecuteReaderAsync(cancellationToken);
            await totalsReader.ReadAsync(cancellationToken);
            var totalVotes = totalsReader.GetInt32(0);
            var totalVoters = totalsReader.GetInt32(1);
            await totalsReader.DisposeAsync();

            await using var rowsCommand = CreateCommand(connection, null, """
                SELECT "CharacterId", COUNT(*)::integer AS votes
                  FROM tier_ranking_votes
                 WHERE "VoteMonth" = @voteMonth
                 GROUP BY "CharacterId"
                 ORDER BY votes DESC, "CharacterId";
                """);
            AddParameter(rowsCommand, "voteMonth", voteMonth.Value);
            var rows = new List<TierRankingVoteCountDto>();
            await using var rowsReader = await rowsCommand.ExecuteReaderAsync(cancellationToken);
            while (await rowsReader.ReadAsync(cancellationToken))
                rows.Add(new(rowsReader.GetString(0), rowsReader.GetInt32(1)));

            return new TierRankingPublicDto(
                voteMonth.Value,
                voteMonth.ResetsAt,
                totalVotes,
                totalVoters,
                rows);
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

    public async Task<TierAccountVoteState?> GetMineAsync(
        Guid accountId,
        VoteMonth voteMonth,
        CancellationToken cancellationToken = default)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = await OpenIfNeededAsync(connection, cancellationToken);
        try
        {
            await using var command = CreateCommand(connection, null, """
                SELECT u."IsActive", u."EmailVerified", u."PhoneVerified", v."CharacterId"
                  FROM user_accounts u
                  LEFT JOIN tier_ranking_votes v
                    ON v."UserId" = u."Id" AND v."VoteMonth" = @voteMonth
                 WHERE u."Id" = @accountId
                 ORDER BY v."CharacterId";
                """);
            AddParameter(command, "accountId", accountId);
            AddParameter(command, "voteMonth", voteMonth.Value);
            var characterIds = new List<string>();
            bool? active = null;
            var emailVerified = false;
            var phoneVerified = false;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                active ??= reader.GetBoolean(0);
                emailVerified = reader.GetBoolean(1);
                phoneVerified = reader.GetBoolean(2);
                if (!reader.IsDBNull(3)) characterIds.Add(reader.GetString(3));
            }

            return active.HasValue
                ? new TierAccountVoteState(active.Value, emailVerified, phoneVerified, characterIds)
                : null;
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

    public async Task<TierVoteStoreResult> ConfirmVoteAsync(
        TierVoteStoreRequest request,
        CancellationToken cancellationToken = default)
    {
        for (var attempt = 0; attempt < 3; attempt++)
        {
            try
            {
                return await ConfirmVoteOnceAsync(request, cancellationToken);
            }
            catch (PostgresException exception) when (
                exception.SqlState is PostgresErrorCodes.SerializationFailure or
                    PostgresErrorCodes.DeadlockDetected or
                    PostgresErrorCodes.UniqueViolation && attempt < 2)
            {
                await Task.Delay(TimeSpan.FromMilliseconds(10 * (attempt + 1)), cancellationToken);
            }
        }

        throw new InvalidOperationException("Tier vote retry budget was exhausted.");
    }

    public async Task<AdminTierRankingStatsDto> GetAdminStatsAsync(
        VoteMonth voteMonth,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = await OpenIfNeededAsync(connection, cancellationToken);
        try
        {
            await using var totals = CreateCommand(connection, null, """
                SELECT (SELECT COUNT(*)::integer FROM tier_ranking_baselines),
                       COUNT(*)::integer,
                       COUNT(DISTINCT "UserId")::integer
                  FROM tier_ranking_votes
                 WHERE "VoteMonth" = @voteMonth;
                """);
            AddParameter(totals, "voteMonth", voteMonth.Value);
            await using var totalsReader = await totals.ExecuteReaderAsync(cancellationToken);
            await totalsReader.ReadAsync(cancellationToken);
            var totalItems = totalsReader.GetInt32(0);
            var totalVotes = totalsReader.GetInt32(1);
            var totalVoters = totalsReader.GetInt32(2);
            await totalsReader.DisposeAsync();

            await using var rowsCommand = CreateCommand(connection, null, AdminRowsSql);
            AddParameter(rowsCommand, "voteMonth", voteMonth.Value);
            AddParameter(rowsCommand, "offset", (page - 1) * pageSize);
            AddParameter(rowsCommand, "limit", pageSize);
            var characters = new List<AdminTierRankingCharacterDto>();
            await using var rowsReader = await rowsCommand.ExecuteReaderAsync(cancellationToken);
            while (await rowsReader.ReadAsync(cancellationToken))
                characters.Add(MapAdminCharacter(rowsReader));

            return new AdminTierRankingStatsDto(
                voteMonth.Value,
                voteMonth.ResetsAt,
                page,
                pageSize,
                totalItems,
                totalVotes,
                totalVoters,
                characters);
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

    public async Task<TierAdminMutationResult> UpdateBaseVotesAsync(
        string characterId,
        int baseVotes,
        string expectedVersion,
        string updatedBySubject,
        VoteMonth voteMonth,
        CancellationToken cancellationToken = default)
    {
        if (!OpaqueVersion.TryGetSequence(expectedVersion, out var version))
            return new(TierAdminMutationStatus.Conflict, null);

        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = await OpenIfNeededAsync(connection, cancellationToken);
        try
        {
            await using var transaction = await connection.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);
            await using var update = CreateCommand(connection, transaction, """
                UPDATE tier_ranking_baselines
                   SET "BaseVotes" = @baseVotes,
                       "Version" = "Version" + 1,
                       "UpdatedAt" = CURRENT_TIMESTAMP,
                       "UpdatedBySubject" = @updatedBySubject
                 WHERE "CharacterId" = @characterId
                   AND "Version" = @expectedVersion;
                """);
            AddParameter(update, "baseVotes", baseVotes);
            AddParameter(update, "updatedBySubject", updatedBySubject);
            AddParameter(update, "characterId", characterId);
            AddParameter(update, "expectedVersion", version);
            var changed = await update.ExecuteNonQueryAsync(cancellationToken);
            if (changed == 0)
            {
                await using var existsCommand = CreateCommand(connection, transaction, """
                    SELECT EXISTS(
                        SELECT 1 FROM tier_ranking_baselines WHERE "CharacterId" = @characterId);
                    """);
                AddParameter(existsCommand, "characterId", characterId);
                var exists = await existsCommand.ExecuteScalarAsync(cancellationToken) is true;
                await transaction.RollbackAsync(cancellationToken);
                return new(
                    exists ? TierAdminMutationStatus.Conflict : TierAdminMutationStatus.NotFound,
                    null);
            }

            var character = await ReadAdminCharacterAsync(
                connection,
                transaction,
                characterId,
                voteMonth,
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return character is null
                ? new(TierAdminMutationStatus.NotFound, null)
                : new(TierAdminMutationStatus.Success, character);
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

    private async Task<TierVoteStoreResult> ConfirmVoteOnceAsync(
        TierVoteStoreRequest request,
        CancellationToken cancellationToken)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = await OpenIfNeededAsync(connection, cancellationToken);
        try
        {
            await using var transaction = await connection.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            var account = await ReadAccountForUpdateAsync(
                connection,
                transaction,
                request.AccountId,
                cancellationToken);
            if (account is null || !account.Value.IsActive)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(TierVoteStoreStatus.AccountUnavailable, request.CharacterId);
            }

            var rarity = await ReadCharacterRarityAsync(
                connection,
                transaction,
                request.CharacterId,
                cancellationToken);
            if (rarity is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(TierVoteStoreStatus.CharacterNotFound, request.CharacterId);
            }
            if (!request.EligibleRarities.Contains(rarity))
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(TierVoteStoreStatus.InvalidRarity, request.CharacterId, rarity);
            }

            var existing = await VoteExistsAsync(
                connection,
                transaction,
                request.AccountId,
                request.CharacterId,
                request.VoteMonth,
                cancellationToken);
            var maxVotes = account.Value.EmailVerified || account.Value.PhoneVerified
                ? request.VerifiedLimit
                : request.UnverifiedLimit;
            var selected = await SelectedInRarityAsync(
                connection,
                transaction,
                request.AccountId,
                request.VoteMonth,
                rarity,
                cancellationToken);

            if (!existing)
            {
                if (selected >= maxVotes)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return new TierVoteStoreResult(
                        TierVoteStoreStatus.QuotaExceeded,
                        request.CharacterId,
                        rarity,
                        0,
                        0,
                        0,
                        selected,
                        account.Value.EmailVerified,
                        account.Value.PhoneVerified);
                }

                var slot = await FindAvailableSlotAsync(
                    connection,
                    transaction,
                    request.AccountId,
                    request.VoteMonth,
                    rarity,
                    maxVotes,
                    cancellationToken);
                await InsertVoteAsync(
                    connection,
                    transaction,
                    request,
                    rarity,
                    slot,
                    cancellationToken);
                selected++;
            }

            var aggregate = await ReadAggregateAsync(
                connection,
                transaction,
                request.CharacterId,
                request.VoteMonth,
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new TierVoteStoreResult(
                TierVoteStoreStatus.Success,
                request.CharacterId,
                rarity,
                aggregate.CharacterVotes,
                aggregate.TotalVotes,
                aggregate.TotalVoters,
                selected,
                account.Value.EmailVerified,
                account.Value.PhoneVerified);
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

    private static async Task<(bool IsActive, bool EmailVerified, bool PhoneVerified)?> ReadAccountForUpdateAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid accountId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, transaction, """
            SELECT "IsActive", "EmailVerified", "PhoneVerified"
              FROM user_accounts
             WHERE "Id" = @accountId
             FOR UPDATE;
            """);
        AddParameter(command, "accountId", accountId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken)
            ? (reader.GetBoolean(0), reader.GetBoolean(1), reader.GetBoolean(2))
            : null;
    }

    private static async Task<string?> ReadCharacterRarityAsync(
        DbConnection connection,
        DbTransaction transaction,
        string characterId,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, transaction, """
            SELECT "Tier" FROM characters WHERE "Id" = @characterId;
            """);
        AddParameter(command, "characterId", characterId);
        return await command.ExecuteScalarAsync(cancellationToken) as string;
    }

    private static async Task<bool> VoteExistsAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid accountId,
        string characterId,
        string voteMonth,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, transaction, """
            SELECT EXISTS(
                SELECT 1
                  FROM tier_ranking_votes
                 WHERE "UserId" = @accountId
                   AND "CharacterId" = @characterId
                   AND "VoteMonth" = @voteMonth);
            """);
        AddParameter(command, "accountId", accountId);
        AddParameter(command, "characterId", characterId);
        AddParameter(command, "voteMonth", voteMonth);
        return await command.ExecuteScalarAsync(cancellationToken) is true;
    }

    private static async Task<int> SelectedInRarityAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid accountId,
        string voteMonth,
        string rarity,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, transaction, """
            SELECT COUNT(*)::integer
              FROM tier_ranking_votes
             WHERE "UserId" = @accountId
               AND "VoteMonth" = @voteMonth
               AND "Rarity" = @rarity;
            """);
        AddParameter(command, "accountId", accountId);
        AddParameter(command, "voteMonth", voteMonth);
        AddParameter(command, "rarity", rarity);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }

    private static async Task<int> FindAvailableSlotAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid accountId,
        string voteMonth,
        string rarity,
        int maxVotes,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, transaction, """
            SELECT slot
              FROM generate_series(1, @maxVotes) AS slot
             WHERE NOT EXISTS (
                 SELECT 1 FROM tier_ranking_votes
                  WHERE "UserId" = @accountId
                    AND "VoteMonth" = @voteMonth
                    AND "Rarity" = @rarity
                    AND "VoteSlot" = slot)
             ORDER BY slot
             LIMIT 1;
            """);
        AddParameter(command, "maxVotes", maxVotes);
        AddParameter(command, "accountId", accountId);
        AddParameter(command, "voteMonth", voteMonth);
        AddParameter(command, "rarity", rarity);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    }

    private static async Task InsertVoteAsync(
        DbConnection connection,
        DbTransaction transaction,
        TierVoteStoreRequest request,
        string rarity,
        int slot,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, transaction, """
            INSERT INTO tier_ranking_votes
                ("UserId", "CharacterId", "VoteMonth", "Rarity", "VoteSlot", "CreatedAt")
            VALUES
                (@accountId, @characterId, @voteMonth, @rarity, @voteSlot, CURRENT_TIMESTAMP);
            """);
        AddParameter(command, "accountId", request.AccountId);
        AddParameter(command, "characterId", request.CharacterId);
        AddParameter(command, "voteMonth", request.VoteMonth);
        AddParameter(command, "rarity", rarity);
        AddParameter(command, "voteSlot", slot);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<(int CharacterVotes, int TotalVotes, int TotalVoters)> ReadAggregateAsync(
        DbConnection connection,
        DbTransaction transaction,
        string characterId,
        string voteMonth,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, transaction, """
            SELECT COUNT(*) FILTER (WHERE "CharacterId" = @characterId)::integer,
                   COUNT(*)::integer,
                   COUNT(DISTINCT "UserId")::integer
              FROM tier_ranking_votes
             WHERE "VoteMonth" = @voteMonth;
            """);
        AddParameter(command, "characterId", characterId);
        AddParameter(command, "voteMonth", voteMonth);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);
        return (reader.GetInt32(0), reader.GetInt32(1), reader.GetInt32(2));
    }

    private static async Task<AdminTierRankingCharacterDto?> ReadAdminCharacterAsync(
        DbConnection connection,
        DbTransaction transaction,
        string characterId,
        VoteMonth voteMonth,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(connection, transaction, AdminCharacterSql);
        AddParameter(command, "voteMonth", voteMonth.Value);
        AddParameter(command, "characterId", characterId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? MapAdminCharacter(reader) : null;
    }

    private static AdminTierRankingCharacterDto MapAdminCharacter(DbDataReader reader) => new(
        reader.GetString(0),
        reader.GetString(1),
        reader.GetString(2),
        reader.GetString(3),
        reader.GetString(4),
        reader.GetInt32(5),
        reader.GetInt32(6),
        reader.GetInt32(7),
        OpaqueVersion.FromSequence(reader.GetInt64(8)));

    private static TierVoteStoreResult Empty(
        TierVoteStoreStatus status,
        string characterId,
        string rarity = "") =>
        new(status, characterId, rarity, 0, 0, 0, 0, false, false);

    private static async Task<bool> OpenIfNeededAsync(
        DbConnection connection,
        CancellationToken cancellationToken)
    {
        if (connection.State == ConnectionState.Open) return false;
        await connection.OpenAsync(cancellationToken);
        return true;
    }

    private static DbCommand CreateCommand(
        DbConnection connection,
        DbTransaction? transaction,
        string sql)
    {
        var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Transaction = transaction;
        return command;
    }

    private static void AddParameter(DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }

    private const string ScoredCte = """
        WITH scored AS (
            SELECT c."Id" AS character_id,
                   c."NameVi" AS name_vi,
                   c."NameEn" AS name_en,
                   c."Tier" AS rarity,
                   b."BaseVotes"::integer AS base_votes,
                   b."IsCore" AS is_core,
                   b."BaseOrder" AS base_order,
                   b."Version" AS version,
                   COUNT(v."UserId")::integer AS community_votes,
                   (b."BaseVotes" + COUNT(v."UserId"))::integer AS total_score
              FROM tier_ranking_baselines b
              JOIN characters c ON c."Id" = b."CharacterId"
              LEFT JOIN tier_ranking_votes v
                ON v."CharacterId" = b."CharacterId"
               AND v."VoteMonth" = @voteMonth
             WHERE c."Tier" IN ('UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R')
             GROUP BY c."Id", c."NameVi", c."NameEn", c."Tier",
                      b."BaseVotes", b."IsCore", b."BaseOrder", b."Version"
        ), ranked AS (
            SELECT scored.*,
                   ROW_NUMBER() OVER (
                       PARTITION BY rarity, is_core
                       ORDER BY total_score DESC, base_order, character_id) AS band_position,
                   COUNT(*) OVER (PARTITION BY rarity, is_core) AS band_count
              FROM scored
        ), banded AS (
            SELECT ranked.*,
                   CASE
                     WHEN is_core THEN 'CORE'
                     WHEN band_position <= CEIL(band_count * 0.12) THEN 'SS'
                     WHEN band_position <= CEIL(band_count * 0.30) THEN 'S'
                     WHEN band_position <= CEIL(band_count * 0.55) THEN 'A'
                     WHEN band_position <= CEIL(band_count * 0.75) THEN 'B'
                     WHEN band_position <= CEIL(band_count * 0.90) THEN 'C'
                     ELSE 'D'
                   END AS ranking_tier
              FROM ranked
        )
        """;

    private const string AdminRowsSql = ScoredCte + """
        SELECT character_id, name_vi, name_en, rarity, ranking_tier,
               base_votes, community_votes, total_score, version
          FROM banded
         ORDER BY CASE rarity
                    WHEN 'UR+' THEN 1 WHEN 'UR' THEN 2 WHEN 'SSR+' THEN 3
                    WHEN 'SSR' THEN 4 WHEN 'SR' THEN 5 ELSE 6 END,
                  CASE ranking_tier
                    WHEN 'CORE' THEN 0 WHEN 'SS' THEN 1 WHEN 'S' THEN 2
                    WHEN 'A' THEN 3 WHEN 'B' THEN 4 WHEN 'C' THEN 5 ELSE 6 END,
                  total_score DESC, base_order, character_id
         OFFSET @offset LIMIT @limit;
        """;

    private const string AdminCharacterSql = ScoredCte + """
        SELECT character_id, name_vi, name_en, rarity, ranking_tier,
               base_votes, community_votes, total_score, version
          FROM banded
         WHERE character_id = @characterId;
        """;
}
