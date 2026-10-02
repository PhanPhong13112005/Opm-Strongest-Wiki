using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpmWiki.Api.Controllers;
using OpmWiki.Application.Community;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

public sealed class ReleaseScheduleMonthPrecisionTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Theory]
    [InlineData("2026-10", true)]
    [InlineData("2024-02", true)]
    [InlineData("0001-01", true)]
    [InlineData("9999-12", true)]
    [InlineData("0000-10", false)]
    [InlineData("2026-00", false)]
    [InlineData("2026-13", false)]
    [InlineData("2026-1", false)]
    [InlineData("2026-10-01", false)]
    [InlineData(" 2026-10", false)]
    [InlineData(null, false)]
    public void MonthValidationDoesNotAcceptAnInventedDay(string? month, bool expected)
        => Assert.Equal(expected, ReleaseScheduleMonth.IsValid(month));

    [Fact]
    public void SnapshotMatchesRuntimeModelWithoutOpeningADatabase()
    {
        using var context = new OpmWikiDbContext(new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseNpgsql("Host=127.0.0.1;Port=55439;Database=opmwiki_month_test;Username=opmwiki_month_local").Options);
        Assert.False(context.Database.HasPendingModelChanges());
    }

    [Fact]
    public async Task OptInIncludesChildWithoutChangingLegacyRowsOrFields()
    {
        await using var context = CreateContext();
        SeedCanonicalDays(context);
        await context.SaveChangesAsync();
        var repository = new CommunityRepository(context);
        var before = JsonSerializer.Serialize(await repository.ListReleaseScheduleAsync("vi"), JsonOptions);
        var child = await repository.CreateMonthReleaseScheduleAsync(Child());

        var saved = await context.ReleaseScheduleEntries.SingleAsync(x => x.Id == child.Id);
        Assert.Null(saved.Date);
        Assert.Equal("2026-10", saved.ReleaseMonth);
        Assert.Equal("month", saved.DatePrecision);
        Assert.Equal(before, JsonSerializer.Serialize(await repository.ListReleaseScheduleAsync("vi"), JsonOptions));

        foreach (var language in new[] { "vi", "en" })
        {
            var rows = await repository.ListReleaseScheduleWithMonthPrecisionAsync(language);
            Assert.Equal(23, rows.Count);
            Assert.Equal(23, rows.Select(x => $"{x.Server}|{x.Date}|{x.SortOrder}").Distinct().Count());
            var target = Assert.Single(rows, x => x.CharacterId == "100320-urplus");
            Assert.Equal("2026-10", target.Date);
            Assert.Equal("month", target.DatePrecision);
            Assert.Equal(language == "en" ? "Child Emperor" : "Đồng Đế", target.OverrideName);
            Assert.All(rows.Where(x => x.CharacterId != target.CharacterId), x => Assert.Equal("day", x.DatePrecision));
            Assert.Equal(rows.OrderBy(x => x.Date, StringComparer.Ordinal)
                .ThenBy(x => x.Server, StringComparer.Ordinal).ThenBy(x => x.SortOrder), rows);
        }

        var controller = new ReleaseScheduleController(repository);
        var legacy = Assert.IsType<OkObjectResult>(await controller.List());
        var legacyRows = Assert.IsAssignableFrom<IReadOnlyList<ReleaseScheduleDto>>(legacy.Value);
        Assert.Equal(22, legacyRows.Count);
        using var json = JsonDocument.Parse(JsonSerializer.Serialize(legacyRows, JsonOptions));
        Assert.Equal(20, json.RootElement[0].EnumerateObject().Count());
        Assert.False(json.RootElement[0].TryGetProperty("datePrecision", out _));
        Assert.IsAssignableFrom<IReadOnlyList<ReleaseScheduleMonthAwareDto>>(
            Assert.IsType<OkObjectResult>(await controller.List("vi", true)).Value);
        Assert.Equal(21, JsonSerializer.SerializeToElement(
            ((OkObjectResult)await controller.List("vi", true)).Value, JsonOptions)[0]
            .EnumerateObject().Count());
    }

    [Theory]
    [InlineData("2026-13", "CN", 1)]
    [InlineData("2026-10-01", "CN", 1)]
    [InlineData("2026-10", "OTHER", 1)]
    [InlineData("2026-10", "CN", 0)]
    public async Task AdminRejectsInvalidMonthServerAndSortOrder(string date, string server, int sortOrder)
    {
        await using var context = CreateContext();
        var controller = new AdminReleaseScheduleController(new CommunityRepository(context));
        var result = await controller.CreateMonth(Child() with { Date = date, Server = server, SortOrder = sortOrder }, default);
        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Empty(context.ReleaseScheduleEntries);
    }

    [Fact]
    public async Task OptInFailsClosedForInconsistentStoredPrecision()
    {
        await using var context = CreateContext();
        context.ReleaseScheduleEntries.Add(new ReleaseScheduleEntry
        {
            Server = "CN", CharacterId = "invalid", Date = new DateOnly(2026, 10, 1),
            DatePrecision = "month", ReleaseMonth = "2026-10",
        });
        await context.SaveChangesAsync();
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new CommunityRepository(context).ListReleaseScheduleWithMonthPrecisionAsync("vi"));
    }

    internal static ReleaseScheduleMonthWriteRequest Child() => new(
        "CN", "2026-10", "100320-urplus", "/Characters/Child Emperor (UR)/UR.png", false,
        "Đồng Đế", "Child Emperor", "UR+", "", "", "", "", "", "", 1);

    internal static void SeedCanonicalDays(OpmWikiDbContext context)
    {
        using var fixture = JsonDocument.Parse(File.ReadAllText(
            Path.Combine(AppContext.BaseDirectory, "Fixtures", "release_schedule_api_vi.json")));
        foreach (var row in fixture.RootElement.EnumerateArray())
        {
            string Text(string key) => row.GetProperty(key).GetString() ?? "";
            context.ReleaseScheduleEntries.Add(new ReleaseScheduleEntry
            {
                Id = row.GetProperty("id").GetInt64(), Server = Text("server"), Date = DateOnly.Parse(Text("date")),
                CharacterId = Text("characterId"), BannerImage = Text("bannerImage"),
                IsReturn = row.GetProperty("isReturn").GetBoolean(), SortOrder = row.GetProperty("sortOrder").GetInt32(),
                OverrideNameVi = Text("overrideNameVi"), OverrideNameEn = Text("overrideNameEn"), OverrideTier = Text("overrideTier"),
                OverrideFactionVi = Text("overrideFactionVi"), OverrideFactionEn = Text("overrideFactionEn"),
                OverrideTypeVi = Text("overrideTypeVi"), OverrideTypeEn = Text("overrideTypeEn"),
                OverrideRoleVi = Text("overrideRoleVi"), OverrideRoleEn = Text("overrideRoleEn"),
            });
        }
    }

    private static OpmWikiDbContext CreateContext() => new(new DbContextOptionsBuilder<OpmWikiDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
}
