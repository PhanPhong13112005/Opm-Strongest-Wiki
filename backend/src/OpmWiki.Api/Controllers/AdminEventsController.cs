using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/events")]
public sealed class AdminEventsController(ICommunityRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminEventDto>>> List(CancellationToken cancellationToken) =>
        Ok(await repository.ListAdminEventsAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<AdminEventDto>> Create(
        AdminEventWriteRequest request,
        CancellationToken cancellationToken)
    {
        var errors = Validate(request);
        if (errors.Count > 0) return BadRequest(new ValidationProblemDetails(errors));
        var result = await repository.CreateAdminEventAsync(request, cancellationToken);
        return result is null
            ? Conflict(new { message = $"Sự kiện '{request.Id}' đã tồn tại." })
            : Created($"/api/admin/events/{result.Id}", result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AdminEventDto>> Update(
        string id,
        AdminEventWriteRequest request,
        CancellationToken cancellationToken)
    {
        if (!string.Equals(id, request.Id, StringComparison.Ordinal))
            return BadRequest(new { message = "ID trên URL và dữ liệu phải giống nhau." });
        var errors = Validate(request);
        if (errors.Count > 0) return BadRequest(new ValidationProblemDetails(errors));
        var result = await repository.UpdateAdminEventAsync(id, request, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        await repository.DeleteAdminEventAsync(id, cancellationToken) ? NoContent() : NotFound();

    private static Dictionary<string, string[]> Validate(AdminEventWriteRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.Id) || request.Id.Length > 100 || request.Id.Contains('/') || request.Id.Contains('\\'))
            errors[nameof(request.Id)] = ["ID bắt buộc, tối đa 100 ký tự và không chứa dấu phân cách đường dẫn."];
        if (string.IsNullOrWhiteSpace(request.TitleVi) || string.IsNullOrWhiteSpace(request.TitleEn))
            errors["title"] = ["Tiêu đề tiếng Việt và tiếng Anh là bắt buộc."];
        if (request.EndDate < request.StartDate)
            errors["date"] = ["Ngày kết thúc không được trước ngày bắt đầu."];
        if (string.IsNullOrWhiteSpace(request.SectionsJson))
            errors[nameof(request.SectionsJson)] = ["SectionsJson phải là JSON hợp lệ."];
        else
        {
            try { JsonDocument.Parse(request.SectionsJson); }
            catch (JsonException) { errors[nameof(request.SectionsJson)] = ["SectionsJson phải là JSON hợp lệ."]; }
        }
        return errors;
    }
}
