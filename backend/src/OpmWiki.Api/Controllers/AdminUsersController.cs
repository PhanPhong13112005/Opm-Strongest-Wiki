using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Api.Security;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;
using OpmWiki.Domain.Entities;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/users")]
public sealed class AdminUsersController(ICommunityRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AccountDto>>> List(CancellationToken cancellationToken) =>
        Ok(await repository.ListAccountsAsync(cancellationToken));

    [HttpPut("{id:guid}/role")]
    public async Task<ActionResult<AccountDto>> UpdateRole(
        Guid id,
        UpdateAccountRoleRequest request,
        CancellationToken cancellationToken)
    {
        if (id == User.GetAccountId())
            return Conflict(new { message = "Bạn không thể tự thay đổi vai trò của mình." });
        if (request.Role is not (AccountRoles.User or AccountRoles.Staff or AccountRoles.Admin))
            return BadRequest(new { message = "Vai trò phải là User, Staff hoặc Admin." });
        var result = await repository.UpdateAccountRoleAsync(id, request.Role, User.GetAccountId(), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<AccountDto>> UpdateStatus(
        Guid id,
        UpdateAccountStatusRequest request,
        CancellationToken cancellationToken)
    {
        if (request.IsActive is not bool isActive)
            return BadRequest(new { message = "Trạng thái tài khoản phải là true hoặc false." });
        if (id == User.GetAccountId())
            return Conflict(new { message = "Bạn không thể tự vô hiệu hóa tài khoản của mình." });
        var result = await repository.UpdateAccountStatusAsync(
            id, isActive, User.GetAccountId(), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}
