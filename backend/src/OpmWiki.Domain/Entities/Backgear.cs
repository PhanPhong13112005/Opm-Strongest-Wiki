namespace OpmWiki.Domain.Entities;

public sealed class Backgear
{
    public string Id { get; set; } = string.Empty;
    public string NameVi { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public string RarityVi { get; set; } = string.Empty;
    public string RarityEn { get; set; } = string.Empty;
    public string AcquireVi { get; set; } = string.Empty;
    public string AcquireEn { get; set; } = string.Empty;
    public int LevelMax { get; set; }
    public string IconUrl { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string SeniorIconUrl { get; set; } = string.Empty;
    public int? ChangeLevel { get; set; }
    public string LevelsJson { get; set; } = "[]";
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class BackgearSet
{
    public string Id { get; set; } = string.Empty;
    public string NameVi { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string RarityVi { get; set; } = string.Empty;
    public string RarityEn { get; set; } = string.Empty;
    public string RewardVi { get; set; } = string.Empty;
    public string RewardEn { get; set; } = string.Empty;
    public string RewardIconUrl { get; set; } = string.Empty;
    public string NeedsJson { get; set; } = "[]";
    public string LevelsJson { get; set; } = "[]";
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
