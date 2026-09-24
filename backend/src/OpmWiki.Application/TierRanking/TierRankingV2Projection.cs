namespace OpmWiki.Application.TierRanking;

public static class TierRankingV2Projection
{
    public const int SchemaVersion = 2;
    public const int EligibleCharacterCount = 160;
    public const int BaselineScoreTotal = 540;
    public const int BaselineReferenceSize = 22;

    private static readonly string[] TierOrder = ["UR+", "UR", "SSR+", "SSR", "SR", "R"];

    private static readonly IReadOnlyDictionary<string, int> ExpectedTierCounts =
        new Dictionary<string, int>(StringComparer.Ordinal)
        {
            ["UR+"] = 12,
            ["UR"] = 28,
            ["SSR+"] = 26,
            ["SSR"] = 42,
            ["SR"] = 35,
            ["R"] = 17,
        };

    public static (
        TierRankingAggregatesDto Aggregates,
        IReadOnlyList<TierRankingEntryDto> Rankings) Build(
        IEnumerable<TierRankingScoreInput> source,
        int totalVotes,
        int totalVoters)
    {
        var rows = source.ToArray();
        Validate(rows, totalVotes, totalVoters);

        var rankings = new List<TierRankingEntryDto>(rows.Length);
        foreach (var tier in TierOrder)
        {
            var ordered = rows
                .Where(row => string.Equals(row.Tier, tier, StringComparison.Ordinal))
                .OrderByDescending(row => row.BaseVotes + row.CommunityVotes)
                .ThenBy(row => row.BaseOrder)
                .ThenBy(row => row.CharacterId, StringComparer.Ordinal)
                .ToArray();
            var nonCore = ordered.Where(row => !row.IsCore).ToArray();
            var nonCorePosition = nonCore
                .Select((row, index) => (row.CharacterId, Position: index + 1))
                .ToDictionary(item => item.CharacterId, item => item.Position, StringComparer.Ordinal);
            var bandPositions = new Dictionary<string, int>(StringComparer.Ordinal);

            for (var index = 0; index < ordered.Length; index++)
            {
                var row = ordered[index];
                var band = row.IsCore
                    ? "CORE"
                    : BandFor(nonCorePosition[row.CharacterId], nonCore.Length);
                bandPositions.TryGetValue(band, out var currentBandPosition);
                var bandRank = currentBandPosition + 1;
                bandPositions[band] = bandRank;

                rankings.Add(new TierRankingEntryDto(
                    row.CharacterId,
                    row.Tier,
                    row.BaseVotes,
                    row.CommunityVotes,
                    row.BaseVotes + row.CommunityVotes,
                    row.BaseOrder,
                    row.IsCore,
                    band,
                    index + 1,
                    bandRank));
            }
        }

        var aggregates = new TierRankingAggregatesDto(
            EligibleCharacterCount,
            BaselineScoreTotal,
            BaselineReferenceSize,
            totalVotes,
            totalVoters,
            BaselineScoreTotal + totalVotes);
        return (aggregates, rankings);
    }

    private static void Validate(
        IReadOnlyCollection<TierRankingScoreInput> rows,
        int totalVotes,
        int totalVoters)
    {
        if (rows.Count != EligibleCharacterCount)
            throw new InvalidOperationException(
                $"Tier Ranking v2 requires {EligibleCharacterCount} eligible rows; found {rows.Count}.");
        if (rows.Select(row => row.CharacterId).Distinct(StringComparer.Ordinal).Count() != rows.Count)
            throw new InvalidOperationException("Tier Ranking v2 contains duplicate character IDs.");
        if (rows.Any(row => row.BaseVotes < 0 || row.CommunityVotes < 0 || row.BaseOrder < 0))
            throw new InvalidOperationException("Tier Ranking v2 contains invalid negative values.");
        if (rows.Sum(row => row.BaseVotes) != BaselineScoreTotal)
            throw new InvalidOperationException(
                $"Tier Ranking v2 baseline score must total {BaselineScoreTotal}.");
        if (rows.Sum(row => row.CommunityVotes) != totalVotes)
            throw new InvalidOperationException(
                "Tier Ranking v2 community totals do not match the legacy totalVotes field.");
        if (totalVoters < 0 || totalVoters > totalVotes)
            throw new InvalidOperationException("Tier Ranking v2 community voter total is invalid.");

        foreach (var expected in ExpectedTierCounts)
        {
            var tierRows = rows.Where(row => string.Equals(row.Tier, expected.Key, StringComparison.Ordinal)).ToArray();
            if (tierRows.Length != expected.Value)
                throw new InvalidOperationException(
                    $"Tier Ranking v2 tier {expected.Key} requires {expected.Value} rows; found {tierRows.Length}.");
            if (tierRows.Select(row => row.BaseOrder).Distinct().Count() != tierRows.Length)
                throw new InvalidOperationException(
                    $"Tier Ranking v2 tier {expected.Key} contains duplicate baseOrder values.");
        }

        if (rows.Any(row => !ExpectedTierCounts.ContainsKey(row.Tier)))
            throw new InvalidOperationException("Tier Ranking v2 contains an unsupported tier.");
    }

    private static string BandFor(int position, int count)
    {
        if (position <= Math.Ceiling(count * 0.12m)) return "SS";
        if (position <= Math.Ceiling(count * 0.30m)) return "S";
        if (position <= Math.Ceiling(count * 0.55m)) return "A";
        if (position <= Math.Ceiling(count * 0.75m)) return "B";
        if (position <= Math.Ceiling(count * 0.90m)) return "C";
        return "D";
    }
}
