import '../../../../core/errors/app_error.dart';
import '../../domain/models/character_summary.dart';

enum CharacterListStatus { initial, loading, success, error, loadingMore }

class CharacterListState {
  const CharacterListState({
    this.status = CharacterListStatus.initial,
    this.characters = const [],
    this.page = 1,
    this.pageSize = 12,
    this.totalPages = 1,
    this.totalCount = 0,
    this.searchQuery = '',
    this.selectedTier,
    this.selectedFaction,
    this.selectedType,
    this.sort = 'release_desc',
    this.error,
  });

  final CharacterListStatus status;
  final List<CharacterSummary> characters;
  final int page;
  final int pageSize;
  final int totalPages;
  final int totalCount;
  final String searchQuery;
  final String? selectedTier;
  final String? selectedFaction;
  final String? selectedType;
  final String sort;
  final AppError? error;

  bool get isLoading => status == CharacterListStatus.loading;
  bool get isLoadingMore => status == CharacterListStatus.loadingMore;
  bool get hasMore => page < totalPages;
  bool get isEmpty =>
      status == CharacterListStatus.success && characters.isEmpty;

  CharacterListState copyWith({
    CharacterListStatus? status,
    List<CharacterSummary>? characters,
    int? page,
    int? pageSize,
    int? totalPages,
    int? totalCount,
    String? searchQuery,
    String? Function()? selectedTier,
    String? Function()? selectedFaction,
    String? Function()? selectedType,
    String? sort,
    AppError? Function()? error,
  }) {
    return CharacterListState(
      status: status ?? this.status,
      characters: characters ?? this.characters,
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      totalPages: totalPages ?? this.totalPages,
      totalCount: totalCount ?? this.totalCount,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedTier: selectedTier != null ? selectedTier() : this.selectedTier,
      selectedFaction: selectedFaction != null
          ? selectedFaction()
          : this.selectedFaction,
      selectedType: selectedType != null ? selectedType() : this.selectedType,
      sort: sort ?? this.sort,
      error: error != null ? error() : this.error,
    );
  }
}
