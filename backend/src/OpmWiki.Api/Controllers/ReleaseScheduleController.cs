using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/release-schedule")]
public sealed class ReleaseScheduleController(ICommunityRepository repository) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ReleaseScheduleDto>>> List(
        [FromQuery] string language = "vi",
        CancellationToken cancellationToken = default) =>
        Ok(await repository.ListReleaseScheduleAsync(language, cancellationToken));
}

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/releases")]
public sealed class AdminReleaseScheduleController(ICommunityRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ReleaseScheduleDto>>> List(
        CancellationToken cancellationToken) =>
        Ok(await repository.ListReleaseScheduleAsync("vi", cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ReleaseScheduleDto>> Create(
        ReleaseScheduleWriteRequest request,
        CancellationToken cancellationToken)
    {
        var error = Validate(request);
        if (error is not null) return BadRequest(new { message = error });
        try
        {
            var result = await repository.CreateReleaseScheduleAsync(request, cancellationToken);
            return Created($"/api/admin/releases/{result.Id}", result);
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Đã có một mốc cùng ngày, máy chủ và thứ tự." });
        }
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ReleaseScheduleDto>> Update(
        long id,
        ReleaseScheduleWriteRequest request,
        CancellationToken cancellationToken)
    {
        var error = Validate(request);
        if (error is not null) return BadRequest(new { message = error });
        try
        {
            var result = await repository.UpdateReleaseScheduleAsync(id, request, cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Đã có một mốc cùng ngày, máy chủ và thứ tự." });
        }
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken) =>
        await repository.DeleteReleaseScheduleAsync(id, cancellationToken) ? NoContent() : NotFound();

    private static string? Validate(ReleaseScheduleWriteRequest request)
    {
        if (request.Server is not ("CN" or "SEA")) return "Máy chủ phải là CN hoặc SEA.";
        if (string.IsNullOrWhiteSpace(request.CharacterId) || request.CharacterId.Length > 80) return "ID nhân vật không hợp lệ.";
        if ((request.BannerImage?.Length ?? 0) > 500) return "Đường dẫn banner quá dài.";
        if (request.SortOrder is < 0 or > 100) return "Thứ tự phải từ 0 đến 100.";
        return null;
    }
}
