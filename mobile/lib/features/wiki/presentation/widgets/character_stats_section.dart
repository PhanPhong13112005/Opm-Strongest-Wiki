import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../domain/models/character_detail.dart';

class CharacterStatsSection extends StatelessWidget {
  const CharacterStatsSection({super.key, required this.character});

  final CharacterDetail character;

  @override
  Widget build(BuildContext context) {
    final text = AppLocalizations.of(context);
    final hasBase = character.hasBaseStats;
    final hasPvp = character.hasPvpStats;

    if (!hasBase && !hasPvp) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          text.characterStats,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        if (hasBase) ...[
          Text(
            text.baseStats,
            style: const TextStyle(
              color: AppColors.primary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          _buildStatGrid(character.baseStats!, text),
          const SizedBox(height: AppSpacing.md),
        ],
        if (hasPvp) ...[
          Text(
            text.pvpStats,
            style: const TextStyle(
              color: AppColors.secondary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          _buildStatGrid(character.pvpStats!, text),
        ],
      ],
    );
  }

  Widget _buildStatGrid(CharacterStats stats, AppLocalizations text) {
    return Row(
      children: [
        Expanded(
          child: _buildStatTile(
            text.statAtk,
            stats.atk,
            const Color(0xFFFF5252),
          ),
        ),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: _buildStatTile(text.statHp, stats.hp, const Color(0xFF4CAF50)),
        ),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: _buildStatTile(
            text.statDef,
            stats.def,
            const Color(0xFF2196F3),
          ),
        ),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: _buildStatTile(
            text.statSpd,
            stats.spd,
            const Color(0xFFFFC107),
          ),
        ),
      ],
    );
  }

  Widget _buildStatTile(String label, int value, Color accentColor) {
    return Container(
      padding: const EdgeInsets.symmetric(
        vertical: AppSpacing.sm,
        horizontal: 4,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceRaised,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border, width: 1),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              color: accentColor,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value.toString(),
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
