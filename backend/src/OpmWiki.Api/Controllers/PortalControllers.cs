using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;
using OpmWiki.Api.Services;

namespace OpmWiki.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/dashboard")]
public sealed class AdminDashboardController(ICommunityRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get(CancellationToken cancellationToken) =>
        Ok(await repository.GetDashboardAsync(cancellationToken));
}

[ApiController]
[Authorize]
[Route("api/advisor")]
public sealed class AdvisorController(ICommunityRepository repository, AiAdvisorClient aiAdvisor) : ControllerBase
{
    [HttpPost("ask")]
    public async Task<ActionResult<AdvisorResponse>> Ask(
        AdvisorRequest request,
        CancellationToken cancellationToken)
    {
        var question = request.Question?.Trim() ?? string.Empty;
        if (question.Length is < 2 or > 1000)
            return BadRequest(new { message = "Câu hỏi phải có 2-1000 ký tự." });

        var context = await repository.FindAdvisorContextAsync(question, cancellationToken);
        var aiAnswer = await aiAdvisor.AskAsync(question, context, cancellationToken);
        if (!string.IsNullOrWhiteSpace(aiAnswer))
            return Ok(new AdvisorResponse(aiAnswer, "external-ai + wiki"));
        if (context.Characters.Count == 0 && context.Events.Count == 0)
        {
            return Ok(new AdvisorResponse(
                "Tôi chưa tìm thấy dữ liệu phù hợp. Hãy thử nhập chính xác tên nhân vật, phe, hệ hoặc tên sự kiện.",
                "wiki-local"));
        }

        var sections = new List<string>();
        if (context.Characters.Count > 0)
            sections.Add("Nhân vật phù hợp:\n- " + string.Join("\n- ", context.Characters));
        if (context.Events.Count > 0)
            sections.Add("Sự kiện phù hợp:\n- " + string.Join("\n- ", context.Events));
        return Ok(new AdvisorResponse(string.Join("\n\n", sections), "wiki-local"));
    }
}
