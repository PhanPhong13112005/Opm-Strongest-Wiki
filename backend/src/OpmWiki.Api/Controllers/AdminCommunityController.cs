using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Api.Security;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.AdminCommunity;
using OpmWiki.Application.Common;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/community")]
public sealed class AdminCommunityController(IAdminCommunityRepository repository) : ControllerBase
{
    [HttpGet("feed")]
    public async Task<ActionResult<AdminCommunityFeedDto>> Feed(
        [FromQuery] string kind = AdminCommunityKinds.All,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        var normalizedKind = kind.Trim().ToLowerInvariant();
        if (!AdminCommunityKinds.IsValid(normalizedKind) || page < 1 || pageSize is < 1 or > 100 ||
            (long)(page - 1) * pageSize > int.MaxValue)
            return BadRequest(new { message = "kind, page hoặc pageSize không hợp lệ." });
        return Ok(await repository.GetFeedAsync(normalizedKind, page, pageSize, cancellationToken));
    }

    [HttpPut("topics/{id:long}/lock")]
    public async Task<ActionResult<AdminCommunityTopicDto>> SetTopicLock(
        long id,
        UpdateTopicLockRequest request,
        CancellationToken cancellationToken)
    {
        if (id <= 0 || !OpaqueVersion.TryGetTimestamp(request.ExpectedVersion, out var expected))
            return BadRequest(new { message = "id hoặc expectedVersion không hợp lệ." });
        var result = await repository.SetTopicLockAsync(id, request.IsLocked, expected, cancellationToken);
        return result.Status switch
        {
            AdminCommunityMutationStatus.Success => Ok(result.Topic),
            AdminCommunityMutationStatus.NotFound => NotFound(),
            _ => Conflict(new { message = "Dữ liệu đã thay đổi; hãy tải phiên bản mới nhất." }),
        };
    }

    [HttpDelete("topics/{id:long}")]
    public async Task<IActionResult> DeleteTopic(long id, CancellationToken cancellationToken)
    {
        var versionResult = ReadIfMatch(id);
        if (versionResult.Error is not null) return versionResult.Error;
        return MapDelete(await repository.SoftDeleteTopicAsync(
            id, versionResult.Version, cancellationToken));
    }

    [HttpDelete("comments/{id:long}")]
    public async Task<IActionResult> DeleteComment(long id, CancellationToken cancellationToken)
    {
        var versionResult = ReadIfMatch(id);
        if (versionResult.Error is not null) return versionResult.Error;
        return MapDelete(await repository.SoftDeleteCommentAsync(
            id, versionResult.Version, User.GetAccountId(), cancellationToken));
    }

    private (DateTimeOffset Version, IActionResult? Error) ReadIfMatch(long id)
    {
        if (id <= 0) return (default, BadRequest(new { message = "id không hợp lệ." }));
        var header = Request.Headers.IfMatch.ToString();
        if (string.IsNullOrWhiteSpace(header))
            return (default, StatusCode(StatusCodes.Status428PreconditionRequired,
                new { message = "If-Match is required." }));
        return OpaqueVersion.TryGetTimestamp(header, out var expected)
            ? (expected, null)
            : (default, BadRequest(new { message = "If-Match không hợp lệ." }));
    }

    private IActionResult MapDelete(AdminCommunityMutationStatus status) => status switch
    {
        AdminCommunityMutationStatus.Success => NoContent(),
        AdminCommunityMutationStatus.NotFound => NotFound(),
        _ => Conflict(new { message = "Dữ liệu đã thay đổi; hãy tải phiên bản mới nhất." }),
    };
}
