using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OpmWiki.Api.Security;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/admin/auth")]
public sealed class AdminAuthController(AdminTokenService tokenService) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting("admin-login")]
    [HttpPost("login")]
    [ProducesResponseType<AdminLoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public ActionResult<AdminLoginResponse> Login(AdminLoginRequest request)
    {
        if (!tokenService.ValidateCredentials(request.Username, request.Password))
            return Unauthorized(new { message = "Invalid administrator credentials." });

        return Ok(tokenService.CreateToken());
    }
}
