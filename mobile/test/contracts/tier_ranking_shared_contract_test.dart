import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

const _tiers = <String>['UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R'];
const _powerBands = <String>['SS', 'S', 'A', 'B', 'C', 'D'];
const _cutoffRatios = <double>[0.12, 0.30, 0.55, 0.75, 0.90, 1];

Map<String, dynamic> _fixture() {
  final source = File(
    'test/fixtures/api/tier_rankings_v2_parity.json',
  ).readAsStringSync();
  return (jsonDecode(source) as Map).cast<String, dynamic>();
}

List<Map<String, dynamic>> _rows(Map<String, dynamic> fixture) =>
    (fixture['rankings'] as List)
        .map((row) => (row as Map).cast<String, dynamic>())
        .toList(growable: false);

int _compareRanking(Map<String, dynamic> left, Map<String, dynamic> right) {
  final score = (right['totalScore'] as int).compareTo(
    left['totalScore'] as int,
  );
  if (score != 0) return score;
  final baseOrder = (left['baseOrder'] as int).compareTo(
    right['baseOrder'] as int,
  );
  if (baseOrder != 0) return baseOrder;
  return (left['characterId'] as String).compareTo(
    right['characterId'] as String,
  );
}

void main() {
  group('Tier Ranking shared v2 contract', () {
    test('contains exactly the approved 160 unique eligible IDs', () {
      final fixture = _fixture();
      final rows = _rows(fixture);
      final ids = rows.map((row) => row['characterId']).toSet();

      expect(fixture['schemaVersion'], 2);
      expect(rows, hasLength(160));
      expect(ids, hasLength(160));
      expect(
        {
          for (final tier in _tiers)
            tier: rows.where((row) => row['tier'] == tier).length,
        },
        const {'UR+': 12, 'UR': 28, 'SSR+': 26, 'SSR': 42, 'SR': 35, 'R': 17},
      );

      const rankingKeys = {
        'characterId',
        'tier',
        'baseVotes',
        'communityVotes',
        'totalScore',
        'baseOrder',
        'isCore',
        'band',
        'rank',
        'bandRank',
      };
      for (final row in rows) {
        expect(
          row.keys.toSet(),
          rankingKeys,
          reason: row['characterId'] as String,
        );
      }
    });

    test('keeps sparse real votes separate from the dense zero-vote list', () {
      final fixture = _fixture();
      final rows = _rows(fixture);
      final sparseVotes = Map<String, int>.fromEntries(
        (fixture['votes'] as List).map((raw) {
          final vote = (raw as Map).cast<String, dynamic>();
          return MapEntry(vote['characterId'] as String, vote['votes'] as int);
        }),
      );

      expect(sparseVotes, hasLength(4));
      expect(sparseVotes.values, everyElement(greaterThan(0)));
      expect(rows.where((row) => row['communityVotes'] == 0), hasLength(156));

      for (final row in rows) {
        final characterId = row['characterId'] as String;
        final communityVotes = sparseVotes[characterId] ?? 0;
        expect(row['communityVotes'], communityVotes, reason: characterId);
        expect(
          row['totalScore'],
          (row['baseVotes'] as int) + communityVotes,
          reason: characterId,
        );
      }
    });

    test('preserves aggregate meanings without counting baseline as users', () {
      final fixture = _fixture();
      final rows = _rows(fixture);
      final aggregates = (fixture['aggregates'] as Map).cast<String, dynamic>();
      final sparseVotes = fixture['votes'] as List;
      final communityTotal = sparseVotes.fold<int>(
        0,
        (total, raw) => total + ((raw as Map)['votes'] as int),
      );
      final baselineTotal = rows.fold<int>(
        0,
        (total, row) => total + (row['baseVotes'] as int),
      );

      expect(fixture['totalVotes'], communityTotal);
      expect(fixture['totalVoters'], 2);
      expect(aggregates['eligibleCharacterCount'], 160);
      expect(aggregates['baselineScoreTotal'], baselineTotal);
      expect(aggregates['baselineScoreTotal'], 540);
      expect(aggregates['baselineReferenceSize'], 22);
      expect(aggregates['communityVoteTotal'], communityTotal);
      expect(aggregates['communityVoterCount'], fixture['totalVoters']);
      expect(aggregates['combinedScoreTotal'], baselineTotal + communityTotal);
      expect(aggregates['combinedScoreTotal'], 552);
      expect(fixture['totalVotes'], isNot(aggregates['combinedScoreTotal']));
      expect(
        fixture['totalVoters'],
        isNot(aggregates['baselineReferenceSize']),
      );
    });

    test('uses canonical score, base order, ID, rank and band rules', () {
      final rows = _rows(_fixture());
      var foundDeterministicTie = false;

      for (final tier in _tiers) {
        final tierRows = rows.where((row) => row['tier'] == tier).toList();
        final sorted = [...tierRows]..sort(_compareRanking);
        expect(
          tierRows.map((row) => row['characterId']),
          orderedEquals(sorted.map((row) => row['characterId'])),
          reason: '$tier canonical ordering',
        );

        for (var index = 0; index < tierRows.length; index++) {
          expect(tierRows[index]['rank'], index + 1, reason: '$tier rank');
          if (index > 0 &&
              tierRows[index - 1]['totalScore'] ==
                  tierRows[index]['totalScore']) {
            foundDeterministicTie = true;
            expect(
              _compareRanking(tierRows[index - 1], tierRows[index]),
              lessThan(0),
            );
          }
        }

        final nonCore = tierRows
            .where((row) => row['isCore'] == false)
            .toList();
        final cutoffs = _cutoffRatios
            .map((ratio) => (nonCore.length * ratio).ceil())
            .toList(growable: false);
        final expectedBandById = <String, String>{};
        for (var index = 0; index < nonCore.length; index++) {
          final bandIndex = cutoffs.indexWhere((cutoff) => index < cutoff);
          expectedBandById[nonCore[index]['characterId'] as String] =
              _powerBands[bandIndex];
        }

        final bandRanks = <String, int>{};
        for (final row in tierRows) {
          final expectedBand = row['isCore'] == true
              ? 'CORE'
              : expectedBandById[row['characterId']]!;
          expect(
            row['band'],
            expectedBand,
            reason: row['characterId'] as String,
          );
          final nextBandRank = (bandRanks[expectedBand] ?? 0) + 1;
          bandRanks[expectedBand] = nextBandRank;
          expect(
            row['bandRank'],
            nextBandRank,
            reason: row['characterId'] as String,
          );
        }
      }

      expect(foundDeterministicTie, isTrue);
      expect(
        rows.where((row) => row['isCore'] == true),
        everyElement(containsPair('band', 'CORE')),
      );
    });
  });
}
