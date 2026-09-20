import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opmwiki_mobile/core/errors/app_error.dart';
import 'package:opmwiki_mobile/core/errors/error_mapper.dart';
import 'package:opmwiki_mobile/core/network/api_exception.dart';

void main() {
  test('maps Dio timeouts to a stable application error', () {
    final exception = ApiException.fromDio(
      DioException(
        requestOptions: RequestOptions(path: '/characters'),
        type: DioExceptionType.connectionTimeout,
      ),
    );
    expect(exception.kind, ApiFailureKind.timeout);
    expect(ErrorMapper.map(exception).kind, AppErrorKind.timeout);
  });

  test('uses a safe server message when present', () {
    final options = RequestOptions(path: '/characters');
    final exception = ApiException.fromDio(
      DioException(
        requestOptions: options,
        response: Response(
          requestOptions: options,
          statusCode: 503,
          data: {'message': 'Service unavailable'},
        ),
        type: DioExceptionType.badResponse,
      ),
    );
    expect(exception.message, 'Service unavailable');
    expect(exception.statusCode, 503);
  });
}
