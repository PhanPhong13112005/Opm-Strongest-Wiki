import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';
import 'package:opmwiki_mobile/core/network/api_exception.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/tier_ranking.dart';
import 'package:opmwiki_mobile/features/wiki/domain/repositories/tier_ranking_repository.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/providers/tier_ranking_providers.dart';

class _FakeTierRankingRepository implements TierRankingRepository {
  _FakeTierRankingRepository({this.rankings, this.shouldThrow = false});

  TierRankings? rankings;
  bool shouldThrow;
  int getRankingsCalls = 0;

  @override
  Future<TierRankings> getTierRankings({String language = 'vi'}) async {
    getRankingsCalls++;
    if (shouldThrow) {
      throw const ApiException(
        kind: ApiFailureKind.connection,
        message: 'No internet connection',
      );
    }
    return rankings ??
        const TierRankings(
          voteMonth: '2026-09',
          resetsAt: null,
          totalVotes: 0,
          totalVoters: 0,
          items: [],
        );
  }
}

void main() {
  group('TierRankingNotifier', () {
    final testConfig = AppConfig(
      environment: AppEnvironment.development,
      apiBaseUri: Uri.parse('https://api.opmwiki.app'),
      assetBaseUri: Uri.parse('https://opmwiki.app'),
      localeCode: 'vi',
    );

    test('loads tier rankings successfully on initialization', () async {
      final repo = _FakeTierRankingRepository(
        rankings: const TierRankings(
          voteMonth: '2026-09',
          resetsAt: null,
          totalVotes: 50,
          totalVoters: 10,
          items: [
            TierRankingVoteItem(
              characterId: 'char-1',
              votes: 50,
              rank: 1,
              characterName: 'Hero 1',
              characterTier: 'UR+',
            ),
          ],
        ),
      );

      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(testConfig),
          tierRankingRepositoryProvider.overrideWithValue(repo),
        ],
      );
      addTearDown(container.dispose);

      // Trigger initial read
      final state = container.read(tierRankingControllerProvider);
      expect(state.isLoading, isTrue);

      // Wait for microtask to finish
      await container
          .read(tierRankingControllerProvider.notifier)
          .loadRankings();

      final updatedState = container.read(tierRankingControllerProvider);
      expect(updatedState.isLoading, isFalse);
      expect(updatedState.error, isNull);
      expect(updatedState.rankings?.totalVotes, 50);
      expect(updatedState.filteredItems, hasLength(1));
      expect(updatedState.isEmpty, isFalse);
    });

    test('handles error and retry recovers', () async {
      final repo = _FakeTierRankingRepository(shouldThrow: true);

      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(testConfig),
          tierRankingRepositoryProvider.overrideWithValue(repo),
        ],
      );
      addTearDown(container.dispose);

      await container
          .read(tierRankingControllerProvider.notifier)
          .loadRankings();

      var state = container.read(tierRankingControllerProvider);
      expect(state.isLoading, isFalse);
      expect(state.error, isNotNull);
      expect(state.isEmpty, isFalse);

      // Now fix repo and retry
      repo.shouldThrow = false;
      await container.read(tierRankingControllerProvider.notifier).retry();

      state = container.read(tierRankingControllerProvider);
      expect(state.isLoading, isFalse);
      expect(state.error, isNull);
      expect(state.rankings, isNotNull);
    });

    test('setTier toggles filter properly', () async {
      final repo = _FakeTierRankingRepository();

      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(testConfig),
          tierRankingRepositoryProvider.overrideWithValue(repo),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(tierRankingControllerProvider.notifier);

      notifier.setTier('UR+');
      expect(container.read(tierRankingControllerProvider).selectedTier, 'UR+');

      // Tapping again clears
      notifier.setTier('UR+');
      expect(
        container.read(tierRankingControllerProvider).selectedTier,
        isNull,
      );

      // Setting different tier
      notifier.setTier('SSR');
      expect(container.read(tierRankingControllerProvider).selectedTier, 'SSR');
    });
  });
}
