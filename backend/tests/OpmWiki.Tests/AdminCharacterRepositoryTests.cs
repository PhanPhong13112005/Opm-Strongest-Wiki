using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Admin;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

public sealed class AdminCharacterRepositoryTests
{
    [Fact]
    public async Task CrudAndKeepsakeOperations_UpdateTheSharedCharacterRecord()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new OpmWikiDbContext(options);
        var repository = new AdminCharacterRepository(dbContext);
        var request = CreateRequest("admin-test", "Nhân vật thử nghiệm");

        var created = await repository.CreateAsync(request);
        Assert.NotNull(created);
        Assert.Null(await repository.CreateAsync(request));

        var keepsake = await repository.UpdateKeepsakeAsync(
            request.Id,
            "/Keepsake/Admin Test (SSRplus)/Keepsake_SSRplus.png");
        Assert.NotNull(keepsake);
        Assert.Equal("/Keepsake/Admin Test (SSRplus)/Keepsake_SSRplus.png", keepsake.KeepsakeIcon);

        var updated = await repository.UpdateAsync(
            request.Id,
            CreateRequest(request.Id, "Tên đã sửa"));
        Assert.NotNull(updated);
        Assert.Equal("Tên đã sửa", updated.NameVi);

        var page = await repository.ListAsync(new AdminCharacterQuery());
        Assert.Equal(request.Id, Assert.Single(page.Items).Id);

        Assert.True(await repository.DeleteAsync(request.Id));
        Assert.Null(await repository.GetByIdAsync(request.Id));
        Assert.False(await repository.DeleteAsync(request.Id));
    }

    private static AdminCharacterWriteRequest CreateRequest(string id, string nameVi) => new()
    {
        Id = id,
        NameVi = nameVi,
        NameEn = "Test Character",
        ImageUrl = "/Characters/test.png",
        Tier = "SSR+",
        TypeVi = "Vũ Trang",
        TypeEn = "Duelist",
        FactionVi = "Anh Hùng",
        FactionEn = "Hero",
        RolesVi = ["Sát thương"],
        RolesEn = ["Damage"],
        ClassLevel = "A",
        BaseStats = new AdminCharacterStatsDto(100, 1000, 50, 90),
        PvpStats = new AdminCharacterStatsDto(200, 2000, 100, 100),
    };
}
