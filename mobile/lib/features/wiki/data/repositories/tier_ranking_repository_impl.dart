import '../../domain/models/character_summary.dart';
import '../../domain/models/tier_ranking.dart';
import '../../domain/repositories/character_repository.dart';
import '../../domain/repositories/tier_ranking_repository.dart';
import '../datasources/tier_ranking_remote_data_source.dart';
import '../mappers/tier_ranking_mapper.dart';

class TierRankingRepositoryImpl implements TierRankingRepository {
  const TierRankingRepositoryImpl(
    this._remoteDataSource,
    this._characterRepository, [
    this._mapper = const TierRankingMapper(),
  ]);

  final TierRankingRemoteDataSource _remoteDataSource;
  final CharacterRepository _characterRepository;
  final TierRankingMapper _mapper;

  @override
  Future<TierRankings> getTierRankings({String language = 'vi'}) async {
    final dto = await _remoteDataSource.getTierRankings();

    // Nạp toàn bộ danh mục nhân vật để enrich metadata (tên, ảnh, phẩm, hệ, phái).
    // Nếu nạp nhân vật thất bại, vẫn fallback map rỗng để Tier Ranking hiển thị bình thường.
    Map<String, CharacterSummary>? characterMap;
    try {
      characterMap = await _characterRepository.getCharacterMap(
        language: language,
      );
    } catch (_) {
      characterMap = null;
    }

    return _mapper.toDomain(dto, characterMap: characterMap);
  }
}
