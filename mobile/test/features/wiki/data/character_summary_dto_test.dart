import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/network/models/paged_response.dart';
import 'package:opmwiki_mobile/features/wiki/data/models/character_summary_dto.dart';

void main() {
  group('CharacterSummaryDto', () {
    test('deserializes real characters_page_vi.json fixture accurately', () {
      final jsonString = File(
        'test/fixtures/api/characters_page_vi.json',
      ).readAsStringSync();
      final map = jsonDecode(jsonString) as Map<String, dynamic>;

      final paged = PagedResponse<CharacterSummaryDto>.fromJson(
        map,
        (item) => CharacterSummaryDto.fromJson(item as Map<String, dynamic>),
      );

      expect(paged.page, 1);
      expect(paged.pageSize, 2);
      expect(paged.totalCount, 178);
      expect(paged.totalPages, 89);
      expect(paged.hasNextPage, isTrue);
      expect(paged.items.length, 2);

      final first = paged.items.first;
      expect(first.id, 'homeless-emperor-urplus');
      expect(first.name, 'Vua Không Nhà');
      expect(
        first.imageUrl,
        '/Characters/optimized/homeless-emperor-urplus-600.webp',
      );
      expect(first.tier, 'UR+');
      expect(first.type, 'Tâm Linh');
      expect(first.faction, 'Quái Nhân');
      expect(first.roles, ['Gia Tốc Cực Hạn - Sức Mạnh Hủy Diệt']);
      expect(first.classLevel, 'Dragon');
      expect(
        first.keepsakeIcon,
        '/Skill/Homeless Emperor (URplus)/Keepsake-URplus.png',
      );
      expect(first.releaseSea, '2027-01-01');
      expect(first.releaseChina, '2026-09-01');

      final second = paged.items[1];
      expect(second.id, 'blacksperm-urplus');
      expect(second.name, 'Tinh Trùng Đen');
      expect(second.tier, 'UR+');
      expect(second.type, 'Giác Đấu');
      expect(second.roles.length, 2);
    });

    test('throws FormatException when id is missing or empty', () {
      expect(
        () => CharacterSummaryDto.fromJson({
          'id': '',
          'name': 'Saitama',
          'tier': 'SSR',
          'type': 'Giác Đấu',
          'faction': 'Anh Hùng',
        }),
        throwsFormatException,
      );

      expect(
        () => CharacterSummaryDto.fromJson({
          'name': 'Saitama',
          'tier': 'SSR',
          'type': 'Giác Đấu',
          'faction': 'Anh Hùng',
        }),
        throwsFormatException,
      );
    });

    test('throws FormatException when name is missing or empty', () {
      expect(
        () => CharacterSummaryDto.fromJson({
          'id': 'saitama',
          'name': '   ',
          'tier': 'SSR',
          'type': 'Giác Đấu',
          'faction': 'Anh Hùng',
        }),
        throwsFormatException,
      );
    });

    test('handles missing optional fields with safe defaults', () {
      final dto = CharacterSummaryDto.fromJson({
        'id': 'test-hero',
        'name': 'Test Hero',
      });

      expect(dto.id, 'test-hero');
      expect(dto.name, 'Test Hero');
      expect(dto.tier, 'UNKNOWN');
      expect(dto.type, 'UNKNOWN');
      expect(dto.faction, 'UNKNOWN');
      expect(dto.roles, isEmpty);
      expect(dto.imageUrl, isNull);
      expect(dto.classLevel, isNull);
      expect(dto.keepsakeIcon, isNull);
      expect(dto.releaseSea, isNull);
      expect(dto.releaseChina, isNull);
    });
  });
}
