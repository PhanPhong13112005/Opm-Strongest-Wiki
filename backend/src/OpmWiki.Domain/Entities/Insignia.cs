namespace OpmWiki.Domain.Entities;

public sealed class Insignia
{
    public string Id { get; set; } = string.Empty;
    public string ClassLevel { get; set; } = string.Empty;
    public string NameVi { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<InsigniaGuideLink> GuideLinks { get; set; } = [];
}

public sealed class InsigniaGuide
{
    public string Id { get; set; } = string.Empty;
    public string TitleVi { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string DescriptionVi { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string[] ImageUrls { get; set; } = [];
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<InsigniaGuideLink> InsigniaLinks { get; set; } = [];
}

public sealed class InsigniaGuideLink
{
    public string InsigniaId { get; set; } = string.Empty;
    public Insignia Insignia { get; set; } = null!;
    public string GuideId { get; set; } = string.Empty;
    public InsigniaGuide Guide { get; set; } = null!;
    public int SortOrder { get; set; }
}
