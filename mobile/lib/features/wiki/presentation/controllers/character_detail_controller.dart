import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/errors/error_mapper.dart';
import '../../../../core/network/api_exception.dart';
import '../providers/character_providers.dart';
import 'character_detail_state.dart';

class CharacterDetailNotifier extends Notifier<CharacterDetailState> {
  CharacterDetailNotifier(this.characterId);

  final String characterId;

  @override
  CharacterDetailState build() {
    scheduleMicrotask(loadDetail);
    return const CharacterDetailState(status: CharacterDetailStatus.loading);
  }

  Future<void> loadDetail() async {
    state = state.copyWith(status: CharacterDetailStatus.loading, error: null);

    final config = ref.read(appConfigProvider);
    final language = config.localeCode;
    final repository = ref.read(characterRepositoryProvider);

    try {
      final character = await repository.getCharacterDetail(
        id: characterId,
        language: language,
      );
      if (!ref.mounted) return;
      state = state.copyWith(
        status: CharacterDetailStatus.success,
        character: character,
        error: null,
      );
    } on ApiException catch (e) {
      if (!ref.mounted) return;
      if (e.statusCode == 404) {
        state = state.copyWith(
          status: CharacterDetailStatus.notFound,
          error: null,
        );
      } else {
        final appError = ErrorMapper.map(e);
        state = state.copyWith(
          status: CharacterDetailStatus.error,
          error: appError,
        );
      }
    } catch (e) {
      if (!ref.mounted) return;
      final appError = ErrorMapper.map(e);
      state = state.copyWith(
        status: CharacterDetailStatus.error,
        error: appError,
      );
    }
  }

  Future<void> retry() => loadDetail();
}
