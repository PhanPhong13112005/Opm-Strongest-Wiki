using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OpmWiki.Api.Security;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed partial class AuthController(
    ICommunityRepository repository,
    PasswordHasher passwordHasher,
    AdminTokenService tokenService) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting("admin-login")]
    [HttpPost("login")]
    public async Task<ActionResult<AdminLoginResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrEmpty(request.Password))
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng." });

        if (tokenService.ValidateCredentials(request.Username, request.Password))
            return Ok(tokenService.CreateToken());

        var account = await repository.FindUserByUsernameAsync(Normalize(request.Username), cancellationToken);
        if (account is null || !account.IsActive || !passwordHasher.Verify(request.Password, account.PasswordHash))
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng." });

        return Ok(tokenService.CreateToken(
            account.Id.ToString(),
            account.Username,
            account.DisplayName,
            account.Role,
            account.Balance));
    }

    [AllowAnonymous]
    [EnableRateLimiting("admin-login")]
    [HttpPost("register")]
    public async Task<ActionResult<AdminLoginResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var errors = Validate(request);
        if (errors.Count > 0) return BadRequest(new ValidationProblemDetails(errors));

        var account = await repository.CreateUserAsync(
            request.Username,
            request.DisplayName,
            passwordHasher.Hash(request.Password),
            cancellationToken);
        if (account is null) return Conflict(new { message = "Tên đăng nhập đã được sử dụng." });

        return Created("/api/auth/me", tokenService.CreateToken(
            account.Id.ToString(),
            account.Username,
            account.DisplayName,
            account.Role,
            account.Balance));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AccountDto>> Me(CancellationToken cancellationToken)
    {
        var id = User.GetAccountId();
        if (id == Guid.Empty)
        {
            return Ok(new AccountDto(
                Guid.Empty,
                User.Identity?.Name ?? "admin",
                User.FindFirst("display_name")?.Value ?? "Administrator",
                User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Admin",
                0,
                DateTimeOffset.UtcNow));
        }

        var account = await repository.FindUserByIdAsync(id, cancellationToken);
        return account is null
            ? Unauthorized()
            : Ok(new AccountDto(
                account.Id, account.Username, account.DisplayName, account.Role, account.Balance, account.CreatedAt));
    }

    private static Dictionary<string, string[]> Validate(RegisterRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (!UsernamePattern().IsMatch(request.Username ?? string.Empty))
            errors[nameof(request.Username)] = ["Tên đăng nhập phải có 3-30 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang."];
        if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Trim().Length is < 2 or > 60)
            errors[nameof(request.DisplayName)] = ["Tên hiển thị phải có 2-60 ký tự."];
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length is < 8 or > 72)
            errors[nameof(request.Password)] = ["Mật khẩu phải có 8-72 ký tự."];
        return errors;
    }

    private static string Normalize(string value) => value.Trim().ToUpperInvariant();

    [GeneratedRegex("^[a-zA-Z0-9._-]{3,30}$")]
    private static partial Regex UsernamePattern();
}
