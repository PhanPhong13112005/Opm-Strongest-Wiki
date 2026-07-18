using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Admin;
using OpmWiki.Application.Common;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/characters")]
public sealed class AdminCharactersController(IAdminCharacterRepository repository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<AdminCharacterDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AdminCharacterDto>>> List(
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await repository.ListAsync(
            new AdminCharacterQuery(search, page, pageSize),
            cancellationToken));

    [HttpGet("{id}")]
    [ProducesResponseType<AdminCharacterDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminCharacterDto>> GetById(
        string id,
        CancellationToken cancellationToken = default)
    {
        var character = await repository.GetByIdAsync(id, cancellationToken);
        return character is null ? NotFound() : Ok(character);
    }

    [HttpPost]
    [ProducesResponseType<AdminCharacterDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminCharacterDto>> Create(
        AdminCharacterWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = Validate(request);
        if (validation is not null) return BadRequest(new ValidationProblemDetails(validation));

        var character = await repository.CreateAsync(request, cancellationToken);
        return character is null
            ? Conflict(new { message = $"Character '{request.Id}' already exists." })
            : CreatedAtAction(nameof(GetById), new { id = character.Id }, character);
    }

    [HttpPut("{id}")]
    [ProducesResponseType<AdminCharacterDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminCharacterDto>> Update(
        string id,
        AdminCharacterWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(id, request.Id, StringComparison.Ordinal))
            return BadRequest(new { message = "Route id and payload id must match." });

        var validation = Validate(request);
        if (validation is not null) return BadRequest(new ValidationProblemDetails(validation));

        var character = await repository.UpdateAsync(id, request, cancellationToken);
        return character is null ? NotFound() : Ok(character);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        string id,
        CancellationToken cancellationToken = default) =>
        await repository.DeleteAsync(id, cancellationToken) ? NoContent() : NotFound();

    private static Dictionary<string, string[]>? Validate(AdminCharacterWriteRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        AddRequired(errors, nameof(request.Id), request.Id, 80);
        AddRequired(errors, nameof(request.NameVi), request.NameVi, 200);
        AddRequired(errors, nameof(request.NameEn), request.NameEn, 200);
        AddRequired(errors, nameof(request.Tier), request.Tier, 20);
        AddRequired(errors, nameof(request.TypeVi), request.TypeVi, 100);
        AddRequired(errors, nameof(request.TypeEn), request.TypeEn, 100);
        AddRequired(errors, nameof(request.FactionVi), request.FactionVi, 100);
        AddRequired(errors, nameof(request.FactionEn), request.FactionEn, 100);

        if (request.Id.Contains('/') || request.Id.Contains('\\'))
            errors[nameof(request.Id)] = ["Id cannot contain path separators."];
        if (request.KeepsakeIcon?.Contains('+') is true)
            errors[nameof(request.KeepsakeIcon)] = ["Keepsake path cannot contain '+'. Use a deploy-safe name such as SSRplus."];
        if (request.KeepsakeIcon is { Length: > 500 })
            errors[nameof(request.KeepsakeIcon)] = ["Keepsake path cannot exceed 500 characters."];
        if (StatsAreInvalid(request.BaseStats) || StatsAreInvalid(request.PvpStats))
            errors["stats"] = ["Character stats cannot be negative."];

        return errors.Count == 0 ? null : errors;
    }

    private static bool StatsAreInvalid(AdminCharacterStatsDto stats) =>
        stats.Atk < 0 || stats.Hp < 0 || stats.Def < 0 || stats.Spd < 0;

    private static void AddRequired(
        IDictionary<string, string[]> errors,
        string field,
        string value,
        int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            errors[field] = ["This field is required."];
        else if (value.Length > maxLength)
            errors[field] = [$"This field cannot exceed {maxLength} characters."];
    }
}
