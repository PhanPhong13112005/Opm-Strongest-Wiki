import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:opmwiki_mobile/app/bootstrap.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';
import 'package:opmwiki_mobile/features/home/presentation/home_page.dart';
import 'package:opmwiki_mobile/features/home/presentation/providers/release_schedule_providers.dart';
import 'package:opmwiki_mobile/shared/widgets/app_empty_state.dart';
import 'package:opmwiki_mobile/shared/widgets/app_error_view.dart';
import 'package:opmwiki_mobile/shared/widgets/app_loading.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('all five M1 destinations are reachable', (tester) async {
    final config = AppConfig(
      environment: AppEnvironment.development,
      apiBaseUri: Uri.parse('https://api.example.test'),
      assetBaseUri: Uri.parse('https://assets.example.test'),
    );
    await tester.pumpWidget(createRootWidget(config));
    await tester.pumpAndSettle();

    for (final label in [
      'Wiki',
      'Chơi',
      'Phần thưởng',
      'Cá nhân',
      'Trang chủ',
    ]) {
      await tester.tap(find.text(label));
      await tester.pumpAndSettle();
    }
    expect(find.text('OPM Wiki trên di động'), findsOneWidget);
    expect(find.byType(NavigationBar), findsOneWidget);
  });

  testWidgets('English localization is available at runtime', (tester) async {
    final config = AppConfig(
      environment: AppEnvironment.development,
      apiBaseUri: Uri.parse('https://api.example.test'),
      assetBaseUri: Uri.parse('https://assets.example.test'),
      localeCode: 'en',
    );
    await tester.pumpWidget(createRootWidget(config));
    await tester.pumpAndSettle();

    expect(find.text('OPM Wiki on mobile'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Rewards'), findsOneWidget);
  });

  testWidgets('shared loading, error, and empty states render at runtime', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(home: AppLoading(label: 'Loading records')),
    );
    expect(find.bySemanticsLabel('Loading records'), findsOneWidget);

    var retried = false;
    await tester.pumpWidget(
      MaterialApp(
        home: AppErrorView(
          title: 'Error',
          message: 'Offline',
          retryLabel: 'Retry',
          onRetry: () => retried = true,
        ),
      ),
    );
    await tester.tap(find.text('Retry'));
    expect(retried, isTrue);

    await tester.pumpWidget(
      const MaterialApp(
        home: AppEmptyState(title: 'Empty', message: 'Nothing here'),
      ),
    );
    expect(find.text('Empty'), findsOneWidget);
    expect(find.text('Nothing here'), findsOneWidget);
  });

  testWidgets(
    'production release schedule renders the authoritative 22-row response',
    (tester) async {
      final config = AppConfig(
        environment: AppEnvironment.production,
        apiBaseUri: Uri.parse(productionApiBaseUrl),
        assetBaseUri: Uri.parse(productionAssetBaseUrl),
      );
      await tester.pumpWidget(createRootWidget(config));

      final deadline = DateTime.now().add(const Duration(seconds: 60));
      while (find.text('22 lịch từ API OPM Wiki').evaluate().isEmpty &&
          DateTime.now().isBefore(deadline)) {
        await tester.pump(const Duration(milliseconds: 500));
      }

      expect(find.text('22 lịch từ API OPM Wiki'), findsOneWidget);
      expect(find.byKey(const Key('release-schedule-list')), findsOneWidget);

      final context = tester.element(find.byType(HomePage));
      final container = ProviderScope.containerOf(context, listen: false);
      final state = container.read(releaseScheduleControllerProvider);
      final keys = state.items.map((item) => item.compositeKey).toSet();

      expect(state.isFallback, isFalse);
      expect(state.items, hasLength(22));
      expect(keys, hasLength(22));
      expect(
        state.items.singleWhere((item) => item.id == 9).characterId,
        'blacksperm-urplus',
      );
      expect(
        keys,
        containsAll(const {
          'SEA|2026-09-01|1',
          'CN|2026-09-15|2',
          'SEA|2026-09-15|2',
          'SEA|2026-10-01|1',
          'CN|2026-10-15|2',
          'SEA|2026-10-15|2',
        }),
      );
    },
    timeout: const Timeout(Duration(minutes: 2)),
  );
}
