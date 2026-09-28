import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/home/presentation/home_page.dart';
import '../../features/play/presentation/play_page.dart';
import '../../features/profile/presentation/profile_page.dart';
import '../../features/rewards/presentation/rewards_page.dart';
import '../../features/wiki/presentation/character_detail_page.dart';
import '../../features/wiki/presentation/wiki_page.dart';
import 'navigation_shell.dart';
import 'route_names.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            NavigationShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                name: RouteNames.home,
                builder: (_, _) => const HomePage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/wiki',
                name: RouteNames.wiki,
                builder: (_, _) => const WikiPage(),
                routes: [
                  GoRoute(
                    path: 'characters/:id',
                    name: RouteNames.characterDetail,
                    builder: (context, state) {
                      final characterId = state.pathParameters['id']!;
                      return CharacterDetailPage(characterId: characterId);
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/play',
                name: RouteNames.play,
                builder: (_, _) => const PlayPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/rewards',
                name: RouteNames.rewards,
                builder: (_, _) => const RewardsPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                name: RouteNames.profile,
                builder: (_, _) => const ProfilePage(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});
