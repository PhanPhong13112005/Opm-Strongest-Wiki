namespace OpmWiki.Application.Keepsakes;

public sealed record KeepsakeQuery(
    string Language = "vi",
    string? Search = null,
    string? Tier = null,
    string? Faction = null,
    string? Type = null,
    int Page = 1,
    int PageSize = 12);

public sealed record KeepsakeSummaryDto(
    string Id,
    string CharacterName,
    string IconUrl,
    string Tier,
    string Type,
    string Faction,
    string AcquisitionType);

public sealed record KeepsakeDetailDto(
    string Id,
    string CharacterName,
    string IconUrl,
    string Tier,
    string Type,
    string Faction,
    string AcquisitionType,
    DateTimeOffset UpdatedAt);
