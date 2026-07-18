using OpmWiki.Application.Admin;
using OpmWiki.Application.Common;

namespace OpmWiki.Application.Abstractions;

public interface IAdminCharacterRepository
{
    Task<PagedResult<AdminCharacterDto>> ListAsync(
        AdminCharacterQuery query,
        CancellationToken cancellationToken = default);

    Task<AdminCharacterDto?> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default);

    Task<AdminCharacterDto?> CreateAsync(
        AdminCharacterWriteRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminCharacterDto?> UpdateAsync(
        string id,
        AdminCharacterWriteRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        string id,
        CancellationToken cancellationToken = default);

    Task<AdminCharacterDto?> UpdateKeepsakeAsync(
        string id,
        string? iconUrl,
        CancellationToken cancellationToken = default);
}
