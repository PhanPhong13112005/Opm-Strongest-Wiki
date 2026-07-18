using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;
using OpmWiki.Application.Keepsakes;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/keepsakes")]
public sealed class KeepsakesController(IKeepsakeRepository repository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<KeepsakeSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<KeepsakeSummaryDto>>> List(
        [FromQuery] string language = "vi",
        [FromQuery] string? search = null,
        [FromQuery] string? tier = null,
        [FromQuery] string? faction = null,
        [FromQuery] string? type = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        var result = await repository.ListAsync(
            new KeepsakeQuery(language, search, tier, faction, type, page, pageSize),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType<KeepsakeDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<KeepsakeDetailDto>> GetById(
        string id,
        [FromQuery] string language = "vi",
        CancellationToken cancellationToken = default)
    {
        var keepsake = await repository.GetByIdAsync(id, language, cancellationToken);
        return keepsake is null ? NotFound() : Ok(keepsake);
    }
}
