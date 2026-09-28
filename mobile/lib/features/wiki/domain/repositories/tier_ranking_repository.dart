import '../models/tier_ranking.dart';

abstract class TierRankingRepository {
  Future<TierRankings> getTierRankings({String language = 'vi'});
}
