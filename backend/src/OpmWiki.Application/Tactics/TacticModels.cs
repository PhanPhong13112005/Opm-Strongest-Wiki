namespace OpmWiki.Application.Tactics;

public sealed record TacticTierDto(int Star, decimal Value);

public sealed record TacticRarityDto(
    string Key,
    int Quality,
    string Name,
    IReadOnlyList<TacticTierDto> Tiers);

public sealed record TacticScalingDto(
    string Metric,
    string StatType,
    string Label,
    string Unit,
    bool Summable,
    IReadOnlyList<TacticRarityDto> Rarities);

public sealed record TacticCardDto(
    string Id,
    string Name,
    string Icon,
    int Count,
    string Effect,
    TacticScalingDto Scaling,
    int SortOrder,
    DateTimeOffset UpdatedAt);

public sealed record TacticFrameDto(
    string Id,
    string Name,
    string Icon,
    int Hp,
    int Def,
    string ColorClass,
    string BorderClass,
    string BackgroundClass,
    int SortOrder,
    DateTimeOffset UpdatedAt);

public sealed record TacticCatalogDto(
    IReadOnlyList<TacticCardDto> Cards,
    IReadOnlyList<TacticFrameDto> Frames);
