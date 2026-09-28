import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/network/api_client.dart';
import 'package:opmwiki_mobile/core/network/api_endpoints.dart';
import 'package:opmwiki_mobile/features/wiki/data/datasources/tier_ranking_remote_data_source.dart';

class _FakeApiClient extends ApiClient {
  _FakeApiClient(this._handler) : super(Dio());

  final Future<Object?> Function(
    String path,
    Map<String, dynamic>? queryParameters,
  )
  _handler;

  @override
  Future<T> getJson<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(Object? data)? decode,
  }) async {
    final data = await _handler(path, queryParameters);
    return decode == null ? data as T : decode(data);
  }
}

void main() {
  group('TierRankingRemoteDataSourceImpl', () {
    test('fetches and decodes tier rankings fixture correctly', () async {
      String? capturedPath;

      final fakeClient = _FakeApiClient((path, query) async {
        capturedPath = path;
        final raw = File(
          'test/fixtures/api/tier_rankings_shape.json',
        ).readAsStringSync();
        return jsonDecode(raw);
      });

      final dataSource = TierRankingRemoteDataSourceImpl(fakeClient);
      final result = await dataSource.getTierRankings();

      expect(capturedPath, ApiEndpoints.tierRankings);
      expect(result.voteMonth, '2026-09');
      expect(result.resetsAt, 'SANITIZED_VOLATILE_TIMESTAMP');
      expect(result.totalVotes, 0);
      expect(result.votes, isEmpty);
    });

    test('throws FormatException when response data is not a Map', () async {
      final fakeClient = _FakeApiClient((path, query) async => 'invalid-data');
      final dataSource = TierRankingRemoteDataSourceImpl(fakeClient);

      expect(
        () => dataSource.getTierRankings(),
        throwsA(isA<FormatException>()),
      );
    });
  });
}
