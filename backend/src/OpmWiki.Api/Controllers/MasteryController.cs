using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Mastery;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/mastery")]
public sealed class MasteryController(IMasteryRepository repository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<MasteryConfigDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<MasteryConfigDto>> GetConfig(CancellationToken cancellationToken)
    {
        return Ok(await repository.GetConfigAsync(cancellationToken));
    }
}
