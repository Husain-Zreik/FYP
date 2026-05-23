import 'package:flutter/material.dart';

// Mirrors the @theme block in website/src/index.css exactly.
abstract final class AppColors {
  static const primary = Color(0xFF1E1B4B);
  static const primaryHover = Color(0xFF17144A);

  static const secondary = Color(0xFF7C3AED);
  static const secondaryHover = Color(0xFF6D28D9);

  static const tertiary = Color(0xFFEDE9FE);
  static const tertiaryHover = Color(0xFFDDD6FE);
  static const tertiaryForeground = Color(0xFF3730A3);

  static const background = Color(0xFFFFFFFF);
  static const surface = Color(0xFFF0ECFF);
  static const surface2 = Color(0xFFE5DFFF);
  static const border = Color(0xFFC4B5FD);
  static const border2 = Color(0xFFA78BFA);

  static const text = Color(0xFF1E1B4B);
  static const textMuted = Color(0xFF4B4869);
  static const textSubtle = Color(0xFF6B6894);

  static const success = Color(0xFF10B981);
  static const successSurface = Color(0xFFECFDF5);
  static const warning = Color(0xFFF59E0B);
  static const warningSurface = Color(0xFFFFFBEB);
  static const danger = Color(0xFFEF4444);
  static const dangerSurface = Color(0xFFFEF2F2);
}
