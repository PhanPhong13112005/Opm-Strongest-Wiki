using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Seeding;

namespace OpmWiki.Tests;

public sealed class JsonDataSeederTests : IAsyncLifetime
{
    private readonly string dataPath = Path.Combine(Path.GetTempPath(), $"opmwiki-tests-{Guid.NewGuid():N}");

    public async Task InitializeAsync()
    {
        Directory.CreateDirectory(dataPath);
        await File.WriteAllTextAsync(Path.Combine(dataPath, "characters.json"), CharactersVi);
        await File.WriteAllTextAsync(Path.Combine(dataPath, "characters_en.json"), CharactersEn);
        await File.WriteAllTextAsync(Path.Combine(dataPath, "events.json"), Events);
    }

    public Task DisposeAsync()
    {
        if (Directory.Exists(dataPath)) Directory.Delete(dataPath, recursive: true);
        return Task.CompletedTask;
    }

    [Fact]
    public async Task SeedAsync_ImportsBilingualCharacterAndEvent_Idempotently()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new OpmWikiDbContext(options);
        var seeder = new JsonDataSeeder(
            dbContext,
            Options.Create(new SeedDataOptions { FrontendDataPath = dataPath }),
            NullLogger<JsonDataSeeder>.Instance);

        var first = await seeder.SeedAsync();
        var second = await seeder.SeedAsync();

        Assert.Equal(1, first.Characters);
        Assert.Equal(1, first.Events);
        Assert.Equal(first, second);

        var character = await dbContext.Characters
            .Include(x => x.Skills)
            .Include(x => x.Effects)
            .SingleAsync();
        Assert.Equal("Nhân vật thử", character.NameVi);
        Assert.Equal("Test Character", character.NameEn);
        Assert.Equal("Basic", Assert.Single(character.Skills).NameEn);
        Assert.Equal("[Shield]", Assert.Single(character.Effects).TermEn);
        Assert.Equal(new DateOnly(2026, 7, 1), character.ReleaseChina);

        var gameEvent = await dbContext.Events.SingleAsync();
        Assert.Equal("Test Event", gameEvent.TitleEn);
        Assert.Contains("General", gameEvent.SectionsJson);
    }

    [Fact]
    public async Task SeedAsync_ImportsTheCurrentFrontendDataset()
    {
        var frontendDataPath = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "../../../../../../src/data"));
        Assert.True(Directory.Exists(frontendDataPath), $"Frontend data path not found: {frontendDataPath}");

        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new OpmWikiDbContext(options);
        var seeder = new JsonDataSeeder(
            dbContext,
            Options.Create(new SeedDataOptions { FrontendDataPath = frontendDataPath }),
            NullLogger<JsonDataSeeder>.Instance);

        var result = await seeder.SeedAsync();

        Assert.Equal(176, result.Characters);
        Assert.Equal(46, result.Events);
        Assert.Equal(result.Characters, await dbContext.Characters.CountAsync());
        Assert.Equal(result.Events, await dbContext.Events.CountAsync());
        Assert.True(await dbContext.CharacterSkills.CountAsync() > 0);
    }

    private const string CharactersVi = """
        [{
          "id":"test-ur","name":"Nhân vật thử","imageURL":"/test.png","tier":"UR",
          "type":"Vũ Trang","faction":"Anh Hùng","roles":["Công"],"duyen":"Duyên",
          "baseStats":{"atk":10,"hp":20,"def":30,"spd":40},
          "pvpStats":{"atk":1,"hp":2,"def":3,"spd":4},
          "skills":[{"name":"Cơ bản","desc":"Mô tả","type":"Thường","icon":"/skill.png"}],
          "effects":[{"term":"[Khiên]","desc":"Giảm sát thương"}],
          "bio":"Tiểu sử","dacTinh":["KHIÊN"],"bondList":"Liên kết","classLevel":"Class_S",
          "releaseSea":"01/08/2026","releaseTrung":"01/07/2026"
        }]
        """;

    private const string CharactersEn = """
        [{
          "id":"test-ur","name":"Test Character","imageURL":"/test.png","tier":"UR",
          "type":"Duelist","faction":"Hero","roles":["Damage"],"duyen":"Bond",
          "baseStats":{"atk":10,"hp":20,"def":30,"spd":40},
          "pvpStats":{"atk":1,"hp":2,"def":3,"spd":4},
          "skills":[{"name":"Basic","desc":"Description","type":"Basic","icon":"/skill.png"}],
          "effects":[{"term":"[Shield]","desc":"Reduces damage"}],
          "bio":"Biography","dacTinh":["SHIELD"],"bondList":"Link","classLevel":"Class_S",
          "releaseSea":"01/08/2026","releaseTrung":"01/07/2026"
        }]
        """;

    private const string Events = """
        [{
          "id":"event-test","titleVi":"Sự kiện thử","titleEn":"Test Event",
          "descriptionVi":"Mô tả","descriptionEn":"Description","category":"main",
          "imageUrl":"/event.png","detailImages":["/detail.png"],
          "startDate":"2026-07-01","endDate":"2026-07-07",
          "sections":[{"id":"General","titleVi":"Chung","titleEn":"General"}]
        }]
        """;
}
