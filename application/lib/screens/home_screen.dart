import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/app_sizes.dart';
import '../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_logo.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final s = AppSizes.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            title: AppLogo(variant: LogoVariant.onDark, size: s.logoSize - 10),
            backgroundColor: AppColors.primary,
            surfaceTintColor: Colors.transparent,
            floating: true,
            snap: true,
            centerTitle: false,
          ),
          SliverPadding(
            padding: EdgeInsets.all(s.pagePadding),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // ── Welcome ────────────────────────────────────────────
                _WelcomeCard(
                  name: user?.name ?? 'User',
                  hasShelter: user?.hasShelter ?? false,
                  shelterName: user?.shelter?.name,
                  s: s,
                ),
                SizedBox(height: s.sectionGap),
                // ── Quick actions ─────────────────────────────────────
                Text(
                  'Quick Access',
                  style: TextStyle(
                    fontSize: s.bodyLg,
                    fontWeight: FontWeight.w600,
                    color: AppColors.text,
                  ),
                ),
                SizedBox(height: s.fieldGap),
                _QuickGrid(hasShelter: user?.hasShelter ?? false, s: s),
                SizedBox(height: s.pagePadding),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _WelcomeCard extends StatelessWidget {
  final String name;
  final bool hasShelter;
  final String? shelterName;
  final AppSizes s;

  const _WelcomeCard({
    required this.name,
    required this.hasShelter,
    this.shelterName,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(s.cardPadding + 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, Color(0xFF3730A3)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(s.cardRadius + 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Hello, ${name.split(' ').first} 👋',
            style: TextStyle(
              fontSize: s.heading2,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          SizedBox(height: s.itemGap / 2),
          Row(
            children: [
              Icon(
                hasShelter
                    ? Icons.check_circle_outline
                    : Icons.info_outline,
                size: 14,
                color: hasShelter
                    ? const Color(0xFF6EE7B7) // success green
                    : const Color(0xFFFCD34D), // warning yellow
              ),
              SizedBox(width: s.itemGap / 2),
              Expanded(
                child: Text(
                  hasShelter
                      ? shelterName != null
                          ? 'Registered at $shelterName'
                          : 'Registered at a shelter'
                      : 'Not registered at a shelter yet',
                  style: TextStyle(
                    fontSize: s.bodySm,
                    color: const Color(0xCCFFFFFF),
                  ),
                ),
              ),
            ],
          ),
          if (!hasShelter) ...[
            SizedBox(height: s.fieldGap),
            GestureDetector(
              onTap: () => context.go('/shelter'),
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: s.fieldGap,
                  vertical: s.itemGap,
                ),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: BorderRadius.circular(s.borderRadius - 2),
                ),
                child: Text(
                  'Find a Shelter →',
                  style: TextStyle(
                    fontSize: s.bodySm,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _QuickGrid extends StatelessWidget {
  final bool hasShelter;
  final AppSizes s;

  const _QuickGrid({required this.hasShelter, required this.s});

  @override
  Widget build(BuildContext context) {
    final items = [
      if (!hasShelter)
        _QuickItem(
          icon: Icons.search_rounded,
          label: 'Find Shelter',
          color: AppColors.secondary,
          bg: AppColors.tertiary,
          onTap: () => context.go('/shelter'),
        )
      else
        _QuickItem(
          icon: Icons.home_work_rounded,
          label: 'My Shelter',
          color: AppColors.secondary,
          bg: AppColors.tertiary,
          onTap: () => context.go('/shelter'),
        ),
      _QuickItem(
        icon: Icons.favorite_rounded,
        label: 'Incoming Aid',
        color: AppColors.success,
        bg: AppColors.successSurface,
        onTap: () => context.go('/aid'),
      ),
      _QuickItem(
        icon: Icons.campaign_rounded,
        label: 'My Needs',
        color: AppColors.warning,
        bg: AppColors.warningSurface,
        onTap: () => context.go('/aid'),
      ),
      _QuickItem(
        icon: Icons.person_rounded,
        label: 'Profile',
        color: AppColors.textMuted,
        bg: AppColors.surface,
        onTap: () => context.go('/profile'),
      ),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: s.fieldGap,
      mainAxisSpacing: s.fieldGap,
      childAspectRatio: 1.6,
      children: items,
    );
  }
}

class _QuickItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color bg;
  final VoidCallback onTap;

  const _QuickItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.bg,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(s.cardPadding),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(s.cardRadius),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: color, size: 24),
            Text(
              label,
              style: TextStyle(
                fontSize: s.bodySm,
                fontWeight: FontWeight.w600,
                color: AppColors.text,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
