using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Api.Security;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;
using OpmWiki.Domain.Entities;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/top-ups")]
public sealed class TopUpsController(ICommunityRepository repository) : ControllerBase
{
    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<TopUpRequestDto>>> Mine(CancellationToken cancellationToken)
    {
        var userId = User.GetAccountId();
        return userId == Guid.Empty
            ? Ok(Array.Empty<TopUpRequestDto>())
            : Ok(await repository.ListUserTopUpsAsync(userId, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<TopUpRequestDto>> Create(
        CreateTopUpRequest request,
        CancellationToken cancellationToken)
    {
        var provider = request.Provider?.Trim() ?? string.Empty;
        var reference = request.ReferenceCode?.Trim() ?? string.Empty;
        if (provider.Length is < 2 or > 60 || reference.Length is < 4 or > 120)
            return BadRequest(new { message = "Nhà cung cấp hoặc mã giao dịch không hợp lệ." });
        if (request.Amount is < 10_000 or > 100_000_000)
            return BadRequest(new { message = "Số tiền phải từ 10.000 đến 100.000.000." });
        var userId = User.GetAccountId();
        if (userId == Guid.Empty) return BadRequest(new { message = "Hãy dùng tài khoản người dùng để nạp." });

        try
        {
            var result = await repository.CreateTopUpAsync(userId, provider, reference, request.Amount, cancellationToken);
            return Created($"/api/top-ups/{result.Id}", result);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            return Conflict(new { message = "Mã giao dịch này đã được gửi trước đó." });
        }
    }
}

[ApiController]
[Authorize(Roles = "Staff,Admin")]
[Route("api/staff/top-ups")]
public sealed class StaffTopUpsController(ICommunityRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TopUpRequestDto>>> List(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(status) && status is not (TopUpStatuses.Pending or TopUpStatuses.Approved or TopUpStatuses.Rejected))
            return BadRequest(new { message = "Trạng thái không hợp lệ." });
        return Ok(await repository.ListTopUpsAsync(status, cancellationToken));
    }

    [HttpPut("{id:long}/review")]
    public async Task<ActionResult<TopUpRequestDto>> Review(
        long id,
        ReviewTopUpRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Status is not (TopUpStatuses.Approved or TopUpStatuses.Rejected))
            return BadRequest(new { message = "Chỉ có thể duyệt hoặc từ chối yêu cầu." });
        if ((request.StaffNote?.Length ?? 0) > 500)
            return BadRequest(new { message = "Ghi chú không được vượt quá 500 ký tự." });
        var result = await repository.ReviewTopUpAsync(
            id, User.GetAccountId(), request.Status, request.StaffNote ?? string.Empty, cancellationToken);
        return result is null
            ? Conflict(new { message = "Yêu cầu không tồn tại hoặc đã được xử lý." })
            : Ok(result);
    }
}
