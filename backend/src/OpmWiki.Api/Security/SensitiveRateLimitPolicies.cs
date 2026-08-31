using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace OpmWiki.Api.Security;

public static class SensitiveRateLimitPolicies
{
    public const string Login = "auth-login";
    public const string Register = "auth-register";
    public const string ForgotPassword = "auth-forgot-password";
    public const string VerificationRequest = "auth-verification-request";
    public const string VerificationConfirm = "auth-verification-confirm";
    public const string TierVote = "tier-vote";

    public static readonly IReadOnlyDictionary<string, (int PermitLimit, TimeSpan Window)> Settings =
        new Dictionary<string, (int, TimeSpan)>
        {
            [Login] = (5, TimeSpan.FromMinutes(1)),
            [Register] = (3, TimeSpan.FromMinutes(10)),
            [ForgotPassword] = (3, TimeSpan.FromMinutes(10)),
            [VerificationRequest] = (2, TimeSpan.FromMinutes(5)),
            [VerificationConfirm] = (10, TimeSpan.FromMinutes(10)),
            [TierVote] = (30, TimeSpan.FromMinutes(1)),
        };

    public static void Configure(RateLimiterOptions options)
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        AddIpPolicy(options, Login);
        AddIpPolicy(options, Register);
        AddIpPolicy(options, ForgotPassword);
        AddIpPolicy(options, VerificationConfirm);
        AddIdentityPolicy(options, VerificationRequest);
        AddIdentityPolicy(options, TierVote);
    }

    private static void AddIpPolicy(RateLimiterOptions options, string name)
    {
        var setting = Settings[name];
        options.AddPolicy(name, context => FixedWindow(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            setting));
    }

    private static void AddIdentityPolicy(RateLimiterOptions options, string name)
    {
        var setting = Settings[name];
        options.AddPolicy(name, context => FixedWindow(
            context.User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            setting));
    }

    private static RateLimitPartition<string> FixedWindow(
        string partitionKey,
        (int PermitLimit, TimeSpan Window) setting) =>
        RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = setting.PermitLimit,
            Window = setting.Window,
            QueueLimit = 0,
            AutoReplenishment = true,
        });
}
