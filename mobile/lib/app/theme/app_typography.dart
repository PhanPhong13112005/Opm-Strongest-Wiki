import 'package:flutter/material.dart';

abstract final class AppTypography {
  static TextTheme textTheme(Color foreground) => TextTheme(
    displaySmall: TextStyle(
      fontSize: 36,
      height: 1.08,
      fontWeight: FontWeight.w800,
      color: foreground,
    ),
    headlineMedium: TextStyle(
      fontSize: 26,
      height: 1.15,
      fontWeight: FontWeight.w700,
      color: foreground,
    ),
    titleLarge: TextStyle(
      fontSize: 20,
      height: 1.25,
      fontWeight: FontWeight.w700,
      color: foreground,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      height: 1.3,
      fontWeight: FontWeight.w700,
      color: foreground,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      height: 1.55,
      fontWeight: FontWeight.w400,
      color: foreground,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      height: 1.5,
      fontWeight: FontWeight.w400,
      color: foreground,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      height: 1.2,
      fontWeight: FontWeight.w700,
      color: foreground,
    ),
  );
}
