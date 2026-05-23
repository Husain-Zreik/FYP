import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/app_sizes.dart';
import '../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_logo.dart';
import '../widgets/app_scaffold.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final s = AppSizes.of(context);
    final initial =
        user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'U';

    return AppScaffold(
      appBar: AppBar(
        title: AppLogo(variant: LogoVariant.onDark, size: s.logoSize - 12),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            tooltip: 'Logout',
            onPressed: () => context.read<AuthProvider>().logout(),
          ),
        ],
      ),
      body: Padding(
        padding: EdgeInsets.all(s.pagePadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: s.itemGap),
            Row(
              children: [
                CircleAvatar(
                  radius: s.logoSize * 0.7,
                  backgroundColor: AppColors.tertiary,
                  child: Text(
                    initial,
                    style: TextStyle(
                      fontSize: s.heading2,
                      fontWeight: FontWeight.w700,
                      color: AppColors.secondary,
                    ),
                  ),
                ),
                SizedBox(width: s.fieldGap),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? '',
                        style: TextStyle(
                          fontSize: s.heading3,
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        user?.email ?? '',
                        style: TextStyle(
                          fontSize: s.bodySm,
                          color: AppColors.textMuted,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: s.sectionGap),
            Container(
              padding: EdgeInsets.all(s.cardPadding),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(s.cardRadius),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.info_outline,
                    color: AppColors.secondary,
                    size: 20,
                  ),
                  SizedBox(width: s.itemGap),
                  Expanded(
                    child: Text(
                      'More features coming soon — shelter lookup, aid requests, and need submissions.',
                      style: TextStyle(
                        fontSize: s.bodySm,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
