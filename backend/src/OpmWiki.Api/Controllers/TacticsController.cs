using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Tactics;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/tactics")]
public sealed class TacticsController(ITacticRepository repository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<TacticCatalogDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<TacticCatalogDto>> GetCatalog(
        [FromQuery] string language = "vi",
        CancellationToken cancellationToken = default)
    {
        var catalog = await repository.GetCatalogAsync(language, cancellationToken);
        return Ok(catalog);
    }
}
