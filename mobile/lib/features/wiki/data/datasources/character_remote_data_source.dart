import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/network/models/paged_response.dart';
import '../models/character_detail_dto.dart';
import '../models/character_summary_dto.dart';

abstract class CharacterRemoteDataSource {
  Future<PagedResponse<CharacterSummaryDto>> getCharacters({
    required String language,
    String? search,
    String? tier,
    String? faction,
    String? type,
    int page = 1,
    int pageSize = 12,
    String? sort,
  });

  Future<CharacterDetailDto> getCharacterDetail({
    required String id,
    required String language,
  });
}

class CharacterRemoteDataSourceImpl implements CharacterRemoteDataSource {
  const CharacterRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<CharacterDetailDto> getCharacterDetail({
    required String id,
    required String language,
  }) async {
    return _apiClient.getJson<CharacterDetailDto>(
      ApiEndpoints.characterDetail(id),
      queryParameters: {'language': language},
      decode: (data) {
        if (data is! Map) {
          throw const FormatException(
            'Expected JSON object for character detail response',
          );
        }
        return CharacterDetailDto.fromJson(data.cast<String, dynamic>());
      },
    );
  }

  @override
  Future<PagedResponse<CharacterSummaryDto>> getCharacters({
    required String language,
    String? search,
    String? tier,
    String? faction,
    String? type,
    int page = 1,
    int pageSize = 12,
    String? sort,
  }) async {
    final query = <String, dynamic>{
      'language': language,
      'page': page < 1 ? 1 : page,
      'pageSize': pageSize.clamp(1, 100),
    };

    if (search != null && search.trim().isNotEmpty) {
      query['search'] = search.trim();
    }
    if (tier != null && tier.trim().isNotEmpty) {
      query['tier'] = tier.trim();
    }
    if (faction != null && faction.trim().isNotEmpty) {
      query['faction'] = faction.trim();
    }
    if (type != null && type.trim().isNotEmpty) {
      query['type'] = type.trim();
    }
    if (sort != null && sort.trim().isNotEmpty) {
      query['sort'] = sort.trim();
    }

    return _apiClient.getJson<PagedResponse<CharacterSummaryDto>>(
      ApiEndpoints.characters,
      queryParameters: query,
      decode: (data) {
        if (data is! Map) {
          throw const FormatException(
            'Expected JSON object for characters response',
          );
        }
        return PagedResponse.fromJson(data.cast<String, dynamic>(), (item) {
          if (item is! Map) {
            throw const FormatException(
              'Expected JSON object for character item',
            );
          }
          return CharacterSummaryDto.fromJson(item.cast<String, dynamic>());
        });
      },
    );
  }
}
