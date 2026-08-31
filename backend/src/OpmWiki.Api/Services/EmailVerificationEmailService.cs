using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Encodings.Web;
using OpmWiki.Application.Abstractions;

namespace OpmWiki.Api.Services;

public sealed class EmailVerificationEmailService(
    HttpClient httpClient,
    PasswordResetOptions options,
    IWebHostEnvironment environment) : IEmailVerificationDelivery
{
    public async Task<bool> SendAsync(
        string email,
        string verificationUrl,
        string idempotencyKey,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(options.ResendApiKey) || string.IsNullOrWhiteSpace(options.From))
        {
            if (environment.IsProduction())
                throw new InvalidOperationException("Resend email settings are not configured.");
            return false;
        }

        var safeUrl = HtmlEncoder.Default.Encode(verificationUrl);
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ResendApiKey);
        request.Headers.UserAgent.ParseAdd("opmwiki-email-verification/1.0");
        request.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);
        request.Content = JsonContent.Create(new
        {
            from = options.From,
            to = new[] { email },
            subject = "Xác minh Gmail OPM Strongest Wiki",
            text = $"Xác minh Gmail bằng liên kết dùng một lần sau:\n{verificationUrl}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.",
            html = $"""
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202a">
                  <h2>Xác minh Gmail</h2>
                  <p>Mở liên kết dùng một lần dưới đây để xác minh Gmail OPM Strongest Wiki.</p>
                  <p><a href="{safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#42c9f5;color:#061019;text-decoration:none;font-weight:700">Xác minh Gmail</a></p>
                  <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
                </div>
                """,
        });

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode) return true;
        throw new HttpRequestException($"Resend returned HTTP {(int)response.StatusCode}.");
    }
}
