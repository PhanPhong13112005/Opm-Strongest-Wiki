import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'environment.dart';

const productionApiBaseUrl = 'https://api.opmwiki.app';
const productionAssetBaseUrl = 'https://opmwiki.app';

final appConfigProvider = Provider<AppConfig>((ref) {
  throw StateError('AppConfig must be supplied at bootstrap.');
});

class AppConfig {
  AppConfig({
    required this.environment,
    required Uri apiBaseUri,
    required Uri assetBaseUri,
    this.rewardsEnabled = false,
  }) : apiBaseUri = _validateBaseUri(
         apiBaseUri,
         environment: environment,
         fieldName: 'apiBaseUri',
       ),
       assetBaseUri = _validateBaseUri(
         assetBaseUri,
         environment: environment,
         fieldName: 'assetBaseUri',
       );

  final AppEnvironment environment;
  final Uri apiBaseUri;
  final Uri assetBaseUri;
  final bool rewardsEnabled;

  bool get isProduction => environment == AppEnvironment.production;

  factory AppConfig.fromEnvironment() {
    const environmentValue = String.fromEnvironment(
      'OPMWIKI_ENV',
      defaultValue: 'development',
    );
    const apiBaseUrl = String.fromEnvironment(
      'OPMWIKI_API_BASE_URL',
      defaultValue: productionApiBaseUrl,
    );
    const assetBaseUrl = String.fromEnvironment(
      'OPMWIKI_ASSET_BASE_URL',
      defaultValue: productionAssetBaseUrl,
    );
    const rewardsEnabled = bool.fromEnvironment(
      'OPMWIKI_REWARDS_ENABLED',
      defaultValue: false,
    );
    return AppConfig(
      environment: AppEnvironment.parse(environmentValue),
      apiBaseUri: Uri.parse(apiBaseUrl),
      assetBaseUri: Uri.parse(assetBaseUrl),
      rewardsEnabled: rewardsEnabled,
    );
  }

  static Uri _validateBaseUri(
    Uri value, {
    required AppEnvironment environment,
    required String fieldName,
  }) {
    if (!value.isAbsolute || !{'http', 'https'}.contains(value.scheme)) {
      throw ArgumentError.value(value, fieldName, 'Must be an HTTP(S) URL');
    }
    if (value.host.isEmpty ||
        value.hasQuery ||
        value.hasFragment ||
        value.userInfo.isNotEmpty) {
      throw ArgumentError.value(value, fieldName, 'Must be a clean origin URL');
    }
    if (environment == AppEnvironment.production && value.scheme != 'https') {
      throw ArgumentError.value(value, fieldName, 'Production requires HTTPS');
    }
    final normalizedPath = value.path == '/'
        ? ''
        : value.path.replaceFirst(RegExp(r'/+$'), '');
    return value.replace(path: normalizedPath);
  }
}
