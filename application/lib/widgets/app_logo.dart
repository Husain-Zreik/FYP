import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

enum LogoVariant {
  onDark,  // white — for placement on dark (primary) backgrounds
  onLight, // branded — for placement on light (white/surface) backgrounds
}

class AppLogo extends StatelessWidget {
  final LogoVariant variant;
  final double size;

  const AppLogo({
    super.key,
    this.variant = LogoVariant.onLight,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    final isOnDark = variant == LogoVariant.onDark;
    final textColor = isOnDark ? Colors.white : AppColors.primary;
    final containerColor =
        isOnDark ? const Color(0x4D7C3AED) : AppColors.tertiary;
    final iconColor = isOnDark ? Colors.white : AppColors.secondary;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: containerColor,
            borderRadius: BorderRadius.circular(size * 0.25),
          ),
          child: Center(
            child: Icon(
              Icons.home_work_outlined,
              color: iconColor,
              size: size * 0.55,
            ),
          ),
        ),
        SizedBox(width: size * 0.25),
        Text(
          'Nuzuh',
          style: TextStyle(
            fontSize: size * 0.55,
            fontWeight: FontWeight.w700,
            color: textColor,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }
}
