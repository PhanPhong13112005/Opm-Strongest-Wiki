enum AppEnvironment {
  development,
  staging,
  production;

  static AppEnvironment parse(String value) {
    return switch (value.trim().toLowerCase()) {
      'dev' || 'development' => AppEnvironment.development,
      'stage' || 'staging' => AppEnvironment.staging,
      'prod' || 'production' => AppEnvironment.production,
      _ => throw ArgumentError.value(value, 'value', 'Unknown environment'),
    };
  }
}
