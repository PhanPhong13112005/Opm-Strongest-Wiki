using System.Globalization;
using System.Text.RegularExpressions;

namespace OpmWiki.Application.TierRanking;

public readonly partial record struct VoteMonth(int Year, int Month)
{
    public const string TimeZoneId = "Asia/Ho_Chi_Minh";

    public string Value => $"{Year:D4}-{Month:D2}";

    public DateTimeOffset ResetsAt
    {
        get
        {
            var nextMonth = new DateTime(Year, Month, 1, 0, 0, 0, DateTimeKind.Unspecified).AddMonths(1);
            var utc = TimeZoneInfo.ConvertTimeToUtc(nextMonth, GetTimeZone());
            return new DateTimeOffset(utc, TimeSpan.Zero);
        }
    }

    public static VoteMonth FromInstant(DateTimeOffset instant)
    {
        var local = TimeZoneInfo.ConvertTime(instant, GetTimeZone());
        return new VoteMonth(local.Year, local.Month);
    }

    public static bool TryParse(string? value, out VoteMonth voteMonth)
    {
        voteMonth = default;
        if (string.IsNullOrWhiteSpace(value) || !MonthPattern().IsMatch(value)) return false;
        if (!int.TryParse(value.AsSpan(0, 4), CultureInfo.InvariantCulture, out var year) ||
            !int.TryParse(value.AsSpan(5, 2), CultureInfo.InvariantCulture, out var month) ||
            year is < 1 or > 9998 || month is < 1 or > 12)
            return false;
        voteMonth = new VoteMonth(year, month);
        return true;
    }

    public override string ToString() => Value;

    private static TimeZoneInfo GetTimeZone() => TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);

    [GeneratedRegex("^[0-9]{4}-(0[1-9]|1[0-2])$", RegexOptions.CultureInvariant)]
    private static partial Regex MonthPattern();
}
