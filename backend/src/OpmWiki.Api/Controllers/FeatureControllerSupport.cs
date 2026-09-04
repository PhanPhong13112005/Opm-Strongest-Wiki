using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Common;

namespace OpmWiki.Api.Controllers;

internal static class FeatureControllerSupport
{
    public static ObjectResult SchemaNotReady(ControllerBase controller, SchemaCapabilityResult capability)
    {
        var problem = new ProblemDetails
        {
            Type = "https://opmwiki.local/problems/schema-not-ready",
            Title = "Feature unavailable",
            Detail = capability.Detail,
            Status = StatusCodes.Status503ServiceUnavailable,
        };
        problem.Extensions["code"] = capability.Code;
        return controller.StatusCode(StatusCodes.Status503ServiceUnavailable, problem);
    }
}
