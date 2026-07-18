namespace OpmWiki.Application.Insignias;

public sealed record InsigniaQuery(
    string Language = "vi",
    string? Search = null,
    int Page = 1,
    int PageSize = 12);

public sealed record InsigniaSummaryDto(
    string Id,
    string ClassLevel,
    string Name,
    string ImageUrl,
    int SortOrder);

public sealed record InsigniaGuideDto(
    string Id,
    string Title,
    string Description,
    IReadOnlyList<string> Images);

public sealed record InsigniaDetailDto(
    string Id,
    string ClassLevel,
    string Name,
    string ImageUrl,
    int SortOrder,
    IReadOnlyList<InsigniaGuideDto> Guides,
    DateTimeOffset UpdatedAt);
