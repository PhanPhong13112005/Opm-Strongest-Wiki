using OpmWiki.Application.AdminCommunity;

namespace OpmWiki.Application.Abstractions;

public interface IAdminCommunityRepository
{
    Task<AdminCommunityFeedDto> GetFeedAsync(
        string kind,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<AdminCommunityTopicMutationResult> SetTopicLockAsync(
        long id,
        bool isLocked,
        DateTimeOffset expectedUpdatedAt,
        CancellationToken cancellationToken = default);

    Task<AdminCommunityMutationStatus> SoftDeleteTopicAsync(
        long id,
        DateTimeOffset expectedUpdatedAt,
        CancellationToken cancellationToken = default);

    Task<AdminCommunityMutationStatus> SoftDeleteCommentAsync(
        long id,
        DateTimeOffset expectedUpdatedAt,
        Guid actorId,
        CancellationToken cancellationToken = default);
}
