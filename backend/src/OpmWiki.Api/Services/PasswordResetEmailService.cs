using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.WebUtilities;

namespace OpmWiki.Api.Services;

public sealed class PasswordResetOptions
{
    public string ResendApiKey { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string PublicAppUrl { get; set; } = string.Empty;
    public int TokenLifetimeMinutes { get; set; } = 15;
}

public sealed class PasswordResetEmailService(
    HttpClient httpClient,
    PasswordResetOptions options,
    IWebHostEnvironment environment)
{
    public int TokenLifetimeMinutes => Math.Clamp(options.TokenLifetimeMinutes, 5, 60);

    public string BuildResetUrl(HttpRequest request, string token)
    {
        var configuredOrigin = options.PublicAppUrl.Trim().TrimEnd('/');
        if (environment.IsProduction() && string.IsNullOrWhiteSpace(configuredOrigin))
            throw new InvalidOperationException("PublicAppUrl must be configured for password reset emails.");

        var origin = !string.IsNullOrWhiteSpace(configuredOrigin)
            ? configuredOrigin
            : $"{request.Scheme}://{request.Host}";
        return $"{origin}/reset-password?token={Uri.EscapeDataString(token)}";
    }

    public async Task<bool> SendAsync(
        string email,
        string resetUrl,
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.ResendApiKey) || string.IsNullOrWhiteSpace(options.From))
        {
            if (environment.IsProduction())
                throw new InvalidOperationException("Resend email settings are not configured.");
            return false;
        }

        var safeUrl = HtmlEncoder.Default.Encode(resetUrl);
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ResendApiKey);
        request.Headers.UserAgent.ParseAdd("opmwiki-password-reset/1.0");
        request.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);
        request.Content = JsonContent.Create(new
        {
            from = options.From,
            to = new[] { email },
            subject = "Đặt lại mật khẩu OPM Strongest Wiki",
            text = $"""
                Bạn vừa yêu cầu đặt lại mật khẩu OPM Strongest Wiki.

                Mở liên kết sau trong vòng {TokenLifetimeMinutes} phút:
                {resetUrl}

                Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.
                """,
            html = $"""
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202a">
                  <h2>Đặt lại mật khẩu</h2>
                  <p>Bạn vừa yêu cầu đặt lại mật khẩu OPM Strongest Wiki.</p>
                  <p><a href="{safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#42c9f5;color:#061019;text-decoration:none;font-weight:700">Đặt lại mật khẩu</a></p>
                  <p>Liên kết có hiệu lực trong {TokenLifetimeMinutes} phút và chỉ dùng được một lần.</p>
                  <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
                </div>
                """,
        });

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode) return true;

        var detail = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new HttpRequestException(
            $"Resend returned {(int)response.StatusCode}: {detail[..Math.Min(detail.Length, 300)]}");
    }
}

public static class PasswordResetTokens
{
    public static string Create() => WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));

    public static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token ?? string.Empty))).ToLowerInvariant();
}
