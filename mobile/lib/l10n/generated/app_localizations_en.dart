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
  String get releaseScheduleTitle => 'Character release schedule';

  @override
  String releaseScheduleCount(int count) {
    return '$count entries from the OPM Wiki API';
  }

  @override
  String get releaseScheduleNew => 'Release';

  @override
  String get releaseScheduleReturn => 'Return';

  @override
  String get releaseScheduleCached =>
      'Showing the last successfully loaded API data because the current connection is unavailable.';

  @override
  String get releaseScheduleEmpty =>
      'No release schedule is available from the server.';

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

  @override
  String get noCharactersFound => 'No matching characters found';

  @override
  String charactersCount(int count) {
    return '$count characters';
  }

  @override
  String get characterDetailTitle => 'Character Detail';

  @override
  String get characterNotFound => 'Character not found';

  @override
  String get characterNotFoundDescription =>
      'This character may not exist or has been removed.';

  @override
  String get characterBio => 'Biography';

  @override
  String get characterSkills => 'Skills';

  @override
  String get characterEffects => 'Skill Effects';

  @override
  String get characterStats => 'Stats';

  @override
  String get baseStats => 'Base Stats';

  @override
  String get pvpStats => 'PvP Stats';

  @override
  String get characterBonds => 'Bonds';

  @override
  String get releaseSeaLabel => 'SEA Release';

  @override
  String get releaseChinaLabel => 'China Release';

  @override
  String get rolesLabel => 'Roles';

  @override
  String get classLevelLabel => 'Class';

  @override
  String get statAtk => 'ATK';

  @override
  String get statHp => 'HP';

  @override
  String get statDef => 'DEF';

  @override
  String get statSpd => 'SPD';

  @override
  String get backLabel => 'Back';

  @override
  String get charactersTab => 'Characters';

  @override
  String get tierListTab => 'Tier List';

  @override
  String get tierListTitle => 'Community Tier List';

  @override
  String get tierListSubtitle => 'Monthly character power rankings';

  @override
  String voteMonthLabel(String month) {
    return 'Month: $month';
  }

  @override
  String totalVotesLabel(int count) {
    return '$count votes cast';
  }

  @override
  String totalVotersLabel(int count) {
    return '$count participants';
  }

  @override
  String votesCount(int count) {
    return '$count votes';
  }

  @override
  String rankLabel(int rank) {
    return '#$rank';
  }

  @override
  String get noTierRankingsFound => 'No ranking data available for this month';

  @override
  String get allTiers => 'All';

  @override
  String get viewCharacterDetail => 'View character';
}
