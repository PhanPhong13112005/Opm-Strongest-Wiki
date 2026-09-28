import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';
import 'package:opmwiki_mobile/core/network/api_exception.dart';
import 'package:opmwiki_mobile/core/network/models/paged_response.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_detail.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_summary.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/tier_ranking.dart';
import 'package:opmwiki_mobile/features/wiki/domain/repositories/character_repository.dart';
import 'package:opmwiki_mobile/features/wiki/domain/repositories/tier_ranking_repository.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/providers/character_providers.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/providers/tier_ranking_providers.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/widgets/tier_list_view.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/widgets/tier_ranking_card.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/wiki_page.dart';
import 'package:opmwiki_mobile/l10n/generated/app_localizations.dart';
import 'package:opmwiki_mobile/shared/widgets/app_empty_state.dart';
import 'package:opmwiki_mobile/shared/widgets/app_error_view.dart';

class _FakeTierRepo implements TierRankingRepository {
  _FakeTierRepo({this.rankings, this.shouldThrow = false});

  TierRankings? rankings;
  bool shouldThrow;
  int getRankingsCount = 0;

  @override
  Future<TierRankings> getTierRankings({String language = 'vi'}) async {
    getRankingsCount++;
    if (shouldThrow) {
      throw const ApiException(
        kind: ApiFailureKind.connection,
        message: 'Không có kết nối mạng',
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

class _FakeCharRepo implements CharacterRepository {
  _FakeCharRepo({this.items = const []});
  final List<CharacterSummary> items;

  @override
  Future<Map<String, CharacterSummary>> getCharacterMap({
    required String language,
  }) async => const {};

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
    return PagedResponse(
      items: items,
      page: page,
      pageSize: pageSize,
      totalCount: items.length,
      totalPages: 1,
    );
  }
}

Widget _buildTestApp({
  required Widget child,
  required TierRankingRepository tierRepo,
  CharacterRepository? charRepo,
}) {
  final config = AppConfig(
    environment: AppEnvironment.development,
    apiBaseUri: Uri.parse('https://api.opmwiki.app'),
    assetBaseUri: Uri.parse('https://opmwiki.app'),
    localeCode: 'vi',
  );

  return ProviderScope(
    overrides: [
      appConfigProvider.overrideWithValue(config),
      tierRankingRepositoryProvider.overrideWithValue(tierRepo),
      characterRepositoryProvider.overrideWithValue(
        charRepo ?? _FakeCharRepo(),
      ),
    ],
    child: MaterialApp(
      locale: const Locale('vi'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(body: child),
    ),
  );
}

void main() {
  group('TierListView Widget Tests', () {
    testWidgets('renders empty state when votes list is empty', (tester) async {
      final repo = _FakeTierRepo(
        rankings: const TierRankings(
          voteMonth: '2026-09',
          resetsAt: null,
          totalVotes: 0,
          totalVoters: 0,
          items: [],
        ),
      );

      await tester.pumpWidget(
        _buildTestApp(child: const TierListView(), tierRepo: repo),
      );
      await tester.pumpAndSettle();

      expect(find.byType(AppEmptyState), findsOneWidget);
      expect(
        find.text('Chưa có dữ liệu bình chọn cho tháng này'),
        findsOneWidget,
      );
    });

    testWidgets('renders error view and retries on button press', (
      tester,
    ) async {
      final repo = _FakeTierRepo(shouldThrow: true);

      await tester.pumpWidget(
        _buildTestApp(child: const TierListView(), tierRepo: repo),
      );
      await tester.pumpAndSettle();

      expect(find.byType(AppErrorView), findsOneWidget);

      // Now recover repo and tap retry
      repo.shouldThrow = false;
      repo.rankings = const TierRankings(
        voteMonth: '2026-09',
        resetsAt: null,
        totalVotes: 10,
        totalVoters: 2,
        items: [
          TierRankingVoteItem(
            characterId: 'char-1',
            votes: 10,
            rank: 1,
            characterName: 'Saitama',
            characterTier: 'UR+',
          ),
        ],
      );

      await tester.tap(find.text('Thử lại'));
      await tester.pumpAndSettle();

      expect(find.byType(TierRankingCard), findsOneWidget);
      expect(find.text('Saitama'), findsOneWidget);
      expect(find.text('10 phiếu'), findsOneWidget);
    });

    testWidgets(
      'renders rankings list with rank badges, name, tier, and votes',
      (tester) async {
        final repo = _FakeTierRepo(
          rankings: const TierRankings(
            voteMonth: '2026-10',
            resetsAt: null,
            totalVotes: 95,
            totalVoters: 30,
            items: [
              TierRankingVoteItem(
                characterId: 'char-1',
                votes: 60,
                rank: 1,
                band: 'SS',
                characterName: 'Tatsumaki',
                characterTier: 'UR+',
                characterFaction: 'Anh Hùng',
              ),
              TierRankingVoteItem(
                characterId: 'char-2',
                votes: 35,
                rank: 2,
                characterName: 'Genos',
                characterTier: 'SSR+',
                characterFaction: 'Anh Hùng',
              ),
            ],
          ),
        );

        await tester.pumpWidget(
          _buildTestApp(child: const TierListView(), tierRepo: repo),
        );
        await tester.pumpAndSettle();

        expect(find.byType(TierRankingCard), findsNWidgets(2));
        expect(find.text('Tatsumaki'), findsOneWidget);
        expect(find.text('60 phiếu'), findsOneWidget);
        expect(find.text('SS'), findsOneWidget);
        expect(find.text('1'), findsOneWidget); // Rank 1 badge
        expect(find.text('Genos'), findsOneWidget);
        expect(find.text('35 phiếu'), findsOneWidget);
        expect(find.text('2'), findsOneWidget); // Rank 2 badge
      },
    );
  });

  group('WikiPage Tabs & State Preservation', () {
    testWidgets(
      'switching between Characters and Tier List preserves search state',
      (tester) async {
        final tierRepo = _FakeTierRepo(
          rankings: const TierRankings(
            voteMonth: '2026-09',
            resetsAt: null,
            totalVotes: 10,
            totalVoters: 2,
            items: [
              TierRankingVoteItem(
                characterId: 'char-1',
                votes: 10,
                rank: 1,
                characterName: 'Tatsumaki',
                characterTier: 'UR+',
              ),
            ],
          ),
        );

        final charRepo = _FakeCharRepo(
          items: const [
            CharacterSummary(
              id: 'char-1',
              name: 'Tatsumaki',
              tier: 'UR+',
              type: 'Tâm Linh',
              faction: 'Anh Hùng',
            ),
          ],
        );

        await tester.pumpWidget(
          _buildTestApp(
            child: const WikiPage(),
            tierRepo: tierRepo,
            charRepo: charRepo,
          ),
        );
        await tester.pumpAndSettle();

        // Type something into search field on Characters tab
        await tester.enterText(
          find.byKey(const Key('wiki-search-field')),
          'Tatsu',
        );
        await tester.pumpAndSettle();
        expect(find.text('Tatsu'), findsOneWidget);

        // Switch to Tier List tab
        await tester.tap(find.byKey(const Key('wiki-tab-tier-list')));
        await tester.pumpAndSettle();

        // Tier list card should be visible
        expect(find.byType(TierListView), findsOneWidget);
        expect(find.text('10 phiếu'), findsOneWidget);

        // Switch back to Characters tab
        await tester.tap(find.byKey(const Key('wiki-tab-characters')));
        await tester.pumpAndSettle();

        // Search field text should remain intact!
        expect(find.text('Tatsu'), findsOneWidget);
      },
    );
  });
}
