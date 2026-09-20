using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OpmWiki.Api.Security;
using OpmWiki.Application.Common;
using OpmWiki.Application.TierRanking;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Route("api/tier-rankings")]
public sealed class TierRankingsController(
    TierRankingService service,
    ISchemaCapabilityService schemaCapabilities) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<TierRankingPublicDto>> Get(CancellationToken cancellationToken)
    {
        var unavailable = await RequireSchemaAsync(cancellationToken);
        if (unavailable is not null) return unavailable;
        return Ok(await service.GetPublicAsync(cancellationToken));
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<TierRankingMineDto>> Mine(CancellationToken cancellationToken)
    {
        var unavailable = await RequireSchemaAsync(cancellationToken);
        if (unavailable is not null) return unavailable;
        var accountId = User.GetAccountId();
        if (accountId == Guid.Empty) return Forbid();
        var result = await service.GetMineAsync(accountId, cancellationToken);
        return result.Status == TierServiceStatus.Success
            ? Ok(result.Value)
            : Unauthorized(new { message = "Tài khoản không tồn tại hoặc không hoạt động." });
    }

    [Authorize]
    [EnableRateLimiting(SensitiveRateLimitPolicies.TierVote)]
    [HttpPut("votes/{characterId}")]
    public async Task<ActionResult<TierRankingVoteResponseDto>> Vote(
        string characterId,
        TierRankingVoteRequest request,
        CancellationToken cancellationToken)
    {
        var unavailable = await RequireSchemaAsync(cancellationToken);
        if (unavailable is not null) return unavailable;
        var accountId = User.GetAccountId();
        if (accountId == Guid.Empty) return Forbid();
        if (!request.Active.HasValue)
            return BadRequest(new { message = "Vote confirmation is required." });

        var result = await service.VoteAsync(accountId, characterId, request.Active.Value, cancellationToken);
        return result.Status switch
        {
            TierServiceStatus.Success => Ok(result.Value),
            TierServiceStatus.ImmutableVote => Conflict(new { message = "Phiếu đã xác nhận không thể hủy trong tháng hiện tại." }),
            TierServiceStatus.QuotaExceeded => Conflict(new
            {
                message = "Đã đạt giới hạn bình chọn của phẩm này trong tháng.",
                maxVotesPerRarity = result.Value?.MaxVotesPerRarity,
                hasVerifiedContact = result.Value?.HasVerifiedContact,
                emailVerified = result.Value?.EmailVerified,
                phoneVerified = result.Value?.PhoneVerified,
            }),
            TierServiceStatus.CharacterNotFound => NotFound(new { message = "Nhân vật không tồn tại trong bảng xếp hạng." }),
            TierServiceStatus.AccountUnavailable => Unauthorized(new { message = "Tài khoản không tồn tại hoặc không hoạt động." }),
            _ => BadRequest(new { message = "Yêu cầu bình chọn không hợp lệ." }),
        };
    }

    private async Task<ObjectResult?> RequireSchemaAsync(CancellationToken cancellationToken)
    {
        var capability = await schemaCapabilities.CheckAsync(SchemaCapability.TierRanking, cancellationToken);
        return capability.IsAvailable ? null : FeatureControllerSupport.SchemaNotReady(this, capability);
    }
}
