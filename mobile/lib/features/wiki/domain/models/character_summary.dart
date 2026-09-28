class CharacterSummary {
  const CharacterSummary({
    required this.id,
    required this.name,
    this.imageUrl,
    required this.tier,
    required this.type,
    required this.faction,
    this.roles = const [],
    this.classLevel,
    this.keepsakeIconUrl,
    this.releaseSea,
    this.releaseChina,
  });

  final String id;
  final String name;
  final Uri? imageUrl;
  final String tier;
  final String type;
  final String faction;
  final List<String> roles;
  final String? classLevel;
  final Uri? keepsakeIconUrl;
  final String? releaseSea;
  final String? releaseChina;

  bool get hasImage => imageUrl != null;
}
