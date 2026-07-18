namespace OpmWiki.Domain.Entities;

public sealed class CharacterSkill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CharacterId { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string NameVi { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string DescriptionVi { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string TypeVi { get; set; } = string.Empty;
    public string TypeEn { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public string? AnimationUrl { get; set; }
    public string? KeepsakeIconUrl { get; set; }

    public Character Character { get; set; } = null!;
}
