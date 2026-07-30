using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using OpmWiki.Domain.Entities;
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
        await File.WriteAllTextAsync(Path.Combine(dataPath, "mastery.json"), Mastery);
        await File.WriteAllTextAsync(Path.Combine(dataPath, "insignias.json"), Insignias);
        await File.WriteAllTextAsync(Path.Combine(dataPath, "backgear.json"), Backgears);
        await File.WriteAllTextAsync(Path.Combine(dataPath, "tactics.json"), Tactics);
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
        Assert.Equal(1, first.MasteryTiers);
        Assert.Equal(1, first.Insignias);
        Assert.Equal(1, first.Backgears);
        Assert.Equal(1, first.BackgearSets);
        Assert.Equal(1, first.TacticCards);
        Assert.Equal(1, first.TacticFrames);
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
        Assert.Equal(1, await dbContext.MasteryTiers.CountAsync());
        var insignia = await dbContext.Insignias
            .Include(x => x.GuideLinks)
            .ThenInclude(x => x.Guide)
            .SingleAsync();
        Assert.Equal("Test Insignia", insignia.NameEn);
        Assert.Equal("Mystery Shop", Assert.Single(insignia.GuideLinks).Guide.TitleEn);
        Assert.Equal("Test Backgear", (await dbContext.Backgears.SingleAsync()).NameEn);
        Assert.Equal("Test Set", (await dbContext.BackgearSets.SingleAsync()).NameEn);
        Assert.Equal("Assault", (await dbContext.TacticCards.SingleAsync()).NameEn);
        Assert.Equal(4200, (await dbContext.TacticFrames.SingleAsync()).Hp);
    }

    [Fact]
    public async Task SeedAsync_RejectsExactDuplicateCharacterIdBeforeTrackingEntities()
    {
        await AppendDuplicateArrayItemAsync("characters.json");
        await using var dbContext = CreateDbContext();

        var exception = await Assert.ThrowsAsync<InvalidDataException>(() => CreateSeeder(dbContext).SeedAsync());

        Assert.Contains("Duplicate character id", exception.Message);
        Assert.Empty(dbContext.ChangeTracker.Entries());
        Assert.Equal(0, await dbContext.Characters.CountAsync());
    }

    [Fact]
    public async Task SeedAsync_RejectsCaseInsensitiveDuplicateCharacterIdBeforeTrackingEntities()
    {
        await AppendDuplicateArrayItemAsync("characters.json", "TEST-UR");
        await using var dbContext = CreateDbContext();

        var exception = await Assert.ThrowsAsync<InvalidDataException>(() => CreateSeeder(dbContext).SeedAsync());

        Assert.Contains("Duplicate character id", exception.Message);
        Assert.Empty(dbContext.ChangeTracker.Entries());
        Assert.Equal(0, await dbContext.Characters.CountAsync());
    }

    [Fact]
    public async Task SeedAsync_RejectsDuplicateEventIdBeforeTrackingEntities()
    {
        await AppendDuplicateArrayItemAsync("events.json");
        await using var dbContext = CreateDbContext();

        var exception = await Assert.ThrowsAsync<InvalidDataException>(() => CreateSeeder(dbContext).SeedAsync());

        Assert.Contains("Duplicate event id", exception.Message);
        Assert.Empty(dbContext.ChangeTracker.Entries());
        Assert.Equal(0, await dbContext.Events.CountAsync());
    }

    [Fact]
    public async Task SeedAsync_RejectsDuplicateMasteryKeyBeforeTrackingEntities()
    {
        var root = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataPath, "mastery.json")))!.AsObject();
        var tiers = root["categories"]!.AsObject()["phe"]!.AsArray();
        tiers.Add(tiers[0]!.DeepClone());
        await File.WriteAllTextAsync(Path.Combine(dataPath, "mastery.json"), root.ToJsonString());
        await using var dbContext = CreateDbContext();

        var exception = await Assert.ThrowsAsync<InvalidDataException>(() => CreateSeeder(dbContext).SeedAsync());

        Assert.Contains("Duplicate mastery key", exception.Message);
        Assert.Empty(dbContext.ChangeTracker.Entries());
        Assert.Equal(0, await dbContext.MasteryTiers.CountAsync());
    }

    [Fact]
    public async Task SeedAsync_RejectsDuplicateGuideIdWithinAnInsigniaBeforeTrackingEntities()
    {
        var root = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataPath, "insignias.json")))!.AsObject();
        var item = root["items"]!.AsArray()[0]!.AsObject();
        var guideIds = item["guideIds"]!.AsArray();
        guideIds.Add(guideIds[0]!.DeepClone());
        await File.WriteAllTextAsync(Path.Combine(dataPath, "insignias.json"), root.ToJsonString());
        await using var dbContext = CreateDbContext();

        var exception = await Assert.ThrowsAsync<InvalidDataException>(() => CreateSeeder(dbContext).SeedAsync());

        Assert.Contains("Duplicate guide id", exception.Message);
        Assert.Empty(dbContext.ChangeTracker.Entries());
        Assert.Equal(0, await dbContext.Insignias.CountAsync());
    }

    [Fact]
    public async Task SeedAsync_ClearsTrackedEntitiesAfterFailureAndCanRunAgain()
    {
        await File.WriteAllTextAsync(
            Path.Combine(dataPath, "events.json"),
            Events.Replace("2026-07-01", "invalid-date", StringComparison.Ordinal));
        await using var dbContext = CreateDbContext();
        var seeder = CreateSeeder(dbContext);

        await Assert.ThrowsAsync<InvalidDataException>(() => seeder.SeedAsync());

        Assert.DoesNotContain(
            dbContext.ChangeTracker.Entries(),
            entry => entry.State is EntityState.Added or EntityState.Modified);
        Assert.Empty(dbContext.ChangeTracker.Entries());
        Assert.Equal(0, await dbContext.Characters.CountAsync());

        await File.WriteAllTextAsync(Path.Combine(dataPath, "events.json"), Events);
        var result = await seeder.SeedAsync();

        Assert.Equal(1, result.Characters);
        Assert.Equal(1, result.Events);
        Assert.Equal(1, await dbContext.Characters.CountAsync());
        Assert.Equal(1, await dbContext.Events.CountAsync());
    }

    [Fact]
    public async Task SeedAsync_PreservesAdminChangesAndAddsOnlyMissingSourceRecords()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new OpmWikiDbContext(options);
        var seeder = new JsonDataSeeder(
            dbContext,
            Options.Create(new SeedDataOptions { FrontendDataPath = dataPath }),
            NullLogger<JsonDataSeeder>.Instance);

        await seeder.SeedAsync();

        var character = await dbContext.Characters
            .Include(x => x.Skills)
            .Include(x => x.Effects)
            .SingleAsync();
        character.NameEn = "Admin Character";
        Assert.Single(character.Skills).NameEn = "Admin Skill";
        Assert.Single(character.Effects).DescriptionEn = "Admin Effect";
        (await dbContext.Events.SingleAsync()).TitleEn = "Admin Event";
        (await dbContext.MasteryTiers.SingleAsync()).Atk = 999;

        var insignia = await dbContext.Insignias
            .Include(x => x.GuideLinks)
            .ThenInclude(x => x.Guide)
            .SingleAsync();
        insignia.NameEn = "Admin Insignia";
        Assert.Single(insignia.GuideLinks).Guide.TitleEn = "Admin Guide";
        (await dbContext.Backgears.SingleAsync()).NameEn = "Admin Backgear";
        (await dbContext.BackgearSets.SingleAsync()).NameEn = "Admin Set";
        (await dbContext.TacticCards.SingleAsync()).NameEn = "Admin Card";
        (await dbContext.TacticFrames.SingleAsync()).Name = "Admin Frame";
        dbContext.TacticFrames.Add(new TacticFrame
        {
            Id = "admin-frame",
            Name = "Admin-created Frame",
            Icon = "admin.png",
            Hp = 1,
            Def = 2,
            ColorClass = "admin-color",
            BorderClass = "admin-border",
            BackgroundClass = "admin-background",
            SortOrder = 99,
        });
        await dbContext.SaveChangesAsync();

        await File.WriteAllTextAsync(Path.Combine(dataPath, "tactics.json"), TacticsWithNewFrame);
        var second = await seeder.SeedAsync();
        dbContext.ChangeTracker.Clear();

        var preservedCharacter = await dbContext.Characters
            .Include(x => x.Skills)
            .Include(x => x.Effects)
            .SingleAsync();
        Assert.Equal("Admin Character", preservedCharacter.NameEn);
        Assert.Equal("Admin Skill", Assert.Single(preservedCharacter.Skills).NameEn);
        Assert.Equal("Admin Effect", Assert.Single(preservedCharacter.Effects).DescriptionEn);
        Assert.Equal("Admin Event", (await dbContext.Events.SingleAsync()).TitleEn);
        Assert.Equal(999, (await dbContext.MasteryTiers.SingleAsync()).Atk);

        var preservedInsignia = await dbContext.Insignias
            .Include(x => x.GuideLinks)
            .ThenInclude(x => x.Guide)
            .SingleAsync();
        Assert.Equal("Admin Insignia", preservedInsignia.NameEn);
        Assert.Equal("Admin Guide", Assert.Single(preservedInsignia.GuideLinks).Guide.TitleEn);
        Assert.Equal("Admin Backgear", (await dbContext.Backgears.SingleAsync()).NameEn);
        Assert.Equal("Admin Set", (await dbContext.BackgearSets.SingleAsync()).NameEn);
        Assert.Equal("Admin Card", (await dbContext.TacticCards.SingleAsync()).NameEn);
        Assert.Equal("Admin Frame", (await dbContext.TacticFrames.SingleAsync(x => x.Id == "tf_01")).Name);
        Assert.Equal("Admin-created Frame", (await dbContext.TacticFrames.SingleAsync(x => x.Id == "admin-frame")).Name);
        Assert.Equal("New Source Frame", (await dbContext.TacticFrames.SingleAsync(x => x.Id == "tf_02")).Name);
        Assert.Equal(2, second.TacticFrames);
        Assert.Equal(3, await dbContext.TacticFrames.CountAsync());
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

        var charactersJsonPath = Path.Combine(frontendDataPath, "characters.json");
        var expectedCharacterCount = System.Text.Json.JsonDocument.Parse(await File.ReadAllTextAsync(charactersJsonPath))
            .RootElement.GetArrayLength();

        var result = await seeder.SeedAsync();

        Assert.Equal(expectedCharacterCount, result.Characters);
        Assert.Equal(46, result.Events);
        Assert.Equal(33, result.MasteryTiers);
        Assert.Equal(10, result.Insignias);
        Assert.Equal(9, result.Backgears);
        Assert.Equal(1, result.BackgearSets);
        Assert.Equal(19, result.TacticCards);
        Assert.Equal(13, result.TacticFrames);
        Assert.Equal(result.Characters, await dbContext.Characters.CountAsync());
        Assert.Equal(result.Events, await dbContext.Events.CountAsync());
        Assert.True(await dbContext.CharacterSkills.CountAsync() > 0);
        Assert.Equal(result.MasteryTiers, await dbContext.MasteryTiers.CountAsync());
        Assert.Equal(result.Insignias, await dbContext.Insignias.CountAsync());
        Assert.Equal(result.Backgears, await dbContext.Backgears.CountAsync());
        Assert.Equal(result.BackgearSets, await dbContext.BackgearSets.CountAsync());
        Assert.Equal(result.TacticCards, await dbContext.TacticCards.CountAsync());
        Assert.Equal(result.TacticFrames, await dbContext.TacticFrames.CountAsync());

        var blackSperm = await dbContext.Characters.FirstOrDefaultAsync(c => c.Id == "blacksperm-urplus");
        Assert.NotNull(blackSperm);
        Assert.Equal("Tinh Trùng Đen", blackSperm.NameVi);
        Assert.Equal("Black Sperm", blackSperm.NameEn);
    }

    private static OpmWikiDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new OpmWikiDbContext(options);
    }

    private JsonDataSeeder CreateSeeder(OpmWikiDbContext dbContext) =>
        new(
            dbContext,
            Options.Create(new SeedDataOptions { FrontendDataPath = dataPath }),
            NullLogger<JsonDataSeeder>.Instance);

    private async Task AppendDuplicateArrayItemAsync(string fileName, string? duplicateId = null)
    {
        var path = Path.Combine(dataPath, fileName);
        var root = JsonNode.Parse(await File.ReadAllTextAsync(path))!.AsArray();
        var duplicate = root[0]!.DeepClone().AsObject();
        if (duplicateId is not null) duplicate["id"] = duplicateId;
        root.Add(duplicate);
        await File.WriteAllTextAsync(path, root.ToJsonString());
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

    private const string Mastery = """
        {
          "version": 1,
          "categories": {
            "phe": [{
              "tier": 0,
              "stats": {"atk": 0, "hp": 0},
              "costs": {},
              "requirements": []
            }],
            "he": [],
            "cap": []
          }
        }
        """;

    private const string Insignias = """
        {
          "version": 1,
          "guides": [{
            "id":"mystery-shop","titleVi":"Cửa hàng Bí ẩn","titleEn":"Mystery Shop",
            "descriptionVi":"Mô tả","descriptionEn":"Description","images":["/guide.png"]
          }],
          "items": [{
            "id":"insignia-A","classLevel":"A","nameVi":"Huy Hiệu thử","nameEn":"Test Insignia",
            "imageUrl":"/Class/A.png","sortOrder":1,"guideIds":["mystery-shop"]
          }]
        }
        """;

    private const string Backgears = """
        {
          "gears": [{
            "id":"BD_TEST","nameVi":"Thẻ thử","nameEn":"Test Backgear","theme":"spring",
            "rarityVi":"Siêu Hạng","rarity":"Superb","acquireVi":"Sự kiện","acquireEn":"Event",
            "levelMax":1,"icon":"/gear.webp","thumbnail":"/thumb.webp","seniorIcon":"/gear.webp",
            "changeLevel":null,
            "levels":[{"level":1,"senior":false,"costVi":"mở khoá","costEn":"unlock",
              "effects":[{"type":"hp_up","vi":"Máu","en":"HP","text":"+1"}]}]
          }],
          "sets": [{
            "id":"SET_TEST","nameVi":"Bộ thử","nameEn":"Test Set","rarityVi":"Siêu Hạng","rarity":"Superb",
            "rewardVi":"Thưởng","rewardEn":"Reward","rewardIcon":"/reward.webp",
            "needs":[{"id":"BD_TEST","nameVi":"Thẻ thử","nameEn":"Test Backgear","icon":"/gear.webp","count":1}],
            "levels":[{"setLevel":1,"effects":[{"type":"attack_up","vi":"Tấn Công","en":"ATK","text":"+1%"}]}]
          }]
        }
        """;

    private const string Tactics = """
        {
          "cards":[{
            "id":"tc_01","name":{"vi":"Cường Công","en":"Assault"},"icon":"attack.png","count":144,
            "eff":{"vi":"+15% Tấn công","en":"+15% ATK"},
            "scaling":{"metric":"stat","statType":"attack_rate","label_en":"ATK","label_vi":"Tấn công","unit":"%","summable":true,
              "rarities":[{"key":"orange","quality":5,"name_en":"Orange","name_vi":"Cam","tiers":[{"star":7,"value":15}]}]}
          }],
          "frames":[{
            "id":"tf_01","name":"Standard I","icon":"frame.png","hp":4200,"def":2100,
            "colorClass":"text-green","borderClass":"border-green","bgClass":"bg-green"
          }]
        }
        """;

    private const string TacticsWithNewFrame = """
        {
          "cards":[{
            "id":"tc_01","name":{"vi":"Cường Công","en":"Assault"},"icon":"attack.png","count":144,
            "eff":{"vi":"+15% Tấn công","en":"+15% ATK"},
            "scaling":{"metric":"stat","statType":"attack_rate","label_en":"ATK","label_vi":"Tấn công","unit":"%","summable":true,
              "rarities":[{"key":"orange","quality":5,"name_en":"Orange","name_vi":"Cam","tiers":[{"star":7,"value":15}]}]}
          }],
          "frames":[{
            "id":"tf_01","name":"Standard I","icon":"frame.png","hp":4200,"def":2100,
            "colorClass":"text-green","borderClass":"border-green","bgClass":"bg-green"
          },{
            "id":"tf_02","name":"New Source Frame","icon":"frame-2.png","hp":5200,"def":2600,
            "colorClass":"text-blue","borderClass":"border-blue","bgClass":"bg-blue"
          }]
        }
        """;
}
