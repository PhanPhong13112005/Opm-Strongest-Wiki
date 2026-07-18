namespace OpmWiki.Application.Abstractions;

public sealed record SeedResult(
    int Characters,
    int Events,
    int MasteryTiers,
    int Insignias,
    int Backgears,
    int BackgearSets,
    int TacticCards,
    int TacticFrames);

public interface IDataSeeder
{
    Task<SeedResult> SeedAsync(CancellationToken cancellationToken = default);
}
