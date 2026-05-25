import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../shelter/shelter_requests_screen.dart';
import 'aid_screen.dart';

class AidGateScreen extends StatelessWidget {
  const AidGateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    if (user?.hasShelter == true) return const AidScreen();
    if (user?.civilianProfile?.housingStatus == 'private') {
      return const _PrivateHousingAidInfo();
    }
    return const ShelterRequestsScreen();
  }
}

class _PrivateHousingAidInfo extends StatelessWidget {
  const _PrivateHousingAidInfo();

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Aid & Support'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(s.pagePadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: EdgeInsets.all(s.cardPadding + 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, Color(0xFF3730A3)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(s.cardRadius + 2),
              ),
              child: Row(
                children: [
                  const Icon(Icons.home_rounded, color: Colors.white, size: 28),
                  SizedBox(width: s.fieldGap),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Private Housing Registered',
                          style: TextStyle(
                            fontSize: s.bodyLg,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'You are registered as living in private accommodation.',
                          style: TextStyle(
                              fontSize: s.bodySm,
                              color: const Color(0xCCFFFFFF)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: s.sectionGap),
            Text(
              'How to receive aid',
              style: TextStyle(
                fontSize: s.bodyLg,
                fontWeight: FontWeight.w600,
                color: AppColors.text,
              ),
            ),
            SizedBox(height: s.fieldGap),
            _InfoCard(
              icon: Icons.location_city_rounded,
              title: 'Contact your local governorate',
              body:
                  'Aid distribution for private housing residents is coordinated through local government offices. Visit or call your area\'s relief coordination point.',
              s: s,
            ),
            SizedBox(height: s.itemGap),
            _InfoCard(
              icon: Icons.home_work_rounded,
              title: 'Join a shelter',
              body:
                  'If you need access to shelter-based aid (food, water, medical), you can request to join a nearby shelter. Your private housing registration will be updated.',
              s: s,
            ),
            SizedBox(height: s.sectionGap),
            GestureDetector(
              onTap: () => context.go('/shelter'),
              child: Container(
                padding: EdgeInsets.all(s.cardPadding),
                decoration: BoxDecoration(
                  color: AppColors.tertiary,
                  borderRadius: BorderRadius.circular(s.cardRadius),
                  border: Border.all(
                      color: AppColors.secondary.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded,
                        color: AppColors.secondary, size: 20),
                    SizedBox(width: s.fieldGap),
                    Expanded(
                      child: Text(
                        'Browse shelters near you',
                        style: TextStyle(
                          fontSize: s.bodyMd,
                          fontWeight: FontWeight.w600,
                          color: AppColors.secondary,
                        ),
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded,
                        color: AppColors.secondary, size: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String body;
  final AppSizes s;

  const _InfoCard(
      {required this.icon,
      required this.title,
      required this.body,
      required this.s});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.tertiary,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.secondary, size: 20),
          ),
          SizedBox(width: s.fieldGap),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: s.bodyMd,
                    fontWeight: FontWeight.w600,
                    color: AppColors.text,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  body,
                  style:
                      TextStyle(fontSize: s.bodySm, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
