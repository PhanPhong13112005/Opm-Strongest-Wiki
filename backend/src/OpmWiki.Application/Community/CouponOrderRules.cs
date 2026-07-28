using System.Text.RegularExpressions;

namespace OpmWiki.Application.Community;

public static partial class CouponOrderRules
{
    public const string Provider = "Coupon Order";
    public const decimal UnitPrice = 13_000;

    public static bool TryGetQuantity(string? referenceCode, out int quantity)
    {
        quantity = 0;
        var match = ReferencePattern().Match(referenceCode ?? string.Empty);
        return match.Success && int.TryParse(match.Groups[1].Value, out quantity);
    }

    public static bool IsValid(string? referenceCode, decimal amount) =>
        TryGetQuantity(referenceCode, out var quantity) && amount == UnitPrice * quantity;

    [GeneratedRegex(
        @"^UID:\d{5,20}\|SID:[A-Za-z0-9_-]{1,20}\|CP:6\|QTY:(10|[1-9])\|[A-Z0-9]+$",
        RegexOptions.CultureInvariant)]
    private static partial Regex ReferencePattern();
}
