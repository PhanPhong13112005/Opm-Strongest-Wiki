import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_typography.dart';

abstract final class AppTheme {
  static ThemeData get dark {
    const scheme = ColorScheme.dark(
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      surface: AppColors.surface,
      error: AppColors.secondary,
      onPrimary: AppColors.background,
      onSecondary: AppColors.background,
      onSurface: AppColors.textPrimary,
      onError: AppColors.background,
    );
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.background,
      textTheme: AppTypography.textTheme(AppColors.textPrimary),
      dividerColor: AppColors.border,
      cardTheme: const CardThemeData(
        color: AppColors.surfaceRaised,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: AppColors.border),
          borderRadius: BorderRadius.all(Radius.circular(18)),
        ),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(14)),
        ),
      ),
      navigationBarTheme: const NavigationBarThemeData(
        backgroundColor: AppColors.surface,
        indicatorColor: Color(0x335BDEFF),
        height: 68,
      ),
      navigationRailTheme: const NavigationRailThemeData(
        backgroundColor: AppColors.surface,
        indicatorColor: Color(0x335BDEFF),
      ),
    );
  }

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.light,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      textTheme: AppTypography.textTheme(const Color(0xFF09121E)),
    );
  }
}
