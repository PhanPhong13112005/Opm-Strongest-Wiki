import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/features/wiki/data/models/tier_ranking_dto.dart';

void main() {
  group('TierRankingDto', () {
    test('deserializes sanitized tier rankings fixture correctly', () {
      final file = File('test/fixtures/api/tier_rankings_shape.json');
      final json = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;

      final dto = TierRankingResponseDto.fromJson(json);

      expect(dto.voteMonth, '2026-09');
      expect(dto.resetsAt, 'SANITIZED_VOLATILE_TIMESTAMP');
      expect(dto.totalVotes, 0);
      expect(dto.totalVoters, 0);
      expect(dto.votes, isEmpty);
    });

    test('deserializes active tier rankings payload with votes', () {
      final json = {
        'voteMonth': '2026-10',
        'resetsAt': '2026-11-01T00:00:00.000Z',
        'totalVotes': 150,
        'totalVoters': 42,
        'votes': [
          {'characterId': '100316-urplus', 'votes': 80},
          {'characterId': '100312-urplus', 'votes': 70},
        ],
      };

      final dto = TierRankingResponseDto.fromJson(json);

      expect(dto.voteMonth, '2026-10');
      expect(dto.resetsAt, '2026-11-01T00:00:00.000Z');
      expect(dto.totalVotes, 150);
      expect(dto.totalVoters, 42);
      expect(dto.votes, hasLength(2));
      expect(dto.votes[0].characterId, '100316-urplus');
      expect(dto.votes[0].votes, 80);
      expect(dto.votes[1].characterId, '100312-urplus');
      expect(dto.votes[1].votes, 70);
    });

    test('handles missing or malformed fields safely with fallbacks', () {
      final json = <String, dynamic>{
        'votes': [
          {'characterId': null, 'votes': 'not-a-number'},
          'invalid-item',
        ],
      };

      final dto = TierRankingResponseDto.fromJson(json);

      expect(dto.voteMonth, '');
      expect(dto.resetsAt, '');
      expect(dto.totalVotes, 0);
      expect(dto.totalVoters, 0);
      expect(dto.votes, hasLength(1));
      expect(dto.votes[0].characterId, '');
      expect(dto.votes[0].votes, 0);
    });

    test('toJson serializes TierRankingVoteDto correctly', () {
      const vote = TierRankingVoteDto(characterId: 'char-1', votes: 25);
      expect(vote.toJson(), {'characterId': 'char-1', 'votes': 25});
    });

    test('legacy DTO remains compatible with additive v2 response', () {
      final file = File('test/fixtures/api/tier_rankings_v2_parity.json');
      final json = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;

      final dto = TierRankingResponseDto.fromJson(json);

      expect(json['schemaVersion'], 2);
      expect(dto.schemaVersion, 2);
      expect(dto.voteMonth, '2026-09');
      expect(dto.resetsAt, '2026-10-01T00:00:00.000Z');
      expect(dto.totalVotes, 12);
      expect(dto.totalVoters, 2);
      expect(dto.votes, hasLength(4));
      expect(dto.votes.fold<int>(0, (sum, vote) => sum + vote.votes), 12);
      expect(dto.aggregates?.eligibleCharacterCount, 160);
      expect(dto.aggregates?.baselineScoreTotal, 540);
      expect(dto.rankings, hasLength(160));
      expect(dto.rankings.first.characterId, 'blacksperm-urplus');
      expect(dto.rankings.first.totalScore, 11);
      expect(dto.rankings.first.band, 'SS');
    });
  });
}
