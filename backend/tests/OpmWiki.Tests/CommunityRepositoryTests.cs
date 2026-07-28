using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OpmWiki.Api.Security;
using OpmWiki.Application.Community;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

public sealed class CommunityRepositoryTests
{
    [Fact]
    public void PasswordHasher_RoundTripsAndRejectsWrongPassword()
    {
        var hasher = new PasswordHasher();
        var encoded = hasher.Hash("correct-password");

        Assert.True(hasher.Verify("correct-password", encoded));
        Assert.False(hasher.Verify("wrong-password", encoded));
        Assert.False(hasher.Verify("correct-password", "invalid"));
    }

    [Fact]
    public async Task CommunityFlow_ModeratesContentAndCreditsOnlyVerifiedBankWebhook()
    {
        await using var dbContext = CreateContext();
        dbContext.Events.Add(new GameEvent
        {
            Id = "event-1",
            TitleVi = "Sự kiện",
            TitleEn = "Event",
            StartDate = new DateOnly(2026, 7, 1),
            EndDate = new DateOnly(2026, 7, 31),
        });
        await dbContext.SaveChangesAsync();
        var repository = new CommunityRepository(dbContext);

        var user = await repository.CreateUserAsync("tester", "Người thử", "hash");
        Assert.NotNull(user);
        Assert.Null(await repository.CreateUserAsync("TESTER", "Trùng", "hash"));

        var comment = await repository.AddEventCommentAsync("event-1", user!.Id, "Nội dung hợp lệ");
        Assert.NotNull(comment);
        Assert.Single(await repository.ListEventCommentsAsync("event-1"));

        var topic = await repository.CreateForumTopicAsync(user.Id, "Đội hình", "Cần tư vấn đội hình");
        var post = await repository.AddForumPostAsync(topic.Id, user.Id, "Bạn có thể thử đội hình này.");
        Assert.NotNull(post);

        var topUp = await repository.CreateTopUpAsync(user.Id, "Momo", "TX-001", 100_000);
        var reviewed = await repository.ReviewTopUpAsync(
            topUp.Id, Guid.Empty, "admin:test", TopUpStatuses.Approved, "Đã đối soát");
        Assert.Equal(TopUpReviewFailure.NotReviewable, reviewed.Failure);
        Assert.Null(reviewed.TopUp);
        Assert.Equal(0, (await repository.FindUserByIdAsync(user.Id))?.Balance);

        var couponOrder = await repository.CreateTopUpAsync(
            user.Id, "Coupon Order", "UID:3107453|SID:310170|CP:6|QTY:1|QA", 13_000);
        var reviewedCoupon = await repository.ReviewTopUpAsync(
            couponOrder.Id, Guid.Empty, "admin:test", TopUpStatuses.Approved, "Đã nạp Coupon");
        Assert.Equal(TopUpReviewFailure.None, reviewedCoupon.Failure);
        Assert.Equal(TopUpStatuses.Approved, reviewedCoupon.TopUp?.Status);
        Assert.Equal("admin:test", reviewedCoupon.TopUp?.ReviewedBySubject);
        Assert.Equal(0, (await repository.FindUserByIdAsync(user.Id))?.Balance);

        var idempotentReference = "UID:3107453|SID:310170|CP:6|QTY:1|IDEMPOTENT";
        var firstCouponSubmission = await repository.CreateOrGetCouponTopUpAsync(
            user.Id, idempotentReference, 13_000);
        var replayedCouponSubmission = await repository.CreateOrGetCouponTopUpAsync(
            user.Id, idempotentReference, 13_000);
        Assert.True(firstCouponSubmission.Created);
        Assert.False(replayedCouponSubmission.Created);
        Assert.Equal(firstCouponSubmission.TopUp.Id, replayedCouponSubmission.TopUp.Id);
        Assert.Equal(1, await dbContext.TopUpRequests.CountAsync(
            x => x.UserId == user.Id && x.ReferenceCode == idempotentReference));

        Assert.Equal(
            TopUpReviewFailure.NotReviewable,
            (await repository.ReviewTopUpAsync(
                couponOrder.Id, Guid.Empty, "admin:test", TopUpStatuses.Approved, "Lặp lại")).Failure);

        var malformedCoupon = await repository.CreateTopUpAsync(
            user.Id, CouponOrderRules.Provider,
            "UID:3107453|SID:310170|CP:6|QTY:2|LEGACYPRICE", 13_000);
        var malformedApproval = await repository.ReviewTopUpAsync(
            malformedCoupon.Id, Guid.Empty, "admin:test",
            TopUpStatuses.Approved, "Không được duyệt dữ liệu sai");
        Assert.Equal(TopUpReviewFailure.InvalidCouponOrder, malformedApproval.Failure);
        Assert.Null(malformedApproval.TopUp);
        var rejectedMalformed = await repository.ReviewTopUpAsync(
            malformedCoupon.Id, Guid.Empty, "admin:test",
            TopUpStatuses.Rejected, "Giá trị không khớp số lượng Coupon");
        Assert.Equal(TopUpReviewFailure.None, rejectedMalformed.Failure);
        Assert.Equal(TopUpStatuses.Rejected, rejectedMalformed.TopUp?.Status);

        var databaseAdmin = await repository.CreateUserAsync("db-admin", "Database Admin", "hash");
        Assert.NotNull(databaseAdmin);
        databaseAdmin!.Role = AccountRoles.Admin;
        await dbContext.SaveChangesAsync();
        var selfReviewCoupon = await repository.CreateTopUpAsync(
            databaseAdmin.Id, "Coupon Order", "UID:3107453|SID:310170|CP:6|QTY:1|SELFREVIEW", 13_000);
        var selfReview = await repository.ReviewTopUpAsync(
            selfReviewCoupon.Id, databaseAdmin.Id, databaseAdmin.Id.ToString(),
            TopUpStatuses.Approved, "Không được tự duyệt");
        Assert.Equal(TopUpReviewFailure.SelfReview, selfReview.Failure);
        Assert.Null(selfReview.TopUp);
        Assert.Equal(TopUpStatuses.Pending,
            (await repository.GetUserTopUpAsync(selfReviewCoupon.Id, databaseAdmin.Id))?.Status);
        var reviewedByAnotherAdmin = await repository.ReviewTopUpAsync(
            selfReviewCoupon.Id, Guid.Empty, "admin:other",
            TopUpStatuses.Approved, "Admin khác đã xử lý");
        Assert.Equal(TopUpReviewFailure.None, reviewedByAnotherAdmin.Failure);
        Assert.Equal(TopUpStatuses.Approved, reviewedByAnotherAdmin.TopUp?.Status);
        Assert.Equal("admin:other", reviewedByAnotherAdmin.TopUp?.ReviewedBySubject);
        var cancellableCoupon = await repository.CreateTopUpAsync(
            user.Id, "Coupon Order", "CANCEL-COUPON-001", 13_000);
        Assert.Null(await repository.UpdateUserTopUpStatusAsync(
            cancellableCoupon.Id, user.Id, "Bank transfer", TopUpStatuses.Pending, TopUpStatuses.Cancelled));
        var cancelledCoupon = await repository.UpdateUserTopUpStatusAsync(
            cancellableCoupon.Id, user.Id, "Coupon Order", TopUpStatuses.Pending, TopUpStatuses.Cancelled);
        Assert.Equal(TopUpStatuses.Cancelled, cancelledCoupon?.Status);
        Assert.Null(await repository.UpdateUserTopUpStatusAsync(
            cancellableCoupon.Id, user.Id, "Coupon Order", TopUpStatuses.Pending, TopUpStatuses.Cancelled));

        var bankTopUp = await repository.CreateTopUpAsync(
            user.Id, "Bank transfer", "OPMTESTBANK001", 13_000);
        var bankEntity = await dbContext.TopUpRequests.SingleAsync(x => x.Id == bankTopUp.Id);
        bankEntity.Status = TopUpStatuses.PaymentReported;
        await dbContext.SaveChangesAsync();
        Assert.DoesNotContain(
            await repository.ListTopUpsAsync(TopUpStatuses.Pending),
            item => item.Id == bankTopUp.Id && item.Status == TopUpStatuses.PaymentReported);
        Assert.Equal(
            TopUpReviewFailure.NotReviewable,
            (await repository.ReviewTopUpAsync(
                bankTopUp.Id, Guid.Empty, "admin:test", TopUpStatuses.Approved, "Không được duyệt thủ công")).Failure);
        var webhook = new SePayWebhookTransaction(
            "90001",
            "VCB",
            "0000000001",
            bankTopUp.ReferenceCode,
            bankTopUp.Amount,
            "in",
            "BANK-REF-001",
            """{"id":90001}""",
            DateTimeOffset.UtcNow);
        var processed = await repository.ProcessSePayWebhookAsync(webhook);
        Assert.True(processed.Credited);
        Assert.False(processed.Duplicate);
        Assert.Equal(TopUpStatuses.Paid, (await repository.GetUserTopUpAsync(bankTopUp.Id, user.Id))?.Status);
        Assert.Equal(13_000, (await repository.FindUserByIdAsync(user.Id))?.Balance);
        Assert.Single(await dbContext.BalanceLedgerEntries.ToListAsync());

        var replayed = await repository.ProcessSePayWebhookAsync(webhook);
        Assert.True(replayed.Duplicate);
        Assert.Equal(13_000, (await repository.FindUserByIdAsync(user.Id))?.Balance);
        Assert.Single(await dbContext.BalanceLedgerEntries.ToListAsync());

        var expiredBankTopUp = await repository.CreateTopUpAsync(
            user.Id, "Bank transfer", "OPMTESTBANK002", 50_000);
        var expiredBankEntity = await dbContext.TopUpRequests.SingleAsync(x => x.Id == expiredBankTopUp.Id);
        expiredBankEntity.CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-6);
        await dbContext.SaveChangesAsync();
        await repository.ExpirePendingBankTopUpsAsync(DateTimeOffset.UtcNow.AddMinutes(-5), user.Id);
        Assert.Equal(
            TopUpStatuses.Expired,
            (await repository.GetUserTopUpAsync(expiredBankTopUp.Id, user.Id))?.Status);

        var dashboard = await repository.GetDashboardAsync();
        Assert.Equal(1, dashboard.Users);
        Assert.Equal(1, dashboard.EventComments);
        Assert.Equal(1, dashboard.ForumTopics);
        Assert.Equal(1, dashboard.ForumPosts);
        Assert.Equal(1, dashboard.PendingTopUps);

        Assert.True(await repository.DeleteForumTopicAsync(topic.Id, Guid.Empty));
        Assert.Empty(await repository.ListForumTopicsAsync());
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{\"isActive\":null}")]
    public void AccountStatusContract_RejectsMissingOrNullBoolean(string payload)
    {
        var request = JsonSerializer.Deserialize<UpdateAccountStatusRequest>(
            payload, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.NotNull(request);
        var validationResults = new List<ValidationResult>();
        Assert.False(Validator.TryValidateObject(
            request!, new ValidationContext(request!), validationResults, validateAllProperties: true));
        Assert.Contains(validationResults, result =>
            result.MemberNames.Contains(nameof(UpdateAccountStatusRequest.IsActive)));
    }

    [Fact]
    public void AccountStatusContract_RejectsStringBoolean()
    {
        Assert.Throws<JsonException>(() => JsonSerializer.Deserialize<UpdateAccountStatusRequest>(
            "{\"isActive\":\"true\"}", new JsonSerializerOptions(JsonSerializerDefaults.Web)));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void AccountStatusContract_AcceptsExplicitBoolean(bool isActive)
    {
        var payload = $"{{\"isActive\":{isActive.ToString().ToLowerInvariant()}}}";
        var request = JsonSerializer.Deserialize<UpdateAccountStatusRequest>(
            payload, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.NotNull(request);
        var validationResults = new List<ValidationResult>();
        Assert.True(Validator.TryValidateObject(
            request!, new ValidationContext(request!), validationResults, validateAllProperties: true));
        Assert.Equal(isActive, request!.IsActive);
    }

    [Fact]
    public async Task AccountAdministration_TracksActivityAndPreventsSelfChanges()
    {
        await using var dbContext = CreateContext();
        var repository = new CommunityRepository(dbContext);
        var admin = await repository.CreateUserAsync("account-admin", "Account Admin", "hash");
        var target = await repository.CreateUserAsync("account-target", "Account Target", "hash");
        Assert.NotNull(admin);
        Assert.NotNull(target);
        admin!.Role = AccountRoles.Admin;
        await dbContext.SaveChangesAsync();

        Assert.Null(await repository.UpdateAccountStatusAsync(admin.Id, false, admin.Id));
        Assert.Null(await repository.UpdateAccountRoleAsync(admin.Id, AccountRoles.User, admin.Id));

        var disabled = await repository.UpdateAccountStatusAsync(target!.Id, false, admin.Id);
        Assert.NotNull(disabled);
        Assert.False(disabled!.IsActive);
        Assert.False((await repository.ListAccountsAsync()).Single(x => x.Id == target.Id).IsActive);

        var roleUpdated = await repository.UpdateAccountRoleAsync(target.Id, AccountRoles.Staff, admin.Id);
        Assert.Equal(AccountRoles.Staff, roleUpdated?.Role);
        Assert.False(roleUpdated?.IsActive);

        var enabled = await repository.UpdateAccountStatusAsync(target.Id, true, admin.Id);
        Assert.True(enabled?.IsActive);
    }

    [Fact]
    public async Task ReleaseSchedule_CrudPreservesBothLanguages()
    {
        await using var dbContext = CreateContext();
        var repository = new CommunityRepository(dbContext);
        var request = new ReleaseScheduleWriteRequest(
            "SEA", new DateOnly(2026, 8, 15), "100313-urplus", "/banner.png", false,
            "Tên Việt", "English name", "UR+", "Anh Hùng", "Hero", "Vũ Trang", "Duelist",
            "Sát thương", "Damage", 2);

        var created = await repository.CreateReleaseScheduleAsync(request);
        Assert.Equal("Tên Việt", created.OverrideNameVi);
        Assert.Equal("English name", created.OverrideNameEn);

        var english = Assert.Single(await repository.ListReleaseScheduleAsync("en"));
        Assert.Equal("English name", english.OverrideName);
        Assert.Equal("Hero", english.OverrideFaction);

        Assert.True(await repository.DeleteReleaseScheduleAsync(created.Id));
        Assert.Empty(await repository.ListReleaseScheduleAsync("vi"));
    }

    private static OpmWikiDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new OpmWikiDbContext(options);
    }
}
