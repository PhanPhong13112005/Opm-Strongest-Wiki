import 'package:flutter/foundation.dart';

import '../../../../core/errors/app_error.dart';
import '../../domain/models/tier_ranking.dart';

@immutable
class TierRankingState {
  const TierRankingState({
    this.isLoading = false,
    this.rankings,
    this.error,
    this.selectedTier,
  });

  final bool isLoading;
  final TierRankings? rankings;
  final AppError? error;
  final String? selectedTier;

  bool get isEmpty =>
      !isLoading &&
      error == null &&
      (rankings == null || rankings!.items.isEmpty);

  List<TierRankingVoteItem> get filteredItems =>
      rankings?.filterByTier(selectedTier) ?? const [];

  TierRankingState copyWith({
    bool? isLoading,
    TierRankings? rankings,
    AppError? error,
    bool clearError = false,
    String? selectedTier,
    bool clearSelectedTier = false,
  }) {
    return TierRankingState(
      isLoading: isLoading ?? this.isLoading,
      rankings: rankings ?? this.rankings,
      error: clearError ? null : (error ?? this.error),
      selectedTier: clearSelectedTier
          ? null
          : (selectedTier ?? this.selectedTier),
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TierRankingState &&
          runtimeType == other.runtimeType &&
          isLoading == other.isLoading &&
          rankings == other.rankings &&
          error == other.error &&
          selectedTier == other.selectedTier;

  @override
  int get hashCode => Object.hash(isLoading, rankings, error, selectedTier);
}
