import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/errors/error_mapper.dart';
import '../providers/tier_ranking_providers.dart';
import 'tier_ranking_state.dart';

class TierRankingNotifier extends Notifier<TierRankingState> {
  @override
  TierRankingState build() {
    scheduleMicrotask(loadRankings);
    return const TierRankingState(isLoading: true);
  }

  Future<void> loadRankings({bool refresh = false}) async {
    if (!refresh && state.rankings != null && !state.isLoading) {
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);

    final config = ref.read(appConfigProvider);
    final language = config.localeCode;
    final repository = ref.read(tierRankingRepositoryProvider);

    try {
      final rankings = await repository.getTierRankings(language: language);
      if (!ref.mounted) return;
      state = state.copyWith(
        isLoading: false,
        rankings: rankings,
        clearError: true,
      );
    } catch (e) {
      if (!ref.mounted) return;
      final appError = ErrorMapper.map(e);
      state = state.copyWith(isLoading: false, error: appError);
    }
  }

  void setTier(String? tier) {
    if (state.selectedTier == tier) {
      state = state.copyWith(clearSelectedTier: true);
    } else {
      state = state.copyWith(selectedTier: tier);
    }
  }

  Future<void> retry() => loadRankings(refresh: true);
}
