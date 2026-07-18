using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Backgears;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/backgears")]
public sealed class BackgearsController(IBackgearRepository repository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<BackgearCatalogDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<BackgearCatalogDto>> GetCatalog(
        [FromQuery] string language = "vi",
        CancellationToken cancellationToken = default)
    {
        var catalog = await repository.GetCatalogAsync(language, cancellationToken);
        return Ok(catalog);
    }
}
