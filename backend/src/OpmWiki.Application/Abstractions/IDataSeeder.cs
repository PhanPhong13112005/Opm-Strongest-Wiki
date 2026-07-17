namespace OpmWiki.Application.Abstractions;

public sealed record SeedResult(int Characters, int Events, int MasteryTiers);

public interface IDataSeeder
{
    Task<SeedResult> SeedAsync(CancellationToken cancellationToken = default);
}
