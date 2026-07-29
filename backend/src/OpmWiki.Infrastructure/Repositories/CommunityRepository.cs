using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
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

    public Task<UserAccount?> FindUserByIdentifierAsync(
        string normalizedUsername,
        string normalizedEmail,
        CancellationToken cancellationToken = default)
    {
        var username = NormalizeUsername(normalizedUsername);
        var email = NormalizeEmail(normalizedEmail);
        return dbContext.UserAccounts.AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.NormalizedUsername == username ||
                     (email != string.Empty && x.NormalizedEmail == email),
                cancellationToken);
    }

    public Task<UserAccount?> FindUserByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.UserAccounts.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<UserAccount?> CreateUserAsync(
        string username,
        string displayName,
        string passwordHash,
        CancellationToken cancellationToken = default) =>
        CreateUserWithEmailAsync(username, string.Empty, displayName, passwordHash, cancellationToken);

    public async Task<UserAccount?> CreateUserWithEmailAsync(
        string username,
        string email,
        string displayName,
        string passwordHash,
        CancellationToken cancellationToken = default)
    {
        var normalized = NormalizeUsername(username);
        var normalizedEmail = NormalizeEmail(email);
        if (await dbContext.UserAccounts.AnyAsync(
                x => x.NormalizedUsername == normalized ||
                     (normalizedEmail != string.Empty && x.NormalizedEmail == normalizedEmail),
                cancellationToken))
            return null;

        var user = new UserAccount
        {
            Username = username.Trim(),
            NormalizedUsername = normalized,
            Email = email.Trim().ToLowerInvariant(),
            NormalizedEmail = normalizedEmail,
            DisplayName = displayName.Trim(),
            PasswordHash = passwordHash,
            Role = AccountRoles.User,
        };
        dbContext.UserAccounts.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<UserAccount?> SetPasswordResetTokenAsync(
        string normalizedEmail,
        string tokenHash,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(normalizedEmail);
        var account = await dbContext.UserAccounts.SingleOrDefaultAsync(
            x => email != string.Empty && x.NormalizedEmail == email && x.IsActive,
            cancellationToken);
        if (account is null) return null;
        account.PasswordResetTokenHash = tokenHash;
        account.PasswordResetExpiresAt = expiresAt;
        account.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return account;
    }

    public async Task<bool> ResetPasswordAsync(
        string tokenHash,
        string passwordHash,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var account = await dbContext.UserAccounts.SingleOrDefaultAsync(
            x => x.PasswordResetTokenHash == tokenHash &&
                 x.PasswordResetExpiresAt > now &&
                 x.IsActive,
            cancellationToken);
        if (account is null) return false;
        account.PasswordHash = passwordHash;
        account.PasswordResetTokenHash = null;
        account.PasswordResetExpiresAt = null;
        account.UpdatedAt = now;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<AccountDto>> ListAccountsAsync(
        CancellationToken cancellationToken = default) =>
        await dbContext.UserAccounts.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new AccountDto(x.Id, x.Username, x.DisplayName, x.Role, x.Balance, x.IsActive, x.CreatedAt))
            .ToListAsync(cancellationToken);

    public async Task<AccountDto?> UpdateAccountRoleAsync(
        Guid id,
        string role,
        Guid actorId,
        CancellationToken cancellationToken = default)
    {
        var account = await dbContext.UserAccounts.SingleOrDefaultAsync(
            x => x.Id == id && (actorId == Guid.Empty || x.Id != actorId),
            cancellationToken);
        if (account is null) return null;
        account.Role = role;
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapAccount(account);
    }

    public async Task<AccountDto?> UpdateAccountStatusAsync(
        Guid id,
        bool isActive,
        Guid actorId,
        CancellationToken cancellationToken = default)
    {
        var account = await dbContext.UserAccounts.SingleOrDefaultAsync(
            x => x.Id == id && (actorId == Guid.Empty || x.Id != actorId),
            cancellationToken);
        if (account is null) return null;
        account.IsActive = isActive;
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapAccount(account);
    }

    private static AccountDto MapAccount(UserAccount account) =>
        new(account.Id, account.Username, account.DisplayName, account.Role, account.Balance, account.IsActive, account.CreatedAt);

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

    public async Task<TopUpRequestDto?> GetUserTopUpAsync(
        long id,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await MapTopUps(dbContext.TopUpRequests.AsNoTracking().Where(x => x.Id == id && x.UserId == userId))
            .SingleOrDefaultAsync(cancellationToken);

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

    public async Task<TopUpCreationResult> CreateOrGetCouponTopUpAsync(
        Guid userId,
        string referenceCode,
        decimal amount,
        CancellationToken cancellationToken = default)
    {
        var normalizedReference = referenceCode.Trim();
        var existing = await FindTopUpByReferenceAsync(userId, normalizedReference, cancellationToken);
        if (existing is not null)
            return MapCouponReplay(existing, amount);

        try
        {
            var created = await CreateTopUpAsync(
                userId, CouponOrderRules.Provider, normalizedReference, amount, cancellationToken);
            return new TopUpCreationResult(created, true);
        }
        catch (DbUpdateException)
        {
            foreach (var entry in dbContext.ChangeTracker.Entries<TopUpRequest>()
                         .Where(x => x.State == EntityState.Added))
                entry.State = EntityState.Detached;

            existing = await FindTopUpByReferenceAsync(userId, normalizedReference, cancellationToken);
            if (existing is not null)
                return MapCouponReplay(existing, amount);
            throw;
        }
    }

    private async Task<TopUpRequest?> FindTopUpByReferenceAsync(
        Guid userId,
        string referenceCode,
        CancellationToken cancellationToken) =>
        await dbContext.TopUpRequests.AsNoTracking()
            .Include(x => x.User)
            .SingleOrDefaultAsync(
                x => x.UserId == userId && x.ReferenceCode == referenceCode,
                cancellationToken);

    private static TopUpCreationResult MapCouponReplay(TopUpRequest request, decimal amount)
    {
        if (request.Provider != CouponOrderRules.Provider || request.Amount != amount)
            throw new DbUpdateException("The idempotency reference belongs to a different top-up request.");
        return new TopUpCreationResult(MapTopUp(request), false);
    }

    public async Task ExpirePendingBankTopUpsAsync(
        DateTimeOffset createdBefore,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.TopUpRequests.Where(
            x => x.Provider == "Bank transfer" &&
                 x.Status == TopUpStatuses.Pending &&
                 x.CreatedAt <= createdBefore);
        if (userId.HasValue)
            query = query.Where(x => x.UserId == userId.Value);

        if (dbContext.Database.IsRelational())
        {
            await query.ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.Status, TopUpStatuses.Expired)
                    .SetProperty(x => x.UpdatedAt, DateTimeOffset.UtcNow),
                cancellationToken);
            return;
        }

        foreach (var request in await query.ToListAsync(cancellationToken))
            request.Status = TopUpStatuses.Expired;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<TopUpRequestDto?> UpdateUserTopUpStatusAsync(
        long id,
        Guid userId,
        string provider,
        string expectedStatus,
        string status,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.TopUpRequests.Where(
            x => x.Id == id && x.UserId == userId && x.Provider == provider &&
                 x.Status == expectedStatus);
        if (dbContext.Database.IsRelational())
        {
            var updated = await query.ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.Status, status)
                    .SetProperty(x => x.UpdatedAt, DateTimeOffset.UtcNow),
                cancellationToken);
            return updated == 0
                ? null
                : await GetUserTopUpAsync(id, userId, cancellationToken);
        }

        var request = await query.SingleOrDefaultAsync(cancellationToken);
        if (request is null) return null;
        request.Status = status;
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetUserTopUpAsync(id, userId, cancellationToken);
    }
    public async Task<IReadOnlyList<AdminTopUpRequestDto>> ListTopUpsAsync(
        string? status,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.TopUpRequests.AsNoTracking()
            .Where(x => x.Provider == "Coupon Order");
        if (status == TopUpStatuses.Pending)
            query = query.Where(x => x.Status == TopUpStatuses.Pending ||
                                     x.Status == TopUpStatuses.PaymentReported);
        else if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status);
        return await MapAdminTopUps(query).ToListAsync(cancellationToken);
    }

    public async Task<TopUpReviewResult> ReviewTopUpAsync(
        long id,
        Guid reviewerId,
        string reviewerSubject,
        string status,
        string staffNote,
        CancellationToken cancellationToken = default)
    {
        var order = await dbContext.TopUpRequests.AsNoTracking()
            .Where(x => x.Id == id && x.Provider == CouponOrderRules.Provider)
            .Select(x => new { x.UserId, x.Status, x.ReferenceCode, x.Amount })
            .SingleOrDefaultAsync(cancellationToken);
        if (order is null ||
            order.Status is not (TopUpStatuses.Pending or TopUpStatuses.PaymentReported))
            return new(null, TopUpReviewFailure.NotReviewable);
        if (reviewerId != Guid.Empty && order.UserId == reviewerId)
            return new(null, TopUpReviewFailure.SelfReview);
        if (status == TopUpStatuses.Approved &&
            !CouponOrderRules.IsValid(order.ReferenceCode, order.Amount))
            return new(null, TopUpReviewFailure.InvalidCouponOrder);

        if (dbContext.Database.IsRelational())
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            var reviewedAt = DateTimeOffset.UtcNow;
            var updated = await dbContext.TopUpRequests
                .Where(x => x.Id == id && x.Provider == CouponOrderRules.Provider &&
                            (reviewerId == Guid.Empty || x.UserId != reviewerId) &&
                            (x.Status == TopUpStatuses.Pending ||
                             x.Status == TopUpStatuses.PaymentReported))
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(x => x.Status, status)
                        .SetProperty(x => x.StaffNote, staffNote.Trim())
                        .SetProperty(x => x.ReviewedById, reviewerId == Guid.Empty ? null : reviewerId)
                        .SetProperty(x => x.ReviewedBySubject, reviewerSubject)
                        .SetProperty(x => x.ReviewedAt, reviewedAt)
                        .SetProperty(x => x.UpdatedAt, reviewedAt),
                    cancellationToken);
            if (updated == 0)
                return new(null, TopUpReviewFailure.NotReviewable);

            var updatedRequest = await dbContext.TopUpRequests
                .Include(x => x.User)
                .SingleAsync(x => x.Id == id, cancellationToken);
            if (status == TopUpStatuses.Approved && updatedRequest.Provider != CouponOrderRules.Provider)
                updatedRequest.User.Balance += updatedRequest.Amount;
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new(MapAdminTopUp(updatedRequest), TopUpReviewFailure.None);
        }

        var request = await dbContext.TopUpRequests
            .Include(x => x.User)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (request is null || request.Provider != CouponOrderRules.Provider ||
            (reviewerId != Guid.Empty && request.UserId == reviewerId) ||
            request.Status is not (TopUpStatuses.Pending or TopUpStatuses.PaymentReported))
            return new(null, TopUpReviewFailure.NotReviewable);

        request.Status = status;
        request.StaffNote = staffNote.Trim();
        request.ReviewedById = reviewerId == Guid.Empty ? null : reviewerId;
        request.ReviewedBySubject = reviewerSubject;
        request.ReviewedAt = DateTimeOffset.UtcNow;
        if (status == TopUpStatuses.Approved && request.Provider != CouponOrderRules.Provider)
            request.User.Balance += request.Amount;
        await dbContext.SaveChangesAsync(cancellationToken);
        return new(MapAdminTopUp(request), TopUpReviewFailure.None);
    }

    public async Task<PaymentProcessingResult> ProcessSePayWebhookAsync(
        SePayWebhookTransaction webhook,
        CancellationToken cancellationToken = default)
    {
        var executionStrategy = dbContext.Database.CreateExecutionStrategy();
        return await executionStrategy.ExecuteAsync(async () =>
        {
            await using var databaseTransaction = dbContext.Database.IsRelational()
                ? await dbContext.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken)
                : null;

            var duplicate = await dbContext.PaymentTransactions
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    x => x.Provider == "SePay" &&
                         x.ExternalTransactionId == webhook.ExternalTransactionId,
                    cancellationToken);
            if (duplicate is not null)
            {
                if (databaseTransaction is not null)
                    await databaseTransaction.CommitAsync(cancellationToken);
                return new PaymentProcessingResult(
                    true,
                    duplicate.Status == "Credited",
                    duplicate.TopUpRequestId,
                    duplicate.Status);
            }

            var topUp = await dbContext.TopUpRequests
                .Include(x => x.User)
                .FirstOrDefaultAsync(
                    x => x.Provider == "Bank transfer" &&
                         x.ReferenceCode == webhook.PaymentCode &&
                         x.Amount == webhook.Amount,
                    cancellationToken);
            var shouldCredit = topUp is not null &&
                               topUp.Status is not (TopUpStatuses.Paid or TopUpStatuses.Approved);
            var payment = new PaymentTransaction
            {
                Provider = "SePay",
                ExternalTransactionId = webhook.ExternalTransactionId,
                TopUpRequestId = topUp?.Id,
                Gateway = webhook.Gateway,
                AccountNumber = webhook.AccountNumber,
                PaymentCode = webhook.PaymentCode,
                Amount = webhook.Amount,
                TransferType = webhook.TransferType,
                BankReferenceCode = webhook.BankReferenceCode,
                Status = shouldCredit ? "Credited" : topUp is null ? "Unmatched" : "DuplicateOrder",
                PayloadJson = webhook.PayloadJson,
                TransactionAt = webhook.TransactionAt,
            };
            dbContext.PaymentTransactions.Add(payment);
            await dbContext.SaveChangesAsync(cancellationToken);

            if (shouldCredit && topUp is not null)
            {
                var balanceBefore = topUp.User.Balance;
                topUp.User.Balance += webhook.Amount;
                topUp.Status = TopUpStatuses.Paid;
                topUp.PaidAt = DateTimeOffset.UtcNow;
                topUp.ExternalTransactionId = webhook.ExternalTransactionId;
                dbContext.BalanceLedgerEntries.Add(new BalanceLedgerEntry
                {
                    UserId = topUp.UserId,
                    TopUpRequestId = topUp.Id,
                    PaymentTransactionId = payment.Id,
                    EntryType = "BankTopUp",
                    Amount = webhook.Amount,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = topUp.User.Balance,
                });
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            if (databaseTransaction is not null)
                await databaseTransaction.CommitAsync(cancellationToken);
            return new PaymentProcessingResult(false, shouldCredit, topUp?.Id, payment.Status);
        });
    }

    public async Task<DashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default) =>
        new(
            await dbContext.UserAccounts.CountAsync(x => x.Role == AccountRoles.User, cancellationToken),
            await dbContext.UserAccounts.CountAsync(x => x.Role == AccountRoles.Staff, cancellationToken),
            await dbContext.UserAccounts.CountAsync(x => x.Role == AccountRoles.Admin, cancellationToken) + 1,
            await dbContext.EventComments.CountAsync(x => !x.IsDeleted, cancellationToken),
            await dbContext.ForumTopics.CountAsync(x => !x.IsDeleted, cancellationToken),
            await dbContext.ForumPosts.CountAsync(x => !x.IsDeleted, cancellationToken),
            await dbContext.TopUpRequests.CountAsync(
                x => x.Provider == "Coupon Order" &&
                     (x.Status == TopUpStatuses.Pending ||
                      x.Status == TopUpStatuses.PaymentReported),
                cancellationToken),
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
    private static string NormalizeEmail(string email)
    {
        var local = email.Trim().ToLowerInvariant().Split('@')[0].Split('+')[0].Replace(".", string.Empty);
        return string.IsNullOrEmpty(local) ? string.Empty : $"{local}@gmail.com";
    }

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
            x.ReviewedAt,
            x.PaidAt,
            x.ExternalTransactionId));

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
            request.ReviewedAt,
            request.PaidAt,
            request.ExternalTransactionId);

    private static IQueryable<AdminTopUpRequestDto> MapAdminTopUps(IQueryable<TopUpRequest> query) =>
        query.OrderByDescending(x => x.CreatedAt).Select(x => new AdminTopUpRequestDto(
            x.Id,
            x.UserId,
            x.User.Username,
            x.User.DisplayName,
            x.Provider,
            x.ReferenceCode,
            x.Amount,
            x.Status,
            x.StaffNote,
            x.ReviewedBySubject,
            x.CreatedAt,
            x.ReviewedAt,
            x.PaidAt,
            x.ExternalTransactionId));

    private static AdminTopUpRequestDto MapAdminTopUp(TopUpRequest request) =>
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
            request.ReviewedBySubject,
            request.CreatedAt,
            request.ReviewedAt,
            request.PaidAt,
            request.ExternalTransactionId);

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
