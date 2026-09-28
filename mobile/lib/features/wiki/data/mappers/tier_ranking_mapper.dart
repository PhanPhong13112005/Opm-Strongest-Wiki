import '../../domain/models/character_summary.dart';
import '../../domain/models/tier_ranking.dart';
import '../models/tier_ranking_dto.dart';

class TierRankingMapper {
  const TierRankingMapper();

  TierRankings toDomain(
    TierRankingResponseDto dto, {
    Map<String, CharacterSummary>? characterMap,
  }) => dto.schemaVersion >= 2
      ? _mapV2(dto, characterMap)
      : _mapLegacy(dto, characterMap);

  TierRankings _mapV2(
    TierRankingResponseDto dto,
    Map<String, CharacterSummary>? characterMap,
  ) {
    final aggregates = dto.aggregates;
    if (aggregates == null || dto.rankings.isEmpty) {
      throw const FormatException('Tier Ranking v2 payload is incomplete.');
    }
    final ids = dto.rankings.map((row) => row.characterId).toSet();
    if (ids.length != dto.rankings.length ||
        aggregates.eligibleCharacterCount != 160 ||
        aggregates.eligibleCharacterCount != dto.rankings.length ||
        aggregates.baselineScoreTotal != 540 ||
        aggregates.communityVoteTotal != dto.totalVotes ||
        aggregates.communityVoterCount != dto.totalVoters ||
        aggregates.combinedScoreTotal !=
            aggregates.baselineScoreTotal + dto.totalVotes) {
      throw const FormatException('Tier Ranking v2 payload invariants failed.');
    }

    final items = dto.rankings
        .map((row) {
          if (row.characterId.isEmpty ||
              row.tier.isEmpty ||
              row.rank < 1 ||
              row.bandRank < 1 ||
              row.totalScore != row.baseVotes + row.communityVotes) {
            throw const FormatException('Tier Ranking v2 row is invalid.');
          }
          final character = characterMap?[row.characterId];
          return TierRankingVoteItem(
            characterId: row.characterId,
            votes: row.communityVotes,
            rank: row.rank,
            baseVotes: row.baseVotes,
            totalScore: row.totalScore,
            baseOrder: row.baseOrder,
            isCore: row.isCore,
            band: row.band,
            bandRank: row.bandRank,
            characterName: character?.name,
            characterAvatarUrl: character?.imageUrl,
            characterTier: character?.tier ?? row.tier,
            characterFaction: character?.faction,
            characterType: character?.type,
          );
        })
        .toList(growable: false);

    return TierRankings(
      schemaVersion: dto.schemaVersion,
      voteMonth: dto.voteMonth,
      resetsAt: DateTime.tryParse(dto.resetsAt),
      totalVotes: dto.totalVotes,
      totalVoters: dto.totalVoters,
      aggregates: TierRankingAggregates(
        eligibleCharacterCount: aggregates.eligibleCharacterCount,
        baselineScoreTotal: aggregates.baselineScoreTotal,
        baselineReferenceSize: aggregates.baselineReferenceSize,
        communityVoteTotal: aggregates.communityVoteTotal,
        communityVoterCount: aggregates.communityVoterCount,
        combinedScoreTotal: aggregates.combinedScoreTotal,
      ),
      items: List.unmodifiable(items),
    );
  }

  TierRankings _mapLegacy(
    TierRankingResponseDto dto,
    Map<String, CharacterSummary>? characterMap,
  ) {
    final sorted = List<TierRankingVoteDto>.from(dto.votes)
      ..sort((a, b) {
        final votes = b.votes.compareTo(a.votes);
        return votes != 0 ? votes : a.characterId.compareTo(b.characterId);
      });
    final items = <TierRankingVoteItem>[];
    for (var index = 0; index < sorted.length; index++) {
      final vote = sorted[index];
      final character = characterMap?[vote.characterId];
      items.add(
        TierRankingVoteItem(
          characterId: vote.characterId,
          votes: vote.votes,
          rank: index + 1,
          totalScore: vote.votes,
          characterName: character?.name,
          characterAvatarUrl: character?.imageUrl,
          characterTier: character?.tier,
          characterFaction: character?.faction,
          characterType: character?.type,
        ),
      );
    }
    return TierRankings(
      voteMonth: dto.voteMonth,
      resetsAt: DateTime.tryParse(dto.resetsAt),
      totalVotes: dto.totalVotes,
      totalVoters: dto.totalVoters,
      items: List.unmodifiable(items),
    );
  }
}
