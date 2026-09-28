import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:opmwiki_mobile/app/routing/route_names.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';
import 'package:opmwiki_mobile/core/network/models/paged_response.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_detail.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_summary.dart';
import 'package:opmwiki_mobile/features/wiki/domain/repositories/character_repository.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/character_detail_page.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/providers/character_providers.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/wiki_page.dart';
import 'package:opmwiki_mobile/l10n/generated/app_localizations.dart';

class _NavFakeRepo implements CharacterRepository {
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
      items: const [
        CharacterSummary(
          id: '100029-sr',
          name: 'Amai Mask',
          tier: 'SR',
          type: 'Giác Đấu',
          faction: 'Anh Hùng',
        ),
      ],
      page: 1,
      pageSize: 12,
      totalCount: 1,
      totalPages: 1,
    );
  }

  @override
  Future<CharacterDetail> getCharacterDetail({
    required String id,
    required String language,
  }) async {
    return CharacterDetail(
      id: id,
      name: 'Amai Mask Detail',
      tier: 'SR',
      type: 'Giác Đấu',
      faction: 'Anh Hùng',
      bio: 'Hero Association idol',
    );
  }

  @override
  Future<Map<String, CharacterSummary>> getCharacterMap({
    required String language,
  }) async => const {};
}

void main() {
  testWidgets(
    'tapping CharacterCard opens CharacterDetail and back returns to list',
    (tester) async {
      final fakeRepo = _NavFakeRepo();

      final router = GoRouter(
        initialLocation: '/wiki',
        routes: [
          GoRoute(
            path: '/wiki',
            name: RouteNames.wiki,
            builder: (_, _) => const Scaffold(body: WikiPage()),
            routes: [
              GoRoute(
                path: 'characters/:id',
                name: RouteNames.characterDetail,
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return CharacterDetailPage(characterId: id);
                },
              ),
            ],
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            appConfigProvider.overrideWithValue(
              AppConfig(
                environment: AppEnvironment.development,
                apiBaseUri: Uri.parse('https://api.opmwiki.app'),
                assetBaseUri: Uri.parse('https://opmwiki.app'),
                localeCode: 'vi',
              ),
            ),
            characterRepositoryProvider.overrideWithValue(fakeRepo),
          ],
          child: MaterialApp.router(
            routerConfig: router,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [Locale('vi'), Locale('en')],
            locale: const Locale('vi'),
          ),
        ),
      );

      // Initial load and settle
      await tester.pumpAndSettle();

      // Verify CharacterCard is rendered
      expect(find.text('Amai Mask'), findsOneWidget);

      // Tap CharacterCard
      await tester.tap(find.text('Amai Mask'));
      await tester.pumpAndSettle();

      // Verify navigated to CharacterDetailPage
      expect(find.byType(CharacterDetailPage), findsOneWidget);
      expect(find.text('Amai Mask Detail'), findsWidgets);
      expect(find.text('Hero Association idol'), findsOneWidget);

      // Tap back button
      await tester.tap(find.byIcon(Icons.arrow_back));
      await tester.pumpAndSettle();

      // Verify returned to WikiPage
      expect(find.byType(CharacterDetailPage), findsNothing);
      expect(find.byType(WikiPage), findsOneWidget);
      expect(find.text('Amai Mask'), findsOneWidget);
    },
  );
}
