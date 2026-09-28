import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';
import 'package:opmwiki_mobile/core/network/api_exception.dart';
import 'package:opmwiki_mobile/core/network/models/paged_response.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_detail.dart';
import 'package:opmwiki_mobile/features/wiki/domain/models/character_summary.dart';
import 'package:opmwiki_mobile/features/wiki/domain/repositories/character_repository.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/character_detail_page.dart';
import 'package:opmwiki_mobile/features/wiki/presentation/providers/character_providers.dart';
import 'package:opmwiki_mobile/l10n/generated/app_localizations.dart';
import 'package:opmwiki_mobile/shared/widgets/app_empty_state.dart';
import 'package:opmwiki_mobile/shared/widgets/app_error_view.dart';
import 'package:opmwiki_mobile/shared/widgets/app_loading.dart';

class _FakeRepo implements CharacterRepository {
  _FakeRepo({
    this.character,
    this.shouldThrow404 = false,
    this.shouldThrowError = false,
    this.pendingFuture,
  });

  final CharacterDetail? character;
  final bool shouldThrow404;
  final bool shouldThrowError;
  final Future<CharacterDetail>? pendingFuture;

  @override
  Future<CharacterDetail> getCharacterDetail({
    required String id,
    required String language,
  }) async {
    if (pendingFuture != null) return pendingFuture!;
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
        message: 'Network error',
      );
    }
    return character ??
        CharacterDetail(
          id: id,
          name: 'Fallback Hero',
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

Widget _wrap(Widget child, {List<dynamic> overrides = const []}) {
  final config = AppConfig(
    environment: AppEnvironment.development,
    apiBaseUri: Uri.parse('https://api.opmwiki.app'),
    assetBaseUri: Uri.parse('https://opmwiki.app'),
    localeCode: 'vi',
  );

  return ProviderScope(
    overrides: [
      appConfigProvider.overrideWithValue(config),
      ...overrides.cast(),
    ],
    child: MaterialApp(
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('vi'), Locale('en')],
      locale: const Locale('vi'),
      home: child,
    ),
  );
}

void main() {
  group('CharacterDetailPage', () {
    testWidgets('renders loading state initially', (tester) async {
      final completer = Completer<CharacterDetail>();
      final fakeRepo = _FakeRepo(pendingFuture: completer.future);

      await tester.pumpWidget(
        _wrap(
          const CharacterDetailPage(characterId: 'char-1'),
          overrides: [characterRepositoryProvider.overrideWithValue(fakeRepo)],
        ),
      );

      // Just pumped, async request is pending
      expect(find.byType(AppLoading), findsOneWidget);
    });

    testWidgets('renders notFound state when character is absent', (
      tester,
    ) async {
      final fakeRepo = _FakeRepo(shouldThrow404: true);

      await tester.pumpWidget(
        _wrap(
          const CharacterDetailPage(characterId: 'char-404'),
          overrides: [characterRepositoryProvider.overrideWithValue(fakeRepo)],
        ),
      );

      await tester.pumpAndSettle();

      expect(find.byType(AppEmptyState), findsOneWidget);
      expect(find.text('Không tìm thấy thông tin nhân vật'), findsOneWidget);
    });

    testWidgets('renders error view on failure', (tester) async {
      final fakeRepo = _FakeRepo(shouldThrowError: true);

      await tester.pumpWidget(
        _wrap(
          const CharacterDetailPage(characterId: 'char-err'),
          overrides: [characterRepositoryProvider.overrideWithValue(fakeRepo)],
        ),
      );

      await tester.pumpAndSettle();

      expect(find.byType(AppErrorView), findsOneWidget);
      expect(find.text('Thử lại'), findsOneWidget);
    });

    testWidgets('renders complete character detail UI on success', (
      tester,
    ) async {
      const character = CharacterDetail(
        id: '100029-sr',
        name: 'Amai Mask',
        tier: 'SR',
        type: 'Giác Đấu',
        faction: 'Anh Hùng',
        roles: ['Hỗ Trợ', 'Hạt Nhân'],
        bio: 'Siêu sao hiệp hội anh hùng.',
        baseStats: CharacterStats(atk: 183, hp: 1099, def: 46, spd: 94),
        skills: [
          CharacterSkill(
            id: 'skill-1',
            sortOrder: 0,
            name: 'Đòn cơ bản',
            description: 'Tung 3 đòn liên hoàn',
            type: 'Kỹ năng thường',
          ),
        ],
        effects: [
          CharacterEffect(
            id: 'eff-1',
            sortOrder: 0,
            term: 'Choáng',
            description: 'Không thể hành động',
          ),
        ],
        duyen: 'Cộng sự của hiệp hội',
      );

      final fakeRepo = _FakeRepo(character: character);

      await tester.pumpWidget(
        _wrap(
          const CharacterDetailPage(characterId: '100029-sr'),
          overrides: [characterRepositoryProvider.overrideWithValue(fakeRepo)],
        ),
      );

      await tester.pumpAndSettle();

      // Verify header
      expect(find.text('Amai Mask'), findsWidgets);
      expect(find.text('SR'), findsWidgets);
      expect(find.text('Giác Đấu'), findsWidgets);
      expect(find.text('Anh Hùng'), findsWidgets);

      // Verify info & bio
      expect(find.text('Siêu sao hiệp hội anh hùng.'), findsOneWidget);
      expect(find.text('Hỗ Trợ'), findsOneWidget);
      expect(find.text('Hạt Nhân'), findsOneWidget);

      // Verify stats
      expect(find.text('183'), findsOneWidget);
      expect(find.text('1099'), findsOneWidget);

      // Verify skills
      expect(find.text('Đòn cơ bản'), findsOneWidget);
      expect(find.text('Tung 3 đòn liên hoàn'), findsOneWidget);

      // Verify effects
      expect(find.text('【Choáng】'), findsOneWidget);
      expect(find.text('Không thể hành động'), findsOneWidget);

      // Verify bonds
      expect(find.text('Cộng sự của hiệp hội'), findsOneWidget);
    });
  });
}
