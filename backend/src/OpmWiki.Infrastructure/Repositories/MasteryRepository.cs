using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Mastery;
using OpmWiki.Infrastructure.Persistence;

namespace OpmWiki.Infrastructure.Repositories;

public sealed class MasteryRepository(OpmWikiDbContext dbContext) : IMasteryRepository
{
    public async Task<MasteryConfigDto> GetConfigAsync(CancellationToken cancellationToken = default)
    {
        var rows = await dbContext.MasteryTiers
            .AsNoTracking()
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Tier)
            .ToListAsync(cancellationToken);

        var categories = rows
            .GroupBy(x => x.Category)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<MasteryTierDto>)group.Select(x => new MasteryTierDto(
                    x.Tier,
                    new MasteryStatsDto(x.Atk, x.Hp),
                    JsonSerializer.Deserialize<JsonElement>(x.CostsJson),
                    JsonSerializer.Deserialize<JsonElement>(x.RequirementsJson))).ToArray());

        return new MasteryConfigDto(1, categories);
    }
}
