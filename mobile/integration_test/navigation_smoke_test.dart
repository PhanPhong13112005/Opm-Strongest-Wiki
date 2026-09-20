import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:opmwiki_mobile/app/bootstrap.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';

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
}
