using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Api.Security;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/forum")]
public sealed class ForumController(ICommunityRepository repository) : ControllerBase
{
    [HttpGet("topics")]
    public async Task<ActionResult<IReadOnlyList<ForumTopicSummaryDto>>> ListTopics(
        CancellationToken cancellationToken) =>
        Ok(await repository.ListForumTopicsAsync(cancellationToken));

    [HttpGet("topics/{id:long}")]
    public async Task<ActionResult<ForumTopicDetailDto>> GetTopic(long id, CancellationToken cancellationToken)
    {
        var topic = await repository.GetForumTopicAsync(id, cancellationToken);
        return topic is null ? NotFound() : Ok(topic);
    }

    [HttpPost("topics")]
    public async Task<ActionResult<ForumTopicDetailDto>> CreateTopic(
        CreateForumTopicRequest request,
        CancellationToken cancellationToken)
    {
        var title = request.Title?.Trim() ?? string.Empty;
        var content = request.Content?.Trim() ?? string.Empty;
        if (title.Length is < 3 or > 160 || content.Length is < 3 or > 5000)
            return BadRequest(new { message = "Tiêu đề cần 3-160 ký tự và nội dung cần 3-5000 ký tự." });
        var userId = User.GetAccountId();
        if (userId == Guid.Empty) return BadRequest(new { message = "Hãy dùng tài khoản cộng đồng để tạo chủ đề." });
        var topic = await repository.CreateForumTopicAsync(userId, title, content, cancellationToken);
        return CreatedAtAction(nameof(GetTopic), new { id = topic.Id }, topic);
    }

    [HttpPost("topics/{id:long}/posts")]
    public async Task<ActionResult<ForumPostDto>> AddPost(
        long id,
        CreateForumPostRequest request,
        CancellationToken cancellationToken)
    {
        var content = request.Content?.Trim() ?? string.Empty;
        if (content.Length is < 1 or > 3000)
            return BadRequest(new { message = "Tin nhắn phải có 1-3000 ký tự." });
        var userId = User.GetAccountId();
        if (userId == Guid.Empty) return BadRequest(new { message = "Hãy dùng tài khoản cộng đồng để trò chuyện." });
        var post = await repository.AddForumPostAsync(id, userId, content, cancellationToken);
        return post is null ? NotFound(new { message = "Chủ đề không tồn tại hoặc đã bị khóa." }) : Ok(post);
    }
}

[ApiController]
[Authorize(Roles = "Staff,Admin")]
[Route("api/moderation/forum")]
public sealed class ForumModerationController(ICommunityRepository repository) : ControllerBase
{
    [HttpDelete("topics/{id:long}")]
    public async Task<IActionResult> DeleteTopic(long id, CancellationToken cancellationToken) =>
        await repository.DeleteForumTopicAsync(id, User.GetAccountId(), cancellationToken)
            ? NoContent()
            : NotFound();

    [HttpDelete("posts/{id:long}")]
    public async Task<IActionResult> DeletePost(long id, CancellationToken cancellationToken) =>
        await repository.DeleteForumPostAsync(id, User.GetAccountId(), cancellationToken)
            ? NoContent()
            : NotFound();
}
