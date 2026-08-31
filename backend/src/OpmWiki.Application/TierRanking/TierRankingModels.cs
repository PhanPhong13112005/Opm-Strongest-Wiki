using System.ComponentModel.DataAnnotations;

namespace OpmWiki.Application.TierRanking;

public static class TierVotePolicy
{
    public const int UnverifiedVotesPerRarity = 1;
    public const int VerifiedVotesPerRarity = 8;
    public static readonly IReadOnlySet<string> EligibleRarities =
        new HashSet<string>(["UR+", "UR", "SSR+", "SSR", "SR", "R"], StringComparer.Ordinal);

    public static int Limit(bool emailVerified, bool phoneVerified) =>
        emailVerified || phoneVerified ? VerifiedVotesPerRarity : UnverifiedVotesPerRarity;
}

public sealed record TierRankingVoteCountDto(string CharacterId, int Votes);

public sealed record TierRankingPublicDto(
    string VoteMonth,
    DateTimeOffset ResetsAt,
    int TotalVotes,
    int TotalVoters,
    IReadOnlyList<TierRankingVoteCountDto> Votes);

public sealed record TierRankingMineDto(
    IReadOnlyList<string> CharacterIds,
    string VoteMonth,
    DateTimeOffset ResetsAt,
    int MaxVotesPerRarity,
    bool HasVerifiedContact,
    bool EmailVerified,
    bool PhoneVerified);

public sealed record TierRankingVoteRequest(
    [param: Required(ErrorMessage = "Vote confirmation is required.")]
    bool? Active);

public sealed record TierRankingVoteResponseDto(
    string CharacterId,
    bool Active,
    string VoteMonth,
    DateTimeOffset ResetsAt,
    string Rarity,
    int Votes,
    int TotalVotes,
    int TotalVoters,
    int SelectedInRarity,
    int RemainingInRarity,
    int MaxVotesPerRarity,
    bool HasVerifiedContact,
    bool EmailVerified,
    bool PhoneVerified);

public sealed record TierAccountVoteState(
    bool IsActive,
    bool EmailVerified,
    bool PhoneVerified,
    IReadOnlyList<string> CharacterIds);

public enum TierVoteStoreStatus
{
    Success,
    AccountUnavailable,
    CharacterNotFound,
    InvalidRarity,
    QuotaExceeded,
}

public sealed record TierVoteStoreResult(
    TierVoteStoreStatus Status,
    string CharacterId,
    string Rarity,
    int CharacterVotes,
    int TotalVotes,
    int TotalVoters,
    int SelectedInRarity,
    bool EmailVerified,
    bool PhoneVerified);

public sealed record TierVoteStoreRequest(
    Guid AccountId,
    string CharacterId,
    string VoteMonth,
    IReadOnlySet<string> EligibleRarities,
    int UnverifiedLimit,
    int VerifiedLimit);

public sealed record AdminTierRankingCharacterDto(
    string CharacterId,
    string NameVi,
    string NameEn,
    string Rarity,
    string Tier,
    int BaseVotes,
    int CommunityVotes,
    int TotalScore,
    string Version);

public sealed record AdminTierRankingStatsDto(
    string VoteMonth,
    DateTimeOffset ResetsAt,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalVotes,
    int TotalVoters,
    IReadOnlyList<AdminTierRankingCharacterDto> Characters);

public sealed record UpdateBaseVotesRequest(
    int BaseVotes,
    string ExpectedVersion);

public enum TierAdminMutationStatus
{
    Success,
    NotFound,
    Conflict,
}

public sealed record TierAdminMutationResult(
    TierAdminMutationStatus Status,
    AdminTierRankingCharacterDto? Character);

public enum TierServiceStatus
{
    Success,
    InvalidInput,
    AccountUnavailable,
    CharacterNotFound,
    ImmutableVote,
    QuotaExceeded,
    Conflict,
}

public sealed record TierServiceResult<T>(TierServiceStatus Status, T? Value = default);
