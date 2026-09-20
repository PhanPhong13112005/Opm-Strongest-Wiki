enum AppErrorKind { offline, timeout, cancelled, server, unknown }

class AppError {
  const AppError(this.kind, this.message);

  final AppErrorKind kind;
  final String message;
}
