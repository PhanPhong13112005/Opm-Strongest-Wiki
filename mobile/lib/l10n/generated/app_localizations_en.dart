// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'OPM Wiki';

  @override
  String get homeTab => 'Home';

  @override
  String get wikiTab => 'Wiki';

  @override
  String get playTab => 'Play';

  @override
  String get rewardsTab => 'Rewards';

  @override
  String get profileTab => 'Profile';

  @override
  String get homeTitle => 'OPM Wiki on mobile';

  @override
  String get homeSubtitle =>
      'Browse One Punch Man: The Strongest data quickly, clearly, and consistently.';

  @override
  String get homeFoundation => 'M1 foundation';

  @override
  String get homeFoundationBody =>
      'App shell, navigation, environment configuration, and read-only networking are ready.';

  @override
  String get wikiTitle => 'Wiki library';

  @override
  String get wikiSubtitle =>
      'Character content and searchable data will be connected in M2.';

  @override
  String get wikiSearchHint => 'Search characters...';

  @override
  String get playTitle => 'Play area';

  @override
  String get playSubtitle =>
      'Interactive features will follow after the content foundation is stable.';

  @override
  String get rewardsTitle => 'Rewards';

  @override
  String get rewardsSubtitle =>
      'This feature is locked and has no balance or transaction integration.';

  @override
  String get profileTitle => 'Guest profile';

  @override
  String get profileSubtitle =>
      'Sign-in is planned for M3; M1 stores no credentials.';

  @override
  String get comingSoon => 'Coming soon';

  @override
  String get loadingLabel => 'Loading...';

  @override
  String get errorTitle => 'Unable to load data';

  @override
  String get emptyTitle => 'No data yet';

  @override
  String get retryLabel => 'Retry';
}
