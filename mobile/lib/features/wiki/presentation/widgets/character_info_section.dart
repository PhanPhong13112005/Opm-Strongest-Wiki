import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../domain/models/character_detail.dart';

class CharacterInfoSection extends StatelessWidget {
  const CharacterInfoSection({super.key, required this.character});

  final CharacterDetail character;

  @override
  Widget build(BuildContext context) {
    final text = AppLocalizations.of(context);
    final hasBio = character.bio != null && character.bio!.isNotEmpty;
    final hasRoles = character.roles.isNotEmpty;
    final hasSeaRelease =
        character.releaseSea != null && character.releaseSea!.trim().isNotEmpty;
    final hasChinaRelease =
        character.releaseChina != null &&
        character.releaseChina!.trim().isNotEmpty;
    final hasKeepsake = character.keepsakeIconUrl != null;

    if (!hasBio &&
        !hasRoles &&
        !hasSeaRelease &&
        !hasChinaRelease &&
        !hasKeepsake) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surfaceRaised,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Bio
          if (hasBio) ...[
            Text(
              text.characterBio,
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 14,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              character.bio!,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                height: 1.5,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          // Roles
          if (hasRoles) ...[
            Text(
              text.rolesLabel,
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              children: character.roles.map((role) {
                return Chip(
                  label: Text(
                    role,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 12,
                    ),
                  ),
                  backgroundColor: AppColors.surface,
                  side: const BorderSide(color: AppColors.border),
                  padding: EdgeInsets.zero,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          // Release info & Keepsake
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (hasSeaRelease || hasChinaRelease)
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (hasSeaRelease)
                        _buildReleaseRow(
                          text.releaseSeaLabel,
                          character.releaseSea!,
                        ),
                      if (hasChinaRelease) ...[
                        const SizedBox(height: 4),
                        _buildReleaseRow(
                          text.releaseChinaLabel,
                          character.releaseChina!,
                        ),
                      ],
                    ],
                  ),
                ),
              if (hasKeepsake)
                Column(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          character.keepsakeIconUrl.toString(),
                          cacheWidth: 120,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) => const Icon(
                            Icons.shield_outlined,
                            size: 24,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Keepsake',
                      style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReleaseRow(String label, String value) {
    return Row(
      children: [
        Text(
          '$label: ',
          style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
        ),
        Text(
          value,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
