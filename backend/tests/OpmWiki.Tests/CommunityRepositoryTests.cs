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
        var reviewed = await repository.ReviewTopUpAsync(topUp.Id, Guid.Empty, TopUpStatuses.Approved, "Đã đối soát");
        Assert.Null(reviewed);
        Assert.Equal(0, (await repository.FindUserByIdAsync(user.Id))?.Balance);

        var couponOrder = await repository.CreateTopUpAsync(
            user.Id, "Coupon Order", "UID:3107453|SID:310170|CP:6|QTY:1|QA", 13_000);
        var reviewedCoupon = await repository.ReviewTopUpAsync(
            couponOrder.Id, Guid.Empty, TopUpStatuses.Approved, "Đã nạp Coupon");
        Assert.Equal(TopUpStatuses.Approved, reviewedCoupon?.Status);
        Assert.Equal(0, (await repository.FindUserByIdAsync(user.Id))?.Balance);

        var bankTopUp = await repository.CreateTopUpAsync(
            user.Id, "Bank transfer", "OPMTESTBANK001", 13_000);
        var bankEntity = await dbContext.TopUpRequests.SingleAsync(x => x.Id == bankTopUp.Id);
        bankEntity.Status = TopUpStatuses.PaymentReported;
        await dbContext.SaveChangesAsync();
        Assert.DoesNotContain(
            await repository.ListTopUpsAsync(TopUpStatuses.Pending),
            item => item.Id == bankTopUp.Id && item.Status == TopUpStatuses.PaymentReported);
        Assert.Null(await repository.ReviewTopUpAsync(
            bankTopUp.Id, Guid.Empty, TopUpStatuses.Approved, "Không được duyệt thủ công"));
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
        Assert.Equal(0, dashboard.PendingTopUps);

        Assert.True(await repository.DeleteForumTopicAsync(topic.Id, Guid.Empty));
        Assert.Empty(await repository.ListForumTopicsAsync());
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
