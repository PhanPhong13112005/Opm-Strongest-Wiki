using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Insignias;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

public sealed class InsigniaRepositoryTests
{
    [Fact]
    public async Task ListAndDetail_ReturnLocalizedInsigniasAndOrderedGuides()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new OpmWikiDbContext(options);

        var firstGuide = CreateGuide("first", "Đầu tiên", "First");
        var secondGuide = CreateGuide("second", "Tiếp theo", "Second");
        dbContext.Insignias.AddRange(
            CreateInsignia("insignia-B", "B", "Huy Hiệu B", "B Insignia", 2),
            CreateInsignia("insignia-A", "A", "Huy Hiệu A", "A Insignia", 1));
        dbContext.InsigniaGuides.AddRange(firstGuide, secondGuide);
        dbContext.InsigniaGuideLinks.AddRange(
            new InsigniaGuideLink { InsigniaId = "insignia-A", GuideId = "second", SortOrder = 1 },
            new InsigniaGuideLink { InsigniaId = "insignia-A", GuideId = "first", SortOrder = 0 });
        await dbContext.SaveChangesAsync();

        var repository = new InsigniaRepository(dbContext);
        var list = await repository.ListAsync(new InsigniaQuery(Language: "en"));
        var detail = await repository.GetByIdAsync("insignia-A", "en");

        Assert.Equal(["insignia-A", "insignia-B"], list.Items.Select(x => x.Id));
        Assert.NotNull(detail);
        Assert.Equal("A Insignia", detail.Name);
        Assert.Equal(["first", "second"], detail.Guides.Select(x => x.Id));
        Assert.Equal("First", detail.Guides[0].Title);
    }

    private static Insignia CreateInsignia(
        string id,
        string classLevel,
        string nameVi,
        string nameEn,
        int sortOrder) => new()
        {
            Id = id,
            ClassLevel = classLevel,
            NameVi = nameVi,
            NameEn = nameEn,
            ImageUrl = $"/Class/{classLevel}.png",
            SortOrder = sortOrder,
        };

    private static InsigniaGuide CreateGuide(string id, string titleVi, string titleEn) => new()
    {
        Id = id,
        TitleVi = titleVi,
        TitleEn = titleEn,
        DescriptionVi = titleVi,
        DescriptionEn = titleEn,
        ImageUrls = [$"/{id}.png"],
    };
}
