import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/shared/widgets/app_empty_state.dart';
import 'package:opmwiki_mobile/shared/widgets/app_error_view.dart';
import 'package:opmwiki_mobile/shared/widgets/app_loading.dart';

void main() {
  testWidgets('loading state exposes an accessible label', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: AppLoading(label: 'Loading records')),
    );
    expect(find.bySemanticsLabel('Loading records'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('error state invokes retry', (tester) async {
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
  });

  testWidgets('empty state renders title and message', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: AppEmptyState(title: 'Empty', message: 'Nothing here'),
      ),
    );
    expect(find.text('Empty'), findsOneWidget);
    expect(find.text('Nothing here'), findsOneWidget);
  });
}
