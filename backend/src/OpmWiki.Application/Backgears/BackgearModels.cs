namespace OpmWiki.Application.Backgears;

public sealed record BackgearEffectDto(string Type, string Name, string Text);

public sealed record BackgearLevelDto(
    int Level,
    bool Senior,
    string Cost,
    IReadOnlyList<BackgearEffectDto> Effects);

public sealed record BackgearDto(
    string Id,
    string Name,
    string Theme,
    string Rarity,
    string Acquire,
    int LevelMax,
    string Icon,
    string Thumbnail,
    string SeniorIcon,
    int? ChangeLevel,
    IReadOnlyList<BackgearLevelDto> Levels,
    int SortOrder,
    DateTimeOffset UpdatedAt);

public sealed record BackgearSetNeedDto(
    string Id,
    string Name,
    string Icon,
    int Count);

public sealed record BackgearSetLevelDto(
    int SetLevel,
    IReadOnlyList<BackgearEffectDto> Effects);

public sealed record BackgearSetDto(
    string Id,
    string Name,
    string Rarity,
    string Reward,
    string RewardIcon,
    IReadOnlyList<BackgearSetNeedDto> Needs,
    IReadOnlyList<BackgearSetLevelDto> Levels,
    int SortOrder,
    DateTimeOffset UpdatedAt);

public sealed record BackgearCatalogDto(
    IReadOnlyList<BackgearDto> Gears,
    IReadOnlyList<BackgearSetDto> Sets);
