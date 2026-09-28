import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/config/app_config.dart';
import 'package:opmwiki_mobile/core/config/environment.dart';

void main() {
  test('keeps production API and asset origins separate', () {
    final config = AppConfig(
      environment: AppEnvironment.production,
      apiBaseUri: Uri.parse(productionApiBaseUrl),
      assetBaseUri: Uri.parse(productionAssetBaseUrl),
    );
    expect(config.apiBaseUri.host, 'api.opmwiki.app');
    expect(config.assetBaseUri.host, 'opmwiki.app');
  });

  test('rejects insecure production origins', () {
    expect(
      () => AppConfig(
        environment: AppEnvironment.production,
        apiBaseUri: Uri.parse('http://api.opmwiki.app'),
        assetBaseUri: Uri.parse(productionAssetBaseUrl),
      ),
      throwsArgumentError,
    );
  });

  test('parses supported environment aliases', () {
    expect(AppEnvironment.parse('prod'), AppEnvironment.production);
    expect(AppEnvironment.parse('staging'), AppEnvironment.staging);
    expect(() => AppEnvironment.parse('preview'), throwsArgumentError);
  });

  test('defaults to Vietnamese and validates the scoped locale', () {
    final defaultConfig = AppConfig(
      environment: AppEnvironment.development,
      apiBaseUri: Uri.parse('https://api.example.test'),
      assetBaseUri: Uri.parse('https://assets.example.test'),
    );
    final englishConfig = AppConfig(
      environment: AppEnvironment.development,
      apiBaseUri: Uri.parse('https://api.example.test'),
      assetBaseUri: Uri.parse('https://assets.example.test'),
      localeCode: 'EN',
    );

    expect(defaultConfig.localeCode, 'vi');
    expect(englishConfig.localeCode, 'en');
    expect(
      () => AppConfig(
        environment: AppEnvironment.development,
        apiBaseUri: Uri.parse('https://api.example.test'),
        assetBaseUri: Uri.parse('https://assets.example.test'),
        localeCode: 'ja',
      ),
      throwsArgumentError,
    );
  });
}
