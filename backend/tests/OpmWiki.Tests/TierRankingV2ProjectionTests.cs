using System.Text.Json;
using OpmWiki.Application.TierRanking;

namespace OpmWiki.Tests;

public sealed class TierRankingV2ProjectionTests
{
    [Fact]
    public void Build_ReproducesApproved160RowFixture()
    {
        using var document = LoadFixture();
        var root = document.RootElement;
        var expectedRows = root.GetProperty("rankings").EnumerateArray().ToArray();
        var inputs = expectedRows.Select(ReadInput).ToArray();

        var result = TierRankingV2Projection.Build(
            inputs,
            root.GetProperty("totalVotes").GetInt32(),
            root.GetProperty("totalVoters").GetInt32());

        Assert.Equal(160, result.Rankings.Count);
        Assert.Equal(540, result.Aggregates.BaselineScoreTotal);
        Assert.Equal(12, result.Aggregates.CommunityVoteTotal);
        Assert.Equal(552, result.Aggregates.CombinedScoreTotal);
        for (var index = 0; index < expectedRows.Length; index++)
        {
            var expected = expectedRows[index];
            var actual = result.Rankings[index];
            Assert.Equal(expected.GetProperty("characterId").GetString(), actual.CharacterId);
            Assert.Equal(expected.GetProperty("tier").GetString(), actual.Tier);
            Assert.Equal(expected.GetProperty("totalScore").GetInt32(), actual.TotalScore);
            Assert.Equal(expected.GetProperty("band").GetString(), actual.Band);
            Assert.Equal(expected.GetProperty("rank").GetInt32(), actual.Rank);
            Assert.Equal(expected.GetProperty("bandRank").GetInt32(), actual.BandRank);
        }
    }

    [Fact]
    public void Build_FailsClosedWhenBaselineIsIncompleteOrTotalsDrift()
    {
        using var document = LoadFixture();
        var inputs = document.RootElement.GetProperty("rankings")
            .EnumerateArray().Select(ReadInput).ToArray();

        Assert.Throws<InvalidOperationException>(() =>
            TierRankingV2Projection.Build(inputs[..^1], 12, 2));
        Assert.Throws<InvalidOperationException>(() =>
            TierRankingV2Projection.Build(inputs, 13, 2));
    }

    [Fact]
    public void PublicDto_SerializesV2AdditivelyWhileLegacyConstructionStaysExact()
    {
        using var document = LoadFixture();
        var root = document.RootElement;
        var productionLikeInputs = root.GetProperty("rankings").EnumerateArray()
            .Select(ReadInput)
            .Select(row => row.CharacterId == "homeless-emperor-urplus"
                ? row with { CommunityVotes = 1 }
                : row)
            .ToArray();
        var projection = TierRankingV2Projection.Build(
            productionLikeInputs, 10, 2);
        var dto = new TierRankingPublicDto(
            "2026-09", DateTimeOffset.Parse("2026-09-30T17:00:00Z"), 10, 2,
            [new("homeless-emperor-urplus", 1)])
        {
            SchemaVersion = 2,
            Aggregates = projection.Aggregates,
            Rankings = projection.Rankings,
        };
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);

        var v2 = JsonSerializer.SerializeToElement(dto, options);
        Assert.Equal(2, v2.GetProperty("schemaVersion").GetInt32());
        Assert.Equal(160, v2.GetProperty("rankings").GetArrayLength());
        Assert.Equal(1, v2.GetProperty("votes")[0].GetProperty("votes").GetInt32());
        Assert.Equal(1, v2.GetProperty("rankings").EnumerateArray()
            .Single(row => row.GetProperty("characterId").GetString() == "homeless-emperor-urplus")
            .GetProperty("communityVotes").GetInt32());

        var legacy = JsonSerializer.SerializeToElement(
            new TierRankingPublicDto("2026-09", dto.ResetsAt, 1, 1, dto.Votes), options);
        Assert.False(legacy.TryGetProperty("schemaVersion", out _));
        Assert.False(legacy.TryGetProperty("aggregates", out _));
        Assert.False(legacy.TryGetProperty("rankings", out _));
    }

    private static JsonDocument LoadFixture() => JsonDocument.Parse(
        File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", "tier_rankings_v2_parity.json")));

    private static TierRankingScoreInput ReadInput(JsonElement row) => new(
        row.GetProperty("characterId").GetString()!,
        row.GetProperty("tier").GetString()!,
        row.GetProperty("baseVotes").GetInt32(),
        row.GetProperty("communityVotes").GetInt32(),
        row.GetProperty("baseOrder").GetInt32(),
        row.GetProperty("isCore").GetBoolean());
}
