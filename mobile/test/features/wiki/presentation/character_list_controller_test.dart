import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';
import 'package:opmwiki_mobile/core/network/api_exception.dart';
import 'package:opmwiki_mobile/core/network/models/paged_response.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_detail.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_summary.dart';
import 'package:opmwiki_mobile/features/wiki/domain/repositories/character_repository.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/controllers/character_list_state.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/providers/character_providers.dart';

class _FakeCharacterRepository implements CharacterRepository {
  _FakeCharacterRepository({this.shouldThrow = false});

  bool shouldThrow;
  int getCharactersCalls = 0;
  String? lastSearch;
  String? lastTier;
  int lastPage = 0;

  @override
  Future<CharacterDetail> getCharacterDetail({
    required String id,
    required String language,
  }) => throw UnimplementedError();

  @override
  Future<PagedResponse<CharacterSummary>> getCharacters({
    required String language,
    String? search,
    String? tier,
    String? faction,
    String? type,
    int page = 1,
    int pageSize = 12,
    String? sort,
  }) async {
    getCharactersCalls++;
    lastSearch = search;
    lastTier = tier;
    lastPage = page;

    if (shouldThrow) {
      throw const ApiException(
        kind: ApiFailureKind.connection,
        message: 'No internet connection',
      );
    }

    final items = List.generate(
      pageSize,
      (index) => CharacterSummary(
        id: 'hero-p$page-$index',
        name: 'Hero P$page-$index',
        tier: tier ?? 'SSR',
        type: 'Giác Đấu',
        faction: 'Anh Hùng',
      ),
    );

    return PagedResponse<CharacterSummary>(
      items: items,
      page: page,
      pageSize: pageSize,
      totalCount: 36,
      totalPages: 3,
    );
  }

  @override
  Future<Map<String, CharacterSummary>> getCharacterMap({
    required String language,
  }) async => const {};
}

void main() {
  final testConfig = AppConfig(
    environment: AppEnvironment.development,
    apiBaseUri: Uri.parse('https://api.example.test'),
    assetBaseUri: Uri.parse('https://assets.example.test'),
    localeCode: 'vi',
  );

  group('CharacterListNotifier', () {
    test('loads initial page on startup and transitions to success', () async {
      final fakeRepo = _FakeCharacterRepository();
      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(testConfig),
          characterRepositoryProvider.overrideWithValue(fakeRepo),
        ],
      );
      addTearDown(container.dispose);

      // Trigger read
      container.read(characterListControllerProvider);
      // Wait for microtask loadInitial
      await Future<void>.delayed(Duration.zero);

      final state = container.read(characterListControllerProvider);
      expect(state.status, CharacterListStatus.success);
      expect(state.characters.length, 12);
      expect(state.page, 1);
      expect(state.totalPages, 3);
      expect(state.totalCount, 36);
      expect(state.hasMore, isTrue);
      expect(fakeRepo.getCharactersCalls, 1);
    });

    test('filters by tier and reloads page 1', () async {
      final fakeRepo = _FakeCharacterRepository();
      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(testConfig),
          characterRepositoryProvider.overrideWithValue(fakeRepo),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(characterListControllerProvider.notifier);
      await Future<void>.delayed(Duration.zero);

      notifier.setTier('UR+');
      await Future<void>.delayed(Duration.zero);

      final state = container.read(characterListControllerProvider);
      expect(state.selectedTier, 'UR+');
      expect(fakeRepo.lastTier, 'UR+');
      expect(fakeRepo.lastPage, 1);
    });

    test('searches characters and updates query', () async {
      final fakeRepo = _FakeCharacterRepository();
      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(testConfig),
          characterRepositoryProvider.overrideWithValue(fakeRepo),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(characterListControllerProvider.notifier);
      await Future<void>.delayed(Duration.zero);

      notifier.setSearchQuery('Saitama');
      await Future<void>.delayed(Duration.zero);

      final state = container.read(characterListControllerProvider);
      expect(state.searchQuery, 'Saitama');
      expect(fakeRepo.lastSearch, 'Saitama');
    });

    test(
      'loadMore accumulates pages without discarding existing characters',
      () async {
        final fakeRepo = _FakeCharacterRepository();
        final container = ProviderContainer(
          overrides: [
            appConfigProvider.overrideWithValue(testConfig),
            characterRepositoryProvider.overrideWithValue(fakeRepo),
          ],
        );
        addTearDown(container.dispose);

        final notifier = container.read(
          characterListControllerProvider.notifier,
        );
        await Future<void>.delayed(Duration.zero);

        expect(
          container.read(characterListControllerProvider).characters.length,
          12,
        );

        await notifier.loadMore();

        final state = container.read(characterListControllerProvider);
        expect(state.characters.length, 24);
        expect(state.page, 2);
        expect(fakeRepo.lastPage, 2);
      },
    );

    test(
      'transitions to error state on failure and recovers with retry',
      () async {
        final fakeRepo = _FakeCharacterRepository(shouldThrow: true);
        final container = ProviderContainer(
          overrides: [
            appConfigProvider.overrideWithValue(testConfig),
            characterRepositoryProvider.overrideWithValue(fakeRepo),
          ],
        );
        addTearDown(container.dispose);

        final notifier = container.read(
          characterListControllerProvider.notifier,
        );
        await Future<void>.delayed(Duration.zero);

        final errorState = container.read(characterListControllerProvider);
        expect(errorState.status, CharacterListStatus.error);
        expect(errorState.error, isNotNull);
        expect(errorState.characters, isEmpty);

        // Now fix network and retry
        fakeRepo.shouldThrow = false;
        notifier.retry();
        await Future<void>.delayed(Duration.zero);

        final successState = container.read(characterListControllerProvider);
        expect(successState.status, CharacterListStatus.success);
        expect(successState.characters.length, 12);
      },
    );

    test(
      'old out-of-order search responses cannot overwrite newer results',
      () async {
        final completer1 = Completer<PagedResponse<CharacterSummary>>();
        final completer2 = Completer<PagedResponse<CharacterSummary>>();

        var callCount = 0;
        final customRepo = _FakeCustomRepository(
          onGetCharacters: (search) {
            callCount++;
            if (callCount == 1) {
              // initial load
              return Future.value(
                const PagedResponse(
                  items: [],
                  page: 1,
                  pageSize: 10,
                  totalCount: 0,
                  totalPages: 1,
                ),
              );
            } else if (callCount == 2) {
              // Search 1: slow
              return completer1.future;
            } else {
              // Search 2: fast
              return completer2.future;
            }
          },
        );

        final container = ProviderContainer(
          overrides: [
            appConfigProvider.overrideWithValue(testConfig),
            characterRepositoryProvider.overrideWithValue(customRepo),
          ],
        );
        addTearDown(container.dispose);

        final notifier = container.read(
          characterListControllerProvider.notifier,
        );
        await Future<void>.delayed(Duration.zero);

        // Trigger search 1
        notifier.setSearchQuery('SlowQuery');
        // Trigger search 2 immediately after
        notifier.setSearchQuery('FastQuery');

        // Complete search 2 first
        completer2.complete(
          const PagedResponse(
            items: [
              CharacterSummary(
                id: 'fast-hero',
                name: 'Fast Hero',
                tier: 'UR',
                type: 'Tâm Linh',
                faction: 'Anh Hùng',
              ),
            ],
            page: 1,
            pageSize: 10,
            totalCount: 1,
            totalPages: 1,
          ),
        );
        await Future<void>.delayed(Duration.zero);

        expect(
          container.read(characterListControllerProvider).characters.first.id,
          'fast-hero',
        );

        // Now complete search 1 late
        completer1.complete(
          const PagedResponse(
            items: [
              CharacterSummary(
                id: 'slow-hero',
                name: 'Slow Hero',
                tier: 'SSR',
                type: 'Giác Đấu',
                faction: 'Quái Nhân',
              ),
            ],
            page: 1,
            pageSize: 10,
            totalCount: 1,
            totalPages: 1,
          ),
        );
        await Future<void>.delayed(Duration.zero);

        // State MUST STILL be fast-hero, not overwritten by slow-hero!
        final finalState = container.read(characterListControllerProvider);
        expect(finalState.characters.length, 1);
        expect(finalState.characters.first.id, 'fast-hero');
      },
    );

    test(
      'pagination deduplicates items when overlapping characters are returned',
      () async {
        var call = 0;
        final customRepo = _FakeCustomRepository(
          onGetCharacters: (_) {
            call++;
            if (call == 1) {
              return Future.value(
                const PagedResponse(
                  items: [
                    CharacterSummary(
                      id: 'hero-1',
                      name: 'Hero 1',
                      tier: 'SSR',
                      type: 'Giác Đấu',
                      faction: 'Anh Hùng',
                    ),
                  ],
                  page: 1,
                  pageSize: 1,
                  totalCount: 2,
                  totalPages: 2,
                ),
              );
            } else {
              // Page 2 returns overlapping hero-1 and new hero-2
              return Future.value(
                const PagedResponse(
                  items: [
                    CharacterSummary(
                      id: 'hero-1',
                      name: 'Hero 1',
                      tier: 'SSR',
                      type: 'Giác Đấu',
                      faction: 'Anh Hùng',
                    ),
                    CharacterSummary(
                      id: 'hero-2',
                      name: 'Hero 2',
                      tier: 'SSR',
                      type: 'Giác Đấu',
                      faction: 'Anh Hùng',
                    ),
                  ],
                  page: 2,
                  pageSize: 2,
                  totalCount: 2,
                  totalPages: 2,
                ),
              );
            }
          },
        );

        final container = ProviderContainer(
          overrides: [
            appConfigProvider.overrideWithValue(testConfig),
            characterRepositoryProvider.overrideWithValue(customRepo),
          ],
        );
        addTearDown(container.dispose);

        final notifier = container.read(
          characterListControllerProvider.notifier,
        );
        await Future<void>.delayed(Duration.zero);

        expect(
          container.read(characterListControllerProvider).characters.length,
          1,
        );

        await notifier.loadMore();

        final characters = container
            .read(characterListControllerProvider)
            .characters;
        expect(characters.length, 2);
        expect(characters[0].id, 'hero-1');
        expect(characters[1].id, 'hero-2');
      },
    );
  });
}

class _FakeCustomRepository implements CharacterRepository {
  _FakeCustomRepository({required this.onGetCharacters});

  final Future<PagedResponse<CharacterSummary>> Function(String? search)
  onGetCharacters;

  @override
  Future<CharacterDetail> getCharacterDetail({
    required String id,
    required String language,
  }) => throw UnimplementedError();

  @override
  Future<PagedResponse<CharacterSummary>> getCharacters({
    required String language,
    String? search,
    String? tier,
    String? faction,
    String? type,
    int page = 1,
    int pageSize = 12,
    String? sort,
  }) {
    return onGetCharacters(search);
  }

  @override
  Future<Map<String, CharacterSummary>> getCharacterMap({
    required String language,
  }) async => const {};
}
