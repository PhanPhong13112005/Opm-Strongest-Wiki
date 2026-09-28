import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/features/wiki/data/models/character_detail_dto.dart';

void main() {
  group('CharacterDetailDto', () {
    test('deserializes character_detail_vi.json fixture accurately', () {
      final file = File('test/fixtures/api/character_detail_vi.json');
      final jsonMap =
          jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;

      final dto = CharacterDetailDto.fromJson(jsonMap);

      expect(dto.id, '100029-sr');
      expect(dto.name, 'Amai Mask');
      expect(dto.imageUrl, '/Characters/Amai Mask (SR)/sr.png');
      expect(dto.tier, 'SR');
      expect(dto.type, 'Giác Đấu');
      expect(dto.faction, 'Anh Hùng');
      expect(dto.roles, containsAll(['Hỗ Trợ', 'Hạt Nhân']));
      expect(dto.classLevel, 'A');
      expect(dto.keepsakeIcon, '/Keepsake/Amai Mask (SR)/Keepsake_SR.png');
      expect(dto.releaseSea, isNull);
      expect(dto.releaseChina, isNull);

      expect(dto.baseStats, isNotNull);
      expect(dto.baseStats!.atk, 183);
      expect(dto.baseStats!.hp, 1099);
      expect(dto.baseStats!.def, 46);
      expect(dto.baseStats!.spd, 94);

      expect(dto.pvpStats, isNotNull);
      expect(dto.pvpStats!.atk, 0);

      expect(dto.skills, hasLength(1));
      final skill = dto.skills.first;
      expect(skill.id, '7ca9a9f7-6cb2-465f-a0ce-03761ffa4995');
      expect(skill.sortOrder, 0);
      expect(skill.name, 'Cơ bản');
      expect(skill.type, 'Kỹ năng thường');
      expect(skill.iconUrl, '/Skill/Amai Mask (SR)/Skill_base.png');
      expect(skill.animationUrl, isNull);

      expect(dto.effects, isEmpty);
      expect(dto.updatedAt, '2026-07-22T17:54:00.243836+07:00');
    });

    test('throws FormatException when id is missing or empty', () {
      expect(
        () => CharacterDetailDto.fromJson({'name': 'Genos', 'tier': 'SSR'}),
        throwsFormatException,
      );

      expect(
        () => CharacterDetailDto.fromJson({'id': '   ', 'name': 'Genos'}),
        throwsFormatException,
      );
    });

    test('throws FormatException when name is missing or empty', () {
      expect(
        () => CharacterDetailDto.fromJson({'id': '100001'}),
        throwsFormatException,
      );

      expect(
        () => CharacterDetailDto.fromJson({'id': '100001', 'name': '  '}),
        throwsFormatException,
      );
    });

    test('handles missing optional fields with safe defaults', () {
      final dto = CharacterDetailDto.fromJson({
        'id': 'minimal-char',
        'name': 'Minimal Hero',
      });

      expect(dto.id, 'minimal-char');
      expect(dto.name, 'Minimal Hero');
      expect(dto.imageUrl, isNull);
      expect(dto.tier, 'UNKNOWN');
      expect(dto.type, 'UNKNOWN');
      expect(dto.faction, 'UNKNOWN');
      expect(dto.roles, isEmpty);
      expect(dto.duyen, isNull);
      expect(dto.bio, isNull);
      expect(dto.keepsakeIcon, isNull);
      expect(dto.traits, isEmpty);
      expect(dto.bondList, isNull);
      expect(dto.classLevel, isNull);
      expect(dto.baseStats, isNull);
      expect(dto.pvpStats, isNull);
      expect(dto.skills, isEmpty);
      expect(dto.effects, isEmpty);
      expect(dto.updatedAt, isNull);
    });
  });
}
