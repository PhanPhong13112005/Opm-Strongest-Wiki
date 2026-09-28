import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/release_schedule_dto.dart';

abstract class ReleaseScheduleRemoteDataSource {
  Future<List<ReleaseScheduleDto>> getReleaseSchedule({
    required String language,
  });
}

class ReleaseScheduleRemoteDataSourceImpl
    implements ReleaseScheduleRemoteDataSource {
  const ReleaseScheduleRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<List<ReleaseScheduleDto>> getReleaseSchedule({
    required String language,
  }) {
    return _apiClient.getJson<List<ReleaseScheduleDto>>(
      ApiEndpoints.releaseSchedule,
      queryParameters: {'language': language == 'en' ? 'en' : 'vi'},
      decode: (data) {
        if (data is! List) {
          throw const FormatException(
            'Expected JSON array for release schedule response',
          );
        }

        final entries = <ReleaseScheduleDto>[];
        final keys = <String>{};
        for (final item in data) {
          if (item is! Map) {
            throw const FormatException(
              'Expected JSON object for release schedule item',
            );
          }
          final dto = ReleaseScheduleDto.fromJson(item.cast<String, dynamic>());
          if (!keys.add(dto.compositeKey)) {
            throw FormatException(
              'Duplicate release schedule key: ${dto.compositeKey}',
            );
          }
          entries.add(dto);
        }
        if (entries.isEmpty) {
          throw const FormatException('Release schedule response is empty');
        }
        return List.unmodifiable(entries);
      },
    );
  }
}
