using OpmWiki.Application.Mastery;

namespace OpmWiki.Application.Abstractions;

public interface IMasteryRepository
{
    Task<MasteryConfigDto> GetConfigAsync(CancellationToken cancellationToken = default);
}
