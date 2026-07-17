using System.Text.Json;

namespace OpmWiki.Application.Mastery;

public sealed record MasteryStatsDto(int Atk, int Hp);

public sealed record MasteryTierDto(
    int Tier,
    MasteryStatsDto Stats,
    JsonElement Costs,
    JsonElement Requirements);

public sealed record MasteryConfigDto(
    int Version,
    IReadOnlyDictionary<string, IReadOnlyList<MasteryTierDto>> Categories);
