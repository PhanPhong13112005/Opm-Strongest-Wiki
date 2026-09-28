import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/media/media_url_resolver.dart';
import 'package:opmwiki_mobile/features/wiki/data/mappers/character_mapper.dart';
import 'package:opmwiki_mobile/features/wiki/data/models/character_summary_dto.dart';

void main() {
  group('CharacterMapper', () {
    final resolver = MediaUrlResolver(Uri.parse('https://opmwiki.app'));
    final mapper = CharacterMapper(resolver);

    test('correctly maps DTO to domain model with resolved media URLs', () {
      const dto = CharacterSummaryDto(
        id: 'genos-ur',
        name: 'Genos',
        imageUrl: '/Characters/Genos/genos.png',
        tier: 'UR',
        type: 'Công Nghệ',
        faction: 'Anh Hùng',
        roles: ['Sát Thương Diện Rộng'],
        classLevel: 'S-Class',
        keepsakeIcon: '/Keepsake/genos.png',
        releaseSea: '2026-05-01',
        releaseChina: '2026-01-01',
      );

      final domain = mapper.toDomain(dto);

      expect(domain.id, 'genos-ur');
      expect(domain.name, 'Genos');
      expect(
        domain.imageUrl,
        Uri.parse('https://opmwiki.app/Characters/Genos/genos.png'),
      );
      expect(domain.hasImage, isTrue);
      expect(domain.tier, 'UR');
      expect(domain.type, 'Công Nghệ');
      expect(domain.faction, 'Anh Hùng');
      expect(domain.roles, ['Sát Thương Diện Rộng']);
      expect(domain.classLevel, 'S-Class');
      expect(
        domain.keepsakeIconUrl,
        Uri.parse('https://opmwiki.app/Keepsake/genos.png'),
      );
      expect(domain.releaseSea, '2026-05-01');
      expect(domain.releaseChina, '2026-01-01');
    });

    test('maps empty or invalid image URLs to null gracefully', () {
      const dtoWithEmpty = CharacterSummaryDto(
        id: 'hero-1',
        name: 'Empty Image Hero',
        imageUrl: '',
        tier: 'SSR',
        type: 'Giác Đấu',
        faction: 'Anh Hùng',
      );

      final result1 = mapper.toDomain(dtoWithEmpty);
      expect(result1.imageUrl, isNull);
      expect(result1.hasImage, isFalse);

      const dtoWithInvalid = CharacterSummaryDto(
        id: 'hero-2',
        name: 'Invalid Image Hero',
        imageUrl: '//malformed-protocol-relative.png',
        tier: 'SSR',
        type: 'Giác Đấu',
        faction: 'Anh Hùng',
      );

      final result2 = mapper.toDomain(dtoWithInvalid);
      expect(result2.imageUrl, isNull);
      expect(result2.hasImage, isFalse);
    });

    test('preserves absolute HTTP/HTTPS image URLs', () {
      const dto = CharacterSummaryDto(
        id: 'hero-3',
        name: 'Absolute Hero',
        imageUrl: 'https://cdn.example.com/hero.png',
        tier: 'SSR',
        type: 'Giác Đấu',
        faction: 'Anh Hùng',
      );

      final result = mapper.toDomain(dto);
      expect(result.imageUrl, Uri.parse('https://cdn.example.com/hero.png'));
    });
  });
}
