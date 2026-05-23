import 'package:flutter/widgets.dart';

// Mirrors the website's fluid rem + breakpoint system.
// Reference screen: 390dp wide (iPhone 14 / Pixel 7).
// Everything below 360dp scales down; tablets get a slight bump, then clamp.
//
// Usage:
//   final s = AppSizes.of(context);
//   padding: EdgeInsets.all(s.pagePadding)
//   style: TextStyle(fontSize: s.bodyMd)
class AppSizes {
  final double screenWidth;
  final double screenHeight;

  // Fluid scale factor — analogous to the website's html { font-size } rule.
  // 320dp → 0.85  |  360dp → 0.92  |  390dp → 1.0  |  430dp → 1.10  |  600dp+ → 1.15
  final double scale;

  AppSizes._(BuildContext context)
      : screenWidth = MediaQuery.sizeOf(context).width,
        screenHeight = MediaQuery.sizeOf(context).height,
        scale = (MediaQuery.sizeOf(context).width / 390).clamp(0.85, 1.15);

  factory AppSizes.of(BuildContext context) => AppSizes._(context);

  // ── Breakpoints ──────────────────────────────────────────────────────────
  bool get isSmall => screenWidth < 360;   // very small Android phones
  bool get isNormal => screenWidth >= 360 && screenWidth < 600;
  bool get isTablet => screenWidth >= 600;

  // ── Spacing ──────────────────────────────────────────────────────────────
  double get pagePadding => isSmall ? 16.0 : 24.0;
  double get fieldGap => isSmall ? 12.0 : 16.0;
  double get sectionGap => isSmall ? 20.0 : 28.0;
  double get headerVertical => isSmall ? 32.0 : 48.0;
  double get cardPadding => isSmall ? 14.0 : 16.0;
  double get itemGap => isSmall ? 8.0 : 12.0;

  // ── Typography — scaled with fluid factor ─────────────────────────────────
  double get displayLg => _s(32);
  double get heading1 => _s(24);
  double get heading2 => _s(20);
  double get heading3 => _s(18);
  double get bodyLg => _s(16);
  double get bodyMd => _s(14);
  double get bodySm => _s(13);
  double get caption => _s(12);
  double get label => _s(13);

  // ── Components ────────────────────────────────────────────────────────────
  double get buttonHeight => 48.0;
  double get inputHeight => 48.0;
  double get borderRadius => 10.0;
  double get cardRadius => 12.0;
  double get logoSize => isSmall ? 34.0 : 40.0;

  double _s(double base) => (base * scale).roundToDouble();
}
