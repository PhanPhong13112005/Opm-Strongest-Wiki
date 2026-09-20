using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpmWiki.Api.Controllers;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.AdminCommunity;
using OpmWiki.Application.Common;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

public sealed class AdminCommunityPhase2Tests
{
    [Fact]
    public async Task Feed_IsBoundedStablePagedAndPartitionsKinds()
    {
        await using var dbContext = CreateContext();
        Seed(dbContext);
        await dbContext.SaveChangesAsync();
        var repository = new AdminCommunityRepository(dbContext);

        var all = await repository.GetFeedAsync(AdminCommunityKinds.All, 1, 2);
        Assert.Equal(4, all.TotalItems);
        Assert.Equal(2, all.Topics.Count + all.Comments.Count);
        var timestamps = all.Topics.Select(x => x.CreatedAt)
            .Concat(all.Comments.Select(x => x.CreatedAt)).ToArray();
        Assert.Equal(timestamps.OrderByDescending(x => x), timestamps);
        Assert.All(all.Topics, topic => Assert.StartsWith("t1.", topic.Version));
        Assert.All(all.Comments, comment => Assert.StartsWith("t1.", comment.Version));

        var topics = await repository.GetFeedAsync(AdminCommunityKinds.Topics, 1, 1);
        Assert.Equal(2, topics.TotalItems);
        Assert.Single(topics.Topics);
        Assert.Empty(topics.Comments);
        Assert.Equal(1, topics.PageSize);

        var comments = await repository.GetFeedAsync(AdminCommunityKinds.Comments, 2, 1);
        Assert.Equal(2, comments.TotalItems);
        Assert.Empty(comments.Topics);
        Assert.Single(comments.Comments);
    }

    [Fact]
    public async Task TopicLock_IsAtomicVersionedAndRejectsStaleWrites()
    {
        await using var dbContext = CreateContext();
        Seed(dbContext);
        await dbContext.SaveChangesAsync();
        var repository = new AdminCommunityRepository(dbContext);
        var topic = (await repository.GetFeedAsync(AdminCommunityKinds.Topics, 1, 10))
            .Topics.Single(x => x.Id == 1);
        Assert.True(OpaqueVersion.TryGetTimestamp(topic.Version, out var firstVersion));

        var locked = await repository.SetTopicLockAsync(1, true, firstVersion);
        Assert.Equal(AdminCommunityMutationStatus.Success, locked.Status);
        Assert.True(locked.Topic!.IsLocked);
        Assert.NotEqual(topic.Version, locked.Topic.Version);

        var stale = await repository.SetTopicLockAsync(1, false, firstVersion);
        Assert.Equal(AdminCommunityMutationStatus.Conflict, stale.Status);
        Assert.True((await dbContext.ForumTopics.SingleAsync(x => x.Id == 1)).IsLocked);

        Assert.True(OpaqueVersion.TryGetTimestamp(locked.Topic.Version, out var secondVersion));
        var unlocked = await repository.SetTopicLockAsync(1, false, secondVersion);
        Assert.Equal(AdminCommunityMutationStatus.Success, unlocked.Status);
        Assert.False(unlocked.Topic!.IsLocked);
        Assert.Equal(AdminCommunityMutationStatus.NotFound,
            (await repository.SetTopicLockAsync(999, true, firstVersion)).Status);
    }

    [Fact]
    public async Task TopicAndCommentDelete_AreSoftConditionalAndRepeatSafe()
    {
        await using var dbContext = CreateContext();
        Seed(dbContext);
        await dbContext.SaveChangesAsync();
        var repository = new AdminCommunityRepository(dbContext);
        var feed = await repository.GetFeedAsync(AdminCommunityKinds.All, 1, 10);
        var topic = feed.Topics.Single(x => x.Id == 1);
        var comment = feed.Comments.Single(x => x.Id == 11);
        Assert.True(OpaqueVersion.TryGetTimestamp(topic.Version, out var topicVersion));
        Assert.True(OpaqueVersion.TryGetTimestamp(comment.Version, out var commentVersion));

        Assert.Equal(AdminCommunityMutationStatus.Conflict,
            await repository.SoftDeleteTopicAsync(1, topicVersion.AddSeconds(-1)));
        Assert.Equal(AdminCommunityMutationStatus.Success,
            await repository.SoftDeleteTopicAsync(1, topicVersion));
        Assert.True((await dbContext.ForumTopics.SingleAsync(x => x.Id == 1)).IsDeleted);
        Assert.Equal(AdminCommunityMutationStatus.NotFound,
            await repository.SoftDeleteTopicAsync(1, topicVersion));

        var actorId = Guid.NewGuid();
        Assert.Equal(AdminCommunityMutationStatus.Success,
            await repository.SoftDeleteCommentAsync(11, commentVersion, actorId));
        var deletedComment = await dbContext.EventComments.SingleAsync(x => x.Id == 11);
        Assert.True(deletedComment.IsDeleted);
        Assert.Equal(actorId, deletedComment.DeletedById);
        Assert.Equal(AdminCommunityMutationStatus.NotFound,
            await repository.SoftDeleteCommentAsync(11, commentVersion, actorId));
    }

    [Fact]
    public async Task Controller_RequiresAdminRoleAndIfMatchPrecondition()
    {
        var authorize = typeof(AdminCommunityController)
            .GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorize);
        Assert.Equal("Admin", authorize!.Roles);

        var controller = new AdminCommunityController(null!)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        var missingHeader = await controller.DeleteTopic(1, CancellationToken.None);
        var result = Assert.IsType<ObjectResult>(missingHeader);
        Assert.Equal(StatusCodes.Status428PreconditionRequired, result.StatusCode);

        controller.Request.Headers.IfMatch = "invalid";
        var invalidHeader = await controller.DeleteComment(1, CancellationToken.None);
        Assert.IsType<BadRequestObjectResult>(invalidHeader);
    }

    private static OpmWikiDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new OpmWikiDbContext(options);
    }

    private static void Seed(OpmWikiDbContext dbContext)
    {
        var user = new UserAccount
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000301"),
            Username = "community-author",
            NormalizedUsername = "COMMUNITY-AUTHOR",
            DisplayName = "Community Author",
            PasswordHash = "test",
        };
        dbContext.UserAccounts.Add(user);
        dbContext.ForumTopics.AddRange(
            new ForumTopic
            {
                Id = 1,
                UserId = user.Id,
                User = user,
                Title = "Older topic",
                Content = new string('a', 240),
                CreatedAt = DateTimeOffset.Parse("2026-08-01T10:00:00Z"),
                UpdatedAt = DateTimeOffset.Parse("2026-08-01T10:00:00Z"),
                Posts =
                [
                    new ForumPost
                    {
                        Id = 101,
                        UserId = user.Id,
                        User = user,
                        Content = "reply",
                        CreatedAt = DateTimeOffset.Parse("2026-08-01T10:01:00Z"),
                        UpdatedAt = DateTimeOffset.Parse("2026-08-01T10:01:00Z"),
                    },
                ],
            },
            new ForumTopic
            {
                Id = 2,
                UserId = user.Id,
                User = user,
                Title = "Newest topic",
                Content = "topic",
                CreatedAt = DateTimeOffset.Parse("2026-08-04T10:00:00Z"),
                UpdatedAt = DateTimeOffset.Parse("2026-08-04T10:00:00Z"),
            });
        dbContext.EventComments.AddRange(
            new EventComment
            {
                Id = 11,
                EventId = "event-1",
                UserId = user.Id,
                User = user,
                Content = "comment one",
                CreatedAt = DateTimeOffset.Parse("2026-08-02T10:00:00Z"),
                UpdatedAt = DateTimeOffset.Parse("2026-08-02T10:00:00Z"),
            },
            new EventComment
            {
                Id = 12,
                EventId = "event-2",
                UserId = user.Id,
                User = user,
                Content = "comment two",
                CreatedAt = DateTimeOffset.Parse("2026-08-03T10:00:00Z"),
                UpdatedAt = DateTimeOffset.Parse("2026-08-03T10:00:00Z"),
            });
    }
}
