import '../../../../core/network/models/paged_response.dart';
import '../models/character_detail.dart';
import '../models/character_summary.dart';

abstract class CharacterRepository {
  Future<PagedResponse<CharacterSummary>> getCharacters({
    required String language,
    String? search,
    String? tier,
    String? faction,
    String? type,
    int page = 1,
    int pageSize = 12,
    String? sort,
  });

  Future<CharacterDetail> getCharacterDetail({
    required String id,
    required String language,
  });

  Future<Map<String, CharacterSummary>> getCharacterMap({
    required String language,
  }) async => const {};
}
