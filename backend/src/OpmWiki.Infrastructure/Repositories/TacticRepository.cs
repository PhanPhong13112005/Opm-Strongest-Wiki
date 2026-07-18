using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Tactics;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class TacticRepository(OpmWikiDbContext dbContext) : ITacticRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<TacticCatalogDto> GetCatalogAsync(
        string language,
        CancellationToken cancellationToken = default)
    {
        var isEnglish = string.Equals(language, "en", StringComparison.OrdinalIgnoreCase);
        var cards = await dbContext.TacticCards
            .AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);
        var frames = await dbContext.TacticFrames
            .AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);

        return new TacticCatalogDto(
            cards.Select(card => MapCard(card, isEnglish)).ToArray(),
            frames.Select(MapFrame).ToArray());
    }

    private static TacticCardDto MapCard(TacticCard card, bool isEnglish)
    {
        var scaling = JsonSerializer.Deserialize<StoredScaling>(card.ScalingJson, JsonOptions)
            ?? new StoredScaling();
        return new TacticCardDto(
            card.Id,
            isEnglish ? card.NameEn : card.NameVi,
            card.Icon,
            card.Count,
            isEnglish ? card.EffectEn : card.EffectVi,
            new TacticScalingDto(
                scaling.Metric,
                scaling.StatType,
                isEnglish ? scaling.LabelEn : scaling.LabelVi,
                scaling.Unit,
                scaling.Summable,
                scaling.Rarities.Select(rarity => new TacticRarityDto(
                    rarity.Key,
                    rarity.Quality,
                    isEnglish ? rarity.NameEn : rarity.NameVi,
                    rarity.Tiers.Select(tier => new TacticTierDto(tier.Star, tier.Value)).ToArray()))
                    .ToArray()),
            card.SortOrder,
            card.UpdatedAt);
    }

    private static TacticFrameDto MapFrame(TacticFrame frame) => new(
        frame.Id,
        frame.Name,
        frame.Icon,
        frame.Hp,
        frame.Def,
        frame.ColorClass,
        frame.BorderClass,
        frame.BackgroundClass,
        frame.SortOrder,
        frame.UpdatedAt);

    private sealed record StoredTier
    {
        public int Star { get; init; }
        public decimal Value { get; init; }
    }

    private sealed record StoredRarity
    {
        public string Key { get; init; } = string.Empty;
        public int Quality { get; init; }
        [JsonPropertyName("name_en")]
        public string NameEn { get; init; } = string.Empty;
        [JsonPropertyName("name_vi")]
        public string NameVi { get; init; } = string.Empty;
        public IReadOnlyList<StoredTier> Tiers { get; init; } = [];
    }

    private sealed record StoredScaling
    {
        public string Metric { get; init; } = string.Empty;
        public string StatType { get; init; } = string.Empty;
        [JsonPropertyName("label_en")]
        public string LabelEn { get; init; } = string.Empty;
        [JsonPropertyName("label_vi")]
        public string LabelVi { get; init; } = string.Empty;
        public string Unit { get; init; } = string.Empty;
        public bool Summable { get; init; }
        public IReadOnlyList<StoredRarity> Rarities { get; init; } = [];
    }
}
