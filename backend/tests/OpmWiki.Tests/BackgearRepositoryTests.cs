using Microsoft.EntityFrameworkCore;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

public sealed class BackgearRepositoryTests
{
    [Fact]
    public async Task GetCatalog_ReturnsLocalizedOrderedGearsAndSets()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new OpmWikiDbContext(options);
        dbContext.Backgears.Add(new Backgear
        {
            Id = "BD_P1",
            NameVi = "Đồng Cỏ Anh Đào",
            NameEn = "Cherry Blossom Meadow",
            Theme = "spring",
            RarityVi = "Siêu Hạng",
            RarityEn = "Superb",
            AcquireVi = "Sự kiện mùa xuân",
            AcquireEn = "Spring event",
            LevelMax = 1,
            IconUrl = "/gear.webp",
            ThumbnailUrl = "/thumb.webp",
            SeniorIconUrl = "/gear.webp",
            LevelsJson = """[{"level":1,"senior":false,"costVi":"mở khoá","costEn":"unlock","effects":[{"type":"hp_up","vi":"Máu","en":"HP","text":"+72,000"}]}]""",
            SortOrder = 0,
        });
        dbContext.BackgearSets.Add(new BackgearSet
        {
            Id = "SET_1",
            NameVi = "Bộ mùa xuân",
            NameEn = "Spring Set",
            RarityVi = "Siêu Hạng",
            RarityEn = "Superb",
            RewardVi = "Phần thưởng",
            RewardEn = "Reward",
            RewardIconUrl = "/reward.webp",
            NeedsJson = """[{"id":"BD_P1","nameVi":"Đồng Cỏ Anh Đào","nameEn":"Cherry Blossom Meadow","icon":"/gear.webp","count":1}]""",
            LevelsJson = """[{"setLevel":1,"effects":[{"type":"attack_up","vi":"Tấn Công","en":"ATK","text":"+1%"}]}]""",
            SortOrder = 0,
        });
        await dbContext.SaveChangesAsync();

        var catalog = await new BackgearRepository(dbContext).GetCatalogAsync("en");

        var gear = Assert.Single(catalog.Gears);
        Assert.Equal("Cherry Blossom Meadow", gear.Name);
        Assert.Equal("unlock", Assert.Single(gear.Levels).Cost);
        Assert.Equal("HP", Assert.Single(gear.Levels[0].Effects).Name);
        var set = Assert.Single(catalog.Sets);
        Assert.Equal("Spring Set", set.Name);
        Assert.Equal("Cherry Blossom Meadow", Assert.Single(set.Needs).Name);
        Assert.Equal("ATK", Assert.Single(set.Levels[0].Effects).Name);
    }
}
