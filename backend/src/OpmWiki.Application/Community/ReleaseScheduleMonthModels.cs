using System.Globalization;

namespace OpmWiki.Application.Community;

// Opt-in projection only. The legacy DTO retains its DateOnly date and exact fields.
public sealed record ReleaseScheduleMonthAwareDto(
    long Id,
    string Server,
    string Date,
    string CharacterId,
    string BannerImage,
    bool IsReturn,
    string OverrideName,
    string OverrideTier,
    string OverrideFaction,
    string OverrideType,
    string OverrideRole,
    string OverrideNameVi,
    string OverrideNameEn,
    string OverrideFactionVi,
    string OverrideFactionEn,
    string OverrideTypeVi,
    string OverrideTypeEn,
    string OverrideRoleVi,
    string OverrideRoleEn,
    int SortOrder,
    string DatePrecision);

public sealed record ReleaseScheduleMonthWriteRequest(
    string Server,
    string Date,
    string CharacterId,
    string BannerImage,
    bool IsReturn,
    string OverrideNameVi,
    string OverrideNameEn,
    string OverrideTier,
    string OverrideFactionVi,
    string OverrideFactionEn,
    string OverrideTypeVi,
    string OverrideTypeEn,
    string OverrideRoleVi,
    string OverrideRoleEn,
    int SortOrder);

public static class ReleaseScheduleMonth
{
    public static bool IsValid(string? value) =>
        value is { Length: 7 } &&
        DateOnly.TryParseExact(value + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture,
            DateTimeStyles.None, out _);
}
