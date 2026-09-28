import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/errors/error_mapper.dart';
import '../providers/character_providers.dart';
import 'character_list_state.dart';

class CharacterListNotifier extends Notifier<CharacterListState> {
  int _requestId = 0;

  @override
  CharacterListState build() {
    scheduleMicrotask(loadInitial);
    return const CharacterListState(status: CharacterListStatus.loading);
  }

  Future<void> loadInitial() async {
    final requestId = ++_requestId;

    state = state.copyWith(
      status: CharacterListStatus.loading,
      error: () => null,
    );

    try {
      final config = ref.read(appConfigProvider);
      final repository = ref.read(characterRepositoryProvider);
      final response = await repository.getCharacters(
        language: config.localeCode,
        search: state.searchQuery,
        tier: state.selectedTier,
        faction: state.selectedFaction,
        type: state.selectedType,
        page: 1,
        pageSize: state.pageSize,
        sort: state.sort,
      );

      // Discard out-of-order or superseded responses
      if (requestId != _requestId) return;

      state = state.copyWith(
        status: CharacterListStatus.success,
        characters: response.items,
        page: response.page,
        totalPages: response.totalPages,
        totalCount: response.totalCount,
        error: () => null,
      );
    } catch (e) {
      if (requestId != _requestId) return;

      final appError = ErrorMapper.map(e);
      state = state.copyWith(
        status: CharacterListStatus.error,
        error: () => appError,
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || state.isLoadingMore || !state.hasMore) return;

    final requestId = _requestId;
    state = state.copyWith(status: CharacterListStatus.loadingMore);

    try {
      final config = ref.read(appConfigProvider);
      final repository = ref.read(characterRepositoryProvider);
      final nextPage = state.page + 1;
      final response = await repository.getCharacters(
        language: config.localeCode,
        search: state.searchQuery,
        tier: state.selectedTier,
        faction: state.selectedFaction,
        type: state.selectedType,
        page: nextPage,
        pageSize: state.pageSize,
        sort: state.sort,
      );

      if (requestId != _requestId) return;

      // Prevent duplicate characters across pagination pages
      final existingIds = state.characters.map((c) => c.id).toSet();
      final newItems = response.items
          .where((c) => !existingIds.contains(c.id))
          .toList();

      state = state.copyWith(
        status: CharacterListStatus.success,
        characters: [...state.characters, ...newItems],
        page: response.page,
        totalPages: response.totalPages,
        totalCount: response.totalCount,
      );
    } catch (_) {
      if (requestId != _requestId) return;
      state = state.copyWith(status: CharacterListStatus.success);
    }
  }

  void setSearchQuery(String query) {
    final trimmed = query.trim();
    if (state.searchQuery == trimmed) return;
    state = state.copyWith(searchQuery: trimmed, page: 1);
    loadInitial();
  }

  void setTier(String? tier) {
    if (state.selectedTier == tier) return;
    state = state.copyWith(selectedTier: () => tier, page: 1);
    loadInitial();
  }

  void setFaction(String? faction) {
    if (state.selectedFaction == faction) return;
    state = state.copyWith(selectedFaction: () => faction, page: 1);
    loadInitial();
  }

  void setType(String? type) {
    if (state.selectedType == type) return;
    state = state.copyWith(selectedType: () => type, page: 1);
    loadInitial();
  }

  void retry() => loadInitial();
}
