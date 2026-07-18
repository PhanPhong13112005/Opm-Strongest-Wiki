namespace OpmWiki.Domain.Entities;

public sealed class Character
{
    public string Id { get; set; } = string.Empty;
    public string NameVi { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public string TypeVi { get; set; } = string.Empty;
    public string TypeEn { get; set; } = string.Empty;
    public string FactionVi { get; set; } = string.Empty;
    public string FactionEn { get; set; } = string.Empty;
    public string[] RolesVi { get; set; } = [];
    public string[] RolesEn { get; set; } = [];
    public string DuyenVi { get; set; } = string.Empty;
    public string DuyenEn { get; set; } = string.Empty;
    public string BioVi { get; set; } = string.Empty;
    public string BioEn { get; set; } = string.Empty;
    public string? KeepsakeIcon { get; set; }
    public string[] TraitsVi { get; set; } = [];
    public string[] TraitsEn { get; set; } = [];
    public string BondListVi { get; set; } = string.Empty;
    public string BondListEn { get; set; } = string.Empty;
    public string ClassLevel { get; set; } = string.Empty;
    public DateOnly? ReleaseSea { get; set; }
    public DateOnly? ReleaseChina { get; set; }
    public CharacterStats BaseStats { get; set; } = new();
    public CharacterStats PvpStats { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<CharacterSkill> Skills { get; set; } = [];
    public ICollection<CharacterEffect> Effects { get; set; } = [];
}

public sealed class CharacterStats
{
    public int Atk { get; set; }
    public int Hp { get; set; }
    public int Def { get; set; }
    public int Spd { get; set; }
}
