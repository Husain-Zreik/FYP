import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/aid_dispatch.dart';
import '../../models/civilian_need.dart';
import '../../providers/auth_provider.dart';
import '../../services/aid_service.dart';
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

class _IncomingAidTab extends StatefulWidget {
  const _IncomingAidTab();

  @override
  State<_IncomingAidTab> createState() => _IncomingAidTabState();
}

class _IncomingAidTabState extends State<_IncomingAidTab> {
  List<AidDispatch>? _dispatches;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await AidService.getDispatches();
      if (mounted) setState(() => _dispatches = data);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  Future<void> _accept(AidDispatch dispatch) async {
    final s = AppSizes.of(context);
    DateTime selected = DateTime.now();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Text('Confirm Receipt'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Confirm receipt of ${dispatch.quantity} ${dispatch.category.unit} of ${dispatch.category.name}?',
                style: TextStyle(fontSize: s.bodyMd),
              ),
              SizedBox(height: s.sectionGap),
              Text(
                'Date received',
                style: TextStyle(
                  fontSize: s.bodySm,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMuted,
                ),
              ),
              SizedBox(height: s.itemGap),
              GestureDetector(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: ctx,
                    initialDate: selected,
                    firstDate: DateTime(2024),
                    lastDate: DateTime.now(),
                  );
                  if (picked != null) setS(() => selected = picked);
                },
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: s.fieldGap,
                    vertical: s.itemGap + 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(s.borderRadius),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded,
                          size: 16, color: AppColors.textMuted),
                      SizedBox(width: s.itemGap),
                      Text(
                        '${selected.year}-${selected.month.toString().padLeft(2, '0')}-${selected.day.toString().padLeft(2, '0')}',
                        style: TextStyle(
                            fontSize: s.bodyMd, color: AppColors.text),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Confirm'),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true || !mounted) return;
    try {
      final dateStr =
          '${selected.year}-${selected.month.toString().padLeft(2, '0')}-${selected.day.toString().padLeft(2, '0')}';
      await AidService.acceptDispatch(dispatch.id, dateStr);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to accept: $e')),
        );
      }
    }
  }

  Future<void> _reject(AidDispatch dispatch) async {
    final s = AppSizes.of(context);
    final reasonController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject Aid'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Reject ${dispatch.quantity} ${dispatch.category.unit} of ${dispatch.category.name}?',
              style: TextStyle(fontSize: s.bodyMd),
            ),
            SizedBox(height: s.sectionGap),
            Text(
              'Reason (optional)',
              style: TextStyle(
                fontSize: s.bodySm,
                fontWeight: FontWeight.w600,
                color: AppColors.textMuted,
              ),
            ),
            SizedBox(height: s.itemGap),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Why are you rejecting this aid?',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    reasonController.dispose();
    if (confirmed != true || !mounted) return;
    try {
      await AidService.rejectDispatch(dispatch.id,
          reason: reasonController.text);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to reject: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);

    if (_error != null) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(s.pagePadding),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded,
                  size: 48, color: AppColors.danger),
              SizedBox(height: s.fieldGap),
              Text('Failed to load dispatches',
                  style: TextStyle(
                      fontSize: s.bodyMd,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted)),
              SizedBox(height: s.itemGap),
              AppButton(
                label: 'Retry',
                variant: ButtonVariant.secondary,
                expand: false,
                onPressed: () => setState(() {
                  _error = null;
                  _dispatches = null;
                  _load();
                }),
              ),
            ],
          ),
        ),
      );
    }

    if (_dispatches == null) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.secondary));
    }

    if (_dispatches!.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.volunteer_activism_outlined,
                size: 56, color: AppColors.border2),
            SizedBox(height: s.fieldGap),
            Text('No incoming aid',
                style: TextStyle(
                    fontSize: s.bodyMd,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted)),
            SizedBox(height: s.itemGap / 2),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: s.pagePadding * 2),
              child: Text(
                'Aid dispatches from your shelter will appear here',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: s.bodySm, color: AppColors.textSubtle),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.secondary,
      onRefresh: _load,
      child: ListView.separated(
        padding: EdgeInsets.all(s.pagePadding),
        itemCount: _dispatches!.length,
        separatorBuilder: (_, _) => SizedBox(height: s.itemGap),
        itemBuilder: (_, i) => _DispatchCard(
          dispatch: _dispatches![i],
          onAccept: () => _accept(_dispatches![i]),
          onReject: () => _reject(_dispatches![i]),
        ),
      ),
    );
  }
}

class _DispatchCard extends StatelessWidget {
  final AidDispatch dispatch;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  const _DispatchCard({
    required this.dispatch,
    required this.onAccept,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);

    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  dispatch.category.name,
                  style: TextStyle(
                    fontSize: s.bodyMd,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text,
                  ),
                ),
              ),
              _StatusBadge(dispatch.status),
            ],
          ),
          SizedBox(height: s.itemGap / 2),
          Text(
            '${dispatch.quantity} ${dispatch.category.unit}',
            style: TextStyle(
              fontSize: s.bodySm,
              color: AppColors.textMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: s.itemGap / 2),
          Text(
            'From: ${dispatch.dispatcherName}',
            style: TextStyle(fontSize: s.bodySm, color: AppColors.textSubtle),
          ),
          if (dispatch.notes != null && dispatch.notes!.isNotEmpty) ...[
            SizedBox(height: s.itemGap / 2),
            Text(
              dispatch.notes!,
              style:
                  TextStyle(fontSize: s.bodySm, color: AppColors.textSubtle),
            ),
          ],
          if (dispatch.isAccepted && dispatch.receivedAt != null) ...[
            SizedBox(height: s.itemGap / 2),
            Text(
              'Received: ${dispatch.receivedAt}',
              style: TextStyle(
                  fontSize: s.bodySm, color: AppColors.success),
            ),
          ],
          if (dispatch.isRejected && dispatch.rejectionReason != null) ...[
            SizedBox(height: s.itemGap / 2),
            Text(
              'Reason: ${dispatch.rejectionReason}',
              style:
                  TextStyle(fontSize: s.bodySm, color: AppColors.danger),
            ),
          ],
          if (dispatch.isPending) ...[
            SizedBox(height: s.fieldGap),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Accept',
                    icon: Icons.check_rounded,
                    onPressed: onAccept,
                  ),
                ),
                SizedBox(width: s.itemGap),
                Expanded(
                  child: AppButton(
                    label: 'Reject',
                    variant: ButtonVariant.danger,
                    icon: Icons.close_rounded,
                    onPressed: onReject,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// ── My Needs ───────────────────────────────────────────────────────────────

class _MyNeedsTab extends StatefulWidget {
  const _MyNeedsTab();

  @override
  State<_MyNeedsTab> createState() => _MyNeedsTabState();
}

class _MyNeedsTabState extends State<_MyNeedsTab> {
  List<CivilianNeed>? _needs;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await AidService.getNeeds();
      if (mounted) setState(() => _needs = data);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    final user = context.watch<AuthProvider>().user;

    if (_error != null) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(s.pagePadding),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded,
                  size: 48, color: AppColors.danger),
              SizedBox(height: s.fieldGap),
              Text('Failed to load needs',
                  style: TextStyle(
                      fontSize: s.bodyMd,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted)),
              SizedBox(height: s.itemGap),
              AppButton(
                label: 'Retry',
                variant: ButtonVariant.secondary,
                expand: false,
                onPressed: () => setState(() {
                  _error = null;
                  _needs = null;
                  _load();
                }),
              ),
            ],
          ),
        ),
      );
    }

    if (_needs == null) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.secondary));
    }

    return RefreshIndicator(
      color: AppColors.secondary,
      onRefresh: _load,
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: EdgeInsets.fromLTRB(
                s.pagePadding, s.pagePadding, s.pagePadding, s.itemGap),
            sliver: SliverToBoxAdapter(
              child: user?.hasShelter == true
                  ? AppButton(
                      label: 'Submit a Need',
                      icon: Icons.add_rounded,
                      onPressed: () async {
                        await context.push('/aid/submit-need');
                        _load();
                      },
                    )
                  : Container(
                      padding: EdgeInsets.all(s.cardPadding),
                      decoration: BoxDecoration(
                        color: AppColors.warningSurface,
                        borderRadius: BorderRadius.circular(s.cardRadius),
                        border: Border.all(
                            color: AppColors.warning.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline_rounded,
                              size: 18, color: AppColors.warning),
                          SizedBox(width: s.itemGap),
                          Expanded(
                            child: Text(
                              'You must be assigned to a shelter to submit needs.',
                              style: TextStyle(
                                  fontSize: s.bodySm,
                                  color: AppColors.warning),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
          ),
          if (_needs!.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.campaign_outlined,
                        size: 56, color: AppColors.border2),
                    SizedBox(height: s.fieldGap),
                    Text('No needs submitted',
                        style: TextStyle(
                            fontSize: s.bodyMd,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textMuted)),
                    SizedBox(height: s.itemGap / 2),
                    Padding(
                      padding:
                          EdgeInsets.symmetric(horizontal: s.pagePadding * 2),
                      child: Text(
                        'Your submitted needs will appear here',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: s.bodySm,
                            color: AppColors.textSubtle),
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: EdgeInsets.fromLTRB(
                  s.pagePadding, 0, s.pagePadding, s.pagePadding),
              sliver: SliverList.separated(
                itemCount: _needs!.length,
                separatorBuilder: (_, _) => SizedBox(height: s.itemGap),
                itemBuilder: (_, i) => _NeedCard(need: _needs![i]),
              ),
            ),
        ],
      ),
    );
  }
}

class _NeedCard extends StatelessWidget {
  final CivilianNeed need;
  const _NeedCard({required this.need});

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    final category =
        need.category[0].toUpperCase() + need.category.substring(1);

    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  category,
                  style: TextStyle(
                    fontSize: s.bodyMd,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text,
                  ),
                ),
              ),
              if (need.urgency != null) ...[
                _UrgencyBadge(need.urgency!),
                SizedBox(width: s.itemGap / 2),
              ],
              _StatusBadge(need.status),
            ],
          ),
          SizedBox(height: s.itemGap / 2),
          Text(
            need.description,
            style: TextStyle(fontSize: s.bodySm, color: AppColors.textMuted),
          ),
          if (need.shelterNotes != null && need.shelterNotes!.isNotEmpty) ...[
            SizedBox(height: s.itemGap),
            Container(
              padding: EdgeInsets.all(s.itemGap),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(s.borderRadius - 2),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.comment_outlined,
                      size: 14, color: AppColors.textSubtle),
                  SizedBox(width: s.itemGap / 2),
                  Expanded(
                    child: Text(
                      need.shelterNotes!,
                      style: TextStyle(
                          fontSize: s.bodySm, color: AppColors.textSubtle),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (need.reviewedByName != null) ...[
            SizedBox(height: s.itemGap / 2),
            Text(
              'Reviewed by ${need.reviewedByName}',
              style: TextStyle(
                  fontSize: s.caption, color: AppColors.textSubtle),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Shared badge widgets ────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge(this.status);

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    final (Color bg, Color fg, String label) = switch (status) {
      'pending' => (
          AppColors.warningSurface,
          AppColors.warning,
          'Pending',
        ),
      'in_review' => (
          AppColors.tertiary,
          AppColors.tertiaryForeground,
          'In Review',
        ),
      'accepted' || 'fulfilled' => (
          AppColors.successSurface,
          AppColors.success,
          status == 'fulfilled' ? 'Fulfilled' : 'Accepted',
        ),
      'rejected' => (AppColors.dangerSurface, AppColors.danger, 'Rejected'),
      _ => (AppColors.surface, AppColors.textMuted, status),
    };

    return Container(
      padding: EdgeInsets.symmetric(
          horizontal: s.itemGap, vertical: s.itemGap / 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: s.caption,
          fontWeight: FontWeight.w600,
          color: fg,
        ),
      ),
    );
  }
}

class _UrgencyBadge extends StatelessWidget {
  final String urgency;
  const _UrgencyBadge(this.urgency);

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    final (Color bg, Color fg, String label) = switch (urgency) {
      'high' => (AppColors.dangerSurface, AppColors.danger, 'High'),
      'medium' => (AppColors.warningSurface, AppColors.warning, 'Medium'),
      _ => (AppColors.successSurface, AppColors.success, 'Low'),
    };

    return Container(
      padding: EdgeInsets.symmetric(
          horizontal: s.itemGap, vertical: s.itemGap / 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: s.caption,
          fontWeight: FontWeight.w600,
          color: fg,
        ),
      ),
    );
  }
}
