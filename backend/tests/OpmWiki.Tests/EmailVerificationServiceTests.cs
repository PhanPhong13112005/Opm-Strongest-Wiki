using System.Security.Cryptography;
using System.Text;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.EmailVerification;

namespace OpmWiki.Tests;

public sealed class EmailVerificationServiceTests
{
    private static readonly Guid AccountId = Guid.Parse("00000000-0000-0000-0000-000000000201");

    [Fact]
    public async Task Request_StoresOnlyHashAndSendsOneTimeLink()
    {
        var harness = CreateHarness();
        harness.Repository.Add(AccountId, "user@gmail.com");

        var requested = await harness.Service.RequestAsync(AccountId, "http://localhost:5180");
        Assert.Equal(EmailVerificationRequestStatus.Accepted, requested.Status);
        Assert.False(requested.Verified);
        Assert.StartsWith("https://wiki.example/verify-email?token=", requested.VerificationUrl);
        Assert.Equal(requested.VerificationUrl, Assert.Single(harness.Delivery.Urls));

        var token = TokenFrom(requested.VerificationUrl!);
        Assert.NotEqual(token, harness.Repository.StoredHash);
        Assert.Equal(EmailVerificationTokens.Hash(token), harness.Repository.StoredHash);
        Assert.DoesNotContain(token, harness.Repository.StoredHash!, StringComparison.Ordinal);

        var confirmed = await harness.Service.ConfirmAsync(token);
        Assert.Equal(EmailVerificationConfirmStatus.Confirmed, confirmed);
        Assert.True(harness.Repository.EmailVerified);
        Assert.Null(harness.Repository.StoredHash);
        Assert.Equal(EmailVerificationConfirmStatus.InvalidOrExpired,
            await harness.Service.ConfirmAsync(token));
    }

    [Fact]
    public async Task WrongExpiredAndMalformedTokensAreRejected()
    {
        var harness = CreateHarness();
        harness.Repository.Add(AccountId, "user@gmail.com");
        var requested = await harness.Service.RequestAsync(AccountId, "http://localhost:5180");
        var token = TokenFrom(requested.VerificationUrl!);

        Assert.Equal(EmailVerificationConfirmStatus.InvalidOrExpired,
            await harness.Service.ConfirmAsync(EmailVerificationTokens.Create()));
        Assert.Equal(EmailVerificationConfirmStatus.InvalidOrExpired,
            await harness.Service.ConfirmAsync("short"));
        harness.Time.UtcNow = harness.Time.UtcNow.AddMinutes(31);
        Assert.Equal(EmailVerificationConfirmStatus.InvalidOrExpired,
            await harness.Service.ConfirmAsync(token));
        Assert.False(harness.Repository.EmailVerified);
    }

    [Fact]
    public async Task ResendIsThrottledThenReplacesOldToken()
    {
        var harness = CreateHarness();
        harness.Repository.Add(AccountId, "user@gmail.com");
        var first = await harness.Service.RequestAsync(AccountId, "http://localhost:5180");
        var firstToken = TokenFrom(first.VerificationUrl!);

        var throttled = await harness.Service.RequestAsync(AccountId, "http://localhost:5180");
        Assert.Equal(EmailVerificationRequestStatus.Throttled, throttled.Status);
        Assert.Single(harness.Delivery.Urls);

        harness.Time.UtcNow = harness.Time.UtcNow.AddSeconds(61);
        var resent = await harness.Service.RequestAsync(AccountId, "http://localhost:5180");
        var secondToken = TokenFrom(resent.VerificationUrl!);
        Assert.NotEqual(firstToken, secondToken);
        Assert.Equal(2, harness.Delivery.Urls.Count);
        Assert.Equal(EmailVerificationConfirmStatus.InvalidOrExpired,
            await harness.Service.ConfirmAsync(firstToken));
        Assert.Equal(EmailVerificationConfirmStatus.Confirmed,
            await harness.Service.ConfirmAsync(secondToken));
    }

    [Fact]
    public async Task AlreadyVerifiedMissingAndInactiveAccountsDoNotSendEmail()
    {
        var harness = CreateHarness();
        harness.Repository.Add(AccountId, "verified@gmail.com", verified: true);
        var already = await harness.Service.RequestAsync(AccountId, "http://localhost:5180");
        Assert.Equal(EmailVerificationRequestStatus.AlreadyVerified, already.Status);
        Assert.True(already.Verified);

        var missing = await harness.Service.RequestAsync(Guid.NewGuid(), "http://localhost:5180");
        Assert.Equal(EmailVerificationRequestStatus.Accepted, missing.Status);
        Assert.False(missing.Verified);

        var inactiveId = Guid.NewGuid();
        harness.Repository.Add(inactiveId, "inactive@gmail.com", active: false);
        var inactive = await harness.Service.RequestAsync(inactiveId, "http://localhost:5180");
        Assert.Equal(EmailVerificationRequestStatus.Accepted, inactive.Status);
        Assert.Empty(harness.Delivery.Urls);
    }

    [Fact]
    public async Task DeliveryFailureClearsMatchingTokenWithoutLeakingIt()
    {
        var harness = CreateHarness(exposeTestUrl: false);
        harness.Repository.Add(AccountId, "user@gmail.com");
        harness.Delivery.Fail = true;

        var result = await harness.Service.RequestAsync(AccountId, "http://localhost:5180");
        Assert.Equal(EmailVerificationRequestStatus.DeliveryUnavailable, result.Status);
        Assert.Null(result.VerificationUrl);
        Assert.Null(harness.Repository.StoredHash);
    }

    [Fact]
    public void TokenGenerator_IsCryptographicallySizedAndHashIsDeterministic()
    {
        var first = EmailVerificationTokens.Create();
        var second = EmailVerificationTokens.Create();
        Assert.NotEqual(first, second);
        Assert.True(first.Length >= 43);
        Assert.Equal(64, EmailVerificationTokens.Hash(first).Length);
        Assert.Equal(EmailVerificationTokens.Hash(first), EmailVerificationTokens.Hash(first));
    }

    private static Harness CreateHarness(bool exposeTestUrl = true)
    {
        var time = new TestTimeProvider(DateTimeOffset.Parse("2026-08-15T12:00:00Z"));
        var repository = new FakeVerificationRepository();
        var delivery = new FakeDelivery();
        var options = new EmailVerificationOptions
        {
            PublicAppUrl = "https://wiki.example",
            TokenLifetimeMinutes = 30,
            MinimumResendSeconds = 60,
            ExposeTestUrl = exposeTestUrl,
        };
        return new(
            new EmailVerificationService(repository, delivery, options, time),
            repository,
            delivery,
            time);
    }

    private static string TokenFrom(string verificationUrl) =>
        Uri.UnescapeDataString(new Uri(verificationUrl).Query.Split("token=", 2)[1]);

    private sealed record Harness(
        EmailVerificationService Service,
        FakeVerificationRepository Repository,
        FakeDelivery Delivery,
        TestTimeProvider Time);

    private sealed class FakeDelivery : IEmailVerificationDelivery
    {
        public List<string> Urls { get; } = [];
        public bool Fail { get; set; }

        public Task<bool> SendAsync(
            string email,
            string verificationUrl,
            string idempotencyKey,
            CancellationToken cancellationToken = default)
        {
            if (Fail) throw new HttpRequestException("provider unavailable");
            Urls.Add(verificationUrl);
            return Task.FromResult(true);
        }
    }

    private sealed class FakeVerificationRepository : IEmailVerificationRepository
    {
        private readonly object sync = new();
        private readonly Dictionary<Guid, Account> accounts = [];

        public string? StoredHash => accounts.GetValueOrDefault(AccountId)?.TokenHash;
        public bool EmailVerified => accounts.GetValueOrDefault(AccountId)?.Verified == true;

        public void Add(Guid id, string email, bool verified = false, bool active = true) =>
            accounts[id] = new(email, active, verified);

        public Task<ContactVerificationState?> GetStateAsync(
            Guid accountId,
            CancellationToken cancellationToken = default)
        {
            lock (sync)
            {
                return Task.FromResult<ContactVerificationState?>(
                    accounts.TryGetValue(accountId, out var account) && account.Active
                        ? new(account.Verified, false)
                        : null);
            }
        }

        public Task<EmailVerificationIssueResult> TryIssueAsync(
            Guid accountId,
            string tokenHash,
            DateTimeOffset expiresAt,
            DateTimeOffset recentExpiryThreshold,
            CancellationToken cancellationToken = default)
        {
            lock (sync)
            {
                if (!accounts.TryGetValue(accountId, out var account) || !account.Active)
                    return Task.FromResult(new EmailVerificationIssueResult(
                        EmailVerificationIssueStatus.AccountUnavailable));
                if (account.Verified)
                    return Task.FromResult(new EmailVerificationIssueResult(
                        EmailVerificationIssueStatus.AlreadyVerified, account.Email));
                if (account.TokenHash is not null && account.ExpiresAt > recentExpiryThreshold)
                    return Task.FromResult(new EmailVerificationIssueResult(
                        EmailVerificationIssueStatus.Throttled, account.Email));
                account.TokenHash = tokenHash;
                account.ExpiresAt = expiresAt;
                return Task.FromResult(new EmailVerificationIssueResult(
                    EmailVerificationIssueStatus.Issued, account.Email));
            }
        }

        public Task ClearIssuedTokenAsync(
            Guid accountId,
            string tokenHash,
            CancellationToken cancellationToken = default)
        {
            lock (sync)
            {
                if (accounts.TryGetValue(accountId, out var account) &&
                    FixedTimeEquals(account.TokenHash, tokenHash))
                {
                    account.TokenHash = null;
                    account.ExpiresAt = null;
                }
                return Task.CompletedTask;
            }
        }

        public Task<EmailVerificationConfirmStatus> ConfirmAsync(
            string tokenHash,
            DateTimeOffset now,
            CancellationToken cancellationToken = default)
        {
            lock (sync)
            {
                var account = accounts.Values.SingleOrDefault(candidate =>
                    candidate.Active && !candidate.Verified && candidate.ExpiresAt > now &&
                    FixedTimeEquals(candidate.TokenHash, tokenHash));
                if (account is null)
                    return Task.FromResult(EmailVerificationConfirmStatus.InvalidOrExpired);
                account.Verified = true;
                account.TokenHash = null;
                account.ExpiresAt = null;
                return Task.FromResult(EmailVerificationConfirmStatus.Confirmed);
            }
        }

        private static bool FixedTimeEquals(string? left, string right)
        {
            if (left is null) return false;
            var leftBytes = Encoding.UTF8.GetBytes(left);
            var rightBytes = Encoding.UTF8.GetBytes(right);
            return leftBytes.Length == rightBytes.Length &&
                   CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
        }

        private sealed class Account(string email, bool active, bool verified)
        {
            public string Email { get; } = email;
            public bool Active { get; } = active;
            public bool Verified { get; set; } = verified;
            public string? TokenHash { get; set; }
            public DateTimeOffset? ExpiresAt { get; set; }
        }
    }
}
