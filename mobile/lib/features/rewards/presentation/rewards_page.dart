import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/config/app_config.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/widgets/app_page_header.dart';
import '../../../shared/widgets/feature_preview_card.dart';

class RewardsPage extends ConsumerWidget {
  const RewardsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = AppLocalizations.of(context);
    final enabled = ref.watch(appConfigProvider).rewardsEnabled;
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          AppPageHeader(
            title: text.rewardsTitle,
            subtitle: text.rewardsSubtitle,
            eyebrow: 'Feature Gate',
          ),
          const SizedBox(height: AppSpacing.lg),
          FeaturePreviewCard(
            icon: enabled ? Icons.lock_open_outlined : Icons.lock_outline,
            title: enabled ? text.comingSoon : text.rewardsTitle,
            description: text.rewardsSubtitle,
            badge: enabled ? 'PREVIEW' : 'LOCKED',
          ),
        ],
      ),
    );
  }
}
