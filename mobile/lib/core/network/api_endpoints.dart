abstract final class ApiEndpoints {
  static const characters = '/api/characters';
  static const events = '/api/events';
  static const releaseSchedule = '/api/release-schedule';
  static const tierRankings = '/api/tier-rankings';

  static String characterDetail(String id) => '$characters/$id';
}
