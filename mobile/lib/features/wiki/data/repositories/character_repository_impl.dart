import '../../../../core/media/media_url_resolver.dart';
import '../../../../core/network/models/paged_response.dart';
import '../../domain/models/character_detail.dart';
import '../../domain/models/character_summary.dart';
import '../../domain/repositories/character_repository.dart';
import '../datasources/character_remote_data_source.dart';
import '../mappers/character_mapper.dart';

class CharacterRepositoryImpl implements CharacterRepository {
  CharacterRepositoryImpl(this._remoteDataSource, this._mediaUrlResolver);

  final CharacterRemoteDataSource _remoteDataSource;
  final MediaUrlResolver _mediaUrlResolver;

  @override
  Future<CharacterDetail> getCharacterDetail({
    required String id,
    required String language,
  }) async {
    final dto = await _remoteDataSource.getCharacterDetail(
      id: id,
      language: language,
    );
    final mapper = CharacterMapper(_mediaUrlResolver);
    return mapper.toDetailDomain(dto);
  }

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
  }) async {
    final dtoPage = await _remoteDataSource.getCharacters(
      language: language,
      search: search,
      tier: tier,
      faction: faction,
      type: type,
      page: page,
      pageSize: pageSize,
      sort: sort,
    );

    final mapper = CharacterMapper(_mediaUrlResolver);
    return PagedResponse<CharacterSummary>(
      items: dtoPage.items.map(mapper.toDomain).toList(),
      page: dtoPage.page,
      pageSize: dtoPage.pageSize,
      totalCount: dtoPage.totalCount,
      totalPages: dtoPage.totalPages,
    );
  }

  final Map<String, Map<String, CharacterSummary>> _characterMapCache = {};

  @override
  Future<Map<String, CharacterSummary>> getCharacterMap({
    required String language,
  }) async {
    if (_characterMapCache.containsKey(language)) {
      return _characterMapCache[language]!;
    }

    final mapper = CharacterMapper(_mediaUrlResolver);
    final map = <String, CharacterSummary>{};

    final firstPage = await _remoteDataSource.getCharacters(
      language: language,
      page: 1,
      pageSize: 100,
    );

    for (final dto in firstPage.items) {
      map[dto.id] = mapper.toDomain(dto);
    }

    if (firstPage.totalPages > 1) {
      for (var p = 2; p <= firstPage.totalPages; p++) {
        final nextPage = await _remoteDataSource.getCharacters(
          language: language,
          page: p,
          pageSize: 100,
        );
        for (final dto in nextPage.items) {
          map[dto.id] = mapper.toDomain(dto);
        }
      }
    }

    _characterMapCache[language] = map;
    return map;
  }
}
