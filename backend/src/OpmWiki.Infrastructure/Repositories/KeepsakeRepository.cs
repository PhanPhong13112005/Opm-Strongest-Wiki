using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;
using OpmWiki.Application.Keepsakes;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class KeepsakeRepository(OpmWikiDbContext dbContext) : IKeepsakeRepository
{
    public async Task<PagedResult<KeepsakeSummaryDto>> ListAsync(
        KeepsakeQuery query,
        CancellationToken cancellationToken = default)
    {
        var isEnglish = IsEnglish(query.Language);
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var characters = WithKeepsake();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search.Trim()}%";
            characters = isEnglish
                ? characters.Where(x => EF.Functions.ILike(x.NameEn, pattern))
                : characters.Where(x => EF.Functions.ILike(x.NameVi, pattern));
        }

        if (!string.IsNullOrWhiteSpace(query.Tier))
            characters = characters.Where(x => x.Tier == query.Tier);
        if (!string.IsNullOrWhiteSpace(query.Faction))
            characters = isEnglish
                ? characters.Where(x => x.FactionEn == query.Faction)
                : characters.Where(x => x.FactionVi == query.Faction);
        if (!string.IsNullOrWhiteSpace(query.Type))
            characters = isEnglish
                ? characters.Where(x => x.TypeEn == query.Type)
                : characters.Where(x => x.TypeVi == query.Type);

        var totalCount = await characters.CountAsync(cancellationToken);
        var rows = await (isEnglish
                ? characters.OrderBy(x => x.NameEn)
                : characters.OrderBy(x => x.NameVi))
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<KeepsakeSummaryDto>(
            rows.Select(x => MapSummary(x, isEnglish)).ToArray(),
            page,
            pageSize,
            totalCount);
    }

    public async Task<KeepsakeDetailDto?> GetByIdAsync(
        string id,
        string language,
        CancellationToken cancellationToken = default)
    {
        var character = await WithKeepsake()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (character is null) return null;

        var isEnglish = IsEnglish(language);
        return new KeepsakeDetailDto(
            character.Id,
            isEnglish ? character.NameEn : character.NameVi,
            character.KeepsakeIcon!,
            character.Tier,
            isEnglish ? character.TypeEn : character.TypeVi,
            isEnglish ? character.FactionEn : character.FactionVi,
            GetAcquisitionType(character.Tier),
            character.UpdatedAt);
    }

    private IQueryable<Character> WithKeepsake() => dbContext.Characters
        .AsNoTracking()
        .Where(x => x.KeepsakeIcon != null && x.KeepsakeIcon != string.Empty);

    private static KeepsakeSummaryDto MapSummary(Character character, bool isEnglish) => new(
        character.Id,
        isEnglish ? character.NameEn : character.NameVi,
        character.KeepsakeIcon!,
        character.Tier,
        isEnglish ? character.TypeEn : character.TypeVi,
        isEnglish ? character.FactionEn : character.FactionVi,
        GetAcquisitionType(character.Tier));

    private static string GetAcquisitionType(string tier) =>
        tier.Contains("UR", StringComparison.OrdinalIgnoreCase) ? "limited-event" : "related-event";

    private static bool IsEnglish(string language) =>
        string.Equals(language, "en", StringComparison.OrdinalIgnoreCase);
}
