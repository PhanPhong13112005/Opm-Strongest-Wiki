import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/feature_preview_card.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final text = AppLocalizations.of(context);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          AppPageHeader(
            title: text.profileTitle,
            subtitle: text.profileSubtitle,
            eyebrow: 'Guest Session',
          ),
          const SizedBox(height: AppSpacing.lg),
          FeaturePreviewCard(
            icon: Icons.shield_outlined,
            title: text.comingSoon,
            description: text.profileSubtitle,
            badge: 'M3',
          ),
        ],
      ),
    );
  }
}
