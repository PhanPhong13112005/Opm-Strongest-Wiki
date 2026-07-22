using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Admin;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/keepsakes")]
public sealed class AdminKeepsakesController(IAdminCharacterRepository repository) : ControllerBase
{
    [HttpPut("{characterId}")]
    [ProducesResponseType<AdminCharacterDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminCharacterDto>> Upsert(
        string characterId,
        AdminKeepsakeWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.IconUrl))
            return BadRequest(new { message = "Keepsake icon path is required." });
        if (request.IconUrl.Length > 500 || request.IconUrl.Contains('+'))
            return BadRequest(new { message = "Keepsake icon path is invalid or deploy-unsafe." });

        var character = await repository.UpdateKeepsakeAsync(
            characterId,
            request.IconUrl,
            cancellationToken);
        return character is null ? NotFound() : Ok(character);
    }

    [HttpDelete("{characterId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        string characterId,
        CancellationToken cancellationToken = default)
    {
        var character = await repository.UpdateKeepsakeAsync(
            characterId,
            null,
            cancellationToken);
        return character is null ? NotFound() : NoContent();
    }
}
