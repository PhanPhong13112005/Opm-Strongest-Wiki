import 'package:dio/dio.dart';

enum ApiFailureKind { connection, timeout, cancelled, badResponse, unknown }

class ApiException implements Exception {
  const ApiException({
    required this.kind,
    required this.message,
    this.statusCode,
  });

  final ApiFailureKind kind;
  final String message;
  final int? statusCode;

  factory ApiException.fromDio(DioException error) {
    final kind = switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout => ApiFailureKind.timeout,
      DioExceptionType.connectionError => ApiFailureKind.connection,
      DioExceptionType.cancel => ApiFailureKind.cancelled,
      DioExceptionType.badResponse => ApiFailureKind.badResponse,
      _ => ApiFailureKind.unknown,
    };
    return ApiException(
      kind: kind,
      statusCode: error.response?.statusCode,
      message:
          _readMessage(error.response?.data) ??
          error.message ??
          'Unexpected network error',
    );
  }

  static String? _readMessage(Object? data) {
    if (data is! Map) return null;
    final value = data['message'] ?? data['title'];
    return value is String && value.trim().isNotEmpty ? value.trim() : null;
  }

  @override
  String toString() => 'ApiException($kind, $statusCode, $message)';
}
