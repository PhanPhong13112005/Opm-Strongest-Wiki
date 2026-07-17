namespace OpmWiki.Application.Abstractions;

public sealed record SeedResult(int Characters, int Events);

public interface IDataSeeder
{
    Task<SeedResult> SeedAsync(CancellationToken cancellationToken = default);
}
