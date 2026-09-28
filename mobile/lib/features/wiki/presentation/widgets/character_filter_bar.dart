import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

class CharacterFilterBar extends StatelessWidget {
  const CharacterFilterBar({
    super.key,
    required this.selectedTier,
    required this.onTierSelected,
  });

  final String? selectedTier;
  final ValueChanged<String?> onTierSelected;

  static const _tiers = <String?>[null, 'UR+', 'UR', 'SSR+', 'SSR', 'SR'];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _tiers.length,
        separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (context, index) {
          final tier = _tiers[index];
          final isSelected = selectedTier == tier;
          final label = tier ?? 'Tất cả';

          return ChoiceChip(
            label: Text(label),
            selected: isSelected,
            onSelected: (_) => onTierSelected(isSelected ? null : tier),
            selectedColor: AppColors.primary.withValues(alpha: 0.2),
            backgroundColor: AppColors.surface,
            side: BorderSide(
              color: isSelected ? AppColors.primary : AppColors.border,
              width: isSelected ? 1.5 : 1,
            ),
            labelStyle: TextStyle(
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              fontSize: 12,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
          );
        },
      ),
    );
  }
}
