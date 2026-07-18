using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Backgears;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class BackgearRepository(OpmWikiDbContext dbContext) : IBackgearRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<BackgearCatalogDto> GetCatalogAsync(
        string language,
        CancellationToken cancellationToken = default)
    {
        var isEnglish = string.Equals(language, "en", StringComparison.OrdinalIgnoreCase);
        var gears = await dbContext.Backgears
            .AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);
        var sets = await dbContext.BackgearSets
            .AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);

        return new BackgearCatalogDto(
            gears.Select(x => MapGear(x, isEnglish)).ToArray(),
            sets.Select(x => MapSet(x, isEnglish)).ToArray());
    }

    private static BackgearDto MapGear(Backgear gear, bool isEnglish)
    {
        var levels = Deserialize<StoredLevel>(gear.LevelsJson)
            .Select(level => new BackgearLevelDto(
                level.Level,
                level.Senior,
                isEnglish ? level.CostEn : level.CostVi,
                MapEffects(level.Effects, isEnglish)))
            .ToArray();

        return new BackgearDto(
            gear.Id,
            isEnglish ? gear.NameEn : gear.NameVi,
            gear.Theme,
            isEnglish ? gear.RarityEn : gear.RarityVi,
            isEnglish ? gear.AcquireEn : gear.AcquireVi,
            gear.LevelMax,
            gear.IconUrl,
            gear.ThumbnailUrl,
            gear.SeniorIconUrl,
            gear.ChangeLevel,
            levels,
            gear.SortOrder,
            gear.UpdatedAt);
    }

    private static BackgearSetDto MapSet(BackgearSet set, bool isEnglish)
    {
        var needs = Deserialize<StoredNeed>(set.NeedsJson)
            .Select(need => new BackgearSetNeedDto(
                need.Id,
                isEnglish ? need.NameEn : need.NameVi,
                need.Icon,
                need.Count))
            .ToArray();
        var levels = Deserialize<StoredSetLevel>(set.LevelsJson)
            .Select(level => new BackgearSetLevelDto(
                level.SetLevel,
                MapEffects(level.Effects, isEnglish)))
            .ToArray();

        return new BackgearSetDto(
            set.Id,
            isEnglish ? set.NameEn : set.NameVi,
            isEnglish ? set.RarityEn : set.RarityVi,
            isEnglish ? set.RewardEn : set.RewardVi,
            set.RewardIconUrl,
            needs,
            levels,
            set.SortOrder,
            set.UpdatedAt);
    }

    private static IReadOnlyList<BackgearEffectDto> MapEffects(
        IReadOnlyList<StoredEffect> effects,
        bool isEnglish) => effects
            .Select(effect => new BackgearEffectDto(
                effect.Type,
                isEnglish ? effect.En : effect.Vi,
                effect.Text))
            .ToArray();

    private static IReadOnlyList<T> Deserialize<T>(string json) =>
        JsonSerializer.Deserialize<T[]>(json, JsonOptions) ?? [];

    private sealed record StoredEffect
    {
        public string Type { get; init; } = string.Empty;
        public string En { get; init; } = string.Empty;
        public string Vi { get; init; } = string.Empty;
        public string Text { get; init; } = string.Empty;
    }

    private sealed record StoredLevel
    {
        public int Level { get; init; }
        public bool Senior { get; init; }
        public string CostEn { get; init; } = string.Empty;
        public string CostVi { get; init; } = string.Empty;
        public IReadOnlyList<StoredEffect> Effects { get; init; } = [];
    }

    private sealed record StoredNeed
    {
        public string Id { get; init; } = string.Empty;
        public string NameEn { get; init; } = string.Empty;
        public string NameVi { get; init; } = string.Empty;
        public string Icon { get; init; } = string.Empty;
        public int Count { get; init; }
    }

    private sealed record StoredSetLevel
    {
        public int SetLevel { get; init; }
        public IReadOnlyList<StoredEffect> Effects { get; init; } = [];
    }
}
