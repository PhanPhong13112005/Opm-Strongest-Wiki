using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;

namespace OpmWiki.Application.TierRanking;

public sealed class TierRankingService(
    ITierRankingRepository repository,
    TimeProvider timeProvider)
{
    public VoteMonth CurrentVoteMonth => VoteMonth.FromInstant(timeProvider.GetUtcNow());

    public Task<TierRankingPublicDto> GetPublicAsync(CancellationToken cancellationToken = default) =>
        repository.GetPublicAsync(CurrentVoteMonth, cancellationToken);

    public async Task<TierServiceResult<TierRankingMineDto>> GetMineAsync(
        Guid accountId,
        CancellationToken cancellationToken = default)
    {
        if (accountId == Guid.Empty)
            return new(TierServiceStatus.AccountUnavailable);

        var period = CurrentVoteMonth;
        var state = await repository.GetMineAsync(accountId, period, cancellationToken);
        if (state is null || !state.IsActive)
            return new(TierServiceStatus.AccountUnavailable);

        var verified = state.EmailVerified || state.PhoneVerified;
        return new(TierServiceStatus.Success, new TierRankingMineDto(
            state.CharacterIds,
            period.Value,
            period.ResetsAt,
            TierVotePolicy.Limit(state.EmailVerified, state.PhoneVerified),
            verified,
            state.EmailVerified,
            state.PhoneVerified));
    }

    public async Task<TierServiceResult<TierRankingVoteResponseDto>> VoteAsync(
        Guid accountId,
        string characterId,
        bool active,
        CancellationToken cancellationToken = default)
    {
        if (!active) return new(TierServiceStatus.ImmutableVote);
        var normalizedCharacterId = characterId?.Trim() ?? string.Empty;
        if (accountId == Guid.Empty || normalizedCharacterId.Length is < 1 or > 80 ||
            normalizedCharacterId.Contains('/') || normalizedCharacterId.Contains('\\'))
            return new(TierServiceStatus.InvalidInput);

        var period = CurrentVoteMonth;
        var stored = await repository.ConfirmVoteAsync(new TierVoteStoreRequest(
            accountId,
            normalizedCharacterId,
            period.Value,
            TierVotePolicy.EligibleRarities,
            TierVotePolicy.UnverifiedVotesPerRarity,
            TierVotePolicy.VerifiedVotesPerRarity), cancellationToken);

        var serviceStatus = stored.Status switch
        {
            TierVoteStoreStatus.Success => TierServiceStatus.Success,
            TierVoteStoreStatus.AccountUnavailable => TierServiceStatus.AccountUnavailable,
            TierVoteStoreStatus.CharacterNotFound => TierServiceStatus.CharacterNotFound,
            TierVoteStoreStatus.InvalidRarity => TierServiceStatus.InvalidInput,
            TierVoteStoreStatus.QuotaExceeded => TierServiceStatus.QuotaExceeded,
            _ => TierServiceStatus.Conflict,
        };
        if (serviceStatus == TierServiceStatus.QuotaExceeded)
        {
            var conflictLimit = TierVotePolicy.Limit(stored.EmailVerified, stored.PhoneVerified);
            return new(serviceStatus, new TierRankingVoteResponseDto(
                stored.CharacterId,
                true,
                period.Value,
                period.ResetsAt,
                stored.Rarity,
                stored.CharacterVotes,
                stored.TotalVotes,
                stored.TotalVoters,
                stored.SelectedInRarity,
                0,
                conflictLimit,
                stored.EmailVerified || stored.PhoneVerified,
                stored.EmailVerified,
                stored.PhoneVerified));
        }
        if (serviceStatus != TierServiceStatus.Success)
            return new(serviceStatus);

        var maxVotes = TierVotePolicy.Limit(stored.EmailVerified, stored.PhoneVerified);
        return new(TierServiceStatus.Success, new TierRankingVoteResponseDto(
            stored.CharacterId,
            true,
            period.Value,
            period.ResetsAt,
            stored.Rarity,
            stored.CharacterVotes,
            stored.TotalVotes,
            stored.TotalVoters,
            stored.SelectedInRarity,
            Math.Max(0, maxVotes - stored.SelectedInRarity),
            maxVotes,
            stored.EmailVerified || stored.PhoneVerified,
            stored.EmailVerified,
            stored.PhoneVerified));
    }

    public async Task<TierServiceResult<AdminTierRankingStatsDto>> GetAdminStatsAsync(
        string? voteMonth,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var period = string.IsNullOrWhiteSpace(voteMonth)
            ? CurrentVoteMonth
            : VoteMonth.TryParse(voteMonth, out var parsed) ? parsed : default;
        if (period == default || page < 1 || pageSize is < 1 or > 100)
            return new(TierServiceStatus.InvalidInput);

        return new(TierServiceStatus.Success,
            await repository.GetAdminStatsAsync(period, page, pageSize, cancellationToken));
    }

    public async Task<TierServiceResult<AdminTierRankingCharacterDto>> UpdateBaseVotesAsync(
        string characterId,
        UpdateBaseVotesRequest request,
        string updatedBySubject,
        CancellationToken cancellationToken = default)
    {
        var normalizedId = characterId?.Trim() ?? string.Empty;
        if (normalizedId.Length is < 1 or > 80 || request.BaseVotes < 0 ||
            !OpaqueVersion.TryGetSequence(request.ExpectedVersion, out _))
            return new(TierServiceStatus.InvalidInput);

        var result = await repository.UpdateBaseVotesAsync(
            normalizedId,
            request.BaseVotes,
            request.ExpectedVersion,
            updatedBySubject,
            CurrentVoteMonth,
            cancellationToken);
        return result.Status switch
        {
            TierAdminMutationStatus.Success => new(TierServiceStatus.Success, result.Character),
            TierAdminMutationStatus.NotFound => new(TierServiceStatus.CharacterNotFound),
            TierAdminMutationStatus.Conflict => new(TierServiceStatus.Conflict),
            _ => new(TierServiceStatus.Conflict),
        };
    }
}
