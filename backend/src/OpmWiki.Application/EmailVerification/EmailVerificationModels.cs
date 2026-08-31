namespace OpmWiki.Application.EmailVerification;

public sealed class EmailVerificationOptions
{
    public string PublicAppUrl { get; set; } = string.Empty;
    public int TokenLifetimeMinutes { get; set; } = 30;
    public int MinimumResendSeconds { get; set; } = 60;
    public bool ExposeTestUrl { get; set; }

    public int EffectiveTokenLifetimeMinutes => Math.Clamp(TokenLifetimeMinutes, 10, 60);
    public int EffectiveMinimumResendSeconds => Math.Clamp(MinimumResendSeconds, 30, 600);
}

public enum EmailVerificationIssueStatus
{
    Issued,
    AlreadyVerified,
    Throttled,
    AccountUnavailable,
}

public sealed record EmailVerificationIssueResult(
    EmailVerificationIssueStatus Status,
    string Email = "");

public enum EmailVerificationConfirmStatus
{
    Confirmed,
    InvalidOrExpired,
}

public enum EmailVerificationRequestStatus
{
    Accepted,
    AlreadyVerified,
    Throttled,
    DeliveryUnavailable,
}

public sealed record EmailVerificationRequestResult(
    EmailVerificationRequestStatus Status,
    bool Verified,
    string? VerificationUrl = null);

public sealed record ConfirmEmailVerificationRequest(string Token);

public sealed record EmailVerificationResponse(
    string Message,
    bool Verified,
    string? VerificationUrl = null);

public sealed record ContactVerificationState(
    bool EmailVerified,
    bool PhoneVerified)
{
    public bool HasVerifiedContact => EmailVerified || PhoneVerified;
}
