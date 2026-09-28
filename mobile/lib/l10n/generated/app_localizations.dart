import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_vi.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('vi'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In vi, this message translates to:
  /// **'OPM Wiki'**
  String get appTitle;

  /// No description provided for @homeTab.
  ///
  /// In vi, this message translates to:
  /// **'Trang chủ'**
  String get homeTab;

  /// No description provided for @wikiTab.
  ///
  /// In vi, this message translates to:
  /// **'Wiki'**
  String get wikiTab;

  /// No description provided for @playTab.
  ///
  /// In vi, this message translates to:
  /// **'Chơi'**
  String get playTab;

  /// No description provided for @rewardsTab.
  ///
  /// In vi, this message translates to:
  /// **'Phần thưởng'**
  String get rewardsTab;

  /// No description provided for @profileTab.
  ///
  /// In vi, this message translates to:
  /// **'Cá nhân'**
  String get profileTab;

  /// No description provided for @homeTitle.
  ///
  /// In vi, this message translates to:
  /// **'OPM Wiki trên di động'**
  String get homeTitle;

  /// No description provided for @homeSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Tra cứu dữ liệu One Punch Man: The Strongest nhanh, rõ ràng và nhất quán.'**
  String get homeSubtitle;

  /// No description provided for @homeFoundation.
  ///
  /// In vi, this message translates to:
  /// **'Nền tảng M1'**
  String get homeFoundation;

  /// No description provided for @homeFoundationBody.
  ///
  /// In vi, this message translates to:
  /// **'Khung ứng dụng, điều hướng, cấu hình môi trường và lớp mạng chỉ đọc đã sẵn sàng.'**
  String get homeFoundationBody;

  /// No description provided for @releaseScheduleTitle.
  ///
  /// In vi, this message translates to:
  /// **'Lịch ra mắt nhân vật'**
  String get releaseScheduleTitle;

  /// No description provided for @releaseScheduleCount.
  ///
  /// In vi, this message translates to:
  /// **'{count} lịch từ API OPM Wiki'**
  String releaseScheduleCount(int count);

  /// No description provided for @releaseScheduleNew.
  ///
  /// In vi, this message translates to:
  /// **'Ra mắt'**
  String get releaseScheduleNew;

  /// No description provided for @releaseScheduleReturn.
  ///
  /// In vi, this message translates to:
  /// **'Trở lại'**
  String get releaseScheduleReturn;

  /// No description provided for @releaseScheduleCached.
  ///
  /// In vi, this message translates to:
  /// **'Đang hiển thị dữ liệu API đã tải gần nhất vì kết nối hiện tại không khả dụng.'**
  String get releaseScheduleCached;

  /// No description provided for @releaseScheduleEmpty.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có lịch ra mắt nào từ máy chủ.'**
  String get releaseScheduleEmpty;

  /// No description provided for @wikiTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thư viện Wiki'**
  String get wikiTitle;

  /// No description provided for @wikiSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Nội dung nhân vật và dữ liệu tra cứu sẽ được kết nối trong M2.'**
  String get wikiSubtitle;

  /// No description provided for @wikiSearchHint.
  ///
  /// In vi, this message translates to:
  /// **'Tìm nhân vật...'**
  String get wikiSearchHint;

  /// No description provided for @playTitle.
  ///
  /// In vi, this message translates to:
  /// **'Khu vực chơi'**
  String get playTitle;

  /// No description provided for @playSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Tính năng tương tác sẽ được phát triển sau khi nền tảng nội dung ổn định.'**
  String get playSubtitle;

  /// No description provided for @rewardsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Phần thưởng'**
  String get rewardsTitle;

  /// No description provided for @rewardsSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Tính năng này đang bị khóa và chưa kết nối giao dịch hay số dư.'**
  String get rewardsSubtitle;

  /// No description provided for @profileTitle.
  ///
  /// In vi, this message translates to:
  /// **'Hồ sơ khách'**
  String get profileTitle;

  /// No description provided for @profileSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập dự kiến ở M3; M1 không lưu thông tin xác thực.'**
  String get profileSubtitle;

  /// No description provided for @comingSoon.
  ///
  /// In vi, this message translates to:
  /// **'Sắp ra mắt'**
  String get comingSoon;

  /// No description provided for @loadingLabel.
  ///
  /// In vi, this message translates to:
  /// **'Đang tải...'**
  String get loadingLabel;

  /// No description provided for @errorTitle.
  ///
  /// In vi, this message translates to:
  /// **'Không thể tải dữ liệu'**
  String get errorTitle;

  /// No description provided for @emptyTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có dữ liệu'**
  String get emptyTitle;

  /// No description provided for @retryLabel.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại'**
  String get retryLabel;

  /// No description provided for @noCharactersFound.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy nhân vật nào phù hợp'**
  String get noCharactersFound;

  /// No description provided for @charactersCount.
  ///
  /// In vi, this message translates to:
  /// **'{count} nhân vật'**
  String charactersCount(int count);

  /// No description provided for @characterDetailTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chi tiết nhân vật'**
  String get characterDetailTitle;

  /// No description provided for @characterNotFound.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy thông tin nhân vật'**
  String get characterNotFound;

  /// No description provided for @characterNotFoundDescription.
  ///
  /// In vi, this message translates to:
  /// **'Nhân vật này có thể không tồn tại hoặc đã bị xóa.'**
  String get characterNotFoundDescription;

  /// No description provided for @characterBio.
  ///
  /// In vi, this message translates to:
  /// **'Tiểu sử'**
  String get characterBio;

  /// No description provided for @characterSkills.
  ///
  /// In vi, this message translates to:
  /// **'Kỹ năng'**
  String get characterSkills;

  /// No description provided for @characterEffects.
  ///
  /// In vi, this message translates to:
  /// **'Hiệu ứng kỹ năng'**
  String get characterEffects;

  /// No description provided for @characterStats.
  ///
  /// In vi, this message translates to:
  /// **'Chỉ số'**
  String get characterStats;

  /// No description provided for @baseStats.
  ///
  /// In vi, this message translates to:
  /// **'Chỉ số cơ bản'**
  String get baseStats;

  /// No description provided for @pvpStats.
  ///
  /// In vi, this message translates to:
  /// **'Chỉ số PvP'**
  String get pvpStats;

  /// No description provided for @characterBonds.
  ///
  /// In vi, this message translates to:
  /// **'Duyên phận'**
  String get characterBonds;

  /// No description provided for @releaseSeaLabel.
  ///
  /// In vi, this message translates to:
  /// **'Phát hành SEA'**
  String get releaseSeaLabel;

  /// No description provided for @releaseChinaLabel.
  ///
  /// In vi, this message translates to:
  /// **'Phát hành Trung Quốc'**
  String get releaseChinaLabel;

  /// No description provided for @rolesLabel.
  ///
  /// In vi, this message translates to:
  /// **'Vai trò'**
  String get rolesLabel;

  /// No description provided for @classLevelLabel.
  ///
  /// In vi, this message translates to:
  /// **'Xếp lớp'**
  String get classLevelLabel;

  /// No description provided for @statAtk.
  ///
  /// In vi, this message translates to:
  /// **'Công'**
  String get statAtk;

  /// No description provided for @statHp.
  ///
  /// In vi, this message translates to:
  /// **'Máu'**
  String get statHp;

  /// No description provided for @statDef.
  ///
  /// In vi, this message translates to:
  /// **'Thủ'**
  String get statDef;

  /// No description provided for @statSpd.
  ///
  /// In vi, this message translates to:
  /// **'Tốc'**
  String get statSpd;

  /// No description provided for @backLabel.
  ///
  /// In vi, this message translates to:
  /// **'Quay lại'**
  String get backLabel;

  /// No description provided for @charactersTab.
  ///
  /// In vi, this message translates to:
  /// **'Nhân vật'**
  String get charactersTab;

  /// No description provided for @tierListTab.
  ///
  /// In vi, this message translates to:
  /// **'Bảng xếp hạng'**
  String get tierListTab;

  /// No description provided for @tierListTitle.
  ///
  /// In vi, this message translates to:
  /// **'Bảng xếp hạng cộng đồng'**
  String get tierListTitle;

  /// No description provided for @tierListSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Bình chọn sức mạnh nhân vật theo tháng'**
  String get tierListSubtitle;

  /// No description provided for @voteMonthLabel.
  ///
  /// In vi, this message translates to:
  /// **'Tháng: {month}'**
  String voteMonthLabel(String month);

  /// No description provided for @totalVotesLabel.
  ///
  /// In vi, this message translates to:
  /// **'{count} lượt bình chọn'**
  String totalVotesLabel(int count);

  /// No description provided for @totalVotersLabel.
  ///
  /// In vi, this message translates to:
  /// **'{count} người tham gia'**
  String totalVotersLabel(int count);

  /// No description provided for @votesCount.
  ///
  /// In vi, this message translates to:
  /// **'{count} phiếu'**
  String votesCount(int count);

  /// No description provided for @rankLabel.
  ///
  /// In vi, this message translates to:
  /// **'#{rank}'**
  String rankLabel(int rank);

  /// No description provided for @noTierRankingsFound.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có dữ liệu bình chọn cho tháng này'**
  String get noTierRankingsFound;

  /// No description provided for @allTiers.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả'**
  String get allTiers;

  /// No description provided for @viewCharacterDetail.
  ///
  /// In vi, this message translates to:
  /// **'Xem nhân vật'**
  String get viewCharacterDetail;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'vi'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'vi':
      return AppLocalizationsVi();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
