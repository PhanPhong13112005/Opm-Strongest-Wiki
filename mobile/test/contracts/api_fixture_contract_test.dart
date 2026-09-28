import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

Object? _fixture(String name) {
  final source = File('test/fixtures/api/$name').readAsStringSync();
  return jsonDecode(source);
}

Map<String, Object?> _mapFixture(String name) =>
    (_fixture(name) as Map).cast<String, Object?>();

String _releaseKey(Map<Object?, Object?> row) =>
    '${row['server']}|${row['date']}|${row['sortOrder']}';

String _errorCategory(int? statusCode, Object? body) {
  final payload = body is Map ? body : const <Object?, Object?>{};
  if (statusCode == 401) return 'UNAUTHORIZED';
  if (statusCode == 403) return 'FORBIDDEN';
  if (statusCode == 404) return 'NOT_FOUND';
  if (statusCode == 400 && payload['errors'] is Map) {
    return 'VALIDATION_ERROR';
  }
  if (statusCode == 503 && payload['code'] == 'SchemaNotReady') {
    return 'CAPABILITY_UNAVAILABLE';
  }
  if (statusCode != null && statusCode >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN_ERROR';
}

void main() {
  group('captured public contracts', () {
    test('manifest records immutable fixture provenance', () {
      final manifest = _mapFixture('manifest.json');
      expect(manifest['capturedAt'], '2026-09-23');
      expect(manifest['apiOrigin'], 'https://api.opmwiki.app');
      expect(manifest['assetOrigin'], 'https://opmwiki.app');
    });

    test('character page keeps stable string IDs and paging metadata', () {
      final page = _mapFixture('characters_page_vi.json');
      final items = page['items'] as List<Object?>;
      final first = (items.first as Map).cast<String, Object?>();

      expect(page['page'], 1);
      expect(page['pageSize'], 2);
      expect(page['totalCount'], 178);
      expect(page['totalPages'], 89);
      expect(first['id'], 'homeless-emperor-urplus');
      expect(first['roles'], isA<List<Object?>>());
      expect(first['releaseSea'], isA<String>());
    });

    test(
      'character detail preserves nullable dates and ordered skill data',
      () {
        final detail = _mapFixture('character_detail_vi.json');
        final stats = (detail['baseStats'] as Map).cast<String, Object?>();
        final skills = detail['skills'] as List<Object?>;

        expect(detail['releaseSea'], isNull);
        expect(detail['releaseChina'], isNull);
        expect(stats.keys, containsAll(<String>['atk', 'hp', 'def', 'spd']));
        expect((skills.first as Map)['sortOrder'], 0);
        expect((skills.first as Map)['animationUrl'], isNull);
      },
    );

    test('events allow an empty image URL and expose paging metadata', () {
      final page = _mapFixture('events_page_vi.json');
      final first = (page['items'] as List<Object?>).first as Map;

      expect(page['totalCount'], 46);
      expect(first['imageUrl'], '');
      expect(DateTime.parse(first['startDate'] as String), isA<DateTime>());
      expect(DateTime.parse(first['endDate'] as String), isA<DateTime>());
    });

    test('catalog samples retain nested JSON and media fields', () {
      final samples = _mapFixture('catalog_samples_vi.json');
      final mastery = samples['mastery'] as Map;
      final keepsake = samples['keepsake'] as Map;
      final backgear = samples['backgear'] as Map;
      final tactic = samples['tactic'] as Map;

      expect(mastery['version'], 1);
      expect((mastery['categories'] as Map).keys, contains('cap'));
      expect(keepsake['iconUrl'], startsWith('/Keepsake/'));
      expect(backgear['levels'], isA<List<Object?>>());
      expect((tactic['scaling'] as Map)['rarities'], isA<List<Object?>>());
    });

    test('tier fixture explicitly sanitizes volatile community values', () {
      final ranking = _mapFixture('tier_rankings_shape.json');
      expect(
        ranking.keys,
        containsAll(<String>[
          'voteMonth',
          'resetsAt',
          'totalVotes',
          'totalVoters',
          'votes',
        ]),
      );
      expect(ranking['resetsAt'], 'SANITIZED_VOLATILE_TIMESTAMP');
      expect(ranking['votes'], isEmpty);
    });
  });

  group('release schedule parity boundary', () {
    const expectedNewRows = <String, (int, String, bool, String)>{
      'SEA|2026-09-01|1': (
        17,
        '100315-urplus',
        false,
        '/Characters/Full_Background/Bang&Bomb_Urplus.png',
      ),
      'CN|2026-09-15|2': (
        18,
        '100013-urplus',
        true,
        '/Characters/Full_Background/ZombIeMan_URplus.png',
      ),
      'SEA|2026-09-15|2': (
        19,
        '100313-urplus',
        true,
        '/Characters/Full_Background/Atomic Samurai_URplus.png',
      ),
      'SEA|2026-10-01|1': (
        20,
        '100316-urplus',
        false,
        '/Characters/Full_Background/Rover_URplus.png',
      ),
      'CN|2026-10-15|2': (
        21,
        'blacksperm-urplus',
        true,
        '/Characters/Full_Background/Black_Sperm_Ur_plus.png',
      ),
      'SEA|2026-10-15|2': (
        22,
        '100314-urplus',
        true,
        '/Characters/Full_Background/G5_URplus.png',
      ),
    };

    for (final language in const ['vi', 'en']) {
      test('$language snapshot freezes the complete ordered 22-row API', () {
        final rows =
            _fixture('release_schedule_api_$language.json') as List<Object?>;
        final maps = rows.cast<Map<Object?, Object?>>();
        final keys = maps.map(_releaseKey).toList();

        expect(rows, hasLength(22));
        expect(keys.toSet(), hasLength(22));
        expect(
          keys,
          orderedEquals(
            [...keys]..sort((left, right) {
              final leftParts = left.split('|');
              final rightParts = right.split('|');
              final byDate = leftParts[1].compareTo(rightParts[1]);
              if (byDate != 0) return byDate;
              final byServer = leftParts[0].compareTo(rightParts[0]);
              if (byServer != 0) return byServer;
              return int.parse(
                leftParts[2],
              ).compareTo(int.parse(rightParts[2]));
            }),
          ),
        );
        expect(maps.any((row) => row['characterId'] == 'unknown'), isFalse);

        final byKey = <String, Map<Object?, Object?>>{
          for (final row in maps) _releaseKey(row): row,
        };
        for (final entry in expectedNewRows.entries) {
          final row = byKey[entry.key];
          expect(row, isNotNull, reason: entry.key);
          expect(row!['id'], entry.value.$1, reason: entry.key);
          expect(row['characterId'], entry.value.$2, reason: entry.key);
          expect(row['isReturn'], entry.value.$3, reason: entry.key);
          expect(row['bannerImage'], entry.value.$4, reason: entry.key);
        }

        final blackSperm = byKey['CN|2026-08-01|1']!;
        expect(blackSperm['id'], 9);
        expect(blackSperm['characterId'], 'blacksperm-urplus');
        expect(
          blackSperm['bannerImage'],
          '/Characters/Full_Background/Black_Sperm_Ur_plus.png',
        );
      });
    }

    test('VI and EN preserve identical schedule identity and core data', () {
      final vi = _fixture('release_schedule_api_vi.json') as List<Object?>;
      final en = _fixture('release_schedule_api_en.json') as List<Object?>;

      Object? core(Object? value) {
        final row = (value as Map).cast<String, Object?>();
        return <String, Object?>{
          'key': _releaseKey(row),
          'id': row['id'],
          'characterId': row['characterId'],
          'isReturn': row['isReturn'],
          'bannerImage': row['bannerImage'],
        };
      }

      expect(vi.map(core).toList(), equals(en.map(core).toList()));
    });
  });

  group('error response contract', () {
    test('normalizes observed and documented HTTP payload categories', () {
      final fixtures = _mapFixture('error_samples.json');
      final expected = <String, String>{
        'notFound': 'NOT_FOUND',
        'validation': 'VALIDATION_ERROR',
        'unauthorized': 'UNAUTHORIZED',
        'capabilityUnavailable': 'CAPABILITY_UNAVAILABLE',
      };

      for (final entry in expected.entries) {
        final sample = fixtures[entry.key] as Map;
        expect(
          _errorCategory(sample['statusCode'] as int?, sample['body']),
          entry.value,
          reason: entry.key,
        );
      }
    });

    test('keeps message errors and malformed shapes distinguishable', () {
      final fixtures = _mapFixture('error_samples.json');
      final message = fixtures['messageError'] as Map;
      expect((message['body'] as Map)['message'], isA<String>());
      expect(_errorCategory(200, <String, Object?>{}), 'UNKNOWN_ERROR');
    });
  });
}
