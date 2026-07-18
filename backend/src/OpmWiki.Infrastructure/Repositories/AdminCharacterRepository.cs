using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Admin;
using OpmWiki.Application.Common;
using OpmWiki.Domain.Entities;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class AdminCharacterRepository(OpmWikiDbContext dbContext) : IAdminCharacterRepository
{
    public async Task<PagedResult<AdminCharacterDto>> ListAsync(
        AdminCharacterQuery query,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var characters = dbContext.Characters.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search.Trim()}%";
            characters = characters.Where(x =>
                EF.Functions.ILike(x.NameVi, pattern) ||
                EF.Functions.ILike(x.NameEn, pattern) ||
                EF.Functions.ILike(x.Id, pattern));
        }

        var totalCount = await characters.CountAsync(cancellationToken);
        var rows = await characters
            .OrderByDescending(x => x.UpdatedAt)
            .ThenBy(x => x.NameVi)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminCharacterDto>(
            rows.Select(Map).ToArray(),
            page,
            pageSize,
            totalCount);
    }

    public async Task<AdminCharacterDto?> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return character is null ? null : Map(character);
    }

    public async Task<AdminCharacterDto?> CreateAsync(
        AdminCharacterWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (await dbContext.Characters.AnyAsync(x => x.Id == request.Id, cancellationToken))
            return null;

        var character = new Character { Id = request.Id.Trim() };
        Apply(character, request);
        dbContext.Characters.Add(character);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(character);
    }

    public async Task<AdminCharacterDto?> UpdateAsync(
        string id,
        AdminCharacterWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (character is null) return null;

        Apply(character, request);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(character);
    }

    public async Task<bool> DeleteAsync(
        string id,
        CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (character is null) return false;

        dbContext.Characters.Remove(character);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<AdminCharacterDto?> UpdateKeepsakeAsync(
        string id,
        string? iconUrl,
        CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (character is null) return null;

        character.KeepsakeIcon = NormalizeOptional(iconUrl);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(character);
    }

    private static void Apply(Character character, AdminCharacterWriteRequest request)
    {
        character.NameVi = request.NameVi.Trim();
        character.NameEn = request.NameEn.Trim();
        character.ImageUrl = request.ImageUrl.Trim();
        character.Tier = request.Tier.Trim();
        character.TypeVi = request.TypeVi.Trim();
        character.TypeEn = request.TypeEn.Trim();
        character.FactionVi = request.FactionVi.Trim();
        character.FactionEn = request.FactionEn.Trim();
        character.RolesVi = NormalizeList(request.RolesVi);
        character.RolesEn = NormalizeList(request.RolesEn);
        character.DuyenVi = request.DuyenVi.Trim();
        character.DuyenEn = request.DuyenEn.Trim();
        character.BioVi = request.BioVi.Trim();
        character.BioEn = request.BioEn.Trim();
        character.KeepsakeIcon = NormalizeOptional(request.KeepsakeIcon);
        character.TraitsVi = NormalizeList(request.TraitsVi);
        character.TraitsEn = NormalizeList(request.TraitsEn);
        character.BondListVi = request.BondListVi.Trim();
        character.BondListEn = request.BondListEn.Trim();
        character.ClassLevel = request.ClassLevel.Trim();
        character.ReleaseSea = request.ReleaseSea;
        character.ReleaseChina = request.ReleaseChina;
        character.BaseStats = MapStats(request.BaseStats);
        character.PvpStats = MapStats(request.PvpStats);
    }

    private static CharacterStats MapStats(AdminCharacterStatsDto stats) => new()
    {
        Atk = stats.Atk,
        Hp = stats.Hp,
        Def = stats.Def,
        Spd = stats.Spd,
    };

    private static AdminCharacterDto Map(Character character) => new(
        character.Id,
        character.NameVi,
        character.NameEn,
        character.ImageUrl,
        character.Tier,
        character.TypeVi,
        character.TypeEn,
        character.FactionVi,
        character.FactionEn,
        character.RolesVi,
        character.RolesEn,
        character.DuyenVi,
        character.DuyenEn,
        character.BioVi,
        character.BioEn,
        character.KeepsakeIcon,
        character.TraitsVi,
        character.TraitsEn,
        character.BondListVi,
        character.BondListEn,
        character.ClassLevel,
        character.ReleaseSea,
        character.ReleaseChina,
        new AdminCharacterStatsDto(
            character.BaseStats.Atk,
            character.BaseStats.Hp,
            character.BaseStats.Def,
            character.BaseStats.Spd),
        new AdminCharacterStatsDto(
            character.PvpStats.Atk,
            character.PvpStats.Hp,
            character.PvpStats.Def,
            character.PvpStats.Spd),
        character.UpdatedAt);

    private static string[] NormalizeList(IEnumerable<string>? values) => values?
        .Select(value => value.Trim())
        .Where(value => value.Length > 0)
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray() ?? [];

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
