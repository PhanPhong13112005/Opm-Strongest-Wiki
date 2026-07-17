using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;
using OpmWiki.Application.Insignias;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class InsigniaRepository(OpmWikiDbContext dbContext) : IInsigniaRepository
{
    public async Task<PagedResult<InsigniaSummaryDto>> ListAsync(
        InsigniaQuery query,
        CancellationToken cancellationToken = default)
    {
        var isEnglish = IsEnglish(query.Language);
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var insignias = dbContext.Insignias.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search.Trim()}%";
            insignias = isEnglish
                ? insignias.Where(x => EF.Functions.ILike(x.NameEn, pattern))
                : insignias.Where(x => EF.Functions.ILike(x.NameVi, pattern));
        }

        var totalCount = await insignias.CountAsync(cancellationToken);
        var rows = await insignias
            .OrderBy(x => x.SortOrder)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<InsigniaSummaryDto>(
            rows.Select(x => MapSummary(x, isEnglish)).ToArray(),
            page,
            pageSize,
            totalCount);
    }

    public async Task<InsigniaDetailDto?> GetByIdAsync(
        string id,
        string language,
        CancellationToken cancellationToken = default)
    {
        var insignia = await dbContext.Insignias
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.GuideLinks)
            .ThenInclude(x => x.Guide)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (insignia is null) return null;
        var isEnglish = IsEnglish(language);
        return new InsigniaDetailDto(
            insignia.Id,
            insignia.ClassLevel,
            isEnglish ? insignia.NameEn : insignia.NameVi,
            insignia.ImageUrl,
            insignia.SortOrder,
            insignia.GuideLinks
                .OrderBy(x => x.SortOrder)
                .Select(x => MapGuide(x.Guide, isEnglish))
                .ToArray(),
            insignia.UpdatedAt);
    }

    private static InsigniaSummaryDto MapSummary(Insignia insignia, bool isEnglish) => new(
        insignia.Id,
        insignia.ClassLevel,
        isEnglish ? insignia.NameEn : insignia.NameVi,
        insignia.ImageUrl,
        insignia.SortOrder);

    private static InsigniaGuideDto MapGuide(InsigniaGuide guide, bool isEnglish) => new(
        guide.Id,
        isEnglish ? guide.TitleEn : guide.TitleVi,
        isEnglish ? guide.DescriptionEn : guide.DescriptionVi,
        guide.ImageUrls);

    private static bool IsEnglish(string language) =>
        string.Equals(language, "en", StringComparison.OrdinalIgnoreCase);
}
