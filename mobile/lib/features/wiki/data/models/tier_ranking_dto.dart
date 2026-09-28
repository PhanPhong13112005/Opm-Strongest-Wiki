int _intFrom(Object? value) {
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

class TierRankingVoteDto {
  const TierRankingVoteDto({required this.characterId, required this.votes});
  final String characterId;
  final int votes;

  factory TierRankingVoteDto.fromJson(Map<String, dynamic> json) =>
      TierRankingVoteDto(
        characterId: json['characterId']?.toString() ?? '',
        votes: _intFrom(json['votes']),
      );

  Map<String, dynamic> toJson() => {'characterId': characterId, 'votes': votes};
}

class TierRankingAggregatesDto {
  const TierRankingAggregatesDto({
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

  factory TierRankingAggregatesDto.fromJson(Map<String, dynamic> json) =>
      TierRankingAggregatesDto(
        eligibleCharacterCount: _intFrom(json['eligibleCharacterCount']),
        baselineScoreTotal: _intFrom(json['baselineScoreTotal']),
        baselineReferenceSize: _intFrom(json['baselineReferenceSize']),
        communityVoteTotal: _intFrom(json['communityVoteTotal']),
        communityVoterCount: _intFrom(json['communityVoterCount']),
        combinedScoreTotal: _intFrom(json['combinedScoreTotal']),
      );
}

class TierRankingEntryDto {
  const TierRankingEntryDto({
    required this.characterId,
    required this.tier,
    required this.baseVotes,
    required this.communityVotes,
    required this.totalScore,
    required this.baseOrder,
    required this.isCore,
    required this.band,
    required this.rank,
    required this.bandRank,
  });
  final String characterId;
  final String tier;
  final int baseVotes;
  final int communityVotes;
  final int totalScore;
  final int baseOrder;
  final bool isCore;
  final String band;
  final int rank;
  final int bandRank;

  factory TierRankingEntryDto.fromJson(Map<String, dynamic> json) =>
      TierRankingEntryDto(
        characterId: json['characterId']?.toString() ?? '',
        tier: json['tier']?.toString() ?? '',
        baseVotes: _intFrom(json['baseVotes']),
        communityVotes: _intFrom(json['communityVotes']),
        totalScore: _intFrom(json['totalScore']),
        baseOrder: _intFrom(json['baseOrder']),
        isCore: json['isCore'] == true,
        band: json['band']?.toString() ?? '',
        rank: _intFrom(json['rank']),
        bandRank: _intFrom(json['bandRank']),
      );
}

class TierRankingResponseDto {
  const TierRankingResponseDto({
    required this.voteMonth,
    required this.resetsAt,
    required this.totalVotes,
    required this.totalVoters,
    required this.votes,
    this.schemaVersion = 1,
    this.aggregates,
    this.rankings = const [],
  });
  final int schemaVersion;
  final String voteMonth;
  final String resetsAt;
  final int totalVotes;
  final int totalVoters;
  final List<TierRankingVoteDto> votes;
  final TierRankingAggregatesDto? aggregates;
  final List<TierRankingEntryDto> rankings;

  factory TierRankingResponseDto.fromJson(Map<String, dynamic> json) {
    final votes = <TierRankingVoteDto>[];
    if (json['votes'] case final List<dynamic> rawVotes) {
      for (final item in rawVotes.whereType<Map>()) {
        votes.add(TierRankingVoteDto.fromJson(item.cast<String, dynamic>()));
      }
    }
    TierRankingAggregatesDto? aggregates;
    if (json['aggregates'] case final Map<dynamic, dynamic> rawAggregates) {
      aggregates = TierRankingAggregatesDto.fromJson(
        rawAggregates.cast<String, dynamic>(),
      );
    }
    final rankings = <TierRankingEntryDto>[];
    if (json['rankings'] case final List<dynamic> rawRankings) {
      for (final item in rawRankings.whereType<Map>()) {
        rankings.add(
          TierRankingEntryDto.fromJson(item.cast<String, dynamic>()),
        );
      }
    }
    final parsedSchemaVersion = _intFrom(json['schemaVersion']);
    return TierRankingResponseDto(
      schemaVersion: parsedSchemaVersion < 1 ? 1 : parsedSchemaVersion,
      voteMonth: json['voteMonth']?.toString() ?? '',
      resetsAt: json['resetsAt']?.toString() ?? '',
      totalVotes: _intFrom(json['totalVotes']),
      totalVoters: _intFrom(json['totalVoters']),
      votes: List.unmodifiable(votes),
      aggregates: aggregates,
      rankings: List.unmodifiable(rankings),
    );
  }
}
