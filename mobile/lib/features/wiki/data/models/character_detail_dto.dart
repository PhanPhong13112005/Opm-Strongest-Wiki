class CharacterStatsDto {
  const CharacterStatsDto({
    this.atk = 0,
    this.hp = 0,
    this.def = 0,
    this.spd = 0,
  });

  final int atk;
  final int hp;
  final int def;
  final int spd;

  factory CharacterStatsDto.fromJson(Map<String, dynamic> json) {
    return CharacterStatsDto(
      atk: (json['atk'] as num?)?.toInt() ?? 0,
      hp: (json['hp'] as num?)?.toInt() ?? 0,
      def: (json['def'] as num?)?.toInt() ?? 0,
      spd: (json['spd'] as num?)?.toInt() ?? 0,
    );
  }
}

class CharacterSkillDto {
  const CharacterSkillDto({
    required this.id,
    this.sortOrder = 0,
    required this.name,
    this.description = '',
    this.type = '',
    this.iconUrl,
    this.animationUrl,
    this.keepsakeIconUrl,
  });

  final String id;
  final int sortOrder;
  final String name;
  final String description;
  final String type;
  final String? iconUrl;
  final String? animationUrl;
  final String? keepsakeIconUrl;

  factory CharacterSkillDto.fromJson(Map<String, dynamic> json) {
    return CharacterSkillDto(
      id: (json['id'] as String?)?.trim() ?? '',
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      name: (json['name'] as String?)?.trim() ?? '',
      description: (json['description'] as String?)?.trim() ?? '',
      type: (json['type'] as String?)?.trim() ?? '',
      iconUrl: json['iconUrl'] as String?,
      animationUrl: json['animationUrl'] as String?,
      keepsakeIconUrl: json['keepsakeIconUrl'] as String?,
    );
  }
}

class CharacterEffectDto {
  const CharacterEffectDto({
    required this.id,
    this.sortOrder = 0,
    required this.term,
    this.description = '',
  });

  final String id;
  final int sortOrder;
  final String term;
  final String description;

  factory CharacterEffectDto.fromJson(Map<String, dynamic> json) {
    return CharacterEffectDto(
      id: (json['id'] as String?)?.trim() ?? '',
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      term: (json['term'] as String?)?.trim() ?? '',
      description: (json['description'] as String?)?.trim() ?? '',
    );
  }
}

class CharacterDetailDto {
  const CharacterDetailDto({
    required this.id,
    required this.name,
    this.imageUrl,
    required this.tier,
    required this.type,
    required this.faction,
    this.roles = const [],
    this.duyen,
    this.bio,
    this.keepsakeIcon,
    this.traits = const [],
    this.bondList,
    this.classLevel,
    this.releaseSea,
    this.releaseChina,
    this.baseStats,
    this.pvpStats,
    this.skills = const [],
    this.effects = const [],
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? imageUrl;
  final String tier;
  final String type;
  final String faction;
  final List<String> roles;
  final String? duyen;
  final String? bio;
  final String? keepsakeIcon;
  final List<String> traits;
  final String? bondList;
  final String? classLevel;
  final String? releaseSea;
  final String? releaseChina;
  final CharacterStatsDto? baseStats;
  final CharacterStatsDto? pvpStats;
  final List<CharacterSkillDto> skills;
  final List<CharacterEffectDto> effects;
  final String? updatedAt;

  factory CharacterDetailDto.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String || id.trim().isEmpty) {
      throw const FormatException(
        'CharacterDetailDto requires a valid non-empty id',
      );
    }
    final name = json['name'];
    if (name is! String || name.trim().isEmpty) {
      throw const FormatException(
        'CharacterDetailDto requires a valid non-empty name',
      );
    }

    final rawRoles = json['roles'];
    final roles = switch (rawRoles) {
      List<dynamic> list => list.whereType<String>().toList(),
      _ => const <String>[],
    };

    final rawTraits = json['traits'];
    final traits = switch (rawTraits) {
      List<dynamic> list => list.whereType<String>().toList(),
      _ => const <String>[],
    };

    final rawSkills = json['skills'];
    final skills = switch (rawSkills) {
      List<dynamic> list =>
        list
            .whereType<Map<dynamic, dynamic>>()
            .map((s) => CharacterSkillDto.fromJson(s.cast<String, dynamic>()))
            .toList(),
      _ => const <CharacterSkillDto>[],
    };

    final rawEffects = json['effects'];
    final effects = switch (rawEffects) {
      List<dynamic> list =>
        list
            .whereType<Map<dynamic, dynamic>>()
            .map((e) => CharacterEffectDto.fromJson(e.cast<String, dynamic>()))
            .toList(),
      _ => const <CharacterEffectDto>[],
    };

    final rawBaseStats = json['baseStats'];
    final baseStats = rawBaseStats is Map
        ? CharacterStatsDto.fromJson(rawBaseStats.cast<String, dynamic>())
        : null;

    final rawPvpStats = json['pvpStats'];
    final pvpStats = rawPvpStats is Map
        ? CharacterStatsDto.fromJson(rawPvpStats.cast<String, dynamic>())
        : null;

    return CharacterDetailDto(
      id: id.trim(),
      name: name.trim(),
      imageUrl: json['imageUrl'] as String?,
      tier: (json['tier'] as String?)?.trim() ?? 'UNKNOWN',
      type: (json['type'] as String?)?.trim() ?? 'UNKNOWN',
      faction: (json['faction'] as String?)?.trim() ?? 'UNKNOWN',
      roles: roles,
      duyen: json['duyen'] as String?,
      bio: json['bio'] as String?,
      keepsakeIcon: json['keepsakeIcon'] as String?,
      traits: traits,
      bondList: json['bondList'] as String?,
      classLevel: json['classLevel'] as String?,
      releaseSea: json['releaseSea'] as String?,
      releaseChina: json['releaseChina'] as String?,
      baseStats: baseStats,
      pvpStats: pvpStats,
      skills: skills,
      effects: effects,
      updatedAt: json['updatedAt'] as String?,
    );
  }
}
