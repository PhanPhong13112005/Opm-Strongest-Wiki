using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;
using OpmWiki.Application.Insignias;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/insignias")]
public sealed class InsigniasController(IInsigniaRepository repository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<InsigniaSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<InsigniaSummaryDto>>> List(
        [FromQuery] string language = "vi",
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        var result = await repository.ListAsync(
            new InsigniaQuery(language, search, page, pageSize),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType<InsigniaDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InsigniaDetailDto>> GetById(
        string id,
        [FromQuery] string language = "vi",
        CancellationToken cancellationToken = default)
    {
        var insignia = await repository.GetByIdAsync(id, language, cancellationToken);
        return insignia is null ? NotFound() : Ok(insignia);
    }
}
