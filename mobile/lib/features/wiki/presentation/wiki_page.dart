import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/feature_preview_card.dart';

class WikiPage extends StatefulWidget {
  const WikiPage({super.key});

  @override
  State<WikiPage> createState() => _WikiPageState();
}

class _WikiPageState extends State<WikiPage> {
  final searchController = TextEditingController();

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final text = AppLocalizations.of(context);
    return SafeArea(
      child: ListView(
        key: const PageStorageKey('wiki-scroll'),
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          AppPageHeader(
            title: text.wikiTitle,
            subtitle: text.wikiSubtitle,
            eyebrow: 'Knowledge Base',
          ),
          const SizedBox(height: AppSpacing.lg),
          TextField(
            key: const Key('wiki-search-field'),
            controller: searchController,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search),
              hintText: text.wikiSearchHint,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          FeaturePreviewCard(
            icon: Icons.person_search_outlined,
            title: text.comingSoon,
            description: text.wikiSubtitle,
            badge: 'M2',
          ),
        ],
      ),
    );
  }
}
