import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/feature_preview_card.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final text = AppLocalizations.of(context);
    return SafeArea(
      child: CustomScrollView(
        key: const PageStorageKey('home-scroll'),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            sliver: SliverList.list(
              children: [
                Container(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.surfaceRaised, Color(0xFF102C3E)],
                    ),
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: AppPageHeader(
                    title: text.homeTitle,
                    subtitle: text.homeSubtitle,
                    eyebrow: 'Hero Data Network',
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                FeaturePreviewCard(
                  icon: Icons.layers_outlined,
                  title: text.homeFoundation,
                  description: text.homeFoundationBody,
                  badge: 'M1',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
