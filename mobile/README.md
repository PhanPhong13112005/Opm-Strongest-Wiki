# OPM Wiki Mobile

Flutter foundation for the OPM Wiki Android and iOS applications.

## M1 scope

- Five persistent tabs: Home, Wiki, Play, Rewards, and Profile.
- Compact bottom navigation and adaptive large-screen navigation rail.
- Vietnamese default localization with an English foundation.
- Environment-validated, read-only Dio client.
- Separate API and media origins with safe media URL resolution.
- Rewards locked by default and no authentication or secure storage.

## Requirements

- Flutter 3.47.5 / Dart 3.13.4.
- Android SDK with API 24 or later for Android builds.
- macOS and Xcode for iOS builds (deployment target 15.0).

## Run and validate

```shell
flutter pub get
flutter gen-l10n
flutter analyze
flutter test
flutter test integration_test
flutter run
```

Production defaults are `https://api.opmwiki.app` for JSON APIs and
`https://opmwiki.app` for media. Override only through compile-time defines:

```shell
flutter run --dart-define=OPMWIKI_ENV=staging \
  --dart-define=OPMWIKI_API_BASE_URL=https://api-staging.example.test \
  --dart-define=OPMWIKI_ASSET_BASE_URL=https://staging.example.test
```

`OPMWIKI_REWARDS_ENABLED` defaults to `false`. Enabling it in M1 only changes
the preview badge; it does not add balances, coupons, authentication, or writes.
