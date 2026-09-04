using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.AdminCommunity;
using OpmWiki.Application.Common;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class AdminCommunityRepository(OpmWikiDbContext dbContext)
    : IAdminCommunityRepository
{
    public async Task<AdminCommunityFeedDto> GetFeedAsync(
        string kind,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var topics = dbContext.ForumTopics.AsNoTracking()
            .Where(x => !x.IsDeleted)
            .Select(x => new FeedRow
            {
                Kind = AdminCommunityKinds.Topics,
                Id = x.Id,
                EventId = string.Empty,
                Title = x.Title,
                Content = x.Content.Length > 220 ? x.Content.Substring(0, 220) : x.Content,
                Author = x.User.DisplayName,
                PostCount = x.Posts.Count(post => !post.IsDeleted),
                IsLocked = x.IsLocked,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
            });
        var comments = dbContext.EventComments.AsNoTracking()
            .Where(x => !x.IsDeleted)
            .Select(x => new FeedRow
            {
                Kind = AdminCommunityKinds.Comments,
                Id = x.Id,
                EventId = x.EventId,
                Title = string.Empty,
                Content = x.Content,
                Author = x.User.DisplayName,
                PostCount = 0,
                IsLocked = false,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
            });

        var totalItems = kind switch
        {
            AdminCommunityKinds.Topics => await topics.CountAsync(cancellationToken),
            AdminCommunityKinds.Comments => await comments.CountAsync(cancellationToken),
            _ => await topics.CountAsync(cancellationToken) + await comments.CountAsync(cancellationToken),
        };
        var query = kind switch
        {
            AdminCommunityKinds.Topics => topics,
            AdminCommunityKinds.Comments => comments,
            _ => topics.Concat(comments),
        };
        var rows = await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .ThenBy(x => x.Kind)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new AdminCommunityFeedDto(
            kind,
            page,
            pageSize,
            totalItems,
            rows.Where(x => x.Kind == AdminCommunityKinds.Topics).Select(MapTopic).ToArray(),
            rows.Where(x => x.Kind == AdminCommunityKinds.Comments).Select(MapComment).ToArray());
    }

    public async Task<AdminCommunityTopicMutationResult> SetTopicLockAsync(
        long id,
        bool isLocked,
        DateTimeOffset expectedUpdatedAt,
        CancellationToken cancellationToken = default)
    {
        if (!dbContext.Database.IsRelational())
        {
            var topic = await dbContext.ForumTopics.SingleOrDefaultAsync(
                x => x.Id == id && !x.IsDeleted,
                cancellationToken);
            if (topic is null) return new(AdminCommunityMutationStatus.NotFound);
            if (topic.UpdatedAt != expectedUpdatedAt)
                return new(AdminCommunityMutationStatus.Conflict);
            topic.IsLocked = isLocked;
            topic.UpdatedAt = NextVersion(expectedUpdatedAt);
            await dbContext.SaveChangesAsync(cancellationToken);
            return new(AdminCommunityMutationStatus.Success,
                await GetTopicAsync(id, cancellationToken));
        }

        var nextVersion = NextVersion(expectedUpdatedAt);
        var updated = await dbContext.ForumTopics
            .Where(x => x.Id == id && !x.IsDeleted && x.UpdatedAt == expectedUpdatedAt)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.IsLocked, isLocked)
                .SetProperty(x => x.UpdatedAt, nextVersion), cancellationToken);
        if (updated == 0)
        {
            var exists = await dbContext.ForumTopics.AsNoTracking()
                .AnyAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
            return new(exists
                ? AdminCommunityMutationStatus.Conflict
                : AdminCommunityMutationStatus.NotFound);
        }

        return new(AdminCommunityMutationStatus.Success,
            await GetTopicAsync(id, cancellationToken));
    }

    public async Task<AdminCommunityMutationStatus> SoftDeleteTopicAsync(
        long id,
        DateTimeOffset expectedUpdatedAt,
        CancellationToken cancellationToken = default)
    {
        if (!dbContext.Database.IsRelational())
        {
            var topic = await dbContext.ForumTopics.SingleOrDefaultAsync(
                x => x.Id == id && !x.IsDeleted,
                cancellationToken);
            if (topic is null) return AdminCommunityMutationStatus.NotFound;
            if (topic.UpdatedAt != expectedUpdatedAt) return AdminCommunityMutationStatus.Conflict;
            topic.IsDeleted = true;
            topic.UpdatedAt = NextVersion(expectedUpdatedAt);
            await dbContext.SaveChangesAsync(cancellationToken);
            return AdminCommunityMutationStatus.Success;
        }

        var strategy = dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            var nextVersion = NextVersion(expectedUpdatedAt);
            var updated = await dbContext.ForumTopics
                .Where(x => x.Id == id && !x.IsDeleted && x.UpdatedAt == expectedUpdatedAt)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.IsDeleted, true)
                    .SetProperty(x => x.UpdatedAt, nextVersion), cancellationToken);
            if (updated > 0)
            {
                await transaction.CommitAsync(cancellationToken);
                return AdminCommunityMutationStatus.Success;
            }

            var exists = await dbContext.ForumTopics.AsNoTracking()
                .AnyAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
            await transaction.RollbackAsync(cancellationToken);
            return exists ? AdminCommunityMutationStatus.Conflict : AdminCommunityMutationStatus.NotFound;
        });
    }

    public async Task<AdminCommunityMutationStatus> SoftDeleteCommentAsync(
        long id,
        DateTimeOffset expectedUpdatedAt,
        Guid actorId,
        CancellationToken cancellationToken = default)
    {
        Guid? deletedBy = actorId == Guid.Empty ? null : actorId;
        if (!dbContext.Database.IsRelational())
        {
            var comment = await dbContext.EventComments.SingleOrDefaultAsync(
                x => x.Id == id && !x.IsDeleted,
                cancellationToken);
            if (comment is null) return AdminCommunityMutationStatus.NotFound;
            if (comment.UpdatedAt != expectedUpdatedAt) return AdminCommunityMutationStatus.Conflict;
            comment.IsDeleted = true;
            comment.DeletedById = deletedBy;
            comment.UpdatedAt = NextVersion(expectedUpdatedAt);
            await dbContext.SaveChangesAsync(cancellationToken);
            return AdminCommunityMutationStatus.Success;
        }

        var nextVersion = NextVersion(expectedUpdatedAt);
        var updated = await dbContext.EventComments
            .Where(x => x.Id == id && !x.IsDeleted && x.UpdatedAt == expectedUpdatedAt)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.IsDeleted, true)
                .SetProperty(x => x.DeletedById, deletedBy)
                .SetProperty(x => x.UpdatedAt, nextVersion), cancellationToken);
        if (updated > 0) return AdminCommunityMutationStatus.Success;
        var exists = await dbContext.EventComments.AsNoTracking()
            .AnyAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        return exists ? AdminCommunityMutationStatus.Conflict : AdminCommunityMutationStatus.NotFound;
    }

    private async Task<AdminCommunityTopicDto?> GetTopicAsync(
        long id,
        CancellationToken cancellationToken)
    {
        var row = await dbContext.ForumTopics.AsNoTracking()
            .Where(x => x.Id == id && !x.IsDeleted)
            .Select(x => new FeedRow
            {
                Kind = AdminCommunityKinds.Topics,
                Id = x.Id,
                Title = x.Title,
                Content = x.Content.Length > 220 ? x.Content.Substring(0, 220) : x.Content,
                Author = x.User.DisplayName,
                PostCount = x.Posts.Count(post => !post.IsDeleted),
                IsLocked = x.IsLocked,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
            })
            .SingleOrDefaultAsync(cancellationToken);
        return row is null ? null : MapTopic(row);
    }

    private static AdminCommunityTopicDto MapTopic(FeedRow row) => new(
        row.Id,
        row.Title,
        row.Content,
        row.Author,
        row.PostCount,
        row.IsLocked,
        row.CreatedAt,
        OpaqueVersion.FromTimestamp(row.UpdatedAt));

    private static AdminCommunityCommentDto MapComment(FeedRow row) => new(
        row.Id,
        row.EventId,
        row.Content,
        row.Author,
        row.CreatedAt,
        OpaqueVersion.FromTimestamp(row.UpdatedAt));

    private static DateTimeOffset NextVersion(DateTimeOffset expected) =>
        DateTimeOffset.UtcNow > expected ? DateTimeOffset.UtcNow : expected.AddMilliseconds(1);

    private sealed class FeedRow
    {
        public string Kind { get; init; } = string.Empty;
        public long Id { get; init; }
        public string EventId { get; init; } = string.Empty;
        public string Title { get; init; } = string.Empty;
        public string Content { get; init; } = string.Empty;
        public string Author { get; init; } = string.Empty;
        public int PostCount { get; init; }
        public bool IsLocked { get; init; }
        public DateTimeOffset CreatedAt { get; init; }
        public DateTimeOffset UpdatedAt { get; init; }
    }
}
