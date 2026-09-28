import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/network/api_client.dart';
import 'package:opmwiki_mobile/core/network/api_endpoints.dart';
import 'package:opmwiki_mobile/features/wiki/data/datasources/character_remote_data_source.dart';

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
  group('CharacterRemoteDataSourceImpl', () {
    test(
      'sends correct query parameters and decodes characters fixture',
      () async {
        String? capturedPath;
        Map<String, dynamic>? capturedQuery;

        final fakeClient = _FakeApiClient((path, query) async {
          capturedPath = path;
          capturedQuery = query;

          final raw = File(
            'test/fixtures/api/characters_page_vi.json',
          ).readAsStringSync();
          return jsonDecode(raw);
        });

        final dataSource = CharacterRemoteDataSourceImpl(fakeClient);

        final result = await dataSource.getCharacters(
          language: 'vi',
          search: 'Homeless',
          tier: 'UR+',
          faction: 'Quái Nhân',
          type: 'Tâm Linh',
          page: 1,
          pageSize: 12,
          sort: 'release_desc',
        );

        expect(capturedPath, ApiEndpoints.characters);
        expect(capturedQuery?['language'], 'vi');
        expect(capturedQuery?['search'], 'Homeless');
        expect(capturedQuery?['tier'], 'UR+');
        expect(capturedQuery?['faction'], 'Quái Nhân');
        expect(capturedQuery?['type'], 'Tâm Linh');
        expect(capturedQuery?['page'], 1);
        expect(capturedQuery?['pageSize'], 12);
        expect(capturedQuery?['sort'], 'release_desc');

        expect(result.items.length, 2);
        expect(result.items.first.id, 'homeless-emperor-urplus');
      },
    );

    test('clamps page and pageSize correctly', () async {
      Map<String, dynamic>? capturedQuery;

      final fakeClient = _FakeApiClient((path, query) async {
        capturedQuery = query;
        return {
          'items': <dynamic>[],
          'page': 1,
          'pageSize': 100,
          'totalCount': 0,
          'totalPages': 0,
        };
      });

      final dataSource = CharacterRemoteDataSourceImpl(fakeClient);

      await dataSource.getCharacters(language: 'vi', page: -5, pageSize: 500);

      expect(capturedQuery?['page'], 1);
      expect(capturedQuery?['pageSize'], 100);
    });
  });
}
