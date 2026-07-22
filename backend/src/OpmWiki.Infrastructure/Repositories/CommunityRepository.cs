using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class CommunityRepository(OpmWikiDbContext dbContext) : ICommunityRepository
{
    public Task<UserAccount?> FindUserByUsernameAsync(
        string normalizedUsername,
        CancellationToken cancellationToken = default) =>
        dbContext.UserAccounts.AsNoTracking()
            .SingleOrDefaultAsync(x => x.NormalizedUsername == normalizedUsername, cancellationToken);

    public Task<UserAccount?> FindUserByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.UserAccounts.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<UserAccount?> CreateUserAsync(
        string username,
        string displayName,
        string passwordHash,
        CancellationToken cancellationToken = default)
    {
        var normalized = NormalizeUsername(username);
        if (await dbContext.UserAccounts.AnyAsync(x => x.NormalizedUsername == normalized, cancellationToken))
            return null;

        var user = new UserAccount
        {
            Username = username.Trim(),
            NormalizedUsername = normalized,
            DisplayName = displayName.Trim(),
            PasswordHash = passwordHash,
            Role = AccountRoles.User,
        };
        dbContext.UserAccounts.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<IReadOnlyList<AccountDto>> ListAccountsAsync(
        CancellationToken cancellationToken = default) =>
        await dbContext.UserAccounts.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new AccountDto(x.Id, x.Username, x.DisplayName, x.Role, x.Balance, x.CreatedAt))
            .ToListAsync(cancellationToken);

    public async Task<AccountDto?> UpdateAccountRoleAsync(
        Guid id,
        string role,
        CancellationToken cancellationToken = default)
    {
        var account = await dbContext.UserAccounts.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (account is null) return null;
        account.Role = role;
        await dbContext.SaveChangesAsync(cancellationToken);
        return new AccountDto(account.Id, account.Username, account.DisplayName, account.Role, account.Balance, account.CreatedAt);
    }

    public async Task<IReadOnlyList<EventCommentDto>> ListEventCommentsAsync(
        string eventId,
        CancellationToken cancellationToken = default) =>
        await dbContext.EventComments.AsNoTracking()
            .Where(x => x.EventId == eventId && !x.IsDeleted)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new EventCommentDto(
                x.Id,
                x.EventId,
                x.UserId,
                x.User.DisplayName,
                x.User.Role,
                x.Content,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<EventCommentDto>> ListRecentEventCommentsAsync(
        CancellationToken cancellationToken = default) =>
        await dbContext.EventComments.AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .Select(x => new EventCommentDto(
                x.Id,
                x.EventId,
                x.UserId,
                x.User.DisplayName,
                x.User.Role,
                x.Content,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

    public async Task<EventCommentDto?> AddEventCommentAsync(
        string eventId,
        Guid userId,
        string content,
        CancellationToken cancellationToken = default)
    {
        if (!await dbContext.Events.AnyAsync(x => x.Id == eventId, cancellationToken)) return null;
        var user = await dbContext.UserAccounts.SingleOrDefaultAsync(x => x.Id == userId && x.IsActive, cancellationToken);
        if (user is null) return null;

        var comment = new EventComment { EventId = eventId, UserId = userId, User = user, Content = content.Trim() };
        dbContext.EventComments.Add(comment);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapComment(comment, user);
    }

    public async Task<bool> DeleteEventCommentAsync(
        long id,
        Guid moderatorId,
        CancellationToken cancellationToken = default)
    {
        var comment = await dbContext.EventComments.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (comment is null) return false;
        comment.IsDeleted = true;
        comment.DeletedById = moderatorId;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<ForumTopicSummaryDto>> ListForumTopicsAsync(
        CancellationToken cancellationToken = default) =>
        await dbContext.ForumTopics.AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderByDescending(x => x.UpdatedAt)
            .Select(x => new ForumTopicSummaryDto(
                x.Id,
                x.Title,
                x.User.DisplayName,
                x.User.Role,
                x.Posts.Count(p => !p.IsDeleted),
                x.IsLocked,
                x.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<ForumTopicDetailDto?> GetForumTopicAsync(
        long id,
        CancellationToken cancellationToken = default)
    {
        var topic = await dbContext.ForumTopics.AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Posts.Where(p => !p.IsDeleted))
                .ThenInclude(x => x.User)
            .SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        return topic is null ? null : MapTopic(topic);
    }

    public async Task<ForumTopicDetailDto> CreateForumTopicAsync(
        Guid userId,
        string title,
        string content,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.UserAccounts.SingleAsync(x => x.Id == userId && x.IsActive, cancellationToken);
        var topic = new ForumTopic
        {
            UserId = userId,
            User = user,
            Title = title.Trim(),
            Content = content.Trim(),
        };
        dbContext.ForumTopics.Add(topic);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapTopic(topic);
    }

    public async Task<ForumPostDto?> AddForumPostAsync(
        long topicId,
        Guid userId,
        string content,
        CancellationToken cancellationToken = default)
    {
        var topic = await dbContext.ForumTopics.SingleOrDefaultAsync(
            x => x.Id == topicId && !x.IsDeleted && !x.IsLocked,
            cancellationToken);
        var user = await dbContext.UserAccounts.SingleOrDefaultAsync(x => x.Id == userId && x.IsActive, cancellationToken);
        if (topic is null || user is null) return null;

        var post = new ForumPost
        {
            TopicId = topicId,
            Topic = topic,
            UserId = userId,
            User = user,
            Content = content.Trim(),
        };
        topic.UpdatedAt = DateTimeOffset.UtcNow;
        dbContext.ForumPosts.Add(post);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapPost(post);
    }

    public async Task<bool> DeleteForumPostAsync(
        long id,
        Guid moderatorId,
        CancellationToken cancellationToken = default)
    {
        var post = await dbContext.ForumPosts.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (post is null) return false;
        post.IsDeleted = true;
        post.DeletedById = moderatorId;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteForumTopicAsync(
        long id,
        Guid moderatorId,
        CancellationToken cancellationToken = default)
    {
        var topic = await dbContext.ForumTopics.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (topic is null) return false;
        topic.IsDeleted = true;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<TopUpRequestDto>> ListUserTopUpsAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await MapTopUps(dbContext.TopUpRequests.AsNoTracking().Where(x => x.UserId == userId))
            .ToListAsync(cancellationToken);

    public async Task<TopUpRequestDto> CreateTopUpAsync(
        Guid userId,
        string provider,
        string referenceCode,
        decimal amount,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.UserAccounts.SingleAsync(x => x.Id == userId && x.IsActive, cancellationToken);
        var request = new TopUpRequest
        {
            UserId = userId,
            User = user,
            Provider = provider.Trim(),
            ReferenceCode = referenceCode.Trim(),
            Amount = amount,
        };
        dbContext.TopUpRequests.Add(request);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapTopUp(request);
    }

    public async Task<IReadOnlyList<TopUpRequestDto>> ListTopUpsAsync(
        string? status,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.TopUpRequests.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        return await MapTopUps(query).ToListAsync(cancellationToken);
    }

    public async Task<TopUpRequestDto?> ReviewTopUpAsync(
        long id,
        Guid reviewerId,
        string status,
        string staffNote,
        CancellationToken cancellationToken = default)
    {
        var request = await dbContext.TopUpRequests
            .Include(x => x.User)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (request is null || request.Status != TopUpStatuses.Pending) return null;

        request.Status = status;
        request.StaffNote = staffNote.Trim();
        request.ReviewedById = reviewerId == Guid.Empty ? null : reviewerId;
        request.ReviewedAt = DateTimeOffset.UtcNow;
        if (status == TopUpStatuses.Approved) request.User.Balance += request.Amount;
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapTopUp(request);
    }

    public async Task<DashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default) =>
        new(
            await dbContext.UserAccounts.CountAsync(x => x.Role == AccountRoles.User, cancellationToken),
            await dbContext.UserAccounts.CountAsync(x => x.Role == AccountRoles.Staff, cancellationToken),
            await dbContext.UserAccounts.CountAsync(x => x.Role == AccountRoles.Admin, cancellationToken) + 1,
            await dbContext.EventComments.CountAsync(x => !x.IsDeleted, cancellationToken),
            await dbContext.ForumTopics.CountAsync(x => !x.IsDeleted, cancellationToken),
            await dbContext.ForumPosts.CountAsync(x => !x.IsDeleted, cancellationToken),
            await dbContext.TopUpRequests.CountAsync(x => x.Status == TopUpStatuses.Pending, cancellationToken),
            await dbContext.Characters.CountAsync(cancellationToken),
            await dbContext.Events.CountAsync(cancellationToken),
            await dbContext.ReleaseScheduleEntries.CountAsync(cancellationToken));

    public async Task<AdvisorContextDto> FindAdvisorContextAsync(
        string query,
        CancellationToken cancellationToken = default)
    {
        var normalized = query.Trim().ToLowerInvariant();
        var value = normalized
            .Split([' ', ',', '.', '?', '!', ':', ';', '-', '/', '\\'], StringSplitOptions.RemoveEmptyEntries)
            .Where(x => x.Length >= 3)
            .OrderByDescending(x => x.Length)
            .FirstOrDefault() ?? normalized;
        var characters = await dbContext.Characters.AsNoTracking()
            .Where(x => x.NameVi.ToLower().Contains(value) || x.NameEn.ToLower().Contains(value) ||
                        x.FactionVi.ToLower().Contains(value) || x.TypeVi.ToLower().Contains(value))
            .OrderByDescending(x => x.ReleaseSea)
            .Take(5)
            .Select(x => $"{x.NameVi} ({x.Tier}) - {x.FactionVi}, {x.TypeVi}; SEA: {x.ReleaseSea}")
            .ToListAsync(cancellationToken);
        var events = await dbContext.Events.AsNoTracking()
            .Where(x => x.TitleVi.ToLower().Contains(value) || x.TitleEn.ToLower().Contains(value) ||
                        x.DescriptionVi.ToLower().Contains(value))
            .OrderByDescending(x => x.StartDate)
            .Take(5)
            .Select(x => $"{x.TitleVi}: {x.StartDate} - {x.EndDate}")
            .ToListAsync(cancellationToken);
        return new AdvisorContextDto(characters, events);
    }

    public async Task<IReadOnlyList<AdminEventDto>> ListAdminEventsAsync(
        CancellationToken cancellationToken = default)
    {
        var events = await dbContext.Events.AsNoTracking()
            .OrderByDescending(x => x.StartDate)
            .ToListAsync(cancellationToken);
        return events.Select(MapAdminEvent).ToArray();
    }

    public async Task<AdminEventDto?> CreateAdminEventAsync(
        AdminEventWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (await dbContext.Events.AnyAsync(x => x.Id == request.Id, cancellationToken)) return null;
        var gameEvent = MapEvent(request);
        dbContext.Events.Add(gameEvent);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapAdminEvent(gameEvent);
    }

    public async Task<AdminEventDto?> UpdateAdminEventAsync(
        string id,
        AdminEventWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        var gameEvent = await dbContext.Events.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (gameEvent is null) return null;
        ApplyEvent(gameEvent, request);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapAdminEvent(gameEvent);
    }

    public async Task<bool> DeleteAdminEventAsync(string id, CancellationToken cancellationToken = default)
    {
        var gameEvent = await dbContext.Events.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (gameEvent is null) return false;
        dbContext.Events.Remove(gameEvent);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<ReleaseScheduleDto>> ListReleaseScheduleAsync(
        string language,
        CancellationToken cancellationToken = default)
    {
        var entries = await dbContext.ReleaseScheduleEntries.AsNoTracking()
            .OrderBy(x => x.Date)
            .ThenBy(x => x.Server)
            .ThenBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);
        var isEnglish = string.Equals(language, "en", StringComparison.OrdinalIgnoreCase);
        return entries.Select(x => MapRelease(x, isEnglish)).ToArray();
    }

    public async Task<ReleaseScheduleDto> CreateReleaseScheduleAsync(
        ReleaseScheduleWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        var entry = new ReleaseScheduleEntry();
        ApplyRelease(entry, request);
        dbContext.ReleaseScheduleEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapRelease(entry, false);
    }

    public async Task<ReleaseScheduleDto?> UpdateReleaseScheduleAsync(
        long id,
        ReleaseScheduleWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        var entry = await dbContext.ReleaseScheduleEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entry is null) return null;
        ApplyRelease(entry, request);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapRelease(entry, false);
    }

    public async Task<bool> DeleteReleaseScheduleAsync(long id, CancellationToken cancellationToken = default)
    {
        var entry = await dbContext.ReleaseScheduleEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entry is null) return false;
        dbContext.ReleaseScheduleEntries.Remove(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string NormalizeUsername(string username) => username.Trim().ToUpperInvariant();

    private static EventCommentDto MapComment(EventComment comment, UserAccount user) =>
        new(comment.Id, comment.EventId, comment.UserId, user.DisplayName, user.Role, comment.Content, comment.CreatedAt);

    private static ForumTopicDetailDto MapTopic(ForumTopic topic) =>
        new(
            topic.Id,
            topic.Title,
            topic.Content,
            topic.User.DisplayName,
            topic.User.Role,
            topic.IsLocked,
            topic.CreatedAt,
            topic.Posts.Where(x => !x.IsDeleted).OrderBy(x => x.CreatedAt).Select(MapPost).ToArray());

    private static ForumPostDto MapPost(ForumPost post) =>
        new(post.Id, post.UserId, post.User.DisplayName, post.User.Role, post.Content, post.CreatedAt);

    private static IQueryable<TopUpRequestDto> MapTopUps(IQueryable<TopUpRequest> query) =>
        query.OrderByDescending(x => x.CreatedAt).Select(x => new TopUpRequestDto(
            x.Id,
            x.UserId,
            x.User.Username,
            x.User.DisplayName,
            x.Provider,
            x.ReferenceCode,
            x.Amount,
            x.Status,
            x.StaffNote,
            x.CreatedAt,
            x.ReviewedAt));

    private static TopUpRequestDto MapTopUp(TopUpRequest request) =>
        new(
            request.Id,
            request.UserId,
            request.User.Username,
            request.User.DisplayName,
            request.Provider,
            request.ReferenceCode,
            request.Amount,
            request.Status,
            request.StaffNote,
            request.CreatedAt,
            request.ReviewedAt);

    private static AdminEventDto MapAdminEventExpression(GameEvent x) =>
        new(
            x.Id, x.TitleVi, x.TitleEn, x.DescriptionVi, x.DescriptionEn, x.Category,
            x.ImageUrl, x.DetailImages, x.SectionsJson, x.StartDate, x.EndDate, x.UpdatedAt);

    private static AdminEventDto MapAdminEvent(GameEvent x) => MapAdminEventExpression(x);

    private static GameEvent MapEvent(AdminEventWriteRequest request)
    {
        var gameEvent = new GameEvent { Id = request.Id.Trim() };
        ApplyEvent(gameEvent, request);
        return gameEvent;
    }

    private static void ApplyEvent(GameEvent gameEvent, AdminEventWriteRequest request)
    {
        gameEvent.TitleVi = request.TitleVi.Trim();
        gameEvent.TitleEn = request.TitleEn.Trim();
        gameEvent.DescriptionVi = request.DescriptionVi.Trim();
        gameEvent.DescriptionEn = request.DescriptionEn.Trim();
        gameEvent.Category = request.Category.Trim();
        gameEvent.ImageUrl = request.ImageUrl.Trim();
        gameEvent.DetailImages = (request.DetailImages ?? []).Select(x => x.Trim()).Where(x => x.Length > 0).ToArray();
        gameEvent.SectionsJson = request.SectionsJson ?? "[]";
        gameEvent.StartDate = request.StartDate;
        gameEvent.EndDate = request.EndDate;
    }

    private static ReleaseScheduleDto MapRelease(ReleaseScheduleEntry x, bool isEnglish) =>
        new(
            x.Id,
            x.Server,
            x.Date,
            x.CharacterId,
            x.BannerImage,
            x.IsReturn,
            isEnglish ? x.OverrideNameEn : x.OverrideNameVi,
            x.OverrideTier,
            isEnglish ? x.OverrideFactionEn : x.OverrideFactionVi,
            isEnglish ? x.OverrideTypeEn : x.OverrideTypeVi,
            isEnglish ? x.OverrideRoleEn : x.OverrideRoleVi,
            x.OverrideNameVi,
            x.OverrideNameEn,
            x.OverrideFactionVi,
            x.OverrideFactionEn,
            x.OverrideTypeVi,
            x.OverrideTypeEn,
            x.OverrideRoleVi,
            x.OverrideRoleEn,
            x.SortOrder);

    private static void ApplyRelease(ReleaseScheduleEntry entry, ReleaseScheduleWriteRequest request)
    {
        entry.Server = request.Server.Trim().ToUpperInvariant();
        entry.Date = request.Date;
        entry.CharacterId = request.CharacterId.Trim();
        entry.BannerImage = request.BannerImage.Trim();
        entry.IsReturn = request.IsReturn;
        entry.OverrideNameVi = request.OverrideNameVi?.Trim() ?? string.Empty;
        entry.OverrideNameEn = request.OverrideNameEn?.Trim() ?? string.Empty;
        entry.OverrideTier = request.OverrideTier?.Trim() ?? string.Empty;
        entry.OverrideFactionVi = request.OverrideFactionVi?.Trim() ?? string.Empty;
        entry.OverrideFactionEn = request.OverrideFactionEn?.Trim() ?? string.Empty;
        entry.OverrideTypeVi = request.OverrideTypeVi?.Trim() ?? string.Empty;
        entry.OverrideTypeEn = request.OverrideTypeEn?.Trim() ?? string.Empty;
        entry.OverrideRoleVi = request.OverrideRoleVi?.Trim() ?? string.Empty;
        entry.OverrideRoleEn = request.OverrideRoleEn?.Trim() ?? string.Empty;
        entry.SortOrder = request.SortOrder;
    }
}
