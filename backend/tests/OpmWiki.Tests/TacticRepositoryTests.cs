using Microsoft.EntityFrameworkCore;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;
using OpmWiki.Infrastructure.Repositories;

namespace OpmWiki.Tests;

public sealed class TacticRepositoryTests
{
    [Fact]
    public async Task GetCatalog_ReturnsLocalizedScalingAndFrameStats()
    {
        var options = new DbContextOptionsBuilder<OpmWikiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var dbContext = new OpmWikiDbContext(options);
        dbContext.TacticCards.Add(new TacticCard
        {
            Id = "tc_01",
            NameVi = "Cường Công",
            NameEn = "Assault",
            Icon = "attack.png",
            Count = 144,
            EffectVi = "+15% Tấn công",
            EffectEn = "+15% ATK",
            ScalingJson = """{"metric":"stat","statType":"attack_rate","label_en":"ATK","label_vi":"Tấn công","unit":"%","summable":true,"rarities":[{"key":"orange","quality":5,"name_en":"Orange","name_vi":"Cam","tiers":[{"star":7,"value":15}]}]}""",
            SortOrder = 0,
        });
        dbContext.TacticFrames.Add(new TacticFrame
        {
            Id = "tf_01",
            Name = "Standard I",
            Icon = "frame.png",
            Hp = 4200,
            Def = 2100,
            ColorClass = "text-green",
            BorderClass = "border-green",
            BackgroundClass = "bg-green",
            SortOrder = 0,
        });
        await dbContext.SaveChangesAsync();

        var catalog = await new TacticRepository(dbContext).GetCatalogAsync("en");

        var card = Assert.Single(catalog.Cards);
        Assert.Equal("Assault", card.Name);
        Assert.Equal("ATK", card.Scaling.Label);
        Assert.Equal("Orange", Assert.Single(card.Scaling.Rarities).Name);
        Assert.Equal(15, Assert.Single(card.Scaling.Rarities[0].Tiers).Value);
        var frame = Assert.Single(catalog.Frames);
        Assert.Equal(4200, frame.Hp);
        Assert.Equal(2100, frame.Def);
    }
}
