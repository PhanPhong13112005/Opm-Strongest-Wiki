import '../models/release_schedule.dart';

abstract class ReleaseScheduleRepository {
  Future<ReleaseScheduleFeed> getReleaseSchedule({required String language});
}
