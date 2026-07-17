using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Characters;
using OpmWiki.Application.Common;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class CharacterRepository(OpmWikiDbContext dbContext) : ICharacterRepository
{
    public async Task<PagedResult<CharacterSummaryDto>> ListAsync(
        CharacterQuery query,
        CancellationToken cancellationToken = default)
    {
        var isEnglish = IsEnglish(query.Language);
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var characters = dbContext.Characters.AsNoTracking().AsQueryable();

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
        var orderedCharacters = OrderCharacters(characters, query.Sort, isEnglish);
        var rows = await orderedCharacters
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<CharacterSummaryDto>(
            rows.Select(x => MapSummary(x, isEnglish)).ToArray(),
            page,
            pageSize,
            totalCount);
    }

    public async Task<CharacterDetailDto?> GetByIdAsync(
        string id,
        string language,
        CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.Skills)
            .Include(x => x.Effects)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

        return character is null ? null : MapDetail(character, IsEnglish(language));
    }

    private static CharacterSummaryDto MapSummary(Character character, bool isEnglish) => new(
        character.Id,
        isEnglish ? character.NameEn : character.NameVi,
        character.ImageUrl,
        character.Tier,
        isEnglish ? character.TypeEn : character.TypeVi,
        isEnglish ? character.FactionEn : character.FactionVi,
        isEnglish ? character.RolesEn : character.RolesVi,
        character.ClassLevel,
        character.KeepsakeIcon,
        character.ReleaseSea,
        character.ReleaseChina);

    private static CharacterDetailDto MapDetail(Character character, bool isEnglish) => new(
        character.Id,
        isEnglish ? character.NameEn : character.NameVi,
        character.ImageUrl,
        character.Tier,
        isEnglish ? character.TypeEn : character.TypeVi,
        isEnglish ? character.FactionEn : character.FactionVi,
        isEnglish ? character.RolesEn : character.RolesVi,
        isEnglish ? character.DuyenEn : character.DuyenVi,
        isEnglish ? character.BioEn : character.BioVi,
        character.KeepsakeIcon,
        isEnglish ? character.TraitsEn : character.TraitsVi,
        isEnglish ? character.BondListEn : character.BondListVi,
        character.ClassLevel,
        character.ReleaseSea,
        character.ReleaseChina,
        new CharacterStatsDto(character.BaseStats.Atk, character.BaseStats.Hp, character.BaseStats.Def, character.BaseStats.Spd),
        new CharacterStatsDto(character.PvpStats.Atk, character.PvpStats.Hp, character.PvpStats.Def, character.PvpStats.Spd),
        character.Skills.OrderBy(x => x.SortOrder).Select(x => new CharacterSkillDto(
            x.Id,
            x.SortOrder,
            isEnglish ? x.NameEn : x.NameVi,
            isEnglish ? x.DescriptionEn : x.DescriptionVi,
            isEnglish ? x.TypeEn : x.TypeVi,
            x.IconUrl,
            x.AnimationUrl,
            x.KeepsakeIconUrl)).ToArray(),
        character.Effects.OrderBy(x => x.SortOrder).Select(x => new CharacterEffectDto(
            x.Id,
            x.SortOrder,
            isEnglish ? x.TermEn : x.TermVi,
            isEnglish ? x.DescriptionEn : x.DescriptionVi)).ToArray(),
        character.UpdatedAt);

    private static bool IsEnglish(string language) =>
        string.Equals(language, "en", StringComparison.OrdinalIgnoreCase);

    private static IOrderedQueryable<Character> OrderCharacters(
        IQueryable<Character> characters,
        string sort,
        bool isEnglish)
    {
        if (string.Equals(sort, "name_asc", StringComparison.OrdinalIgnoreCase))
            return isEnglish
                ? characters.OrderBy(x => x.NameEn)
                : characters.OrderBy(x => x.NameVi);

        // SEA is the primary schedule shown by the site. China is only used when
        // a character has no SEA release date, and completely undated rows go last.
        var byReleaseDate = characters
            .OrderBy(x => (x.ReleaseSea ?? x.ReleaseChina) == null)
            .ThenByDescending(x => x.ReleaseSea ?? x.ReleaseChina);

        return isEnglish
            ? byReleaseDate.ThenBy(x => x.NameEn)
            : byReleaseDate.ThenBy(x => x.NameVi);
    }
}
