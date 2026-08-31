using OpmWiki.Application.TierRanking;

namespace OpmWiki.Application.Abstractions;

public interface ITierRankingRepository
{
    Task<TierRankingPublicDto> GetPublicAsync(
        VoteMonth voteMonth,
        CancellationToken cancellationToken = default);

    Task<TierAccountVoteState?> GetMineAsync(
        Guid accountId,
        VoteMonth voteMonth,
        CancellationToken cancellationToken = default);

    Task<TierVoteStoreResult> ConfirmVoteAsync(
        TierVoteStoreRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminTierRankingStatsDto> GetAdminStatsAsync(
        VoteMonth voteMonth,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<TierAdminMutationResult> UpdateBaseVotesAsync(
        string characterId,
        int baseVotes,
        string expectedVersion,
        string updatedBySubject,
        VoteMonth voteMonth,
        CancellationToken cancellationToken = default);
}
