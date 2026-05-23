import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/app_button.dart';

class AidScreen extends StatefulWidget {
  const AidScreen({super.key});

  @override
  State<AidScreen> createState() => _AidScreenState();
}

class _AidScreenState extends State<AidScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Aid'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: const Color(0xCCFFFFFF),
          tabs: const [
            Tab(text: 'Incoming Aid'),
            Tab(text: 'My Needs'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _IncomingAidTab(),
          _MyNeedsTab(),
        ],
      ),
    );
  }
}

// ── Incoming Aid ───────────────────────────────────────────────────────────

class _IncomingAidTab extends StatelessWidget {
  const _IncomingAidTab();

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.favorite_border_rounded,
            size: 56,
            color: AppColors.border2,
          ),
          SizedBox(height: s.fieldGap),
          Text(
            'No incoming aid',
            style: TextStyle(
              fontSize: s.bodyMd,
              fontWeight: FontWeight.w600,
              color: AppColors.textMuted,
            ),
          ),
          SizedBox(height: s.itemGap / 2),
          Text(
            'Aid dispatches from your shelter will appear here',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: s.bodySm,
              color: AppColors.textSubtle,
            ),
          ),
        ],
      ),
    );
  }
}

// ── My Needs ───────────────────────────────────────────────────────────────

class _MyNeedsTab extends StatelessWidget {
  const _MyNeedsTab();

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    return Padding(
      padding: EdgeInsets.all(s.pagePadding),
      child: Column(
        children: [
          AppButton(
            label: 'Submit a Need',
            icon: Icons.add_rounded,
            onPressed: () => context.push('/aid/submit-need'),
          ),
          SizedBox(height: s.sectionGap),
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.campaign_outlined,
                    size: 56,
                    color: AppColors.border2,
                  ),
                  SizedBox(height: s.fieldGap),
                  Text(
                    'No needs submitted',
                    style: TextStyle(
                      fontSize: s.bodyMd,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted,
                    ),
                  ),
                  SizedBox(height: s.itemGap / 2),
                  Text(
                    'Your submitted needs will appear here',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: s.bodySm,
                      color: AppColors.textSubtle,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
