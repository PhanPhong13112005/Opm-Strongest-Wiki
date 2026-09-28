import 'package:flutter/foundation.dart';

@immutable
class TierRankingVoteItem {
  const TierRankingVoteItem({
    required this.characterId,
    required this.votes,
    required this.rank,
    this.baseVotes = 0,
    this.totalScore = 0,
    this.baseOrder = 0,
    this.isCore = false,
    this.band,
    this.bandRank,
    this.characterName,
    this.characterAvatarUrl,
    this.characterTier,
    this.characterFaction,
    this.characterType,
  });

  final String characterId;
  final int votes;
  final int rank;
  final int baseVotes;
  final int totalScore;
  final int baseOrder;
  final bool isCore;
  final String? band;
  final int? bandRank;
  final String? characterName;
  final Uri? characterAvatarUrl;
  final String? characterTier;
  final String? characterFaction;
  final String? characterType;

  String get displayName =>
      characterName?.isNotEmpty == true ? characterName! : characterId;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TierRankingVoteItem &&
          runtimeType == other.runtimeType &&
          characterId == other.characterId &&
          votes == other.votes &&
          rank == other.rank &&
          baseVotes == other.baseVotes &&
          totalScore == other.totalScore &&
          baseOrder == other.baseOrder &&
          isCore == other.isCore &&
          band == other.band &&
          bandRank == other.bandRank &&
          characterName == other.characterName &&
          characterAvatarUrl == other.characterAvatarUrl &&
          characterTier == other.characterTier &&
          characterFaction == other.characterFaction &&
          characterType == other.characterType;

  @override
  int get hashCode => Object.hash(
    characterId,
    votes,
    rank,
    baseVotes,
    totalScore,
    baseOrder,
    isCore,
    band,
    bandRank,
    characterName,
    characterAvatarUrl,
    characterTier,
    characterFaction,
    characterType,
  );
}

@immutable
class TierRankings {
  const TierRankings({
    required this.voteMonth,
    required this.resetsAt,
    required this.totalVotes,
    required this.totalVoters,
    required this.items,
    this.schemaVersion = 1,
    this.aggregates,
  });

  final String voteMonth;
  final DateTime? resetsAt;
  final int totalVotes;
  final int totalVoters;
  final List<TierRankingVoteItem> items;
  final int schemaVersion;
  final TierRankingAggregates? aggregates;

  bool get isEmpty => items.isEmpty;

  List<TierRankingVoteItem> filterByTier(String? tier) {
    if (tier == null || tier.isEmpty) {
      return items;
    }
    return items.where((item) => item.characterTier == tier).toList();
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TierRankings &&
          runtimeType == other.runtimeType &&
          voteMonth == other.voteMonth &&
          resetsAt == other.resetsAt &&
          totalVotes == other.totalVotes &&
          totalVoters == other.totalVoters &&
          schemaVersion == other.schemaVersion &&
          aggregates == other.aggregates &&
          listEquals(items, other.items);

  @override
  int get hashCode => Object.hash(
    voteMonth,
    resetsAt,
    totalVotes,
    totalVoters,
    schemaVersion,
    aggregates,
    Object.hashAll(items),
  );
}

@immutable
class TierRankingAggregates {
  const TierRankingAggregates({
    required this.eligibleCharacterCount,
    required this.baselineScoreTotal,
    required this.baselineReferenceSize,
    required this.communityVoteTotal,
    required this.communityVoterCount,
    required this.combinedScoreTotal,
  });

  final int eligibleCharacterCount;
  final int baselineScoreTotal;
  final int baselineReferenceSize;
  final int communityVoteTotal;
  final int communityVoterCount;
  final int combinedScoreTotal;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TierRankingAggregates &&
          eligibleCharacterCount == other.eligibleCharacterCount &&
          baselineScoreTotal == other.baselineScoreTotal &&
          baselineReferenceSize == other.baselineReferenceSize &&
          communityVoteTotal == other.communityVoteTotal &&
          communityVoterCount == other.communityVoterCount &&
          combinedScoreTotal == other.combinedScoreTotal;

  @override
  int get hashCode => Object.hash(
    eligibleCharacterCount,
    baselineScoreTotal,
    baselineReferenceSize,
    communityVoteTotal,
    communityVoterCount,
    combinedScoreTotal,
  );
}
