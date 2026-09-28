import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/media/media_url_resolver.dart';
import 'package:opmwiki_mobile/core/network/api_client.dart';
import 'package:opmwiki_mobile/core/network/api_endpoints.dart';
import 'package:opmwiki_mobile/features/home/data/datasources/release_schedule_remote_data_source.dart';
import 'package:opmwiki_mobile/features/home/data/models/release_schedule_dto.dart';
import 'package:opmwiki_mobile/features/home/data/repositories/release_schedule_repository_impl.dart';

class _FakeApiClient extends ApiClient {
  _FakeApiClient(this.response) : super(Dio());

  Object? response;
  String? path;
  Map<String, dynamic>? query;

  @override
  Future<T> getJson<T>(
    String requestPath, {
    Map<String, dynamic>? queryParameters,
    T Function(Object? data)? decode,
  }) async {
    path = requestPath;
    query = queryParameters;
    return decode == null ? response as T : decode(response);
  }
}

class _FakeRemoteDataSource implements ReleaseScheduleRemoteDataSource {
  _FakeRemoteDataSource(this.entries);

  List<ReleaseScheduleDto> entries;
  bool shouldThrow = false;

  @override
  Future<List<ReleaseScheduleDto>> getReleaseSchedule({
    required String language,
  }) async {
    if (shouldThrow) throw StateError('offline');
    return entries;
  }
}

List<Object?> _fixture(String language) {
  final source = File(
    'test/fixtures/api/release_schedule_api_$language.json',
  ).readAsStringSync();
  return jsonDecode(source) as List<Object?>;
}

List<ReleaseScheduleDto> _fixtureDtos(String language) => _fixture(language)
    .map(
      (item) =>
          ReleaseScheduleDto.fromJson((item as Map).cast<String, dynamic>()),
    )
    .toList();

void main() {
  group('ReleaseScheduleDto', () {
    test('decodes the frozen VI/EN 22-row responses', () {
      for (final language in const ['vi', 'en']) {
        final entries = _fixtureDtos(language);
        expect(entries, hasLength(22));
        expect(entries.map((item) => item.compositeKey).toSet(), hasLength(22));
        expect(entries.any((item) => item.characterId == 'unknown'), isFalse);
        final blackSperm = entries.singleWhere((item) => item.id == 9);
        expect(blackSperm.compositeKey, 'CN|2026-08-01|1');
        expect(blackSperm.characterId, 'blacksperm-urplus');
      }
    });

    test('rejects malformed required fields', () {
      expect(
        () => ReleaseScheduleDto.fromJson({
          'id': 1,
          'server': 'INVALID',
          'date': '2026-01-01',
          'characterId': 'hero',
          'bannerImage': '/hero.png',
          'isReturn': false,
          'sortOrder': 1,
        }),
        throwsFormatException,
      );
    });
  });

  group('ReleaseScheduleRemoteDataSourceImpl', () {
    test('passes language and preserves the exact API response', () async {
      final fixture = _fixture('en');
      final client = _FakeApiClient(fixture);
      final source = ReleaseScheduleRemoteDataSourceImpl(client);

      final result = await source.getReleaseSchedule(language: 'en');

      expect(client.path, ApiEndpoints.releaseSchedule);
      expect(client.query, {'language': 'en'});
      expect(result, hasLength(22));
      expect(result[8].id, 9);
      expect(result[8].characterId, 'blacksperm-urplus');
    });

    test('rejects duplicate composite keys', () async {
      final fixture = _fixture('vi');
      final client = _FakeApiClient([...fixture, fixture.first]);
      final source = ReleaseScheduleRemoteDataSourceImpl(client);

      await expectLater(
        source.getReleaseSchedule(language: 'vi'),
        throwsFormatException,
      );
    });
  });

  group('ReleaseScheduleRepositoryImpl', () {
    final resolver = MediaUrlResolver(Uri.parse('https://opmwiki.app'));

    test('sorts API data and marks it as primary', () async {
      final source = _FakeRemoteDataSource(
        _fixtureDtos('vi').reversed.toList(),
      );
      final repository = ReleaseScheduleRepositoryImpl(source, resolver);

      final feed = await repository.getReleaseSchedule(language: 'vi');

      expect(feed.isFallback, isFalse);
      expect(feed.entries, hasLength(22));
      expect(feed.entries.first.compositeKey, 'CN|2026-06-01|1');
      expect(feed.entries[8].characterId, 'blacksperm-urplus');
      expect(
        feed.entries.map((item) => item.compositeKey).toSet(),
        hasLength(22),
      );
    });

    test(
      'uses last-known-good data only after a successful API load',
      () async {
        final source = _FakeRemoteDataSource(_fixtureDtos('vi'));
        final repository = ReleaseScheduleRepositoryImpl(source, resolver);

        final primary = await repository.getReleaseSchedule(language: 'vi');
        source.shouldThrow = true;
        final fallback = await repository.getReleaseSchedule(language: 'vi');

        expect(primary.isFallback, isFalse);
        expect(fallback.isFallback, isTrue);
        expect(fallback.entries, same(primary.entries));
        expect(fallback.entries, hasLength(22));
      },
    );

    test('does not package a runtime fallback for a cold-start failure', () {
      final source = _FakeRemoteDataSource(_fixtureDtos('vi'))
        ..shouldThrow = true;
      final repository = ReleaseScheduleRepositoryImpl(source, resolver);

      expect(
        repository.getReleaseSchedule(language: 'vi'),
        throwsA(isA<StateError>()),
      );
    });
  });
}
