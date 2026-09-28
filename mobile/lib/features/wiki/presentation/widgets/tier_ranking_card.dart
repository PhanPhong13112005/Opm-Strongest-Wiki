import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../domain/models/tier_ranking.dart';
import 'character_tier_badge.dart';

class TierRankingCard extends StatelessWidget {
  const TierRankingCard({super.key, required this.item, this.onTap});

  final TierRankingVoteItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final text = AppLocalizations.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm + 4,
          ),
          decoration: BoxDecoration(
            color: AppColors.surfaceRaised,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border, width: 1),
            boxShadow: const [
              BoxShadow(
                color: Color(0x22000000),
                blurRadius: 4,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // Rank indicator
              _buildRankBadge(),
              const SizedBox(width: AppSpacing.md),
              // Character Avatar
              _buildAvatar(),
              const SizedBox(width: AppSpacing.md),
              // Name and Tier/Faction
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      item.displayName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Row(
                      children: [
                        if (item.characterTier != null &&
                            item.characterTier!.isNotEmpty) ...[
                          CharacterTierBadge(tier: item.characterTier!),
                          const SizedBox(width: 6),
                        ],
                        if (item.band?.isNotEmpty == true) ...[
                          _buildBandBadge(),
                          const SizedBox(width: 6),
                        ],
                        if (item.characterFaction != null &&
                            item.characterFaction!.isNotEmpty)
                          Flexible(
                            child: Text(
                              item.characterFaction!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 12,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              // Vote count
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.how_to_vote,
                        size: 16,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        text.votesCount(item.votes),
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.chevron_right,
                color: AppColors.textMuted,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRankBadge() {
    Color bg;
    Color textColor;
    if (item.rank == 1) {
      bg = const Color(0xFFFFD700);
      textColor = Colors.black;
    } else if (item.rank == 2) {
      bg = const Color(0xFFC0C0C0);
      textColor = Colors.black;
    } else if (item.rank == 3) {
      bg = const Color(0xFFCD7F32);
      textColor = Colors.white;
    } else {
      bg = AppColors.surface;
      textColor = AppColors.textSecondary;
    }

    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: item.rank > 3
            ? Border.all(color: AppColors.border, width: 1)
            : null,
      ),
      alignment: Alignment.center,
      child: Text(
        '${item.rank}',
        style: TextStyle(
          color: textColor,
          fontSize: 14,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  Widget _buildBandBadge() => Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    decoration: BoxDecoration(
      color: AppColors.primary.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(6),
      border: Border.all(color: AppColors.primary.withValues(alpha: 0.35)),
    ),
    child: Text(
      item.band!,
      style: const TextStyle(
        color: AppColors.primary,
        fontSize: 10,
        fontWeight: FontWeight.w800,
      ),
    ),
  );

  Widget _buildAvatar() {
    final url = item.characterAvatarUrl;
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 48,
        height: 48,
        color: AppColors.surface,
        child: url != null
            ? Image.network(
                url.toString(),
                fit: BoxFit.cover,
                cacheWidth: 160,
                errorBuilder: (_, _, _) => _buildPlaceholderAvatar(),
              )
            : _buildPlaceholderAvatar(),
      ),
    );
  }

  Widget _buildPlaceholderAvatar() {
    return const Center(
      child: Icon(Icons.person, color: AppColors.textMuted, size: 24),
    );
  }
}
