using OpmWiki.Application.EmailVerification;

namespace OpmWiki.Application.Abstractions;

public interface IEmailVerificationRepository
{
    Task<ContactVerificationState?> GetStateAsync(
        Guid accountId,
        CancellationToken cancellationToken = default);

    Task<EmailVerificationIssueResult> TryIssueAsync(
        Guid accountId,
        string tokenHash,
        DateTimeOffset expiresAt,
        DateTimeOffset recentExpiryThreshold,
        CancellationToken cancellationToken = default);

    Task ClearIssuedTokenAsync(
        Guid accountId,
        string tokenHash,
        CancellationToken cancellationToken = default);

    Task<EmailVerificationConfirmStatus> ConfirmAsync(
        string tokenHash,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}

public interface IEmailVerificationDelivery
{
    Task<bool> SendAsync(
        string email,
        string verificationUrl,
        string idempotencyKey,
        CancellationToken cancellationToken = default);
}
