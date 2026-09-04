using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OpmWiki.Api.Security;
using OpmWiki.Api.Services;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Common;
using OpmWiki.Application.Community;
using OpmWiki.Application.EmailVerification;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed partial class AuthController(
    ICommunityRepository repository,
    PasswordHasher passwordHasher,
    AdminTokenService tokenService,
    PasswordResetEmailService passwordResetEmail,
    IEmailVerificationRepository verificationRepository,
    ISchemaCapabilityService schemaCapabilities,
    IWebHostEnvironment environment,
    ILogger<AuthController> logger) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting(SensitiveRateLimitPolicies.Login)]
    [HttpPost("login")]
    public async Task<ActionResult<AdminLoginResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrEmpty(request.Password))
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng." });

        if (tokenService.ValidateCredentials(request.Username, request.Password))
            return Ok(tokenService.CreateToken());

        var identifier = request.Username.Trim();
        var account = await repository.FindUserByIdentifierAsync(
            Normalize(identifier),
            GmailPattern().IsMatch(identifier) ? NormalizeGmail(identifier) : identifier.ToLowerInvariant(),
            cancellationToken);
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
    [EnableRateLimiting(SensitiveRateLimitPolicies.Register)]
    [HttpPost("register")]
    public async Task<ActionResult<AdminLoginResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var errors = Validate(request);
        if (errors.Count > 0) return BadRequest(new ValidationProblemDetails(errors));

        var account = await repository.CreateUserWithEmailAsync(
            request.Username,
            request.Email,
            request.Username,
            passwordHasher.Hash(request.Password),
            cancellationToken);
        if (account is null) return Conflict(new { message = "Tên đăng nhập hoặc Gmail đã được sử dụng." });

        return Created("/api/auth/me", tokenService.CreateToken(
            account.Id.ToString(),
            account.Username,
            account.DisplayName,
            account.Role,
            account.Balance));
    }

    [AllowAnonymous]
    [EnableRateLimiting(SensitiveRateLimitPolicies.ForgotPassword)]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var suppliedEmail = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!GmailPattern().IsMatch(suppliedEmail))
            return BadRequest(new { message = "Vui lòng nhập địa chỉ Gmail hợp lệ." });
        var normalizedEmail = NormalizeGmail(suppliedEmail);

        var token = PasswordResetTokens.Create();
        var tokenHash = PasswordResetTokens.Hash(token);
        var account = await repository.SetPasswordResetTokenAsync(
            normalizedEmail,
            tokenHash,
            DateTimeOffset.UtcNow.AddMinutes(passwordResetEmail.TokenLifetimeMinutes),
            cancellationToken);

        string? resetUrl = null;
        if (account is not null)
        {
            resetUrl = passwordResetEmail.BuildResetUrl(Request, token);
            try
            {
                await passwordResetEmail.SendAsync(
                    account.Email,
                    resetUrl,
                    $"password-reset-{account.Id:N}-{tokenHash[..20]}",
                    cancellationToken);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Could not send password reset email.");
            }
        }

        return Ok(new
        {
            message = "Nếu Gmail tồn tại, liên kết đặt lại mật khẩu đã được gửi.",
            resetUrl = environment.IsDevelopment() ? resetUrl : null,
        });
    }

    [AllowAnonymous]
    [EnableRateLimiting(SensitiveRateLimitPolicies.ForgotPassword)]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || request.Token.Length is < 32 or > 200)
            return BadRequest(new { message = "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length is < 8 or > 72)
            return BadRequest(new { message = "Mật khẩu phải có 8-72 ký tự." });

        var updated = await repository.ResetPasswordAsync(
            PasswordResetTokens.Hash(request.Token),
            passwordHasher.Hash(request.Password),
            cancellationToken);
        return updated
            ? Ok(new { message = "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập ngay." })
            : BadRequest(new { message = "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });
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
                true,
                DateTimeOffset.UtcNow));
        }

        var account = await repository.FindUserByIdAsync(id, cancellationToken);
        ContactVerificationState? contact = null;
        if (account is not null)
        {
            var capability = await schemaCapabilities.CheckAsync(
                SchemaCapability.EmailVerification,
                cancellationToken);
            if (capability.IsAvailable)
                contact = await verificationRepository.GetStateAsync(id, cancellationToken);
        }
        return account is null || !account.IsActive
            ? Unauthorized()
            : Ok(new AccountDto(
                account.Id, account.Username, account.DisplayName, account.Role, account.Balance,
                account.IsActive, account.CreatedAt,
                contact?.EmailVerified ?? false,
                contact?.PhoneVerified ?? false,
                contact?.HasVerifiedContact ?? false));
    }

    private static Dictionary<string, string[]> Validate(RegisterRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (!UsernamePattern().IsMatch(request.Username ?? string.Empty))
            errors[nameof(request.Username)] = ["Tên đăng nhập phải có 3-30 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang."];
        if (!GmailPattern().IsMatch(request.Email?.Trim() ?? string.Empty))
            errors[nameof(request.Email)] = ["Vui lòng sử dụng địa chỉ Gmail hợp lệ có đuôi @gmail.com."];
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length is < 8 or > 72)
            errors[nameof(request.Password)] = ["Mật khẩu phải có 8-72 ký tự."];
        return errors;
    }

    private static string Normalize(string value) => value.Trim().ToUpperInvariant();

    private static string NormalizeGmail(string email)
    {
        var local = email.Trim().ToLowerInvariant().Split('@')[0].Split('+')[0].Replace(".", string.Empty);
        return $"{local}@gmail.com";
    }

    [GeneratedRegex("^[a-zA-Z0-9._-]{3,30}$")]
    private static partial Regex UsernamePattern();

    [GeneratedRegex("^[a-zA-Z0-9._%+-]+@gmail\\.com$", RegexOptions.IgnoreCase)]
    private static partial Regex GmailPattern();
}
