import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/feature_preview_card.dart';

class PlayPage extends StatelessWidget {
  const PlayPage({super.key});

  @override
  Widget build(BuildContext context) {
    final text = AppLocalizations.of(context);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          AppPageHeader(
            title: text.playTitle,
            subtitle: text.playSubtitle,
            eyebrow: 'Interactive Lab',
          ),
          const SizedBox(height: AppSpacing.lg),
          FeaturePreviewCard(
            icon: Icons.extension_outlined,
            title: text.comingSoon,
            description: text.playSubtitle,
          ),
        ],
      ),
    );
  }
}
