using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Characters;
using OpmWiki.Application.Common;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/characters")]
public sealed class CharactersController(ICharacterRepository repository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<CharacterSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<CharacterSummaryDto>>> List(
        [FromQuery] string language = "vi",
        [FromQuery] string? search = null,
        [FromQuery] string? tier = null,
        [FromQuery] string? faction = null,
        [FromQuery] string? type = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string sort = "release_desc",
        CancellationToken cancellationToken = default)
    {
        var result = await repository.ListAsync(
            new CharacterQuery(language, search, tier, faction, type, page, pageSize, sort),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType<CharacterDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CharacterDetailDto>> GetById(
        string id,
        [FromQuery] string language = "vi",
        CancellationToken cancellationToken = default)
    {
        var character = await repository.GetByIdAsync(id, language, cancellationToken);
        return character is null ? NotFound() : Ok(character);
    }
}
