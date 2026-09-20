import '../network/api_exception.dart';
import 'app_error.dart';

abstract final class ErrorMapper {
  static AppError map(Object error) {
    if (error is ApiException) {
      final kind = switch (error.kind) {
        ApiFailureKind.connection => AppErrorKind.offline,
        ApiFailureKind.timeout => AppErrorKind.timeout,
        ApiFailureKind.cancelled => AppErrorKind.cancelled,
        ApiFailureKind.badResponse => AppErrorKind.server,
        ApiFailureKind.unknown => AppErrorKind.unknown,
      };
      return AppError(kind, error.message);
    }
    return const AppError(AppErrorKind.unknown, 'Unexpected application error');
  }
}
