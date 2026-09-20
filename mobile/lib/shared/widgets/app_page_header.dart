import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';

class AppPageHeader extends StatelessWidget {
  const AppPageHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.eyebrow,
  });

  final String title;
  final String subtitle;
  final String? eyebrow;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (eyebrow != null) ...[
          Text(
            eyebrow!.toUpperCase(),
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: AppColors.primary,
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
        Text(title, style: Theme.of(context).textTheme.displaySmall),
        const SizedBox(height: AppSpacing.sm),
        Text(
          subtitle,
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
        ),
      ],
    );
  }
}
