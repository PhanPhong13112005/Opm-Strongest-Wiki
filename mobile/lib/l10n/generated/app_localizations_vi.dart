// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Vietnamese (`vi`).
class AppLocalizationsVi extends AppLocalizations {
  AppLocalizationsVi([String locale = 'vi']) : super(locale);

  @override
  String get appTitle => 'OPM Wiki';

  @override
  String get homeTab => 'Trang chủ';

  @override
  String get wikiTab => 'Wiki';

  @override
  String get playTab => 'Chơi';

  @override
  String get rewardsTab => 'Phần thưởng';

  @override
  String get profileTab => 'Cá nhân';

  @override
  String get homeTitle => 'OPM Wiki trên di động';

  @override
  String get homeSubtitle =>
      'Tra cứu dữ liệu One Punch Man: The Strongest nhanh, rõ ràng và nhất quán.';

  @override
  String get homeFoundation => 'Nền tảng M1';

  @override
  String get homeFoundationBody =>
      'Khung ứng dụng, điều hướng, cấu hình môi trường và lớp mạng chỉ đọc đã sẵn sàng.';

  @override
  String get releaseScheduleTitle => 'Lịch ra mắt nhân vật';

  @override
  String releaseScheduleCount(int count) {
    return '$count lịch từ API OPM Wiki';
  }

  @override
  String get releaseScheduleNew => 'Ra mắt';

  @override
  String get releaseScheduleReturn => 'Trở lại';

  @override
  String get releaseScheduleCached =>
      'Đang hiển thị dữ liệu API đã tải gần nhất vì kết nối hiện tại không khả dụng.';

  @override
  String get releaseScheduleEmpty => 'Chưa có lịch ra mắt nào từ máy chủ.';

  @override
  String get wikiTitle => 'Thư viện Wiki';

  @override
  String get wikiSubtitle =>
      'Nội dung nhân vật và dữ liệu tra cứu sẽ được kết nối trong M2.';

  @override
  String get wikiSearchHint => 'Tìm nhân vật...';

  @override
  String get playTitle => 'Khu vực chơi';

  @override
  String get playSubtitle =>
      'Tính năng tương tác sẽ được phát triển sau khi nền tảng nội dung ổn định.';

  @override
  String get rewardsTitle => 'Phần thưởng';

  @override
  String get rewardsSubtitle =>
      'Tính năng này đang bị khóa và chưa kết nối giao dịch hay số dư.';

  @override
  String get profileTitle => 'Hồ sơ khách';

  @override
  String get profileSubtitle =>
      'Đăng nhập dự kiến ở M3; M1 không lưu thông tin xác thực.';

  @override
  String get comingSoon => 'Sắp ra mắt';

  @override
  String get loadingLabel => 'Đang tải...';

  @override
  String get errorTitle => 'Không thể tải dữ liệu';

  @override
  String get emptyTitle => 'Chưa có dữ liệu';

  @override
  String get retryLabel => 'Thử lại';

  @override
  String get noCharactersFound => 'Không tìm thấy nhân vật nào phù hợp';

  @override
  String charactersCount(int count) {
    return '$count nhân vật';
  }

  @override
  String get characterDetailTitle => 'Chi tiết nhân vật';

  @override
  String get characterNotFound => 'Không tìm thấy thông tin nhân vật';

  @override
  String get characterNotFoundDescription =>
      'Nhân vật này có thể không tồn tại hoặc đã bị xóa.';

  @override
  String get characterBio => 'Tiểu sử';

  @override
  String get characterSkills => 'Kỹ năng';

  @override
  String get characterEffects => 'Hiệu ứng kỹ năng';

  @override
  String get characterStats => 'Chỉ số';

  @override
  String get baseStats => 'Chỉ số cơ bản';

  @override
  String get pvpStats => 'Chỉ số PvP';

  @override
  String get characterBonds => 'Duyên phận';

  @override
  String get releaseSeaLabel => 'Phát hành SEA';

  @override
  String get releaseChinaLabel => 'Phát hành Trung Quốc';

  @override
  String get rolesLabel => 'Vai trò';

  @override
  String get classLevelLabel => 'Xếp lớp';

  @override
  String get statAtk => 'Công';

  @override
  String get statHp => 'Máu';

  @override
  String get statDef => 'Thủ';

  @override
  String get statSpd => 'Tốc';

  @override
  String get backLabel => 'Quay lại';

  @override
  String get charactersTab => 'Nhân vật';

  @override
  String get tierListTab => 'Bảng xếp hạng';

  @override
  String get tierListTitle => 'Bảng xếp hạng cộng đồng';

  @override
  String get tierListSubtitle => 'Bình chọn sức mạnh nhân vật theo tháng';

  @override
  String voteMonthLabel(String month) {
    return 'Tháng: $month';
  }

  @override
  String totalVotesLabel(int count) {
    return '$count lượt bình chọn';
  }

  @override
  String totalVotersLabel(int count) {
    return '$count người tham gia';
  }

  @override
  String votesCount(int count) {
    return '$count phiếu';
  }

  @override
  String rankLabel(int rank) {
    return '#$rank';
  }

  @override
  String get noTierRankingsFound => 'Chưa có dữ liệu bình chọn cho tháng này';

  @override
  String get allTiers => 'Tất cả';

  @override
  String get viewCharacterDetail => 'Xem nhân vật';
}
