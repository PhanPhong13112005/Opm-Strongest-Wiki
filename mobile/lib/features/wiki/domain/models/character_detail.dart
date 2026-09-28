class CharacterStats {
  const CharacterStats({this.atk = 0, this.hp = 0, this.def = 0, this.spd = 0});

  final int atk;
  final int hp;
  final int def;
  final int spd;

  bool get isNonZero => atk > 0 || hp > 0 || def > 0 || spd > 0;
}

class CharacterSkill {
  const CharacterSkill({
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
  final Uri? iconUrl;
  final Uri? animationUrl;
  final Uri? keepsakeIconUrl;

  bool get hasIcon => iconUrl != null;
}

class CharacterEffect {
  const CharacterEffect({
    required this.id,
    this.sortOrder = 0,
    required this.term,
    this.description = '',
  });

  final String id;
  final int sortOrder;
  final String term;
  final String description;
}

class CharacterDetail {
  const CharacterDetail({
    required this.id,
    required this.name,
    this.imageUrl,
    required this.tier,
    required this.type,
    required this.faction,
    this.roles = const [],
    this.duyen,
    this.bio,
    this.keepsakeIconUrl,
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
  final Uri? imageUrl;
  final String tier;
  final String type;
  final String faction;
  final List<String> roles;
  final String? duyen;
  final String? bio;
  final Uri? keepsakeIconUrl;
  final List<String> traits;
  final String? bondList;
  final String? classLevel;
  final String? releaseSea;
  final String? releaseChina;
  final CharacterStats? baseStats;
  final CharacterStats? pvpStats;
  final List<CharacterSkill> skills;
  final List<CharacterEffect> effects;
  final DateTime? updatedAt;

  bool get hasImage => imageUrl != null;
  bool get hasSkills => skills.isNotEmpty;
  bool get hasEffects => effects.isNotEmpty;
  bool get hasBaseStats => baseStats != null && baseStats!.isNonZero;
  bool get hasPvpStats => pvpStats != null && pvpStats!.isNonZero;
  bool get hasBonds =>
      (duyen != null && duyen!.trim().isNotEmpty) ||
      (bondList != null && bondList!.trim().isNotEmpty);
}
