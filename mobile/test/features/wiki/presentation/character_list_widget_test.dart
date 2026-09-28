import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';
import 'package:opmwiki_mobile/core/errors/app_error.dart';
import 'package:opmwiki_mobile/core/network/models/paged_response.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_detail.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_summary.dart';
import 'package:opmwiki_mobile/features/wiki/domain/repositories/character_repository.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/providers/character_providers.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/widgets/character_card.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/widgets/character_tier_badge.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/wiki_page.dart';
import 'package:opmwiki_mobile/l10n/generated/app_localizations.dart';
import 'package:opmwiki_mobile/shared/widgets/app_empty_state.dart';
import 'package:opmwiki_mobile/shared/widgets/app_error_view.dart';
import 'package:opmwiki_mobile/shared/widgets/app_loading.dart';

class _FakeCharacterRepository implements CharacterRepository {
  _FakeCharacterRepository({this.items = const [], this.shouldThrow = false});

  List<CharacterSummary> items;
  bool shouldThrow;

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
    if (shouldThrow) {
      throw const AppError(AppErrorKind.server, 'Server error');
    }
    return PagedResponse<CharacterSummary>(
      items: items,
      page: page,
      pageSize: pageSize,
      totalCount: items.length,
      totalPages: (items.length / pageSize).ceil(),
    );
  }

  @override
  Future<Map<String, CharacterSummary>> getCharacterMap({
    required String language,
  }) async => const {};
}

Widget _buildTestApp({
  required Widget child,
  List<dynamic> overrides = const [],
}) {
  final config = AppConfig(
    environment: AppEnvironment.development,
    apiBaseUri: Uri.parse('https://api.example.test'),
    assetBaseUri: Uri.parse('https://assets.example.test'),
    localeCode: 'vi',
  );

  return ProviderScope(
    overrides: [
      appConfigProvider.overrideWithValue(config),
      ...overrides.cast(),
    ],
    child: MaterialApp(
      locale: const Locale('vi'),
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(body: child),
    ),
  );
}

void main() {
  group('CharacterTierBadge', () {
    testWidgets('renders tier label correctly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: CharacterTierBadge(tier: 'UR+')),
        ),
      );
      expect(find.text('UR+'), findsOneWidget);
    });
  });

  group('CharacterCard', () {
    testWidgets('renders character information and placeholder without error', (
      tester,
    ) async {
      const character = CharacterSummary(
        id: 'saitama-ssr',
        name: 'Saitama',
        tier: 'SSR',
        type: 'Giác Đấu',
        faction: 'Anh Hùng',
        roles: ['Đấm Thường'],
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 180,
              height: 260,
              child: CharacterCard(character: character),
            ),
          ),
        ),
      );

      expect(find.text('Saitama'), findsOneWidget);
      expect(find.text('SSR'), findsNWidgets(2)); // Badge and placeholder
      expect(find.text('Giác Đấu'), findsOneWidget);
      expect(find.text('Anh Hùng'), findsOneWidget);
    });
  });

  group('WikiPage UI States', () {
    testWidgets('renders loading state initially', (tester) async {
      final fakeRepo = _FakeCharacterRepository();
      await tester.pumpWidget(
        _buildTestApp(
          overrides: [characterRepositoryProvider.overrideWithValue(fakeRepo)],
          child: const WikiPage(),
        ),
      );

      // Before settling, loading state is visible
      expect(find.byType(AppLoading), findsOneWidget);
    });

    testWidgets(
      'renders error view when repository throws and retries on press',
      (tester) async {
        final fakeRepo = _FakeCharacterRepository(shouldThrow: true);
        await tester.pumpWidget(
          _buildTestApp(
            overrides: [
              characterRepositoryProvider.overrideWithValue(fakeRepo),
            ],
            child: const WikiPage(),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.byType(AppErrorView), findsOneWidget);
        expect(find.text('Thử lại'), findsOneWidget);

        // Tap retry with resolved repository
        fakeRepo.shouldThrow = false;
        fakeRepo.items = [
          const CharacterSummary(
            id: 'garou-ur',
            name: 'Garou UR',
            tier: 'UR',
            type: 'Giác Đấu',
            faction: 'Quái Nhân',
          ),
        ];

        await tester.tap(find.text('Thử lại'));
        await tester.pumpAndSettle();

        expect(find.byType(AppErrorView), findsNothing);
        expect(find.text('Garou UR'), findsOneWidget);
      },
    );

    testWidgets('renders empty state when characters list is empty', (
      tester,
    ) async {
      final fakeRepo = _FakeCharacterRepository(items: const []);
      await tester.pumpWidget(
        _buildTestApp(
          overrides: [characterRepositoryProvider.overrideWithValue(fakeRepo)],
          child: const WikiPage(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(AppEmptyState), findsOneWidget);
    });

    testWidgets('renders character cards and search bar on success', (
      tester,
    ) async {
      final fakeRepo = _FakeCharacterRepository(
        items: const [
          CharacterSummary(
            id: 'boros-urplus',
            name: 'Boros',
            tier: 'UR+',
            type: 'Tâm Linh',
            faction: 'Quái Nhân',
          ),
          CharacterSummary(
            id: 'tatsumaki-urplus',
            name: 'Tatsumaki',
            tier: 'UR+',
            type: 'Tâm Linh',
            faction: 'Anh Hùng',
          ),
        ],
      );

      await tester.pumpWidget(
        _buildTestApp(
          overrides: [characterRepositoryProvider.overrideWithValue(fakeRepo)],
          child: const WikiPage(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('wiki-search-field')), findsOneWidget);
      expect(find.byType(CharacterCard), findsNWidgets(2));
      expect(find.text('Boros'), findsOneWidget);
      expect(find.text('Tatsumaki'), findsOneWidget);
    });
  });
}
