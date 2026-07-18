using OpmWiki.Application.Backgears;

namespace OpmWiki.Application.Abstractions;

public interface IBackgearRepository
{
    Task<BackgearCatalogDto> GetCatalogAsync(
        string language,
        CancellationToken cancellationToken = default);
}
