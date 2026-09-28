import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/widgets/app_empty_state.dart';
import '../../../shared/widgets/app_error_view.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_page_header.dart';
import 'controllers/character_list_state.dart';
import 'providers/character_providers.dart';
import 'widgets/character_card.dart';
import 'widgets/character_filter_bar.dart';
import 'widgets/tier_list_view.dart';

class WikiPage extends ConsumerStatefulWidget {
  const WikiPage({super.key});

  @override
  ConsumerState<WikiPage> createState() => _WikiPageState();
}

class _WikiPageState extends ConsumerState<WikiPage> {
  final _searchController = TextEditingController();
  Timer? _debounceTimer;

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 350), () {
      if (mounted) {
        ref
            .read(characterListControllerProvider.notifier)
            .setSearchQuery(query);
      }
    });
  }

  void _onSearchCleared() {
    _searchController.clear();
    _debounceTimer?.cancel();
    ref.read(characterListControllerProvider.notifier).setSearchQuery('');
  }

  int _selectedTabIndex = 0;
  bool _hasOpenedTierList = false;

  void _onTabSelected(int index) {
    if (_selectedTabIndex != index) {
      setState(() {
        _selectedTabIndex = index;
        if (index == 1) {
          _hasOpenedTierList = true;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(characterListControllerProvider);
    final text = AppLocalizations.of(context);

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.lg,
              AppSpacing.lg,
              AppSpacing.sm,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppPageHeader(
                  title: _selectedTabIndex == 0
                      ? text.wikiTitle
                      : text.tierListTitle,
                  subtitle: _selectedTabIndex == 0
                      ? (state.totalCount > 0
                            ? text.charactersCount(state.totalCount)
                            : text.wikiSubtitle)
                      : text.tierListSubtitle,
                  eyebrow: 'Knowledge Base',
                ),
                const SizedBox(height: AppSpacing.md),
                // Segmented tab switch between Characters and Tier List
                Container(
                  height: 40,
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          key: const Key('wiki-tab-characters'),
                          borderRadius: BorderRadius.circular(9),
                          onTap: () => _onTabSelected(0),
                          child: Container(
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: _selectedTabIndex == 0
                                  ? AppColors.primary
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(9),
                            ),
                            child: Text(
                              text.charactersTab,
                              style: TextStyle(
                                color: _selectedTabIndex == 0
                                    ? Colors.white
                                    : AppColors.textSecondary,
                                fontWeight: _selectedTabIndex == 0
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: InkWell(
                          key: const Key('wiki-tab-tier-list'),
                          borderRadius: BorderRadius.circular(9),
                          onTap: () => _onTabSelected(1),
                          child: Container(
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: _selectedTabIndex == 1
                                  ? AppColors.primary
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(9),
                            ),
                            child: Text(
                              text.tierListTab,
                              style: TextStyle(
                                color: _selectedTabIndex == 1
                                    ? Colors.white
                                    : AppColors.textSecondary,
                                fontWeight: _selectedTabIndex == 1
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: IndexedStack(
              index: _selectedTabIndex,
              children: [
                _buildCharactersListTab(state, text),
                _hasOpenedTierList
                    ? const TierListView()
                    : const SizedBox.shrink(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCharactersListTab(
    CharacterListState state,
    AppLocalizations text,
  ) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification.metrics.pixels >=
            notification.metrics.maxScrollExtent - 250) {
          if (state.hasMore && !state.isLoadingMore && !state.isLoading) {
            ref.read(characterListControllerProvider.notifier).loadMore();
          }
        }
        return false;
      },
      child: RefreshIndicator(
        color: AppColors.primary,
        backgroundColor: AppColors.surfaceRaised,
        onRefresh: () =>
            ref.read(characterListControllerProvider.notifier).loadInitial(),
        child: CustomScrollView(
          key: const PageStorageKey('wiki-scroll'),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.xs,
                AppSpacing.lg,
                AppSpacing.sm,
              ),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      key: const Key('wiki-search-field'),
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      onSubmitted: (query) {
                        _debounceTimer?.cancel();
                        ref
                            .read(characterListControllerProvider.notifier)
                            .setSearchQuery(query);
                      },
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 20),
                                onPressed: _onSearchCleared,
                              )
                            : null,
                        hintText: text.wikiSearchHint,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    CharacterFilterBar(
                      selectedTier: state.selectedTier,
                      onTierSelected: (tier) {
                        ref
                            .read(characterListControllerProvider.notifier)
                            .setTier(tier);
                      },
                    ),
                  ],
                ),
              ),
            ),
            _buildContentSliver(state, text),
          ],
        ),
      ),
    );
  }

  Widget _buildContentSliver(CharacterListState state, AppLocalizations text) {
    if (state.isLoading) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(child: AppLoading(label: text.loadingLabel)),
      );
    }

    if (state.error != null && state.characters.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
          child: AppErrorView(
            title: text.errorTitle,
            message: state.error!.message,
            retryLabel: text.retryLabel,
            onRetry: () =>
                ref.read(characterListControllerProvider.notifier).retry(),
          ),
        ),
      );
    }

    if (state.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
          child: AppEmptyState(
            title: text.emptyTitle,
            message: text.noCharactersFound,
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        AppSpacing.lg,
      ),
      sliver: SliverMainAxisGroup(
        slivers: [
          SliverGrid(
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 200,
              childAspectRatio: 0.68,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            delegate: SliverChildBuilderDelegate((context, index) {
              final character = state.characters[index];
              return CharacterCard(
                character: character,
                onTap: () => context.go('/wiki/characters/${character.id}'),
              );
            }, childCount: state.characters.length),
          ),
          if (state.isLoadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
                child: Center(
                  child: SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
