import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../domain/models/character_detail.dart';

class CharacterBondSection extends StatelessWidget {
  const CharacterBondSection({super.key, required this.character});

  final CharacterDetail character;

  @override
  Widget build(BuildContext context) {
    if (!character.hasBonds) return const SizedBox.shrink();

    final text = AppLocalizations.of(context);
    final hasDuyen = character.duyen != null && character.duyen!.isNotEmpty;
    final hasBondList =
        character.bondList != null && character.bondList!.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          text.characterBonds,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.surfaceRaised,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border, width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (hasDuyen) ...[
                Text(
                  character.duyen!,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    height: 1.45,
                  ),
                ),
                if (hasBondList) const SizedBox(height: AppSpacing.sm),
              ],
              if (hasBondList)
                Text(
                  character.bondList!,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    height: 1.45,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
