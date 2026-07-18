namespace OpmWiki.Domain.Entities;

public sealed class MasteryTier
{
    public string Category { get; set; } = string.Empty;
    public int Tier { get; set; }
    public int Atk { get; set; }
    public int Hp { get; set; }
    public string CostsJson { get; set; } = "{}";
    public string RequirementsJson { get; set; } = "[]";
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
