using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Characters;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

public sealed class CharacterRepositoryTests
{
    [Fact]
    public async Task ListAsync_DefaultsToNewestReleaseAndPaginatesAfterSorting()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new OpmWikiDbContext(options);
        dbContext.Characters.AddRange(
            CreateCharacter("old-sea", "Old SEA", new DateOnly(2025, 1, 1), new DateOnly(2024, 9, 1)),
            CreateCharacter("new-sea", "New SEA", new DateOnly(2026, 1, 1), new DateOnly(2025, 9, 1)),
            CreateCharacter("china-only", "China Only", null, new DateOnly(2025, 6, 1)),
            CreateCharacter("undated", "Undated", null, null));
        await dbContext.SaveChangesAsync();

        var repository = new CharacterRepository(dbContext);
        var firstPage = await repository.ListAsync(new CharacterQuery(Page: 1, PageSize: 2));
        var secondPage = await repository.ListAsync(new CharacterQuery(Page: 2, PageSize: 2));

        Assert.Equal(["new-sea", "china-only"], firstPage.Items.Select(x => x.Id));
        Assert.Equal(["old-sea", "undated"], secondPage.Items.Select(x => x.Id));
        Assert.Equal(4, firstPage.TotalCount);
    }

    [Fact]
    public async Task ListAsync_CanStillSortByLocalizedName()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new OpmWikiDbContext(options);
        dbContext.Characters.AddRange(
            CreateCharacter("z", "Zulu", new DateOnly(2026, 1, 1), null),
            CreateCharacter("a", "Alpha", new DateOnly(2025, 1, 1), null));
        await dbContext.SaveChangesAsync();

        var repository = new CharacterRepository(dbContext);
        var result = await repository.ListAsync(new CharacterQuery(Language: "en", Sort: "name_asc"));

        Assert.Equal(["a", "z"], result.Items.Select(x => x.Id));
    }

    private static Character CreateCharacter(
        string id,
        string name,
        DateOnly? releaseSea,
        DateOnly? releaseChina) => new()
        {
            Id = id,
            NameVi = name,
            NameEn = name,
            Tier = "SSR",
            TypeVi = "Vũ Trang",
            TypeEn = "Duelist",
            FactionVi = "Anh Hùng",
            FactionEn = "Hero",
            ReleaseSea = releaseSea,
            ReleaseChina = releaseChina,
        };
}
