using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OpmWiki.Api.Security;
using OpmWiki.Application.Common;
using OpmWiki.Application.EmailVerification;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/auth/email-verification")]
public sealed class EmailVerificationController(
    EmailVerificationService service,
    ISchemaCapabilityService schemaCapabilities) : ControllerBase
{
    [Authorize]
    [EnableRateLimiting(SensitiveRateLimitPolicies.VerificationRequest)]
    [HttpPost("request")]
    public async Task<ActionResult<EmailVerificationResponse>> RequestVerification(
        CancellationToken cancellationToken)
    {
        var unavailable = await RequireSchemaAsync(cancellationToken);
        if (unavailable is not null) return unavailable;
        var accountId = User.GetAccountId();
        if (accountId == Guid.Empty) return Forbid();
        var result = await service.RequestAsync(
            accountId, $"{Request.Scheme}://{Request.Host}", cancellationToken);
        return result.Status switch
        {
            EmailVerificationRequestStatus.AlreadyVerified => Ok(new EmailVerificationResponse("Gmail đã được xác minh.", true)),
            EmailVerificationRequestStatus.Throttled => StatusCode(StatusCodes.Status429TooManyRequests,
                new EmailVerificationResponse("Vui lòng chờ trước khi yêu cầu liên kết mới.", false)),
            EmailVerificationRequestStatus.DeliveryUnavailable => StatusCode(StatusCodes.Status503ServiceUnavailable,
                new EmailVerificationResponse("Dịch vụ gửi email tạm thời không khả dụng.", false)),
            _ => Ok(new EmailVerificationResponse(
                "Nếu tài khoản đủ điều kiện, liên kết xác minh đã được gửi.",
                result.Verified,
                result.VerificationUrl)),
        };
    }

    [AllowAnonymous]
    [EnableRateLimiting(SensitiveRateLimitPolicies.VerificationConfirm)]
    [HttpPost("confirm")]
    public async Task<ActionResult<EmailVerificationResponse>> Confirm(
        ConfirmEmailVerificationRequest request,
        CancellationToken cancellationToken)
    {
        var unavailable = await RequireSchemaAsync(cancellationToken);
        if (unavailable is not null) return unavailable;
        var result = await service.ConfirmAsync(request.Token, cancellationToken);
        return result == EmailVerificationConfirmStatus.Confirmed
            ? Ok(new EmailVerificationResponse("Gmail đã được xác minh thành công.", true))
            : BadRequest(new EmailVerificationResponse(
                "Liên kết xác minh Gmail không hợp lệ hoặc đã hết hạn.", false));
    }

    private async Task<ObjectResult?> RequireSchemaAsync(CancellationToken cancellationToken)
    {
        var capability = await schemaCapabilities.CheckAsync(SchemaCapability.EmailVerification, cancellationToken);
        return capability.IsAvailable ? null : FeatureControllerSupport.SchemaNotReady(this, capability);
    }
}
