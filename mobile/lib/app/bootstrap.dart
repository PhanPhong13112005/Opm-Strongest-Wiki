import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/app_config.dart';
import 'app.dart';

Widget createRootWidget(AppConfig config) {
  return ProviderScope(
    overrides: [appConfigProvider.overrideWithValue(config)],
    child: const OpmWikiApp(),
  );
}

void bootstrap(AppConfig config) => runApp(createRootWidget(config));
