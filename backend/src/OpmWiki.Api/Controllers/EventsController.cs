using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;
using OpmWiki.Application.Events;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/events")]
public sealed class EventsController(IEventRepository repository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<EventSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<EventSummaryDto>>> List(
        [FromQuery] string language = "vi",
        [FromQuery] string? category = null,
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await repository.ListAsync(
            new EventQuery(language, category, from, to, page, pageSize),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType<EventDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDetailDto>> GetById(
        string id,
        [FromQuery] string language = "vi",
        CancellationToken cancellationToken = default)
    {
        var gameEvent = await repository.GetByIdAsync(id, language, cancellationToken);
        return gameEvent is null ? NotFound() : Ok(gameEvent);
    }
}
