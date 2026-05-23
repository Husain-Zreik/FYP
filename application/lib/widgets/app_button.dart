import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

enum ButtonVariant { primary, secondary, ghost, danger }

// Mirrors website/src/components/ui/Button.jsx — primary/secondary/ghost/danger variants.
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final bool loading;
  final bool expand;
  final IconData? icon;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = ButtonVariant.primary,
    this.loading = false,
    this.expand = true,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null || loading;

    final (Color bg, Color fg, Color? borderColor) = switch (variant) {
      ButtonVariant.primary => (
          isDisabled ? AppColors.surface2 : AppColors.secondary,
          isDisabled ? AppColors.textSubtle : Colors.white,
          null,
        ),
      ButtonVariant.secondary => (AppColors.surface, AppColors.text, null),
      ButtonVariant.ghost => (
          Colors.transparent,
          AppColors.secondary,
          AppColors.border2,
        ),
      ButtonVariant.danger => (
          isDisabled ? AppColors.dangerSurface : AppColors.danger,
          isDisabled ? AppColors.danger : Colors.white,
          null,
        ),
    };

    final content = loading
        ? SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: fg),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18, color: fg),
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: fg,
                ),
              ),
            ],
          );

    final button = SizedBox(
      height: 48,
      width: expand ? double.infinity : null,
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: isDisabled ? null : onPressed,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(
              border: borderColor != null ? Border.all(color: borderColor) : null,
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: content,
          ),
        ),
      ),
    );

    return button;
  }
}
