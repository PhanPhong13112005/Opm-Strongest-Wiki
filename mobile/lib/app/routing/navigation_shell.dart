import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../l10n/generated/app_localizations.dart';

class NavigationShell extends StatelessWidget {
  const NavigationShell({super.key, required this.navigationShell});

  static const railBreakpoint = 840.0;
  static const railMinHeight = 600.0;
  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context);
    final destinations = [
      _Destination(localizations.homeTab, Icons.home_outlined, Icons.home),
      _Destination(
        localizations.wikiTab,
        Icons.menu_book_outlined,
        Icons.menu_book,
      ),
      _Destination(
        localizations.playTab,
        Icons.sports_esports_outlined,
        Icons.sports_esports,
      ),
      _Destination(
        localizations.rewardsTab,
        Icons.card_giftcard_outlined,
        Icons.card_giftcard,
      ),
      _Destination(
        localizations.profileTab,
        Icons.person_outline,
        Icons.person,
      ),
    ];
    void select(int index) => navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= railBreakpoint &&
            constraints.maxHeight >= railMinHeight) {
          return Scaffold(
            body: Row(
              children: [
                SafeArea(
                  child: NavigationRail(
                    selectedIndex: navigationShell.currentIndex,
                    onDestinationSelected: select,
                    labelType: NavigationRailLabelType.all,
                    leading: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Icon(Icons.bolt, size: 30),
                    ),
                    destinations: [for (final item in destinations) item.rail],
                  ),
                ),
                const VerticalDivider(width: 1),
                Expanded(child: navigationShell),
              ],
            ),
          );
        }
        return Scaffold(
          body: navigationShell,
          bottomNavigationBar: NavigationBar(
            selectedIndex: navigationShell.currentIndex,
            onDestinationSelected: select,
            destinations: [for (final item in destinations) item.bar],
          ),
        );
      },
    );
  }
}

class _Destination {
  const _Destination(this.label, this.icon, this.selectedIcon);
  final String label;
  final IconData icon;
  final IconData selectedIcon;

  NavigationDestination get bar => NavigationDestination(
    icon: Icon(icon),
    selectedIcon: Icon(selectedIcon),
    label: label,
  );
  NavigationRailDestination get rail => NavigationRailDestination(
    icon: Icon(icon),
    selectedIcon: Icon(selectedIcon),
    label: Text(label),
  );
}
