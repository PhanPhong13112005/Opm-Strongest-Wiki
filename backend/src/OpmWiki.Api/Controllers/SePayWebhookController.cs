using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpmWiki.Application.Abstractions;
using OpmWiki.Application.Community;

namespace OpmWiki.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/webhooks/sepay")]
public sealed class SePayWebhookController(
    ICommunityRepository repository,
    IConfiguration configuration,
    ILogger<SePayWebhookController> logger) : ControllerBase
{
    private const int MaximumPayloadBytes = 64 * 1024;
    private static readonly TimeSpan MaximumTimestampSkew = TimeSpan.FromMinutes(5);
    private static readonly Regex PaymentCodePattern = new(
        @"^OPM[A-F0-9]{12}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private static readonly Regex PaymentCodeInContentPattern = new(
        @"(?:^|[^A-Z0-9])(OPM[A-F0-9]{12})(?![A-Z0-9])",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

    [HttpPost]
    public async Task<IActionResult> Receive(CancellationToken cancellationToken)
    {
        var secret = configuration["SePay:WebhookSecret"]?.Trim() ?? string.Empty;
        var receivingAccount = configuration["BankTransfer:AccountNumber"]?.Trim() ?? string.Empty;
        if (secret.Length < 32 || receivingAccount.Length == 0)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { success = false });
        if (Request.ContentLength is > MaximumPayloadBytes)
            return StatusCode(StatusCodes.Status413PayloadTooLarge, new { success = false });

        using var reader = new StreamReader(
            Request.Body,
            Encoding.UTF8,
            detectEncodingFromByteOrderMarks: false,
            leaveOpen: true);
        var rawBody = await reader.ReadToEndAsync(cancellationToken);
        if (Encoding.UTF8.GetByteCount(rawBody) > MaximumPayloadBytes)
            return StatusCode(StatusCodes.Status413PayloadTooLarge, new { success = false });

        if (!long.TryParse(Request.Headers["X-SePay-Timestamp"].ToString(), out var timestamp) ||
            !IsFreshTimestamp(timestamp) ||
            !HasValidSignature(
                Request.Headers["X-SePay-Signature"].ToString(),
                timestamp,
                rawBody,
                secret))
        {
            return Unauthorized(new { success = false });
        }

        SePayPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<SePayPayload>(
                rawBody,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException)
        {
            return BadRequest(new { success = false });
        }

        if (payload is null)
            return BadRequest(new { success = false });
        if (payload.Id <= 0)
            return Ok(new { success = true });

        var paymentCode = ExtractPaymentCode(payload.Code, payload.Content);
        if (payload.TransferType != "in" ||
            payload.AccountNumber?.Trim() != receivingAccount ||
            !PaymentCodePattern.IsMatch(paymentCode) ||
            decimal.Truncate(payload.TransferAmount) != payload.TransferAmount ||
            payload.TransferAmount <= 0)
        {
            return Ok(new { success = true });
        }

        var result = await repository.ProcessSePayWebhookAsync(
            new SePayWebhookTransaction(
                payload.Id.ToString(CultureInfo.InvariantCulture),
                payload.Gateway?.Trim() ?? string.Empty,
                payload.AccountNumber.Trim(),
                paymentCode,
                payload.TransferAmount,
                payload.TransferType,
                payload.ReferenceCode?.Trim() ?? string.Empty,
                rawBody,
                ParseTransactionTime(payload.TransactionDate)),
            cancellationToken);
        logger.LogInformation(
            "Processed SePay transaction {TransactionId}: {Status}, credited={Credited}, duplicate={Duplicate}.",
            payload.Id,
            result.Status,
            result.Credited,
            result.Duplicate);
        return Ok(new { success = true });
    }

    private static bool IsFreshTimestamp(long timestamp)
    {
        try
        {
            return (DateTimeOffset.UtcNow - DateTimeOffset.FromUnixTimeSeconds(timestamp)).Duration() <=
                   MaximumTimestampSkew;
        }
        catch (ArgumentOutOfRangeException)
        {
            return false;
        }
    }

    private static bool HasValidSignature(
        string signature,
        long timestamp,
        string rawBody,
        string secret)
    {
        var signedPayload = $"{timestamp}.{rawBody}";
        var digest = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret),
            Encoding.UTF8.GetBytes(signedPayload));
        var expected = $"sha256={Convert.ToHexString(digest).ToLowerInvariant()}";
        var actualBytes = Encoding.ASCII.GetBytes(signature);
        var expectedBytes = Encoding.ASCII.GetBytes(expected);
        return actualBytes.Length == expectedBytes.Length &&
               CryptographicOperations.FixedTimeEquals(actualBytes, expectedBytes);
    }

    private static DateTimeOffset? ParseTransactionTime(string? value)
    {
        if (!DateTime.TryParseExact(
                value,
                "yyyy-MM-dd HH:mm:ss",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var localTime))
            return null;
        return new DateTimeOffset(localTime, TimeSpan.FromHours(7)).ToUniversalTime();
    }

    private static string ExtractPaymentCode(string? code, string? content)
    {
        var normalizedCode = code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (PaymentCodePattern.IsMatch(normalizedCode))
            return normalizedCode;

        var match = PaymentCodeInContentPattern.Match(content ?? string.Empty);
        return match.Success ? match.Groups[1].Value.ToUpperInvariant() : string.Empty;
    }

    private sealed record SePayPayload(
        long Id,
        string? Gateway,
        string? TransactionDate,
        string? AccountNumber,
        string? Code,
        string? Content,
        string? TransferType,
        decimal TransferAmount,
        string? ReferenceCode);
}
