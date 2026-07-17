using System.Text.Json;

namespace OpmWiki.Application.Events;

public sealed record EventQuery(
    string Language = "vi",
    string? Category = null,
    DateOnly? From = null,
    DateOnly? To = null,
    int Page = 1,
    int PageSize = 20);

public sealed record EventSummaryDto(
    string Id,
    string Title,
    string Description,
    string Category,
    string ImageUrl,
    DateOnly StartDate,
    DateOnly EndDate);

public sealed record EventDetailDto(
    string Id,
    string Title,
    string Description,
    string Category,
    string ImageUrl,
    IReadOnlyList<string> DetailImages,
    JsonElement Sections,
    DateOnly StartDate,
    DateOnly EndDate,
    DateTimeOffset UpdatedAt);
