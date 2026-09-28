// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/app/bootstrap.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';

void main() {
  testWidgets('bootstraps with Vietnamese Home by default', (tester) async {
    await tester.pumpWidget(createRootWidget(_testConfig()));
    await tester.pumpAndSettle();
    expect(find.text('OPM Wiki trên di động'), findsOneWidget);
    expect(find.text('Trang chủ'), findsOneWidget);
  });

  testWidgets('can bootstrap with the supported English locale', (
    tester,
  ) async {
    await tester.pumpWidget(createRootWidget(_testConfig(localeCode: 'en')));
    await tester.pumpAndSettle();
    expect(find.text('OPM Wiki on mobile'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
  });
}

AppConfig _testConfig({String localeCode = 'vi'}) => AppConfig(
  environment: AppEnvironment.development,
  apiBaseUri: Uri.parse('https://api.example.test'),
  assetBaseUri: Uri.parse('https://assets.example.test'),
  localeCode: localeCode,
);
