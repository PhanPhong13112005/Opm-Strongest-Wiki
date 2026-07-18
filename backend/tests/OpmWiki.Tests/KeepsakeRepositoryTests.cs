using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Keepsakes;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

public sealed class KeepsakeRepositoryTests
{
    [Fact]
    public async Task ListAndDetail_ReadKeepsakesFromCharactersWithoutDuplicatingData()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new OpmWikiDbContext(options);
        dbContext.Characters.AddRange(
            CreateCharacter("hero-ur", "Anh hùng UR", "UR Hero", "UR", "/keepsake-ur.png"),
            CreateCharacter("hero-ssr", "Anh hùng SSR", "SSR Hero", "SSR", "/keepsake-ssr.png"),
            CreateCharacter("without-keepsake", "Không có", "Missing", "SSR", null));
        await dbContext.SaveChangesAsync();

        var repository = new KeepsakeRepository(dbContext);
        var page = await repository.ListAsync(new KeepsakeQuery(Language: "en", Tier: "UR"));
        var summary = Assert.Single(page.Items);

        Assert.Equal(1, page.TotalCount);
        Assert.Equal("UR Hero", summary.CharacterName);
        Assert.Equal("limited-event", summary.AcquisitionType);

        var detail = await repository.GetByIdAsync("hero-ssr", "vi");
        Assert.NotNull(detail);
        Assert.Equal("Anh hùng SSR", detail.CharacterName);
        Assert.Equal("related-event", detail.AcquisitionType);
        Assert.Null(await repository.GetByIdAsync("without-keepsake", "vi"));
    }

    private static Character CreateCharacter(
        string id,
        string nameVi,
        string nameEn,
        string tier,
        string? keepsakeIcon) => new()
        {
            Id = id,
            NameVi = nameVi,
            NameEn = nameEn,
            Tier = tier,
            TypeVi = "Vũ Trang",
            TypeEn = "Duelist",
            FactionVi = "Anh Hùng",
            FactionEn = "Hero",
            KeepsakeIcon = keepsakeIcon,
        };
}
