import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';

class MainLayout extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainLayout({super.key, required this.navigationShell});

  // Matches the branch order in app.dart's StatefulShellRoute — tells the
  // assistant which tab the user was on when they opened it.
  static const _screenNames = ['home', 'shelter', 'aid', 'profile'];

  void _onTap(int index) {
    navigationShell.goBranch(
      index,
      // Tapping the current tab goes back to its root route
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    // Clamp system text scale once at the shell level — covers nav bar labels
    // and all tab content simultaneously.
    final clampedScale =
        MediaQuery.textScalerOf(context).scale(1.0).clamp(0.85, 1.15);

    return MediaQuery(
      data: MediaQuery.of(context).copyWith(
        textScaler: TextScaler.linear(clampedScale),
      ),
      child: Scaffold(
        body: navigationShell,
        bottomNavigationBar: _NavBar(
          currentIndex: navigationShell.currentIndex,
          onTap: _onTap,
        ),
        floatingActionButton: _AssistantFab(
          onPressed: () => context.push(
            '/assistant',
            extra: _screenNames[navigationShell.currentIndex],
          ),
        ),
      ),
    );
  }
}

class _AssistantFab extends StatelessWidget {
  final VoidCallback onPressed;
  const _AssistantFab({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: onPressed,
      backgroundColor: AppColors.secondary,
      foregroundColor: Colors.white,
      tooltip: 'Ask the Nuzuh Assistant',
      child: const Icon(Icons.auto_awesome_rounded),
    );
  }
}

class _NavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const _NavBar({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isHoused =
        context.watch<AuthProvider>().user?.hasShelter ?? false;
    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: onTap,
      backgroundColor: AppColors.background,
      indicatorColor: AppColors.tertiary,
      surfaceTintColor: Colors.transparent,
      shadowColor: AppColors.border,
      elevation: 1,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      destinations: [
        const NavigationDestination(
          icon: Icon(Icons.home_outlined, color: AppColors.textSubtle),
          selectedIcon: Icon(Icons.home_rounded, color: AppColors.secondary),
          label: 'Home',
        ),
        const NavigationDestination(
          icon: Icon(Icons.home_work_outlined, color: AppColors.textSubtle),
          selectedIcon:
              Icon(Icons.home_work_rounded, color: AppColors.secondary),
          label: 'Shelter',
        ),
        NavigationDestination(
          icon: Icon(
            isHoused
                ? Icons.favorite_border_rounded
                : Icons.mail_outline_rounded,
            color: AppColors.textSubtle,
          ),
          selectedIcon: Icon(
            isHoused ? Icons.favorite_rounded : Icons.mail_rounded,
            color: AppColors.secondary,
          ),
          label: isHoused ? 'Aid' : 'Requests',
        ),
        const NavigationDestination(
          icon: Icon(Icons.person_outline_rounded, color: AppColors.textSubtle),
          selectedIcon: Icon(Icons.person_rounded, color: AppColors.secondary),
          label: 'Profile',
        ),
      ],
    );
  }
}
