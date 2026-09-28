import 'package:flutter/foundation.dart';

@immutable
class ReleaseScheduleEntry {
  const ReleaseScheduleEntry({
    required this.id,
    required this.server,
    required this.date,
    required this.characterId,
    required this.bannerImageUrl,
    required this.isReturn,
    required this.sortOrder,
    this.overrideName = '',
    this.overrideTier = '',
    this.overrideFaction = '',
    this.overrideType = '',
    this.overrideRole = '',
  });

  final int id;
  final String server;
  final DateTime date;
  final String characterId;
  final Uri bannerImageUrl;
  final bool isReturn;
  final int sortOrder;
  final String overrideName;
  final String overrideTier;
  final String overrideFaction;
  final String overrideType;
  final String overrideRole;

  String get compositeKey =>
      '$server|${date.toIso8601String().substring(0, 10)}|$sortOrder';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ReleaseScheduleEntry &&
          id == other.id &&
          server == other.server &&
          date == other.date &&
          characterId == other.characterId &&
          bannerImageUrl == other.bannerImageUrl &&
          isReturn == other.isReturn &&
          sortOrder == other.sortOrder &&
          overrideName == other.overrideName &&
          overrideTier == other.overrideTier &&
          overrideFaction == other.overrideFaction &&
          overrideType == other.overrideType &&
          overrideRole == other.overrideRole;

  @override
  int get hashCode => Object.hash(
    id,
    server,
    date,
    characterId,
    bannerImageUrl,
    isReturn,
    sortOrder,
    overrideName,
    overrideTier,
    overrideFaction,
    overrideType,
    overrideRole,
  );
}

@immutable
class ReleaseScheduleFeed {
  const ReleaseScheduleFeed({required this.entries, required this.isFallback});

  final List<ReleaseScheduleEntry> entries;
  final bool isFallback;
}
