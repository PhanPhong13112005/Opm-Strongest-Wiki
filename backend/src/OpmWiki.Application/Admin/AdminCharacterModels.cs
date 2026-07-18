namespace OpmWiki.Application.Admin;

public sealed record AdminCharacterQuery(
    string? Search = null,
    int Page = 1,
    int PageSize = 20);

public sealed record AdminCharacterStatsDto(int Atk, int Hp, int Def, int Spd);

public sealed record AdminCharacterDto(
    string Id,
    string NameVi,
    string NameEn,
    string ImageUrl,
    string Tier,
    string TypeVi,
    string TypeEn,
    string FactionVi,
    string FactionEn,
    IReadOnlyList<string> RolesVi,
    IReadOnlyList<string> RolesEn,
    string DuyenVi,
    string DuyenEn,
    string BioVi,
    string BioEn,
    string? KeepsakeIcon,
    IReadOnlyList<string> TraitsVi,
    IReadOnlyList<string> TraitsEn,
    string BondListVi,
    string BondListEn,
    string ClassLevel,
    DateOnly? ReleaseSea,
    DateOnly? ReleaseChina,
    AdminCharacterStatsDto BaseStats,
    AdminCharacterStatsDto PvpStats,
    DateTimeOffset UpdatedAt);

public sealed class AdminCharacterWriteRequest
{
    public string Id { get; init; } = string.Empty;
    public string NameVi { get; init; } = string.Empty;
    public string NameEn { get; init; } = string.Empty;
    public string ImageUrl { get; init; } = string.Empty;
    public string Tier { get; init; } = string.Empty;
    public string TypeVi { get; init; } = string.Empty;
    public string TypeEn { get; init; } = string.Empty;
    public string FactionVi { get; init; } = string.Empty;
    public string FactionEn { get; init; } = string.Empty;
    public string[] RolesVi { get; init; } = [];
    public string[] RolesEn { get; init; } = [];
    public string DuyenVi { get; init; } = string.Empty;
    public string DuyenEn { get; init; } = string.Empty;
    public string BioVi { get; init; } = string.Empty;
    public string BioEn { get; init; } = string.Empty;
    public string? KeepsakeIcon { get; init; }
    public string[] TraitsVi { get; init; } = [];
    public string[] TraitsEn { get; init; } = [];
    public string BondListVi { get; init; } = string.Empty;
    public string BondListEn { get; init; } = string.Empty;
    public string ClassLevel { get; init; } = string.Empty;
    public DateOnly? ReleaseSea { get; init; }
    public DateOnly? ReleaseChina { get; init; }
    public AdminCharacterStatsDto BaseStats { get; init; } = new(0, 0, 0, 0);
    public AdminCharacterStatsDto PvpStats { get; init; } = new(0, 0, 0, 0);
}

public sealed record AdminKeepsakeWriteRequest(string? IconUrl);
