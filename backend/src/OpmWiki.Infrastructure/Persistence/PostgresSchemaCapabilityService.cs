using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Common;

namespace OpmWiki.Infrastructure.Persistence;

public sealed class PostgresSchemaCapabilityService(OpmWikiDbContext dbContext)
    : ISchemaCapabilityService
{
    public async Task<SchemaCapabilityResult> CheckAsync(
        SchemaCapability capability,
        CancellationToken cancellationToken = default)
    {
        var sql = capability switch
        {
            SchemaCapability.EmailVerification => EmailVerificationCapabilitySql,
            SchemaCapability.TierRanking => TierRankingCapabilitySql,
            _ => throw new ArgumentOutOfRangeException(nameof(capability)),
        };

        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        try
        {
            if (shouldClose) await connection.OpenAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            var value = await command.ExecuteScalarAsync(cancellationToken);
            return value is true
                ? SchemaCapabilityResult.Available()
                : SchemaCapabilityResult.Missing(
                    capability == SchemaCapability.TierRanking
                        ? "Tier Ranking tables/contact-verification columns require the additive Phase 3 migration."
                        : "Email-verification columns require the additive Phase 3 migration.");
        }
        catch (DbException)
        {
            return SchemaCapabilityResult.Missing("Database schema capability could not be verified.");
        }
        finally
        {
            if (shouldClose && connection.State == ConnectionState.Open)
                await connection.CloseAsync();
        }
    }

    private const string EmailVerificationCapabilitySql = """
        SELECT COUNT(*) = 4
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'user_accounts'
           AND column_name IN (
               'EmailVerified',
               'PhoneVerified',
               'EmailVerificationTokenHash',
               'EmailVerificationExpiresAt');
        """;

    private const string TierRankingCapabilitySql = """
        SELECT
            to_regclass('public.tier_ranking_votes') IS NOT NULL
            AND to_regclass('public.tier_ranking_baselines') IS NOT NULL
            AND (
                SELECT COUNT(*) = 4
                  FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = 'user_accounts'
                   AND column_name IN (
                       'EmailVerified',
                       'PhoneVerified',
                       'EmailVerificationTokenHash',
                       'EmailVerificationExpiresAt'))
            AND (
                SELECT COUNT(*) = 6
                  FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = 'tier_ranking_votes'
                   AND column_name IN (
                       'UserId', 'CharacterId', 'VoteMonth', 'Rarity', 'VoteSlot', 'CreatedAt'))
            AND (
                SELECT COUNT(*) = 7
                  FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = 'tier_ranking_baselines'
                   AND column_name IN (
                       'CharacterId', 'BaseVotes', 'IsCore', 'BaseOrder',
                       'Version', 'UpdatedAt', 'UpdatedBySubject'));
        """;
}
