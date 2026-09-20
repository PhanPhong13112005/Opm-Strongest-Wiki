using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;
using OpmWiki.Application.TierRanking;

namespace OpmWiki.Tests;

public sealed class TierRankingServiceTests
{
    private static readonly Guid UserId = Guid.Parse("00000000-0000-0000-0000-000000000101");

    [Fact]
    public void VoteMonth_UsesExactVietnamMidnightBoundaryAndUtcReset()
    {
        Assert.Equal("2026-08", VoteMonth.FromInstant(
            DateTimeOffset.Parse("2026-08-31T16:59:59.999Z")).Value);
        var september = VoteMonth.FromInstant(
            DateTimeOffset.Parse("2026-08-31T17:00:00.000Z"));
        Assert.Equal("2026-09", september.Value);
        Assert.Equal(DateTimeOffset.Parse("2026-09-30T17:00:00Z"), september.ResetsAt);
        Assert.True(VoteMonth.TryParse("2026-12", out _));
        Assert.False(VoteMonth.TryParse("2026-13", out _));
        Assert.False(VoteMonth.TryParse("08-2026", out _));
    }

    [Fact]
    public async Task PublicAndMine_ExposeFrozenCurrentMonthContractWithoutOtherAccounts()
    {
        var (service, repository, _) = CreateService();
        repository.AddAccount(UserId, emailVerified: false, phoneVerified: true);
        await service.VoteAsync(UserId, "ur-1", true);

        var publicResult = await service.GetPublicAsync();
        Assert.Equal("2026-08", publicResult.VoteMonth);
        Assert.Equal(1, publicResult.TotalVotes);
        Assert.Equal(1, publicResult.TotalVoters);
        Assert.Equal(new TierRankingVoteCountDto("ur-1", 1), Assert.Single(publicResult.Votes));

        Assert.Equal(TierServiceStatus.AccountUnavailable,
            (await service.GetMineAsync(Guid.Empty)).Status);
        var mine = (await service.GetMineAsync(UserId)).Value!;
        Assert.Equal(["ur-1"], mine.CharacterIds);
        Assert.Equal(8, mine.MaxVotesPerRarity);
        Assert.True(mine.HasVerifiedContact);
        Assert.False(mine.EmailVerified);
        Assert.True(mine.PhoneVerified);
    }

    [Fact]
    public async Task Vote_IsIdempotentImmutableAndEnforcesUnverifiedQuotaPerRarity()
    {
        var (service, repository, _) = CreateService();
        repository.AddAccount(UserId);

        var first = await service.VoteAsync(UserId, "ur-1", true);
        var repeated = await service.VoteAsync(UserId, "ur-1", true);
        Assert.Equal(TierServiceStatus.Success, first.Status);
        Assert.Equal(TierServiceStatus.Success, repeated.Status);
        Assert.Equal(1, repeated.Value!.Votes);
        Assert.Equal(1, repeated.Value.SelectedInRarity);
        Assert.Equal(0, repeated.Value.RemainingInRarity);

        Assert.Equal(TierServiceStatus.ImmutableVote,
            (await service.VoteAsync(UserId, "ur-1", false)).Status);
        var quota = await service.VoteAsync(UserId, "ur-2", true);
        Assert.Equal(TierServiceStatus.QuotaExceeded, quota.Status);
        Assert.Equal(1, quota.Value!.MaxVotesPerRarity);
        Assert.False(quota.Value.HasVerifiedContact);

        Assert.Equal(TierServiceStatus.Success,
            (await service.VoteAsync(UserId, "sr-1", true)).Status);
        Assert.Equal(TierServiceStatus.CharacterNotFound,
            (await service.VoteAsync(UserId, "missing", true)).Status);
        Assert.Equal(TierServiceStatus.InvalidInput,
            (await service.VoteAsync(UserId, "invalid-rarity", true)).Status);
        Assert.Equal(2, (await service.GetPublicAsync()).TotalVotes);
    }

    [Fact]
    public async Task VerifiedAccount_GetsEightVotesAndMonthRolloverResetsAllowance()
    {
        var (service, repository, time) = CreateService();
        repository.AddAccount(UserId, emailVerified: true);

        for (var index = 1; index <= 8; index++)
        {
            var result = await service.VoteAsync(UserId, $"ur-{index}", true);
            Assert.Equal(TierServiceStatus.Success, result.Status);
            Assert.Equal(8 - index, result.Value!.RemainingInRarity);
        }
        Assert.Equal(TierServiceStatus.QuotaExceeded,
            (await service.VoteAsync(UserId, "ur-9", true)).Status);

        time.UtcNow = DateTimeOffset.Parse("2026-08-31T17:00:00Z");
        var newMonth = await service.VoteAsync(UserId, "ur-9", true);
        Assert.Equal(TierServiceStatus.Success, newMonth.Status);
        Assert.Equal("2026-09", newMonth.Value!.VoteMonth);
        Assert.Equal(1, newMonth.Value.SelectedInRarity);
        Assert.Equal(1, (await service.GetPublicAsync()).TotalVotes);
    }

    [Fact]
    public async Task ConcurrentSameVote_IsStoredOnce()
    {
        var (service, repository, _) = CreateService();
        repository.AddAccount(UserId);

        var results = await Task.WhenAll(
            service.VoteAsync(UserId, "ur-1", true),
            service.VoteAsync(UserId, "ur-1", true));

        Assert.All(results, result => Assert.Equal(TierServiceStatus.Success, result.Status));
        Assert.Equal(1, (await service.GetPublicAsync()).TotalVotes);
        Assert.Equal(1, results[0].Value!.Votes);
        Assert.Equal(1, results[1].Value!.Votes);
    }

    [Fact]
    public async Task ConcurrentFinalQuotaSlot_AllowsExactlyOneWinner()
    {
        var (service, repository, _) = CreateService();
        repository.AddAccount(UserId, emailVerified: true);
        for (var index = 1; index <= 7; index++)
            Assert.Equal(TierServiceStatus.Success,
                (await service.VoteAsync(UserId, $"ur-{index}", true)).Status);

        var results = await Task.WhenAll(
            service.VoteAsync(UserId, "ur-8", true),
            service.VoteAsync(UserId, "ur-9", true));

        Assert.Equal(1, results.Count(result => result.Status == TierServiceStatus.Success));
        Assert.Equal(1, results.Count(result => result.Status == TierServiceStatus.QuotaExceeded));
        Assert.Equal(8, (await service.GetPublicAsync()).TotalVotes);
    }

    [Fact]
    public async Task AccountValidationAndAdminInputsFailClosed()
    {
        var (service, repository, _) = CreateService();
        repository.AddAccount(UserId, active: false);
        Assert.Equal(TierServiceStatus.AccountUnavailable,
            (await service.VoteAsync(UserId, "ur-1", true)).Status);
        Assert.Equal(TierServiceStatus.InvalidInput,
            (await service.VoteAsync(UserId, "bad/id", true)).Status);
        Assert.Equal(TierServiceStatus.InvalidInput,
            (await service.GetAdminStatsAsync("2026-99", 1, 25)).Status);
        Assert.Equal(TierServiceStatus.InvalidInput,
            (await service.GetAdminStatsAsync("2026-08", 1, 101)).Status);
        Assert.Equal(TierServiceStatus.InvalidInput,
            (await service.UpdateBaseVotesAsync("ur-1", new(-1, OpaqueVersion.FromSequence(1)), "admin:test")).Status);
        Assert.Equal(TierServiceStatus.InvalidInput,
            (await service.UpdateBaseVotesAsync("ur-1", new(1, "not-a-version"), "admin:test")).Status);
    }

    [Fact]
    public async Task AdminBaseVotes_UsesOptimisticOpaqueVersion()
    {
        var (service, repository, _) = CreateService();
        var stats = (await service.GetAdminStatsAsync("2026-08", 1, 25)).Value!;
        var character = stats.Characters.First(x => x.CharacterId == "ur-1");

        var updated = await service.UpdateBaseVotesAsync(
            "ur-1", new UpdateBaseVotesRequest(42, character.Version), "admin:test");
        Assert.Equal(TierServiceStatus.Success, updated.Status);
        Assert.Equal(42, updated.Value!.BaseVotes);
        Assert.Equal(42, updated.Value.TotalScore);
        Assert.NotEqual(character.Version, updated.Value.Version);

        var stale = await service.UpdateBaseVotesAsync(
            "ur-1", new UpdateBaseVotesRequest(99, character.Version), "admin:test");
        Assert.Equal(TierServiceStatus.Conflict, stale.Status);
        Assert.Equal(TierServiceStatus.CharacterNotFound,
            (await service.UpdateBaseVotesAsync(
                "missing", new UpdateBaseVotesRequest(1, OpaqueVersion.FromSequence(1)), "admin:test")).Status);
    }

    private static (TierRankingService Service, FakeTierRepository Repository, TestTimeProvider Time) CreateService()
    {
        var repository = new FakeTierRepository();
        var time = new TestTimeProvider(DateTimeOffset.Parse("2026-08-15T12:00:00Z"));
        return (new TierRankingService(repository, time), repository, time);
    }

    private sealed class FakeTierRepository : ITierRankingRepository
    {
        private readonly object sync = new();
        private readonly Dictionary<Guid, Account> accounts = [];
        private readonly Dictionary<(Guid UserId, string CharacterId, string Month), Vote> votes = [];
        private readonly Dictionary<string, string> rarities = Enumerable.Range(1, 10)
            .ToDictionary(index => $"ur-{index}", _ => "UR", StringComparer.Ordinal);
        private readonly Dictionary<string, (int BaseVotes, long Version)> baselines = [];

        public FakeTierRepository()
        {
            rarities["sr-1"] = "SR";
            rarities["invalid-rarity"] = "N";
            foreach (var characterId in rarities.Keys.Where(id => id != "invalid-rarity"))
                baselines[characterId] = (0, 1);
        }

        public void AddAccount(
            Guid id,
            bool emailVerified = false,
            bool phoneVerified = false,
            bool active = true) =>
            accounts[id] = new(active, emailVerified, phoneVerified);

        public Task<TierRankingPublicDto> GetPublicAsync(
            VoteMonth voteMonth,
            CancellationToken cancellationToken = default)
        {
            lock (sync)
            {
                var current = votes.Values.Where(vote => vote.Month == voteMonth.Value).ToArray();
                var rows = current.GroupBy(vote => vote.CharacterId)
                    .Select(group => new TierRankingVoteCountDto(group.Key, group.Count()))
                    .OrderByDescending(row => row.Votes)
                    .ThenBy(row => row.CharacterId)
                    .ToArray();
                return Task.FromResult(new TierRankingPublicDto(
                    voteMonth.Value,
                    voteMonth.ResetsAt,
                    current.Length,
                    current.Select(vote => vote.UserId).Distinct().Count(),
                    rows));
            }
        }

        public Task<TierAccountVoteState?> GetMineAsync(
            Guid accountId,
            VoteMonth voteMonth,
            CancellationToken cancellationToken = default)
        {
            lock (sync)
            {
                if (!accounts.TryGetValue(accountId, out var account))
                    return Task.FromResult<TierAccountVoteState?>(null);
                var ids = votes.Values
                    .Where(vote => vote.UserId == accountId && vote.Month == voteMonth.Value)
                    .Select(vote => vote.CharacterId)
                    .Order()
                    .ToArray();
                return Task.FromResult<TierAccountVoteState?>(new(
                    account.Active, account.EmailVerified, account.PhoneVerified, ids));
            }
        }

        public Task<TierVoteStoreResult> ConfirmVoteAsync(
            TierVoteStoreRequest request,
            CancellationToken cancellationToken = default)
        {
            lock (sync)
            {
                if (!accounts.TryGetValue(request.AccountId, out var account) || !account.Active)
                    return Task.FromResult(Empty(TierVoteStoreStatus.AccountUnavailable, request.CharacterId));
                if (!rarities.TryGetValue(request.CharacterId, out var rarity))
                    return Task.FromResult(Empty(TierVoteStoreStatus.CharacterNotFound, request.CharacterId));
                if (!request.EligibleRarities.Contains(rarity))
                    return Task.FromResult(Empty(TierVoteStoreStatus.InvalidRarity, request.CharacterId, rarity));

                var key = (request.AccountId, request.CharacterId, request.VoteMonth);
                var selected = votes.Values.Count(vote =>
                    vote.UserId == request.AccountId && vote.Month == request.VoteMonth && vote.Rarity == rarity);
                var limit = account.EmailVerified || account.PhoneVerified
                    ? request.VerifiedLimit
                    : request.UnverifiedLimit;
                if (!votes.ContainsKey(key))
                {
                    if (selected >= limit)
                        return Task.FromResult(new TierVoteStoreResult(
                            TierVoteStoreStatus.QuotaExceeded,
                            request.CharacterId,
                            rarity,
                            0, 0, 0, selected,
                            account.EmailVerified,
                            account.PhoneVerified));
                    votes[key] = new(request.AccountId, request.CharacterId, request.VoteMonth, rarity);
                    selected++;
                }

                var current = votes.Values.Where(vote => vote.Month == request.VoteMonth).ToArray();
                return Task.FromResult(new TierVoteStoreResult(
                    TierVoteStoreStatus.Success,
                    request.CharacterId,
                    rarity,
                    current.Count(vote => vote.CharacterId == request.CharacterId),
                    current.Length,
                    current.Select(vote => vote.UserId).Distinct().Count(),
                    selected,
                    account.EmailVerified,
                    account.PhoneVerified));
            }
        }

        public Task<AdminTierRankingStatsDto> GetAdminStatsAsync(
            VoteMonth voteMonth,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            lock (sync)
            {
                var characters = baselines.OrderBy(row => row.Key)
                    .Skip((page - 1) * pageSize).Take(pageSize)
                    .Select(row =>
                    {
                        var community = votes.Values.Count(vote =>
                            vote.Month == voteMonth.Value && vote.CharacterId == row.Key);
                        return new AdminTierRankingCharacterDto(
                            row.Key, row.Key + " vi", row.Key + " en", rarities[row.Key], "SS",
                            row.Value.BaseVotes, community, row.Value.BaseVotes + community,
                            OpaqueVersion.FromSequence(row.Value.Version));
                    }).ToArray();
                var current = votes.Values.Where(vote => vote.Month == voteMonth.Value).ToArray();
                return Task.FromResult(new AdminTierRankingStatsDto(
                    voteMonth.Value, voteMonth.ResetsAt, page, pageSize, baselines.Count,
                    current.Length, current.Select(vote => vote.UserId).Distinct().Count(), characters));
            }
        }

        public Task<TierAdminMutationResult> UpdateBaseVotesAsync(
            string characterId,
            int baseVotes,
            string expectedVersion,
            string updatedBySubject,
            VoteMonth voteMonth,
            CancellationToken cancellationToken = default)
        {
            lock (sync)
            {
                if (!baselines.TryGetValue(characterId, out var current))
                    return Task.FromResult(new TierAdminMutationResult(TierAdminMutationStatus.NotFound, null));
                if (!OpaqueVersion.TryGetSequence(expectedVersion, out var expected) || expected != current.Version)
                    return Task.FromResult(new TierAdminMutationResult(TierAdminMutationStatus.Conflict, null));
                var next = (baseVotes, current.Version + 1);
                baselines[characterId] = next;
                var community = votes.Values.Count(vote =>
                    vote.Month == voteMonth.Value && vote.CharacterId == characterId);
                return Task.FromResult(new TierAdminMutationResult(
                    TierAdminMutationStatus.Success,
                    new AdminTierRankingCharacterDto(
                        characterId, characterId + " vi", characterId + " en", rarities[characterId], "SS",
                        next.baseVotes, community, next.baseVotes + community,
                        OpaqueVersion.FromSequence(next.Item2))));
            }
        }

        private static TierVoteStoreResult Empty(
            TierVoteStoreStatus status,
            string characterId,
            string rarity = "") =>
            new(status, characterId, rarity, 0, 0, 0, 0, false, false);

        private sealed record Account(bool Active, bool EmailVerified, bool PhoneVerified);
        private sealed record Vote(Guid UserId, string CharacterId, string Month, string Rarity);
    }
}
