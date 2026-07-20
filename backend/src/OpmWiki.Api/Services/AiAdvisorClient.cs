using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using OpmWiki.Application.Community;

namespace OpmWiki.Api.Services;

public sealed class AiAdvisorOptions
{
    public const string SectionName = "AiAdvisor";
    public bool Enabled { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
}

public sealed class AiAdvisorClient(
    HttpClient httpClient,
    AiAdvisorOptions options,
    ILogger<AiAdvisorClient> logger)
{
    public bool IsConfigured =>
        options.Enabled &&
        Uri.TryCreate(options.Endpoint, UriKind.Absolute, out _) &&
        !string.IsNullOrWhiteSpace(options.ApiKey) &&
        !string.IsNullOrWhiteSpace(options.Model);

    public async Task<string?> AskAsync(
        string question,
        AdvisorContextDto context,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured) return null;
        var wikiContext = $"Nhân vật:\n{string.Join("\n", context.Characters)}\n\nSự kiện:\n{string.Join("\n", context.Events)}";
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{options.Endpoint.TrimEnd('/')}/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiKey);
        request.Content = JsonContent.Create(new
        {
            model = options.Model,
            temperature = 0.2,
            messages = new object[]
            {
                new { role = "system", content = "Bạn là trợ lý cho OPM Strongest Wiki. Chỉ trả lời dựa trên dữ liệu Wiki được cung cấp, nói rõ khi thiếu dữ liệu và không bịa thông tin." },
                new { role = "user", content = $"Dữ liệu Wiki:\n{wikiContext}\n\nCâu hỏi: {question}" },
            },
        });

        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("AI advisor returned status {StatusCode}.", response.StatusCode);
                return null;
            }
            using var document = await JsonDocument.ParseAsync(
                await response.Content.ReadAsStreamAsync(cancellationToken),
                cancellationToken: cancellationToken);
            return document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException or JsonException)
        {
            logger.LogWarning(exception, "AI advisor is unavailable; using Wiki fallback.");
            return null;
        }
    }
}
