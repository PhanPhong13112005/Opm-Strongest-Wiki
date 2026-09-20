namespace OpmWiki.Domain.Entities;

// These entities define the EF-owned Phase 3 model without being added to the
// historical OpmWikiDbContext model in Phase 2. That keeps ten-migration
// databases readable until the additive migration is reviewed and applied.
public sealed class TierRankingVote
{
    public Guid UserId { get; set; }
    public string CharacterId { get; set; } = string.Empty;
    public string VoteMonth { get; set; } = string.Empty;
    public string Rarity { get; set; } = string.Empty;
    public int VoteSlot { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class TierRankingBaseline
{
    public string CharacterId { get; set; } = string.Empty;
    public int BaseVotes { get; set; }
    public bool IsCore { get; set; }
    public int BaseOrder { get; set; }
    public long Version { get; set; } = 1;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string UpdatedBySubject { get; set; } = string.Empty;
}
