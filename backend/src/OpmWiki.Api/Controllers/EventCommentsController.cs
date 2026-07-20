using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Api.Security;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/events/{eventId}/comments")]
public sealed class EventCommentsController(ICommunityRepository repository) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EventCommentDto>>> List(
        string eventId,
        CancellationToken cancellationToken) =>
        Ok(await repository.ListEventCommentsAsync(eventId, cancellationToken));

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<EventCommentDto>> Create(
        string eventId,
        CreateCommentRequest request,
        CancellationToken cancellationToken)
    {
        var content = request.Content?.Trim() ?? string.Empty;
        if (content.Length is < 1 or > 1000)
            return BadRequest(new { message = "Bình luận phải có 1-1000 ký tự." });
        var userId = User.GetAccountId();
        if (userId == Guid.Empty)
            return BadRequest(new { message = "Tài khoản quản trị hệ thống không dùng để bình luận." });

        var comment = await repository.AddEventCommentAsync(eventId, userId, content, cancellationToken);
        return comment is null ? NotFound(new { message = "Không tìm thấy sự kiện hoặc tài khoản." }) : Ok(comment);
    }
}

[ApiController]
[Authorize(Roles = "Staff,Admin")]
[Route("api/moderation/comments")]
public sealed class CommentModerationController(ICommunityRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EventCommentDto>>> List(CancellationToken cancellationToken) =>
        Ok(await repository.ListRecentEventCommentsAsync(cancellationToken));

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken) =>
        await repository.DeleteEventCommentAsync(id, User.GetAccountId(), cancellationToken)
            ? NoContent()
            : NotFound();
}
