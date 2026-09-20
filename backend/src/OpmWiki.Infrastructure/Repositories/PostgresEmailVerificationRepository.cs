using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.EmailVerification;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class PostgresEmailVerificationRepository(OpmWikiDbContext dbContext)
    : IEmailVerificationRepository
{
    public async Task<ContactVerificationState?> GetStateAsync(
        Guid accountId,
        CancellationToken cancellationToken = default)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = await OpenIfNeededAsync(connection, cancellationToken);
        try
        {
            await using var command = CreateCommand(connection, null, """
                SELECT "EmailVerified", "PhoneVerified"
                  FROM user_accounts
                 WHERE "Id" = @accountId AND "IsActive" = TRUE;
                """);
            AddParameter(command, "accountId", accountId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            return await reader.ReadAsync(cancellationToken)
                ? new ContactVerificationState(reader.GetBoolean(0), reader.GetBoolean(1))
                : null;
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

    public async Task<EmailVerificationIssueResult> TryIssueAsync(
        Guid accountId,
        string tokenHash,
        DateTimeOffset expiresAt,
        DateTimeOffset recentExpiryThreshold,
        CancellationToken cancellationToken = default)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = await OpenIfNeededAsync(connection, cancellationToken);
        try
        {
            await using var transaction = await connection.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);
            await using var read = CreateCommand(connection, transaction, """
                SELECT "Email", "IsActive", "EmailVerified",
                       "EmailVerificationTokenHash", "EmailVerificationExpiresAt"
                  FROM user_accounts
                 WHERE "Id" = @accountId
                 FOR UPDATE;
                """);
            AddParameter(read, "accountId", accountId);
            string email;
            bool active;
            bool verified;
            string? currentHash;
            DateTimeOffset? currentExpiry;
            await using (var reader = await read.ExecuteReaderAsync(cancellationToken))
            {
                if (!await reader.ReadAsync(cancellationToken))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return new(EmailVerificationIssueStatus.AccountUnavailable);
                }
                email = reader.GetString(0);
                active = reader.GetBoolean(1);
                verified = reader.GetBoolean(2);
                currentHash = reader.IsDBNull(3) ? null : reader.GetString(3);
                currentExpiry = reader.IsDBNull(4) ? null : reader.GetFieldValue<DateTimeOffset>(4);
            }

            if (!active || string.IsNullOrWhiteSpace(email))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new(EmailVerificationIssueStatus.AccountUnavailable);
            }
            if (verified)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new(EmailVerificationIssueStatus.AlreadyVerified, email);
            }
            if (!string.IsNullOrWhiteSpace(currentHash) && currentExpiry > recentExpiryThreshold)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new(EmailVerificationIssueStatus.Throttled, email);
            }

            await using var update = CreateCommand(connection, transaction, """
                UPDATE user_accounts
                   SET "EmailVerificationTokenHash" = @tokenHash,
                       "EmailVerificationExpiresAt" = @expiresAt,
                       "UpdatedAt" = CURRENT_TIMESTAMP
                 WHERE "Id" = @accountId;
                """);
            AddParameter(update, "tokenHash", tokenHash);
            AddParameter(update, "expiresAt", expiresAt);
            AddParameter(update, "accountId", accountId);
            await update.ExecuteNonQueryAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new(EmailVerificationIssueStatus.Issued, email);
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

    public async Task ClearIssuedTokenAsync(
        Guid accountId,
        string tokenHash,
        CancellationToken cancellationToken = default)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = await OpenIfNeededAsync(connection, cancellationToken);
        try
        {
            await using var command = CreateCommand(connection, null, """
                UPDATE user_accounts
                   SET "EmailVerificationTokenHash" = NULL,
                       "EmailVerificationExpiresAt" = NULL,
                       "UpdatedAt" = CURRENT_TIMESTAMP
                 WHERE "Id" = @accountId
                   AND "EmailVerificationTokenHash" = @tokenHash;
                """);
            AddParameter(command, "accountId", accountId);
            AddParameter(command, "tokenHash", tokenHash);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

    public async Task<EmailVerificationConfirmStatus> ConfirmAsync(
        string tokenHash,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldClose = await OpenIfNeededAsync(connection, cancellationToken);
        try
        {
            await using var command = CreateCommand(connection, null, """
                UPDATE user_accounts
                   SET "EmailVerified" = TRUE,
                       "EmailVerificationTokenHash" = NULL,
                       "EmailVerificationExpiresAt" = NULL,
                       "UpdatedAt" = CURRENT_TIMESTAMP
                 WHERE "EmailVerificationTokenHash" = @tokenHash
                   AND "EmailVerificationExpiresAt" > @now
                   AND "IsActive" = TRUE
                   AND "EmailVerified" = FALSE;
                """);
            AddParameter(command, "tokenHash", tokenHash);
            AddParameter(command, "now", now);
            return await command.ExecuteNonQueryAsync(cancellationToken) == 1
                ? EmailVerificationConfirmStatus.Confirmed
                : EmailVerificationConfirmStatus.InvalidOrExpired;
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

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
}
