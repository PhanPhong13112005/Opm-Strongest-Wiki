class ReleaseScheduleDto {
  const ReleaseScheduleDto({
    required this.id,
    required this.server,
    required this.date,
    required this.characterId,
    required this.bannerImage,
    required this.isReturn,
    required this.overrideName,
    required this.overrideTier,
    required this.overrideFaction,
    required this.overrideType,
    required this.overrideRole,
    required this.overrideNameVi,
    required this.overrideNameEn,
    required this.overrideFactionVi,
    required this.overrideFactionEn,
    required this.overrideTypeVi,
    required this.overrideTypeEn,
    required this.overrideRoleVi,
    required this.overrideRoleEn,
    required this.sortOrder,
  });

  final int id;
  final String server;
  final String date;
  final String characterId;
  final String bannerImage;
  final bool isReturn;
  final String overrideName;
  final String overrideTier;
  final String overrideFaction;
  final String overrideType;
  final String overrideRole;
  final String overrideNameVi;
  final String overrideNameEn;
  final String overrideFactionVi;
  final String overrideFactionEn;
  final String overrideTypeVi;
  final String overrideTypeEn;
  final String overrideRoleVi;
  final String overrideRoleEn;
  final int sortOrder;

  String get compositeKey => '$server|$date|$sortOrder';

  factory ReleaseScheduleDto.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final server = json['server'];
    final date = json['date'];
    final characterId = json['characterId'];
    final bannerImage = json['bannerImage'];
    final isReturn = json['isReturn'];
    final sortOrder = json['sortOrder'];

    if (id is! int || id < 1) {
      throw const FormatException('Release schedule requires a positive id');
    }
    if (server is! String || !const {'CN', 'SEA'}.contains(server)) {
      throw const FormatException('Release schedule has an invalid server');
    }
    if (date is! String ||
        !RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(date) ||
        DateTime.tryParse(date) == null) {
      throw const FormatException('Release schedule has an invalid date');
    }
    if (characterId is! String || characterId.trim().isEmpty) {
      throw const FormatException('Release schedule requires a character id');
    }
    if (bannerImage is! String || bannerImage.trim().isEmpty) {
      throw const FormatException('Release schedule requires a banner image');
    }
    if (isReturn is! bool) {
      throw const FormatException('Release schedule requires isReturn');
    }
    if (sortOrder is! int || sortOrder < 1) {
      throw const FormatException(
        'Release schedule requires a positive sortOrder',
      );
    }

    String optionalString(String key) => (json[key] as String?)?.trim() ?? '';

    return ReleaseScheduleDto(
      id: id,
      server: server,
      date: date,
      characterId: characterId.trim(),
      bannerImage: bannerImage.trim(),
      isReturn: isReturn,
      overrideName: optionalString('overrideName'),
      overrideTier: optionalString('overrideTier'),
      overrideFaction: optionalString('overrideFaction'),
      overrideType: optionalString('overrideType'),
      overrideRole: optionalString('overrideRole'),
      overrideNameVi: optionalString('overrideNameVi'),
      overrideNameEn: optionalString('overrideNameEn'),
      overrideFactionVi: optionalString('overrideFactionVi'),
      overrideFactionEn: optionalString('overrideFactionEn'),
      overrideTypeVi: optionalString('overrideTypeVi'),
      overrideTypeEn: optionalString('overrideTypeEn'),
      overrideRoleVi: optionalString('overrideRoleVi'),
      overrideRoleEn: optionalString('overrideRoleEn'),
      sortOrder: sortOrder,
    );
  }
}
