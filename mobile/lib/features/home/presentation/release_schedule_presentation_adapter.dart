import '../../wiki/domain/models/character_summary.dart';
import '../domain/models/release_schedule.dart';

class ReleaseScheduleViewData {
  const ReleaseScheduleViewData({
    required this.id,
    required this.compositeKey,
    required this.server,
    required this.date,
    required this.characterId,
    required this.characterName,
    required this.bannerImageUrl,
    required this.isReturn,
  });

  final int id;
  final String compositeKey;
  final String server;
  final DateTime date;
  final String characterId;
  final String characterName;
  final Uri bannerImageUrl;
  final bool isReturn;
}

class ReleaseSchedulePresentationAdapter {
  const ReleaseSchedulePresentationAdapter();

  List<ReleaseScheduleViewData> toViewData(
    List<ReleaseScheduleEntry> entries,
    Map<String, CharacterSummary> characters,
  ) {
    return List.unmodifiable(
      entries.map((entry) {
        final characterName = characters[entry.characterId]?.name;
        final displayName = entry.overrideName.isNotEmpty
            ? entry.overrideName
            : characterName?.isNotEmpty == true
            ? characterName!
            : entry.characterId;
        return ReleaseScheduleViewData(
          id: entry.id,
          compositeKey: entry.compositeKey,
          server: entry.server,
          date: entry.date,
          characterId: entry.characterId,
          characterName: displayName,
          bannerImageUrl: entry.bannerImageUrl,
          isReturn: entry.isReturn,
        );
      }),
    );
  }
}
