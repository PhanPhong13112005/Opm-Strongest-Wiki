using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Api.Security;
using OpmWiki.Application.Common;
using OpmWiki.Application.TierRanking;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/tier-ranking")]
public sealed class AdminTierRankingController(
    TierRankingService service,
    ISchemaCapabilityService schemaCapabilities) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<ActionResult<AdminTierRankingStatsDto>> Stats(
        [FromQuery] string? voteMonth = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        var unavailable = await RequireSchemaAsync(cancellationToken);
        if (unavailable is not null) return unavailable;
        var result = await service.GetAdminStatsAsync(voteMonth, page, pageSize, cancellationToken);
        return result.Status == TierServiceStatus.Success
            ? Ok(result.Value)
            : BadRequest(new { message = "voteMonth, page hoặc pageSize không hợp lệ." });
    }

    [HttpPut("{characterId}/base-votes")]
    public async Task<ActionResult<AdminTierRankingCharacterDto>> UpdateBaseVotes(
        string characterId,
        UpdateBaseVotesRequest request,
        CancellationToken cancellationToken)
    {
        var unavailable = await RequireSchemaAsync(cancellationToken);
        if (unavailable is not null) return unavailable;
        var result = await service.UpdateBaseVotesAsync(
            characterId, request, User.GetAccountSubject(), cancellationToken);
        return result.Status switch
        {
            TierServiceStatus.Success => Ok(result.Value),
            TierServiceStatus.CharacterNotFound => NotFound(),
            TierServiceStatus.Conflict => Conflict(new { message = "Dữ liệu đã thay đổi; hãy tải phiên bản mới nhất." }),
            _ => BadRequest(new { message = "baseVotes hoặc expectedVersion không hợp lệ." }),
        };
    }

    private async Task<ObjectResult?> RequireSchemaAsync(CancellationToken cancellationToken)
    {
        var capability = await schemaCapabilities.CheckAsync(SchemaCapability.TierRanking, cancellationToken);
        return capability.IsAvailable ? null : FeatureControllerSupport.SchemaNotReady(this, capability);
    }
}
