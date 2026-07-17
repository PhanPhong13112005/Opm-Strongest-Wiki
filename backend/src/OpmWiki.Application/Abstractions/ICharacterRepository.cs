using OpmWiki.Application.Characters;
using OpmWiki.Application.Common;

namespace OpmWiki.Application.Abstractions;

public interface ICharacterRepository
{
    Task<PagedResult<CharacterSummaryDto>> ListAsync(CharacterQuery query, CancellationToken cancellationToken = default);
    Task<CharacterDetailDto?> GetByIdAsync(string id, string language, CancellationToken cancellationToken = default);
}
