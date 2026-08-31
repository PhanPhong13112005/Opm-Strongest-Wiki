using OpmWiki.Application.Abstractions;

namespace OpmWiki.Application.EmailVerification;

public sealed class EmailVerificationService(
    IEmailVerificationRepository repository,
    IEmailVerificationDelivery delivery,
    EmailVerificationOptions options,
    TimeProvider timeProvider)
{
    public async Task<EmailVerificationRequestResult> RequestAsync(
        Guid accountId,
        string fallbackOrigin,
        CancellationToken cancellationToken = default)
    {
        if (accountId == Guid.Empty)
            return new(EmailVerificationRequestStatus.Accepted, false);

        var now = timeProvider.GetUtcNow();
        var expiresAt = now.AddMinutes(options.EffectiveTokenLifetimeMinutes);
        var recentExpiryThreshold = expiresAt.AddSeconds(-options.EffectiveMinimumResendSeconds);
        var token = EmailVerificationTokens.Create();
        var tokenHash = EmailVerificationTokens.Hash(token);
        var issue = await repository.TryIssueAsync(
            accountId,
            tokenHash,
            expiresAt,
            recentExpiryThreshold,
            cancellationToken);

        if (issue.Status == EmailVerificationIssueStatus.AlreadyVerified)
            return new(EmailVerificationRequestStatus.AlreadyVerified, true);
        if (issue.Status == EmailVerificationIssueStatus.Throttled)
            return new(EmailVerificationRequestStatus.Throttled, false);
        if (issue.Status == EmailVerificationIssueStatus.AccountUnavailable)
            return new(EmailVerificationRequestStatus.Accepted, false);

        var origin = ResolveOrigin(fallbackOrigin);
        var verificationUrl = $"{origin}/verify-email?token={Uri.EscapeDataString(token)}";
        try
        {
            var delivered = await delivery.SendAsync(
                issue.Email,
                verificationUrl,
                $"email-verification-{accountId:N}-{tokenHash[..20]}",
                cancellationToken);
            if (!delivered && !options.ExposeTestUrl)
            {
                await repository.ClearIssuedTokenAsync(accountId, tokenHash, cancellationToken);
                return new(EmailVerificationRequestStatus.DeliveryUnavailable, false);
            }
        }
        catch
        {
            await repository.ClearIssuedTokenAsync(accountId, tokenHash, cancellationToken);
            return new(EmailVerificationRequestStatus.DeliveryUnavailable, false);
        }

        return new(
            EmailVerificationRequestStatus.Accepted,
            false,
            options.ExposeTestUrl ? verificationUrl : null);
    }

    public async Task<EmailVerificationConfirmStatus> ConfirmAsync(
        string? token,
        CancellationToken cancellationToken = default)
    {
        var normalized = token?.Trim() ?? string.Empty;
        if (normalized.Length is < 32 or > 200)
            return EmailVerificationConfirmStatus.InvalidOrExpired;

        return await repository.ConfirmAsync(
            EmailVerificationTokens.Hash(normalized),
            timeProvider.GetUtcNow(),
            cancellationToken);
    }

    private string ResolveOrigin(string fallbackOrigin)
    {
        var configured = options.PublicAppUrl.Trim().TrimEnd('/');
        var fallback = fallbackOrigin.Trim().TrimEnd('/');
        var origin = configured.Length > 0 ? configured : fallback;
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var parsed) ||
            parsed.Scheme is not ("http" or "https"))
            throw new InvalidOperationException("A valid PublicAppUrl is required for verification links.");
        return origin;
    }
}
