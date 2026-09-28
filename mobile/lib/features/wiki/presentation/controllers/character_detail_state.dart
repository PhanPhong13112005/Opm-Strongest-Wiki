import '../../../../core/errors/app_error.dart';
import '../../domain/models/character_detail.dart';

enum CharacterDetailStatus { initial, loading, success, error, notFound }

class CharacterDetailState {
  const CharacterDetailState({
    this.status = CharacterDetailStatus.initial,
    this.character,
    this.error,
  });

  final CharacterDetailStatus status;
  final CharacterDetail? character;
  final AppError? error;

  bool get isLoading => status == CharacterDetailStatus.loading;
  bool get isSuccess => status == CharacterDetailStatus.success;
  bool get isError => status == CharacterDetailStatus.error;
  bool get isNotFound => status == CharacterDetailStatus.notFound;

  CharacterDetailState copyWith({
    CharacterDetailStatus? status,
    CharacterDetail? character,
    AppError? error,
  }) {
    return CharacterDetailState(
      status: status ?? this.status,
      character: character ?? this.character,
      error: error,
    );
  }
}
