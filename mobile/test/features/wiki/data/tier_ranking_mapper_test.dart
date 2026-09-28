import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/features/wiki/data/mappers/tier_ranking_mapper.dart';
import 'package:opmwiki_mobile/features/wiki/data/models/tier_ranking_dto.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_summary.dart';

void main() {
  group('TierRankingMapper', () {
    const mapper = TierRankingMapper();

    test('sorts votes descending and assigns ranks correctly', () {
      const dto = TierRankingResponseDto(
        voteMonth: '2026-09',
        resetsAt: '2026-10-01T00:00:00.000Z',
        totalVotes: 100,
        totalVoters: 25,
        votes: [
          TierRankingVoteDto(characterId: 'char-c', votes: 15),
          TierRankingVoteDto(characterId: 'char-a', votes: 50),
          TierRankingVoteDto(characterId: 'char-b', votes: 35),
        ],
      );

      final domain = mapper.toDomain(dto);

      expect(domain.voteMonth, '2026-09');
      expect(domain.resetsAt, DateTime.utc(2026, 10, 1));
      expect(domain.totalVotes, 100);
      expect(domain.totalVoters, 25);
      expect(domain.items, hasLength(3));

      expect(domain.items[0].characterId, 'char-a');
      expect(domain.items[0].votes, 50);
      expect(domain.items[0].rank, 1);

      expect(domain.items[1].characterId, 'char-b');
      expect(domain.items[1].votes, 35);
      expect(domain.items[1].rank, 2);

      expect(domain.items[2].characterId, 'char-c');
      expect(domain.items[2].votes, 15);
      expect(domain.items[2].rank, 3);
    });

    test('breaks ties deterministically using characterId', () {
      const dto = TierRankingResponseDto(
        voteMonth: '2026-09',
        resetsAt: '',
        totalVotes: 40,
        totalVoters: 10,
        votes: [
          TierRankingVoteDto(characterId: 'char-z', votes: 20),
          TierRankingVoteDto(characterId: 'char-a', votes: 20),
        ],
      );

      final domain = mapper.toDomain(dto);

      expect(domain.items[0].characterId, 'char-a');
      expect(domain.items[0].rank, 1);
      expect(domain.items[1].characterId, 'char-z');
      expect(domain.items[1].rank, 2);
    });

    test('enriches character metadata when characterMap contains the ID', () {
      const dto = TierRankingResponseDto(
        voteMonth: '2026-09',
        resetsAt: '2026-10-01T00:00:00.000Z',
        totalVotes: 30,
        totalVoters: 5,
        votes: [TierRankingVoteDto(characterId: '100316-urplus', votes: 30)],
      );

      final characterMap = <String, CharacterSummary>{
        '100316-urplus': CharacterSummary(
          id: '100316-urplus',
          name: 'Overgrown Rover',
          tier: 'UR+',
          type: 'Tâm Linh',
          faction: 'Quái Nhân',
          imageUrl: Uri.parse('https://opmwiki.app/rover.png'),
        ),
      };

      final domain = mapper.toDomain(dto, characterMap: characterMap);

      expect(domain.items.first.characterName, 'Overgrown Rover');
      expect(domain.items.first.characterTier, 'UR+');
      expect(domain.items.first.characterType, 'Tâm Linh');
      expect(domain.items.first.characterFaction, 'Quái Nhân');
      expect(
        domain.items.first.characterAvatarUrl,
        Uri.parse('https://opmwiki.app/rover.png'),
      );
      expect(domain.items.first.displayName, 'Overgrown Rover');
    });

    test('handles missing metadata gracefully with fallback values', () {
      const dto = TierRankingResponseDto(
        voteMonth: '2026-09',
        resetsAt: 'SANITIZED_VOLATILE_TIMESTAMP',
        totalVotes: 0,
        totalVoters: 0,
        votes: [TierRankingVoteDto(characterId: 'unknown-hero', votes: 5)],
      );

      final domain = mapper.toDomain(dto, characterMap: null);

      expect(domain.resetsAt, isNull);
      expect(domain.items.first.characterName, isNull);
      expect(domain.items.first.characterTier, isNull);
      expect(domain.items.first.characterAvatarUrl, isNull);
      expect(domain.items.first.displayName, 'unknown-hero');
    });

    test('filterByTier filters items by character tier', () {
      const dto = TierRankingResponseDto(
        voteMonth: '2026-09',
        resetsAt: '',
        totalVotes: 40,
        totalVoters: 10,
        votes: [
          TierRankingVoteDto(characterId: 'hero-ur', votes: 25),
          TierRankingVoteDto(characterId: 'hero-ssr', votes: 15),
        ],
      );

      final characterMap = <String, CharacterSummary>{
        'hero-ur': const CharacterSummary(
          id: 'hero-ur',
          name: 'Hero UR',
          tier: 'UR+',
          type: 'Grappler',
          faction: 'Hero',
        ),
        'hero-ssr': const CharacterSummary(
          id: 'hero-ssr',
          name: 'Hero SSR',
          tier: 'SSR',
          type: 'Duelist',
          faction: 'Hero',
        ),
      };

      final domain = mapper.toDomain(dto, characterMap: characterMap);

      expect(domain.filterByTier(null), hasLength(2));
      expect(domain.filterByTier('UR+'), hasLength(1));
      expect(domain.filterByTier('UR+').first.characterId, 'hero-ur');
      expect(domain.filterByTier('SSR'), hasLength(1));
      expect(domain.filterByTier('SSR').first.characterId, 'hero-ssr');
      expect(domain.filterByTier('SR'), isEmpty);
    });

    test('uses dense v2 rankings including zero-vote characters', () {
      final json =
          jsonDecode(
                File(
                  'test/fixtures/api/tier_rankings_v2_parity.json',
                ).readAsStringSync(),
              )
              as Map<String, dynamic>;
      final dto = TierRankingResponseDto.fromJson(json);

      final domain = mapper.toDomain(dto);

      expect(domain.schemaVersion, 2);
      expect(domain.items, hasLength(160));
      expect(domain.aggregates?.baselineScoreTotal, 540);
      final zeroVote = domain.items.firstWhere(
        (item) => item.characterId == '100315-urplus',
      );
      expect(zeroVote.votes, 0);
      expect(zeroVote.baseVotes, 8);
      expect(zeroVote.totalScore, 8);
      expect(zeroVote.rank, 3);
      expect(zeroVote.band, 'S');
      expect(zeroVote.characterTier, 'UR+');
    });

    test('rejects incomplete v2 instead of silently using sparse votes', () {
      const dto = TierRankingResponseDto(
        schemaVersion: 2,
        voteMonth: '2026-09',
        resetsAt: '',
        totalVotes: 1,
        totalVoters: 1,
        votes: [TierRankingVoteDto(characterId: 'char-1', votes: 1)],
      );

      expect(() => mapper.toDomain(dto), throwsFormatException);
    });
  });
}
