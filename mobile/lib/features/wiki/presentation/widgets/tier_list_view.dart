import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../../../shared/widgets/app_empty_state.dart';
import '../../../../shared/widgets/app_error_view.dart';
import '../../../../shared/widgets/app_loading.dart';
import '../controllers/tier_ranking_state.dart';
import '../providers/tier_ranking_providers.dart';
import 'character_filter_bar.dart';
import 'tier_ranking_card.dart';

class TierListView extends ConsumerWidget {
  const TierListView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(tierRankingControllerProvider);
    final text = AppLocalizations.of(context);

    if (state.isLoading) {
      return Center(child: AppLoading(label: text.loadingLabel));
    }

    if (state.error != null &&
        (state.rankings == null || state.rankings!.isEmpty)) {
      return Center(
        child: AppErrorView(
          title: text.errorTitle,
          message: state.error!.message,
          retryLabel: text.retryLabel,
          onRetry: () =>
              ref.read(tierRankingControllerProvider.notifier).retry(),
        ),
      );
    }

    if (state.isEmpty) {
      return Center(
        child: AppEmptyState(
          title: text.emptyTitle,
          message: text.noTierRankingsFound,
        ),
      );
    }

    final filteredItems = state.filteredItems;

    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: AppColors.surfaceRaised,
      onRefresh: () => ref
          .read(tierRankingControllerProvider.notifier)
          .loadRankings(refresh: true),
      child: CustomScrollView(
        key: const PageStorageKey('tier-list-scroll'),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.md,
                AppSpacing.lg,
                AppSpacing.sm,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Month and vote summary card
                  _buildSummaryCard(context, state, text),
                  const SizedBox(height: AppSpacing.md),
                  // Tier filter bar
                  CharacterFilterBar(
                    selectedTier: state.selectedTier,
                    onTierSelected: (tier) {
                      ref
                          .read(tierRankingControllerProvider.notifier)
                          .setTier(tier);
                    },
                  ),
                ],
              ),
            ),
          ),
          if (filteredItems.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: AppEmptyState(
                  title: text.emptyTitle,
                  message: text.noCharactersFound,
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.sm,
                AppSpacing.lg,
                AppSpacing.xl,
              ),
              sliver: SliverList.separated(
                itemCount: filteredItems.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, index) {
                  final item = filteredItems[index];
                  return TierRankingCard(
                    item: item,
                    onTap: () =>
                        context.go('/wiki/characters/${item.characterId}'),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(
    BuildContext context,
    TierRankingState state,
    AppLocalizations text,
  ) {
    final rankings = state.rankings!;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceRaised,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.calendar_month,
                      size: 16,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      text.voteMonthLabel(
                        rankings.voteMonth.isNotEmpty
                            ? rankings.voteMonth
                            : '--',
                      ),
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  text.tierListSubtitle,
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(height: 36, width: 1, color: AppColors.border),
          const SizedBox(width: AppSpacing.md),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                text.totalVotesLabel(rankings.totalVotes),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                text.totalVotersLabel(rankings.totalVoters),
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
