namespace OpmWiki.Domain.Entities;

public sealed class CharacterEffect
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CharacterId { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string TermVi { get; set; } = string.Empty;
    public string TermEn { get; set; } = string.Empty;
    public string DescriptionVi { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;

    public Character Character { get; set; } = null!;
}
