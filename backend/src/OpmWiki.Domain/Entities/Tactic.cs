namespace OpmWiki.Domain.Entities;

public sealed class TacticCard
{
    public string Id { get; set; } = string.Empty;
    public string NameVi { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public int Count { get; set; }
    public string EffectVi { get; set; } = string.Empty;
    public string EffectEn { get; set; } = string.Empty;
    public string ScalingJson { get; set; } = "{}";
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class TacticFrame
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public int Hp { get; set; }
    public int Def { get; set; }
    public string ColorClass { get; set; } = string.Empty;
    public string BorderClass { get; set; } = string.Empty;
    public string BackgroundClass { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
