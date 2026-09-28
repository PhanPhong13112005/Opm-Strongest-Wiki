import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/media/media_url_resolver.dart';
import 'package:opmwiki_mobile/features/wiki/data/mappers/character_mapper.dart';
import 'package:opmwiki_mobile/features/wiki/data/models/character_detail_dto.dart';

void main() {
  group('CharacterMapper - Detail', () {
    final resolver = MediaUrlResolver(Uri.parse('https://opmwiki.app'));
    final mapper = CharacterMapper(resolver);

    test('maps CharacterDetailDto to CharacterDetail domain accurately', () {
      final dto = CharacterDetailDto(
        id: '100029-sr',
        name: 'Amai Mask',
        imageUrl: '/Characters/Amai Mask (SR)/sr.png',
        tier: 'SR',
        type: 'Giác Đấu',
        faction: 'Anh Hùng',
        roles: const ['Hỗ Trợ'],
        classLevel: 'A',
        keepsakeIcon: '/Keepsake/Amai Mask (SR)/Keepsake_SR.png',
        duyen: '  Duyên phận đặc biệt  ',
        bio: '',
        bondList: '   ',
        baseStats: const CharacterStatsDto(
          atk: 100,
          hp: 1000,
          def: 50,
          spd: 80,
        ),
        pvpStats: const CharacterStatsDto(atk: 0, hp: 0, def: 0, spd: 0),
        skills: const [
          CharacterSkillDto(
            id: 'skill-2',
            sortOrder: 2,
            name: 'Tuyệt kỹ',
            description: 'Sát thương diện rộng',
            type: 'Tuyệt kỹ',
            iconUrl: '/Skill/skill_ult.png',
          ),
          CharacterSkillDto(
            id: 'skill-1',
            sortOrder: 1,
            name: 'Đòn đánh thường',
            description: 'Đánh đơn',
            type: 'Cơ bản',
            iconUrl: '/Skill/skill_basic.png',
          ),
        ],
        effects: const [
          CharacterEffectDto(
            id: 'eff-2',
            sortOrder: 5,
            term: 'Trọng thương',
            description: 'Tăng sát thương nhận phải',
          ),
          CharacterEffectDto(
            id: 'eff-1',
            sortOrder: 1,
            term: 'Thiêu đốt',
            description: 'Mất máu theo lượt',
          ),
        ],
        updatedAt: '2026-07-22T17:54:00.243836+07:00',
      );

      final domain = mapper.toDetailDomain(dto);

      expect(domain.id, '100029-sr');
      expect(domain.name, 'Amai Mask');
      expect(
        domain.imageUrl.toString(),
        'https://opmwiki.app/Characters/Amai%20Mask%20(SR)/sr.png',
      );
      expect(
        domain.keepsakeIconUrl.toString(),
        'https://opmwiki.app/Keepsake/Amai%20Mask%20(SR)/Keepsake_SR.png',
      );
      expect(domain.duyen, 'Duyên phận đặc biệt');
      expect(domain.bio, isNull);
      expect(domain.bondList, isNull);

      expect(domain.hasBaseStats, isTrue);
      expect(domain.baseStats!.atk, 100);
      expect(
        domain.hasPvpStats,
        isFalse,
      ); // All zero stats are treated as empty

      // Verify skills are sorted ascending by sortOrder
      expect(domain.skills, hasLength(2));
      expect(domain.skills[0].id, 'skill-1');
      expect(domain.skills[0].sortOrder, 1);
      expect(domain.skills[1].id, 'skill-2');
      expect(domain.skills[1].sortOrder, 2);
      expect(
        domain.skills[0].iconUrl.toString(),
        'https://opmwiki.app/Skill/skill_basic.png',
      );

      // Verify effects are sorted ascending by sortOrder
      expect(domain.effects, hasLength(2));
      expect(domain.effects[0].id, 'eff-1');
      expect(domain.effects[0].sortOrder, 1);
      expect(domain.effects[1].id, 'eff-2');
      expect(domain.effects[1].sortOrder, 5);

      expect(domain.updatedAt, isNotNull);
      expect(domain.updatedAt!.year, 2026);
    });
  });
}
