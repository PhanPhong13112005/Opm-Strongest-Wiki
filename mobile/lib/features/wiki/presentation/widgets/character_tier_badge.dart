import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class CharacterTierBadge extends StatelessWidget {
  const CharacterTierBadge({super.key, required this.tier});

  final String tier;

  @override
  Widget build(BuildContext context) {
    final style = _tierStyle(tier.toUpperCase());

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        gradient: style.gradient,
        color: style.solidColor,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: style.borderColor, width: 1),
        boxShadow: [
          BoxShadow(
            color: style.glowColor.withValues(alpha: 0.3),
            blurRadius: 6,
            spreadRadius: 0,
          ),
        ],
      ),
      child: Text(
        tier,
        style: TextStyle(
          color: style.textColor,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  static _TierStyle _tierStyle(String tier) {
    if (tier.contains('UR+') || tier == 'URPLUS') {
      return const _TierStyle(
        gradient: LinearGradient(
          colors: [Color(0xFFFFB300), Color(0xFF00E5FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderColor: Color(0xFFFFD54F),
        textColor: Color(0xFF050A12),
        glowColor: Color(0xFF00E5FF),
      );
    }
    if (tier == 'UR') {
      return const _TierStyle(
        gradient: LinearGradient(
          colors: [Color(0xFFFF9100), Color(0xFFFF3D00)],
        ),
        borderColor: Color(0xFFFFAB40),
        textColor: Colors.white,
        glowColor: Color(0xFFFF6D00),
      );
    }
    if (tier.contains('SSR+') || tier == 'SSRPLUS') {
      return const _TierStyle(
        gradient: LinearGradient(
          colors: [Color(0xFFE040FB), Color(0xFFFF5252)],
        ),
        borderColor: Color(0xFFEA80FC),
        textColor: Colors.white,
        glowColor: Color(0xFFE040FB),
      );
    }
    if (tier == 'SSR') {
      return const _TierStyle(
        gradient: LinearGradient(
          colors: [Color(0xFFFF5252), Color(0xFFFF7A00)],
        ),
        borderColor: Color(0xFFFF8A80),
        textColor: Colors.white,
        glowColor: Color(0xFFFF5252),
      );
    }
    if (tier == 'SR') {
      return const _TierStyle(
        solidColor: Color(0xFF7C4DFF),
        borderColor: Color(0xFFB388FF),
        textColor: Colors.white,
        glowColor: Color(0xFF7C4DFF),
      );
    }
    return const _TierStyle(
      solidColor: Color(0xFF455A64),
      borderColor: Color(0xFF78909C),
      textColor: AppColors.textPrimary,
      glowColor: Colors.transparent,
    );
  }
}

class _TierStyle {
  const _TierStyle({
    this.gradient,
    this.solidColor,
    required this.borderColor,
    required this.textColor,
    required this.glowColor,
  });

  final Gradient? gradient;
  final Color? solidColor;
  final Color borderColor;
  final Color textColor;
  final Color glowColor;
}
