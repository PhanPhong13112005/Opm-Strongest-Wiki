import 'package:dio/dio.dart';

import 'api_exception.dart';

class ApiClient {
  const ApiClient(this._dio);

  final Dio _dio;

  Future<T> getJson<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(Object? data)? decode,
  }) async {
    try {
      final response = await _dio.get<Object?>(
        path,
        queryParameters: queryParameters,
      );
      return decode == null ? response.data as T : decode(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }
}
