import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';
import 'package:opmwiki_mobile/core/network/api_exception.dart';
import 'package:opmwiki_mobile/core/network/models/paged_response.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_detail.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_summary.dart';
import 'package:opmwiki_mobile/features/wiki/domain/repositories/character_repository.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/controllers/character_detail_state.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/providers/character_providers.dart';

class _FakeCharacterRepository implements CharacterRepository {
  _FakeCharacterRepository({
    this.shouldThrow404 = false,
    this.shouldThrowError = false,
  });

  bool shouldThrow404;
  bool shouldThrowError;
  int getDetailCalls = 0;

  @override
  Future<CharacterDetail> getCharacterDetail({
    required String id,
    required String language,
  }) async {
    getDetailCalls++;
    if (shouldThrow404) {
      throw const ApiException(
        kind: ApiFailureKind.badResponse,
        statusCode: 404,
        message: 'Character not found',
      );
    }
    if (shouldThrowError) {
      throw const ApiException(
        kind: ApiFailureKind.connection,
        message: 'No internet connection',
      );
    }
    return CharacterDetail(
      id: id,
      name: 'Test Character',
      tier: 'SSR',
      type: 'Giác Đấu',
      faction: 'Anh Hùng',
    );
  }

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
    throw UnimplementedError();
  }

  @override
  Future<Map<String, CharacterSummary>> getCharacterMap({
    required String language,
  }) async => const {};
}

void main() {
  group('CharacterDetailNotifier', () {
    final config = AppConfig(
      environment: AppEnvironment.development,
      apiBaseUri: Uri.parse('https://api.opmwiki.app'),
      assetBaseUri: Uri.parse('https://opmwiki.app'),
      localeCode: 'vi',
    );

    test('loads detail on startup and transitions to success', () async {
      final fakeRepo = _FakeCharacterRepository();
      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(config),
          characterRepositoryProvider.overrideWithValue(fakeRepo),
        ],
      );
      addTearDown(container.dispose);

      // Keep active subscription for autoDispose provider
      final subscription = container.listen(
        characterDetailControllerProvider('test-1'),
        (_, _) {},
      );
      addTearDown(subscription.close);

      // Initial state is loading
      expect(
        container.read(characterDetailControllerProvider('test-1')).status,
        CharacterDetailStatus.loading,
      );

      // Wait for async load to finish
      await container.pump();
      await Future<void>.delayed(const Duration(milliseconds: 10));

      final state = container.read(characterDetailControllerProvider('test-1'));
      expect(state.status, CharacterDetailStatus.success);
      expect(state.character?.id, 'test-1');
      expect(state.character?.name, 'Test Character');
      expect(fakeRepo.getDetailCalls, 1);
    });

    test('transitions to notFound when API returns 404', () async {
      final fakeRepo = _FakeCharacterRepository(shouldThrow404: true);
      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(config),
          characterRepositoryProvider.overrideWithValue(fakeRepo),
        ],
      );
      addTearDown(container.dispose);

      final subscription = container.listen(
        characterDetailControllerProvider('test-404'),
        (_, _) {},
      );
      addTearDown(subscription.close);

      await container.pump();
      await Future<void>.delayed(const Duration(milliseconds: 10));

      final state = container.read(
        characterDetailControllerProvider('test-404'),
      );
      expect(state.status, CharacterDetailStatus.notFound);
      expect(state.character, isNull);
    });

    test(
      'transitions to error on network failure and recovers with retry',
      () async {
        final fakeRepo = _FakeCharacterRepository(shouldThrowError: true);
        final container = ProviderContainer(
          overrides: [
            appConfigProvider.overrideWithValue(config),
            characterRepositoryProvider.overrideWithValue(fakeRepo),
          ],
        );
        addTearDown(container.dispose);

        final subscription = container.listen(
          characterDetailControllerProvider('test-err'),
          (_, _) {},
        );
        addTearDown(subscription.close);

        await container.pump();
        await Future<void>.delayed(const Duration(milliseconds: 10));

        var state = container.read(
          characterDetailControllerProvider('test-err'),
        );
        expect(state.status, CharacterDetailStatus.error);
        expect(state.error, isNotNull);
        expect(fakeRepo.getDetailCalls, 1);

        // Recover with retry
        fakeRepo.shouldThrowError = false;
        await container
            .read(characterDetailControllerProvider('test-err').notifier)
            .retry();

        state = container.read(characterDetailControllerProvider('test-err'));
        expect(state.status, CharacterDetailStatus.success);
        expect(fakeRepo.getDetailCalls, 2);
      },
    );
  });
}
