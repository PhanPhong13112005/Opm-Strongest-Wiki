namespace OpmWiki.Application.Characters;

public sealed record CharacterQuery(
    string Language = "vi",
    string? Search = null,
    string? Tier = null,
    string? Faction = null,
    string? Type = null,
    int Page = 1,
    int PageSize = 12,
    string Sort = "release_desc");

public sealed record CharacterSummaryDto(
    string Id,
    string Name,
    string ImageUrl,
    string Tier,
    string Type,
    string Faction,
    IReadOnlyList<string> Roles,
    string ClassLevel,
    string? KeepsakeIcon,
    DateOnly? ReleaseSea,
    DateOnly? ReleaseChina);

public sealed record CharacterStatsDto(int Atk, int Hp, int Def, int Spd);

public sealed record CharacterSkillDto(
    Guid Id,
    int SortOrder,
    string Name,
    string Description,
    string Type,
    string? IconUrl,
    string? AnimationUrl,
    string? KeepsakeIconUrl);

public sealed record CharacterEffectDto(
    Guid Id,
    int SortOrder,
    string Term,
    string Description);

public sealed record CharacterDetailDto(
    string Id,
    string Name,
    string ImageUrl,
    string Tier,
    string Type,
    string Faction,
    IReadOnlyList<string> Roles,
    string Duyen,
    string Bio,
    string? KeepsakeIcon,
    IReadOnlyList<string> Traits,
    string BondList,
    string ClassLevel,
    DateOnly? ReleaseSea,
    DateOnly? ReleaseChina,
    CharacterStatsDto BaseStats,
    CharacterStatsDto PvpStats,
    IReadOnlyList<CharacterSkillDto> Skills,
    IReadOnlyList<CharacterEffectDto> Effects,
    DateTimeOffset UpdatedAt);
