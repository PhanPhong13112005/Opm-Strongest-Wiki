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
    public async Task<IActionResult> List(
        [FromQuery] string language = "vi",
        [FromQuery] bool includeMonthPrecision = false,
        CancellationToken cancellationToken = default) =>
        includeMonthPrecision
            ? Ok(await repository.ListReleaseScheduleWithMonthPrecisionAsync(language, cancellationToken))
            : Ok(await repository.ListReleaseScheduleAsync(language, cancellationToken));
}

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/releases")]
public sealed class AdminReleaseScheduleController(ICommunityRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        CancellationToken cancellationToken,
        [FromQuery] bool includeMonthPrecision = false) =>
        includeMonthPrecision
            ? Ok(await repository.ListReleaseScheduleWithMonthPrecisionAsync("vi", cancellationToken))
            : Ok(await repository.ListReleaseScheduleAsync("vi", cancellationToken));

    [HttpPost("month")]
    public async Task<ActionResult<ReleaseScheduleMonthAwareDto>> CreateMonth(
        ReleaseScheduleMonthWriteRequest request,
        CancellationToken cancellationToken)
    {
        if (!ReleaseScheduleMonth.IsValid(request.Date))
            return BadRequest(new { message = "Tháng phát hành phải có dạng YYYY-MM hợp lệ." });
        if (request.SortOrder is < 1 or > 100)
            return BadRequest(new { message = "Thứ tự phải từ 1 đến 100." });
        var error = ValidateFields(request.Server, request.CharacterId, request.BannerImage, request.SortOrder);
        if (error is not null) return BadRequest(new { message = error });
        if (string.IsNullOrWhiteSpace(request.BannerImage))
            return BadRequest(new { message = "Đường dẫn banner là bắt buộc." });
        try
        {
            var result = await repository.CreateMonthReleaseScheduleAsync(request, cancellationToken);
            return Created($"/api/admin/releases/{result.Id}", result);
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Đã có một mốc cùng tháng, máy chủ và thứ tự." });
        }
    }

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
        => ValidateFields(request.Server, request.CharacterId, request.BannerImage, request.SortOrder);

    private static string? ValidateFields(string server, string characterId, string? bannerImage, int sortOrder)
    {
        if (server is not ("CN" or "SEA")) return "Máy chủ phải là CN hoặc SEA.";
        if (string.IsNullOrWhiteSpace(characterId) || characterId.Length > 80) return "ID nhân vật không hợp lệ.";
        if ((bannerImage?.Length ?? 0) > 500) return "Đường dẫn banner quá dài.";
        if (sortOrder is < 0 or > 100) return "Thứ tự phải từ 0 đến 100.";
        return null;
    }
}
