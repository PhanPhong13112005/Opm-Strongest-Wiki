import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/media/media_url_resolver.dart';
import '../../../../core/network/network_provider.dart';
import '../../data/datasources/release_schedule_remote_data_source.dart';
import '../../data/repositories/release_schedule_repository_impl.dart';
import '../../domain/repositories/release_schedule_repository.dart';
import '../controllers/release_schedule_controller.dart';
import '../controllers/release_schedule_state.dart';
import '../release_schedule_presentation_adapter.dart';

final releaseScheduleRemoteDataSourceProvider =
    Provider<ReleaseScheduleRemoteDataSource>((ref) {
      return ReleaseScheduleRemoteDataSourceImpl(ref.watch(apiClientProvider));
    });

final releaseScheduleRepositoryProvider = Provider<ReleaseScheduleRepository>((
  ref,
) {
  return ReleaseScheduleRepositoryImpl(
    ref.watch(releaseScheduleRemoteDataSourceProvider),
    ref.watch(mediaUrlResolverProvider),
  );
});

final releaseSchedulePresentationAdapterProvider =
    Provider<ReleaseSchedulePresentationAdapter>((ref) {
      return const ReleaseSchedulePresentationAdapter();
    });

final releaseScheduleControllerProvider =
    NotifierProvider<ReleaseScheduleNotifier, ReleaseScheduleState>(
      ReleaseScheduleNotifier.new,
    );
