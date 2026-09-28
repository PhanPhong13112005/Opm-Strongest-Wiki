import '../../../../core/media/media_url_resolver.dart';
import '../../domain/models/release_schedule.dart';
import '../../domain/repositories/release_schedule_repository.dart';
import '../datasources/release_schedule_remote_data_source.dart';
import '../mappers/release_schedule_mapper.dart';

class ReleaseScheduleRepositoryImpl implements ReleaseScheduleRepository {
  ReleaseScheduleRepositoryImpl(this._remoteDataSource, this._mediaUrlResolver);

  final ReleaseScheduleRemoteDataSource _remoteDataSource;
  final MediaUrlResolver _mediaUrlResolver;
  final Map<String, List<ReleaseScheduleEntry>> _lastKnownGood = {};

  @override
  Future<ReleaseScheduleFeed> getReleaseSchedule({
    required String language,
  }) async {
    final normalizedLanguage = language == 'en' ? 'en' : 'vi';
    try {
      final dtos = await _remoteDataSource.getReleaseSchedule(
        language: normalizedLanguage,
      );
      final mapper = ReleaseScheduleMapper(_mediaUrlResolver);
      final entries = dtos.map(mapper.toDomain).toList()..sort(_compareEntries);
      final immutableEntries = List<ReleaseScheduleEntry>.unmodifiable(entries);
      _lastKnownGood[normalizedLanguage] = immutableEntries;
      return ReleaseScheduleFeed(entries: immutableEntries, isFallback: false);
    } catch (error, stackTrace) {
      final cached = _lastKnownGood[normalizedLanguage];
      if (cached != null) {
        return ReleaseScheduleFeed(entries: cached, isFallback: true);
      }
      Error.throwWithStackTrace(error, stackTrace);
    }
  }

  static int _compareEntries(
    ReleaseScheduleEntry left,
    ReleaseScheduleEntry right,
  ) {
    final byDate = left.date.compareTo(right.date);
    if (byDate != 0) return byDate;
    final byServer = left.server.compareTo(right.server);
    if (byServer != 0) return byServer;
    return left.sortOrder.compareTo(right.sortOrder);
  }
}
