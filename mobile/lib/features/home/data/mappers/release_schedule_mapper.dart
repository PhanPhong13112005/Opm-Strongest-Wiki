import '../../../../core/media/media_url_resolver.dart';
import '../../domain/models/release_schedule.dart';
import '../models/release_schedule_dto.dart';

class ReleaseScheduleMapper {
  const ReleaseScheduleMapper(this._mediaUrlResolver);

  final MediaUrlResolver _mediaUrlResolver;

  ReleaseScheduleEntry toDomain(ReleaseScheduleDto dto) {
    return ReleaseScheduleEntry(
      id: dto.id,
      server: dto.server,
      date: DateTime.parse(dto.date),
      characterId: dto.characterId,
      bannerImageUrl: _mediaUrlResolver.resolve(dto.bannerImage),
      isReturn: dto.isReturn,
      sortOrder: dto.sortOrder,
      overrideName: dto.overrideName,
      overrideTier: dto.overrideTier,
      overrideFaction: dto.overrideFaction,
      overrideType: dto.overrideType,
      overrideRole: dto.overrideRole,
    );
  }
}
