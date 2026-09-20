# OPM Wiki Mobile — Current Handoff

## Checkpoint

- Checkpoint: M1 Mobile Foundation.
- Baseline: `dc293046c71088bdbcc223a99ba70940d34d54f6`.
- Branch: `codex/mobile-m1-foundation`.
- Worktree: `D:\Code\OpmWiki-mobile-m1`.
- Flutter: 3.47.5 stable.
- Dart: 3.13.4.

## Implemented

- Android/iOS Flutter scaffold with application ID `app.opmwiki.mobile`, display
  name `OPM Wiki`, Android min API 24 and iOS min version 15.0.
- Five state-preserving branches with adaptive bottom navigation/navigation rail.
- Vietnamese default UI, English foundation and OPM Wiki dark design tokens.
- Validated API/media origins, safe media URL handling, read-only Dio client,
  safe non-production diagnostics and stable error mapping.
- Loading, empty and retryable error widgets plus unit/widget/integration coverage.
- Rewards feature gate defaults off; Profile remains guest-only.

## Validation status

- `flutter pub get`: passed; dependency lockfile updated.
- `flutter gen-l10n`: passed.
- `dart format lib test integration_test`: passed.
- `flutter analyze`: passed with no issues.
- `flutter test test`: passed, 14 unit/widget tests.
- `flutter test integration_test`: not executed because no supported Android/iOS
  device is connected. The smoke test source is present.
- Android APK: not executed because Android SDK/ADB is unavailable on this host.
- iOS: not executable on Windows; macOS/Xcode is required.

M1 is therefore `IMPLEMENTED_UNVERIFIED`: source-level validation is green, but
native Android and iOS build verification remains outstanding.

## Explicitly not implemented

- No production content repository or M2 content screens.
- No Play game, authentication, secure storage, payments, balances or coupons.
- No backend, database, production configuration or deployment changes.

## M2 prerequisites

1. Resolve and document release-schedule contract parity: the audited sources
   currently expose 16 versus 22 entries. Do not silently choose one source.
2. Freeze the public character/release DTOs and paging/error semantics.
3. Confirm representative API and asset fixtures for mobile contract tests.
4. Provide Android SDK/CI and macOS/Xcode CI for platform packaging verification.
