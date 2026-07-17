using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;
using OpmWiki.Application.Events;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class EventRepository(OpmWikiDbContext dbContext) : IEventRepository
{
    public async Task<PagedResult<EventSummaryDto>> ListAsync(
        EventQuery query,
        CancellationToken cancellationToken = default)
    {
        var isEnglish = IsEnglish(query.Language);
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var events = dbContext.Events.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Category))
            events = events.Where(x => x.Category == query.Category);
        if (query.From.HasValue)
            events = events.Where(x => x.EndDate >= query.From.Value);
        if (query.To.HasValue)
            events = events.Where(x => x.StartDate <= query.To.Value);

        var totalCount = await events.CountAsync(cancellationToken);
        var rows = await events
            .OrderByDescending(x => x.StartDate)
            .ThenBy(x => x.TitleVi)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<EventSummaryDto>(
            rows.Select(x => MapSummary(x, isEnglish)).ToArray(),
            page,
            pageSize,
            totalCount);
    }

    public async Task<EventDetailDto?> GetByIdAsync(
        string id,
        string language,
        CancellationToken cancellationToken = default)
    {
        var gameEvent = await dbContext.Events.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return gameEvent is null ? null : MapDetail(gameEvent, IsEnglish(language));
    }

    private static EventSummaryDto MapSummary(GameEvent gameEvent, bool isEnglish) => new(
        gameEvent.Id,
        isEnglish ? gameEvent.TitleEn : gameEvent.TitleVi,
        isEnglish ? gameEvent.DescriptionEn : gameEvent.DescriptionVi,
        gameEvent.Category,
        gameEvent.ImageUrl,
        gameEvent.StartDate,
        gameEvent.EndDate);

    private static EventDetailDto MapDetail(GameEvent gameEvent, bool isEnglish) => new(
        gameEvent.Id,
        isEnglish ? gameEvent.TitleEn : gameEvent.TitleVi,
        isEnglish ? gameEvent.DescriptionEn : gameEvent.DescriptionVi,
        gameEvent.Category,
        gameEvent.ImageUrl,
        gameEvent.DetailImages,
        JsonSerializer.Deserialize<JsonElement>(gameEvent.SectionsJson),
        gameEvent.StartDate,
        gameEvent.EndDate,
        gameEvent.UpdatedAt);

    private static bool IsEnglish(string language) =>
        string.Equals(language, "en", StringComparison.OrdinalIgnoreCase);
}
