import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/app_sizes.dart';
import '../core/theme/app_colors.dart';
import '../widgets/app_button.dart';

class NotFoundScreen extends StatelessWidget {
  const NotFoundScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Page Not Found'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: EdgeInsets.all(s.pagePadding),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.search_off_rounded,
                size: 64,
                color: AppColors.border2,
              ),
              SizedBox(height: s.fieldGap),
              Text(
                '404',
                style: TextStyle(
                  fontSize: s.displayLg,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSubtle,
                ),
              ),
              SizedBox(height: s.itemGap / 2),
              Text(
                'Page not found',
                style: TextStyle(
                  fontSize: s.bodyLg,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text,
                ),
              ),
              SizedBox(height: s.itemGap),
              Text(
                'The page you are looking for does not exist.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: s.bodyMd,
                  color: AppColors.textMuted,
                ),
              ),
              SizedBox(height: s.sectionGap),
              AppButton(
                label: 'Go Home',
                icon: Icons.home_rounded,
                onPressed: () => context.go('/home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
