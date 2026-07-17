using OpmWiki.Application.Common;
using OpmWiki.Application.Keepsakes;

namespace OpmWiki.Application.Abstractions;

public interface IKeepsakeRepository
{
    Task<PagedResult<KeepsakeSummaryDto>> ListAsync(
        KeepsakeQuery query,
        CancellationToken cancellationToken = default);

    Task<KeepsakeDetailDto?> GetByIdAsync(
        string id,
        string language,
        CancellationToken cancellationToken = default);
}
