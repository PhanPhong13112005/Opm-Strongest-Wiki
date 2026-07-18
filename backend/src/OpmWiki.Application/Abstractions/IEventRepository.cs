using OpmWiki.Application.Common;
using OpmWiki.Application.Events;

namespace OpmWiki.Application.Abstractions;

public interface IEventRepository
{
    Task<PagedResult<EventSummaryDto>> ListAsync(EventQuery query, CancellationToken cancellationToken = default);
    Task<EventDetailDto?> GetByIdAsync(string id, string language, CancellationToken cancellationToken = default);
}
