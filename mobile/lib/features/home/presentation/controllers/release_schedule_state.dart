import 'package:flutter/foundation.dart';

import '../../../../core/errors/app_error.dart';
import '../release_schedule_presentation_adapter.dart';

@immutable
class ReleaseScheduleState {
  const ReleaseScheduleState({
    this.isLoading = false,
    this.items = const [],
    this.isFallback = false,
    this.error,
  });

  final bool isLoading;
  final List<ReleaseScheduleViewData> items;
  final bool isFallback;
  final AppError? error;

  bool get isEmpty => !isLoading && error == null && items.isEmpty;

  ReleaseScheduleState copyWith({
    bool? isLoading,
    List<ReleaseScheduleViewData>? items,
    bool? isFallback,
    AppError? error,
    bool clearError = false,
  }) {
    return ReleaseScheduleState(
      isLoading: isLoading ?? this.isLoading,
      items: items ?? this.items,
      isFallback: isFallback ?? this.isFallback,
      error: clearError ? null : (error ?? this.error),
    );
  }
}
