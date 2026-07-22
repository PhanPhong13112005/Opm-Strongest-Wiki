using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        if (request.Role is not (AccountRoles.User or AccountRoles.Staff or AccountRoles.Admin))
            return BadRequest(new { message = "Vai trò phải là User, Staff hoặc Admin." });
        var result = await repository.UpdateAccountRoleAsync(id, request.Role, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}
