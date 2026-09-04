namespace OpmWiki.Application.AdminCommunity;

public static class AdminCommunityKinds
{
    public const string All = "all";
    public const string Topics = "topics";
    public const string Comments = "comments";

    public static bool IsValid(string value) =>
        value is All or Topics or Comments;
}

public sealed record AdminCommunityTopicDto(
    long Id,
    string Title,
    string ContentSnippet,
    string Author,
    int PostCount,
    bool IsLocked,
    DateTimeOffset CreatedAt,
    string Version);

public sealed record AdminCommunityCommentDto(
    long Id,
    string EventId,
    string Content,
    string Author,
    DateTimeOffset CreatedAt,
    string Version);

public sealed record AdminCommunityFeedDto(
    string Kind,
    int Page,
    int PageSize,
    int TotalItems,
    IReadOnlyList<AdminCommunityTopicDto> Topics,
    IReadOnlyList<AdminCommunityCommentDto> Comments);

public sealed record UpdateTopicLockRequest(
    bool IsLocked,
    string ExpectedVersion);

public enum AdminCommunityMutationStatus
{
    Success,
    NotFound,
    Conflict,
}

public sealed record AdminCommunityTopicMutationResult(
    AdminCommunityMutationStatus Status,
    AdminCommunityTopicDto? Topic = null);
