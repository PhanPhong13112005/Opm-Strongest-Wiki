using OpmWiki.Application.Tactics;

namespace OpmWiki.Application.Abstractions;

public interface ITacticRepository
{
    Task<TacticCatalogDto> GetCatalogAsync(
        string language,
        CancellationToken cancellationToken = default);
}
