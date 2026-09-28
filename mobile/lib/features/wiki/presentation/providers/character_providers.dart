import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/media/media_url_resolver.dart';
import '../../../../core/network/network_provider.dart';
import '../../data/datasources/character_remote_data_source.dart';
import '../../data/repositories/character_repository_impl.dart';
import '../../domain/repositories/character_repository.dart';
import '../controllers/character_detail_controller.dart';
import '../controllers/character_detail_state.dart';
import '../controllers/character_list_controller.dart';
import '../controllers/character_list_state.dart';

final characterRemoteDataSourceProvider = Provider<CharacterRemoteDataSource>((
  ref,
) {
  return CharacterRemoteDataSourceImpl(ref.watch(apiClientProvider));
});

final characterRepositoryProvider = Provider<CharacterRepository>((ref) {
  return CharacterRepositoryImpl(
    ref.watch(characterRemoteDataSourceProvider),
    ref.watch(mediaUrlResolverProvider),
  );
});

final characterListControllerProvider =
    NotifierProvider<CharacterListNotifier, CharacterListState>(
      CharacterListNotifier.new,
    );

final characterDetailControllerProvider = NotifierProvider.autoDispose
    .family<CharacterDetailNotifier, CharacterDetailState, String>(
      CharacterDetailNotifier.new,
    );
