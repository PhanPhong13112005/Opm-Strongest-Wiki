import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../wiki/domain/models/character_summary.dart';
import '../../../wiki/presentation/providers/character_providers.dart';
import '../providers/release_schedule_providers.dart';
import 'release_schedule_state.dart';

class ReleaseScheduleNotifier extends Notifier<ReleaseScheduleState> {
  @override
  ReleaseScheduleState build() {
    scheduleMicrotask(load);
    return const ReleaseScheduleState(isLoading: true);
  }

  Future<void> load({bool refresh = false}) async {
    if (!refresh && state.items.isNotEmpty && !state.isLoading) return;

    state = state.copyWith(isLoading: true, clearError: true);
    final language = ref.read(appConfigProvider).localeCode;
    final repository = ref.read(releaseScheduleRepositoryProvider);

    try {
      final feed = await repository.getReleaseSchedule(language: language);
      if (!ref.mounted) return;

      final adapter = ref.read(releaseSchedulePresentationAdapterProvider);
      state = state.copyWith(
        isLoading: false,
        items: adapter.toViewData(feed.entries, const {}),
        isFallback: feed.isFallback,
        clearError: true,
      );

      final characterRepository = ref.read(characterRepositoryProvider);
      Map<String, CharacterSummary> characters;
      try {
        characters = await characterRepository.getCharacterMap(
          language: language,
        );
      } catch (_) {
        characters = const {};
      }
      if (!ref.mounted) return;
      if (characters.isNotEmpty) {
        state = state.copyWith(
          items: adapter.toViewData(feed.entries, characters),
        );
      }
    } catch (error) {
      if (!ref.mounted) return;
      state = state.copyWith(isLoading: false, error: ErrorMapper.map(error));
    }
  }

  Future<void> retry() => load(refresh: true);
}
