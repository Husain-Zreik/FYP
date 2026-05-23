import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

// Wraps every screen with two guarantees:
//   1. System text-scale is clamped to [0.85, 1.15] so large-font
//      accessibility settings can't overflow fixed-height components
//      (buttons, inputs, header chips) — same intent as the website's
//      clamped html { font-size } media queries.
//   2. resizeToAvoidBottomInset: true by default so the keyboard never
//      covers form fields.
class AppScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Color backgroundColor;
  final bool resizeToAvoidBottomInset;

  const AppScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.backgroundColor = AppColors.background,
    this.resizeToAvoidBottomInset = true,
  });

  @override
  Widget build(BuildContext context) {
    final rawScale = MediaQuery.textScalerOf(context).scale(1.0);
    final clampedScale = rawScale.clamp(0.85, 1.15);

    return MediaQuery(
      data: MediaQuery.of(context).copyWith(
        textScaler: TextScaler.linear(clampedScale),
      ),
      child: Scaffold(
        appBar: appBar,
        backgroundColor: backgroundColor,
        resizeToAvoidBottomInset: resizeToAvoidBottomInset,
        body: body,
      ),
    );
  }
}
