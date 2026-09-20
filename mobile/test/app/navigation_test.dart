import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/app/bootstrap.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';

void main() {
  final config = AppConfig(
    environment: AppEnvironment.development,
    apiBaseUri: Uri.parse('https://api.example.test'),
    assetBaseUri: Uri.parse('https://assets.example.test'),
  );

  testWidgets('renders five compact destinations and preserves branch state', (
    tester,
  ) async {
    await tester.pumpWidget(createRootWidget(config));
    await tester.pumpAndSettle();
    expect(find.byType(NavigationDestination), findsNWidgets(5));
    await tester.tap(find.text('Wiki'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const Key('wiki-search-field')),
      'Saitama',
    );
    await tester.tap(find.text('Trang chủ'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Wiki'));
    await tester.pumpAndSettle();
    expect(find.text('Saitama'), findsOneWidget);
  });

  testWidgets('uses navigation rail on large layouts', (tester) async {
    tester.view.physicalSize = const Size(1200, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(createRootWidget(config));
    await tester.pumpAndSettle();
    expect(find.byType(NavigationRail), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);
  });
}
