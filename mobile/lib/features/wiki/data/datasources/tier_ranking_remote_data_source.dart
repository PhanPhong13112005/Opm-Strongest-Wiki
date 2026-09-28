import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/tier_ranking_dto.dart';

abstract class TierRankingRemoteDataSource {
  Future<TierRankingResponseDto> getTierRankings();
}

class TierRankingRemoteDataSourceImpl implements TierRankingRemoteDataSource {
  const TierRankingRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<TierRankingResponseDto> getTierRankings() async {
    return _apiClient.getJson<TierRankingResponseDto>(
      ApiEndpoints.tierRankings,
      decode: (data) {
        if (data is! Map) {
          throw const FormatException(
            'Expected JSON object for tier rankings response',
          );
        }
        return TierRankingResponseDto.fromJson(data.cast<String, dynamic>());
      },
    );
  }
}
