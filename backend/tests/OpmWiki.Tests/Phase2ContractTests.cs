using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OpmWiki.Api.Controllers;
using OpmWiki.Api.Security;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;
using OpmWiki.Application.EmailVerification;
using OpmWiki.Application.TierRanking;

namespace OpmWiki.Tests;

public sealed class Phase2ContractTests
{
    [Fact]
    public void SharedFixtureMatchesDotNetConstantsAndCamelCaseDtos()
    {
        using var fixture = JsonDocument.Parse(File.ReadAllText(
            Path.Combine(FindRepositoryRoot(), "contracts", "phase2-api-contract.json")));
        var root = fixture.RootElement;
        Assert.Equal(VoteMonth.TimeZoneId, root.GetProperty("timeZone").GetString());
        Assert.Equal(TierVotePolicy.UnverifiedVotesPerRarity,
            root.GetProperty("quota").GetProperty("unverified").GetInt32());
        Assert.Equal(TierVotePolicy.VerifiedVotesPerRarity,
            root.GetProperty("quota").GetProperty("verified").GetInt32());
        Assert.Equal(
            root.GetProperty("eligibleRarities").EnumerateArray().Select(x => x.GetString()!).ToHashSet(),
            TierVotePolicy.EligibleRarities.ToHashSet());

        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        AssertFields(root, "tierPublic", JsonSerializer.SerializeToElement(
            new TierRankingPublicDto("2026-08", DateTimeOffset.UtcNow, 1, 1, []), options));
        AssertFields(root, "tierMine", JsonSerializer.SerializeToElement(
            new TierRankingMineDto([], "2026-08", DateTimeOffset.UtcNow, 1, false, false, false), options));
        AssertFields(root, "tierVote", JsonSerializer.SerializeToElement(
            new TierRankingVoteResponseDto(
                "character", true, "2026-08", DateTimeOffset.UtcNow, "UR", 1, 1, 1,
                1, 0, 1, false, false, false), options));
        AssertFields(root, "adminTierCharacter", JsonSerializer.SerializeToElement(
            new AdminTierRankingCharacterDto(
                "character", "vi", "en", "UR", "SS", 1, 2, 3,
                OpaqueVersion.FromSequence(1)), options));
    }

    [Fact]
    public void ControllersExposeExactRoutesRolesAndSensitiveRatePolicies()
    {
        Assert.Equal("api/tier-rankings",
            typeof(TierRankingsController).GetCustomAttribute<RouteAttribute>()!.Template);
        Assert.Equal("api/auth/email-verification",
            typeof(EmailVerificationController).GetCustomAttribute<RouteAttribute>()!.Template);
        AssertAdminOnly<AdminTierRankingController>();
        AssertAdminOnly<AdminCommunityController>();

        AssertPolicy<AuthController>(nameof(AuthController.Login), SensitiveRateLimitPolicies.Login);
        AssertPolicy<AuthController>(nameof(AuthController.Register), SensitiveRateLimitPolicies.Register);
        AssertPolicy<AuthController>(nameof(AuthController.ForgotPassword), SensitiveRateLimitPolicies.ForgotPassword);
        AssertPolicy<EmailVerificationController>(
            nameof(EmailVerificationController.RequestVerification),
            SensitiveRateLimitPolicies.VerificationRequest);
        AssertPolicy<EmailVerificationController>(
            nameof(EmailVerificationController.Confirm),
            SensitiveRateLimitPolicies.VerificationConfirm);
        AssertPolicy<TierRankingsController>(
            nameof(TierRankingsController.Vote),
            SensitiveRateLimitPolicies.TierVote);
        Assert.Equal(6, SensitiveRateLimitPolicies.Settings.Count);
        Assert.All(SensitiveRateLimitPolicies.Settings.Values, setting =>
        {
            Assert.True(setting.PermitLimit > 0);
            Assert.True(setting.Window > TimeSpan.Zero);
        });
    }

    [Fact]
    public async Task MissingPhase3SchemaReturnsExplicit503BeforeRepositoryAccess()
    {
        var time = new TestTimeProvider(DateTimeOffset.Parse("2026-08-15T00:00:00Z"));
        var tierService = new TierRankingService(new ThrowingTierRepository(), time);
        var missing = new FakeCapabilities(false);

        var tier = new TierRankingsController(tierService, missing);
        var tierResult = await tier.Get(CancellationToken.None);
        AssertSchemaNotReady(tierResult.Result);

        var adminTier = new AdminTierRankingController(tierService, missing);
        var adminResult = await adminTier.Stats(cancellationToken: CancellationToken.None);
        AssertSchemaNotReady(adminResult.Result);

        var emailService = new EmailVerificationService(
            new ThrottledVerificationRepository(),
            new NoopDelivery(),
            new EmailVerificationOptions { PublicAppUrl = "https://wiki.example" },
            time);
        var email = new EmailVerificationController(emailService, missing);
        var emailResult = await email.Confirm(
            new ConfirmEmailVerificationRequest(EmailVerificationTokens.Create()),
            CancellationToken.None);
        AssertSchemaNotReady(emailResult.Result);
    }

    [Fact]
    public async Task VerificationResendThrottleMapsTo429WithoutCallingProvider()
    {
        var repository = new ThrottledVerificationRepository();
        var delivery = new NoopDelivery();
        var service = new EmailVerificationService(
            repository,
            delivery,
            new EmailVerificationOptions { PublicAppUrl = "https://wiki.example" },
            new TestTimeProvider(DateTimeOffset.Parse("2026-08-15T00:00:00Z")));
        var controller = new EmailVerificationController(service, new FakeCapabilities(true))
        {
            ControllerContext = new ControllerContext { HttpContext = AuthenticatedHttpContext() },
        };

        var result = await controller.RequestVerification(CancellationToken.None);
        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status429TooManyRequests, objectResult.StatusCode);
        Assert.Equal(0, delivery.Calls);
    }

    private static void AssertFields(JsonElement fixture, string contract, JsonElement serialized)
    {
        var expected = fixture.GetProperty("fields").GetProperty(contract)
            .EnumerateArray().Select(x => x.GetString()!).ToHashSet(StringComparer.Ordinal);
        var actual = serialized.EnumerateObject().Select(x => x.Name).ToHashSet(StringComparer.Ordinal);
        Assert.Equal(expected, actual);
    }

    private static void AssertPolicy<TController>(string methodName, string expectedPolicy)
    {
        var attribute = typeof(TController).GetMethod(methodName)!
            .GetCustomAttribute<EnableRateLimitingAttribute>();
        Assert.NotNull(attribute);
        Assert.Equal(expectedPolicy, attribute!.PolicyName);
    }

    private static void AssertAdminOnly<TController>()
    {
        var attribute = typeof(TController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attribute);
        Assert.Equal("Admin", attribute!.Roles);
    }

    private static void AssertSchemaNotReady(IActionResult? result)
    {
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, objectResult.StatusCode);
        var problem = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal("SchemaNotReady", problem.Extensions["code"]);
    }

    private static DefaultHttpContext AuthenticatedHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Request.Scheme = "https";
        context.Request.Host = new HostString("wiki.example");
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, "00000000-0000-0000-0000-000000000401"),
            new Claim(ClaimTypes.Role, "User"),
        ], "test"));
        return context;
    }

    private static string FindRepositoryRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null && !File.Exists(Path.Combine(current.FullName, "package.json")))
            current = current.Parent;
        return current?.FullName ?? throw new DirectoryNotFoundException("Repository root not found.");
    }

    private sealed class FakeCapabilities(bool available) : ISchemaCapabilityService
    {
        public Task<SchemaCapabilityResult> CheckAsync(
            SchemaCapability capability,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(available
                ? SchemaCapabilityResult.Available()
                : SchemaCapabilityResult.Missing("Phase 3 migration required."));
    }

    private sealed class NoopDelivery : IEmailVerificationDelivery
    {
        public int Calls { get; private set; }
        public Task<bool> SendAsync(
            string email,
            string verificationUrl,
            string idempotencyKey,
            CancellationToken cancellationToken = default)
        {
            Calls++;
            return Task.FromResult(true);
        }
    }

    private sealed class ThrottledVerificationRepository : IEmailVerificationRepository
    {
        public Task<ContactVerificationState?> GetStateAsync(Guid accountId, CancellationToken cancellationToken = default) =>
            Task.FromResult<ContactVerificationState?>(new(false, false));

        public Task<EmailVerificationIssueResult> TryIssueAsync(
            Guid accountId, string tokenHash, DateTimeOffset expiresAt,
            DateTimeOffset recentExpiryThreshold, CancellationToken cancellationToken = default) =>
            Task.FromResult(new EmailVerificationIssueResult(
                EmailVerificationIssueStatus.Throttled, "user@gmail.com"));

        public Task ClearIssuedTokenAsync(Guid accountId, string tokenHash, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<EmailVerificationConfirmStatus> ConfirmAsync(
            string tokenHash, DateTimeOffset now, CancellationToken cancellationToken = default) =>
            Task.FromResult(EmailVerificationConfirmStatus.InvalidOrExpired);
    }

    private sealed class ThrowingTierRepository : ITierRankingRepository
    {
        private static Exception NotCalled() => new InvalidOperationException("Repository must be gated.");
        public Task<TierRankingPublicDto> GetPublicAsync(VoteMonth voteMonth, CancellationToken cancellationToken = default) => throw NotCalled();
        public Task<TierAccountVoteState?> GetMineAsync(Guid accountId, VoteMonth voteMonth, CancellationToken cancellationToken = default) => throw NotCalled();
        public Task<TierVoteStoreResult> ConfirmVoteAsync(TierVoteStoreRequest request, CancellationToken cancellationToken = default) => throw NotCalled();
        public Task<AdminTierRankingStatsDto> GetAdminStatsAsync(VoteMonth voteMonth, int page, int pageSize, CancellationToken cancellationToken = default) => throw NotCalled();
        public Task<TierAdminMutationResult> UpdateBaseVotesAsync(string characterId, int baseVotes, string expectedVersion, string updatedBySubject, VoteMonth voteMonth, CancellationToken cancellationToken = default) => throw NotCalled();
    }
}
