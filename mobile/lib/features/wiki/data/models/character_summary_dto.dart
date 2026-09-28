class CharacterSummaryDto {
  const CharacterSummaryDto({
    required this.id,
    required this.name,
    this.imageUrl,
    required this.tier,
    required this.type,
    required this.faction,
    this.roles = const [],
    this.classLevel,
    this.keepsakeIcon,
    this.releaseSea,
    this.releaseChina,
  });

  final String id;
  final String name;
  final String? imageUrl;
  final String tier;
  final String type;
  final String faction;
  final List<String> roles;
  final String? classLevel;
  final String? keepsakeIcon;
  final String? releaseSea;
  final String? releaseChina;

  factory CharacterSummaryDto.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String || id.trim().isEmpty) {
      throw const FormatException(
        'CharacterSummaryDto requires a valid non-empty id',
      );
    }
    final name = json['name'];
    if (name is! String || name.trim().isEmpty) {
      throw const FormatException(
        'CharacterSummaryDto requires a valid non-empty name',
      );
    }

    final rawRoles = json['roles'];
    final roles = switch (rawRoles) {
      List<dynamic> list => list.whereType<String>().toList(),
      _ => const <String>[],
    };

    return CharacterSummaryDto(
      id: id.trim(),
      name: name.trim(),
      imageUrl: json['imageUrl'] as String?,
      tier: (json['tier'] as String?)?.trim() ?? 'UNKNOWN',
      type: (json['type'] as String?)?.trim() ?? 'UNKNOWN',
      faction: (json['faction'] as String?)?.trim() ?? 'UNKNOWN',
      roles: roles,
      classLevel: json['classLevel'] as String?,
      keepsakeIcon: json['keepsakeIcon'] as String?,
      releaseSea: json['releaseSea'] as String?,
      releaseChina: json['releaseChina'] as String?,
    );
  }
}
