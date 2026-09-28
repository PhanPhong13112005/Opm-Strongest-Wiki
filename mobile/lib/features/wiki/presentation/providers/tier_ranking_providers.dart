import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/network_provider.dart';
import '../../data/datasources/tier_ranking_remote_data_source.dart';
import '../../data/repositories/tier_ranking_repository_impl.dart';
import '../../domain/repositories/tier_ranking_repository.dart';
import '../controllers/tier_ranking_controller.dart';
import '../controllers/tier_ranking_state.dart';
import 'character_providers.dart';

final tierRankingRemoteDataSourceProvider =
    Provider<TierRankingRemoteDataSource>((ref) {
      return TierRankingRemoteDataSourceImpl(ref.watch(apiClientProvider));
    });

final tierRankingRepositoryProvider = Provider<TierRankingRepository>((ref) {
  return TierRankingRepositoryImpl(
    ref.watch(tierRankingRemoteDataSourceProvider),
    ref.watch(characterRepositoryProvider),
  );
});

final tierRankingControllerProvider =
    NotifierProvider<TierRankingNotifier, TierRankingState>(
      TierRankingNotifier.new,
    );
