import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';
import 'package:opmwiki_mobile/core/network/api_exception.dart';
import 'package:opmwiki_mobile/core/network/models/paged_response.dart';
import 'package:opmwiki_mobile/features/home/domain/models/release_schedule.dart';
import 'package:opmwiki_mobile/features/home/domain/repositories/release_schedule_repository.dart';
import 'package:opmwiki_mobile/features/home/presentation/providers/release_schedule_providers.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_detail.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_summary.dart';
import 'package:opmwiki_mobile/features/wiki/domain/repositories/character_repository.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/providers/character_providers.dart';

class _FakeReleaseScheduleRepository implements ReleaseScheduleRepository {
  _FakeReleaseScheduleRepository({this.shouldThrow = false});

  bool shouldThrow;

  @override
  Future<ReleaseScheduleFeed> getReleaseSchedule({
    required String language,
  }) async {
    if (shouldThrow) {
      throw const ApiException(
        kind: ApiFailureKind.connection,
        message: 'offline',
      );
    }
    return ReleaseScheduleFeed(
      isFallback: false,
      entries: [
        ReleaseScheduleEntry(
          id: 9,
          server: 'CN',
          date: DateTime(2026, 8),
          characterId: 'blacksperm-urplus',
          bannerImageUrl: Uri.parse(
            'https://opmwiki.app/Characters/Full_Background/Black_Sperm_Ur_plus.png',
          ),
          isReturn: false,
          sortOrder: 1,
        ),
      ],
    );
  }
}

class _FakeCharacterRepository implements CharacterRepository {
  @override
  Future<Map<String, CharacterSummary>> getCharacterMap({
    required String language,
  }) async => {
    'blacksperm-urplus': const CharacterSummary(
      id: 'blacksperm-urplus',
      name: 'Tinh Trùng Đen',
      tier: 'UR+',
      type: 'Giác Đấu',
      faction: 'Quái Nhân',
    ),
  };

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
  }) => throw UnimplementedError();
}

void main() {
  final config = AppConfig(
    environment: AppEnvironment.development,
    apiBaseUri: Uri.parse('https://api.example.test'),
    assetBaseUri: Uri.parse('https://assets.example.test'),
    localeCode: 'vi',
  );

  test('controller loads and adapts the schedule for presentation', () async {
    final container = ProviderContainer(
      overrides: [
        appConfigProvider.overrideWithValue(config),
        releaseScheduleRepositoryProvider.overrideWithValue(
          _FakeReleaseScheduleRepository(),
        ),
        characterRepositoryProvider.overrideWithValue(
          _FakeCharacterRepository(),
        ),
      ],
    );
    addTearDown(container.dispose);

    container.read(releaseScheduleControllerProvider);
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);

    final state = container.read(releaseScheduleControllerProvider);
    expect(state.isLoading, isFalse);
    expect(state.error, isNull);
    expect(state.items, hasLength(1));
    expect(state.items.single.characterName, 'Tinh Trùng Đen');
    expect(state.items.single.compositeKey, 'CN|2026-08-01|1');
  });

  test('controller exposes a retryable error on cold-start failure', () async {
    final repository = _FakeReleaseScheduleRepository(shouldThrow: true);
    final container = ProviderContainer(
      overrides: [
        appConfigProvider.overrideWithValue(config),
        releaseScheduleRepositoryProvider.overrideWithValue(repository),
        characterRepositoryProvider.overrideWithValue(
          _FakeCharacterRepository(),
        ),
      ],
    );
    addTearDown(container.dispose);

    container.read(releaseScheduleControllerProvider);
    await Future<void>.delayed(Duration.zero);

    var state = container.read(releaseScheduleControllerProvider);
    expect(state.isLoading, isFalse);
    expect(state.error, isNotNull);
    expect(state.items, isEmpty);

    repository.shouldThrow = false;
    await container.read(releaseScheduleControllerProvider.notifier).retry();
    state = container.read(releaseScheduleControllerProvider);
    expect(state.error, isNull);
    expect(state.items, hasLength(1));
  });
}
