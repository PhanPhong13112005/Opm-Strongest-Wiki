import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/network/api_exception.dart';
import 'package:opmwiki_mobile/core/network/models/paged_response.dart';
import 'package:opmwiki_mobile/features/wiki/data/datasources/tier_ranking_remote_data_source.dart';
import 'package:opmwiki_mobile/features/wiki/data/models/tier_ranking_dto.dart';
import 'package:opmwiki_mobile/features/wiki/data/repositories/tier_ranking_repository_impl.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_detail.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_summary.dart';
import 'package:opmwiki_mobile/features/wiki/domain/repositories/character_repository.dart';

class _FakeTierDataSource implements TierRankingRemoteDataSource {
  _FakeTierDataSource({required this.responseDto, this.shouldThrow = false});

  final TierRankingResponseDto responseDto;
  final bool shouldThrow;

  @override
  Future<TierRankingResponseDto> getTierRankings() async {
    if (shouldThrow) {
      throw const ApiException(
        kind: ApiFailureKind.badResponse,
        statusCode: 500,
        message: 'Server error',
      );
    }
    return responseDto;
  }
}

class _FakeCharRepo implements CharacterRepository {
  _FakeCharRepo({this.characterMap = const {}, this.shouldThrow = false});

  final Map<String, CharacterSummary> characterMap;
  final bool shouldThrow;

  @override
  Future<Map<String, CharacterSummary>> getCharacterMap({
    required String language,
  }) async {
    if (shouldThrow) {
      throw const ApiException(
        kind: ApiFailureKind.connection,
        message: 'Network error',
      );
    }
    return characterMap;
  }

  @override
  Future<CharacterDetail> getCharacterDetail({
    required String id,
    required String language,
  }) => throw UnimplementedError();

  @override
  Future<PagedResponse<CharacterSummary>> getCharacters({
    required String language,
    String? search,
    String? tier,
    String? faction,
    String? type,
    int page = 1,
    int pageSize = 12,
    String? sort,
  }) => throw UnimplementedError();
}

void main() {
  group('TierRankingRepositoryImpl', () {
    test('fetches rankings and enriches metadata from character map', () async {
      const dto = TierRankingResponseDto(
        voteMonth: '2026-09',
        resetsAt: '2026-10-01T00:00:00.000Z',
        totalVotes: 100,
        totalVoters: 25,
        votes: [
          TierRankingVoteDto(characterId: 'char-rover', votes: 60),
          TierRankingVoteDto(characterId: 'char-amai', votes: 40),
        ],
      );

      final charMap = {
        'char-rover': const CharacterSummary(
          id: 'char-rover',
          name: 'Rover',
          tier: 'UR+',
          type: 'Esper',
          faction: 'Monster',
        ),
        'char-amai': const CharacterSummary(
          id: 'char-amai',
          name: 'Amai Mask',
          tier: 'SR',
          type: 'Grappler',
          faction: 'Hero',
        ),
      };

      final repo = TierRankingRepositoryImpl(
        _FakeTierDataSource(responseDto: dto),
        _FakeCharRepo(characterMap: charMap),
      );

      final result = await repo.getTierRankings(language: 'vi');

      expect(result.items, hasLength(2));
      expect(result.items[0].characterId, 'char-rover');
      expect(result.items[0].characterName, 'Rover');
      expect(result.items[0].characterTier, 'UR+');
      expect(result.items[0].rank, 1);
      expect(result.items[1].characterId, 'char-amai');
      expect(result.items[1].characterName, 'Amai Mask');
      expect(result.items[1].rank, 2);
    });

    test(
      'survives character repo failure and returns rankings with null metadata',
      () async {
        const dto = TierRankingResponseDto(
          voteMonth: '2026-09',
          resetsAt: '',
          totalVotes: 20,
          totalVoters: 5,
          votes: [TierRankingVoteDto(characterId: 'char-1', votes: 20)],
        );

        final repo = TierRankingRepositoryImpl(
          _FakeTierDataSource(responseDto: dto),
          _FakeCharRepo(shouldThrow: true),
        );

        final result = await repo.getTierRankings(language: 'vi');

        expect(result.items, hasLength(1));
        expect(result.items[0].characterId, 'char-1');
        expect(result.items[0].characterName, isNull);
        expect(result.items[0].votes, 20);
      },
    );

    test('propagates exception when tier rankings datasource fails', () async {
      const dto = TierRankingResponseDto(
        voteMonth: '',
        resetsAt: '',
        totalVotes: 0,
        totalVoters: 0,
        votes: [],
      );

      final repo = TierRankingRepositoryImpl(
        _FakeTierDataSource(responseDto: dto, shouldThrow: true),
        _FakeCharRepo(),
      );

      expect(() => repo.getTierRankings(), throwsA(isA<ApiException>()));
    });
  });
}
