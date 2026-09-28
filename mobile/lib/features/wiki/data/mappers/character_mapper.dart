import '../../../../core/media/media_url_resolver.dart';
import '../../domain/models/character_detail.dart';
import '../../domain/models/character_summary.dart';
import '../models/character_detail_dto.dart';
import '../models/character_summary_dto.dart';

class CharacterMapper {
  const CharacterMapper(this._mediaUrlResolver);

  final MediaUrlResolver _mediaUrlResolver;

  CharacterSummary toDomain(CharacterSummaryDto dto) {
    return CharacterSummary(
      id: dto.id,
      name: dto.name,
      imageUrl: _resolveUri(dto.imageUrl),
      tier: dto.tier,
      type: dto.type,
      faction: dto.faction,
      roles: dto.roles,
      classLevel: dto.classLevel,
      keepsakeIconUrl: _resolveUri(dto.keepsakeIcon),
      releaseSea: dto.releaseSea,
      releaseChina: dto.releaseChina,
    );
  }

  CharacterDetail toDetailDomain(CharacterDetailDto dto) {
    final sortedSkills =
        dto.skills
            .map(
              (s) => CharacterSkill(
                id: s.id,
                sortOrder: s.sortOrder,
                name: s.name,
                description: s.description,
                type: s.type,
                iconUrl: _resolveUri(s.iconUrl),
                animationUrl: _resolveUri(s.animationUrl),
                keepsakeIconUrl: _resolveUri(s.keepsakeIconUrl),
              ),
            )
            .toList()
          ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

    final sortedEffects =
        dto.effects
            .map(
              (e) => CharacterEffect(
                id: e.id,
                sortOrder: e.sortOrder,
                term: e.term,
                description: e.description,
              ),
            )
            .toList()
          ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

    final baseStats = dto.baseStats != null
        ? CharacterStats(
            atk: dto.baseStats!.atk,
            hp: dto.baseStats!.hp,
            def: dto.baseStats!.def,
            spd: dto.baseStats!.spd,
          )
        : null;

    final pvpStats = dto.pvpStats != null
        ? CharacterStats(
            atk: dto.pvpStats!.atk,
            hp: dto.pvpStats!.hp,
            def: dto.pvpStats!.def,
            spd: dto.pvpStats!.spd,
          )
        : null;

    DateTime? updatedAt;
    if (dto.updatedAt != null && dto.updatedAt!.trim().isNotEmpty) {
      updatedAt = DateTime.tryParse(dto.updatedAt!);
    }

    return CharacterDetail(
      id: dto.id,
      name: dto.name,
      imageUrl: _resolveUri(dto.imageUrl),
      tier: dto.tier,
      type: dto.type,
      faction: dto.faction,
      roles: dto.roles,
      duyen: _cleanText(dto.duyen),
      bio: _cleanText(dto.bio),
      keepsakeIconUrl: _resolveUri(dto.keepsakeIcon),
      traits: dto.traits,
      bondList: _cleanText(dto.bondList),
      classLevel: dto.classLevel,
      releaseSea: dto.releaseSea,
      releaseChina: dto.releaseChina,
      baseStats: baseStats,
      pvpStats: pvpStats,
      skills: sortedSkills,
      effects: sortedEffects,
      updatedAt: updatedAt,
    );
  }

  String? _cleanText(String? value) {
    if (value == null) return null;
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  Uri? _resolveUri(String? source) {
    if (source == null || source.trim().isEmpty) return null;
    try {
      return _mediaUrlResolver.resolve(source);
    } on FormatException {
      return null;
    }
  }
}
