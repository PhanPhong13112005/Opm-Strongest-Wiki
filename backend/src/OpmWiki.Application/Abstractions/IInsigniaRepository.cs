using OpmWiki.Application.Common;
using OpmWiki.Application.Insignias;

namespace OpmWiki.Application.Abstractions;

public interface IInsigniaRepository
{
    Task<PagedResult<InsigniaSummaryDto>> ListAsync(
        InsigniaQuery query,
        CancellationToken cancellationToken = default);

    Task<InsigniaDetailDto?> GetByIdAsync(
        string id,
        string language,
        CancellationToken cancellationToken = default);
}
