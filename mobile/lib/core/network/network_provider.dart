import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import 'api_client.dart';

final dioProvider = Provider<Dio>((ref) {
  final config = ref.watch(appConfigProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: config.apiBaseUri.toString(),
      connectTimeout: const Duration(seconds: 10),
      sendTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: const {'Accept': 'application/json'},
    ),
  );
  if (!config.isProduction) {
    dio.interceptors.add(const SafeNetworkLogInterceptor());
  }
  ref.onDispose(dio.close);
  return dio;
});

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(dioProvider)),
);

class SafeNetworkLogInterceptor extends Interceptor {
  const SafeNetworkLogInterceptor();

  static const _timerKey = 'safe-network-log-start';

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.extra[_timerKey] = Stopwatch()..start();
    debugPrint('[HTTP] ${options.method} ${options.uri.path}');
    handler.next(options);
  }

  @override
  void onResponse(
    Response<dynamic> response,
    ResponseInterceptorHandler handler,
  ) {
    final timer = response.requestOptions.extra[_timerKey] as Stopwatch?;
    timer?.stop();
    debugPrint(
      '[HTTP] ${response.statusCode} ${response.requestOptions.uri.path} ${timer?.elapsedMilliseconds ?? 0}ms',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final timer = err.requestOptions.extra[_timerKey] as Stopwatch?;
    timer?.stop();
    debugPrint(
      '[HTTP] error ${err.response?.statusCode ?? '-'} ${err.requestOptions.uri.path} ${timer?.elapsedMilliseconds ?? 0}ms',
    );
    handler.next(err);
  }
}
