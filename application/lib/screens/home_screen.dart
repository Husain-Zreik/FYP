import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/app_sizes.dart';
import '../core/theme/app_colors.dart';
import '../models/aid_dispatch.dart';
import '../models/civilian_need.dart';
import '../models/shelter_request.dart';
import '../providers/auth_provider.dart';
import '../services/aid_service.dart';
import '../services/shelter_service.dart';
import '../widgets/app_logo.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<ShelterRequest> _requests = [];
  List<AidDispatch> _dispatches = [];
  List<CivilianNeed> _needs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = context.read<AuthProvider>().user?.id;
    final hasShelter = context.read<AuthProvider>().user?.hasShelter ?? false;
    if (userId == null) return;

    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ShelterService.getMyRequests(userId),
        if (hasShelter) AidService.getDispatches() else Future.value(<AidDispatch>[]),
        if (hasShelter) AidService.getNeeds() else Future.value(<CivilianNeed>[]),
      ]);
      if (mounted) {
        setState(() {
          _requests = results[0] as List<ShelterRequest>;
          _dispatches = results[1] as List<AidDispatch>;
          _needs = results[2] as List<CivilianNeed>;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _acceptInvite(ShelterRequest req) async {
    final auth = context.read<AuthProvider>();
    try {
      await ShelterService.acceptInvitation(req.id);
      await auth.refreshUser();
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to accept: $e')),
        );
      }
    }
  }

  Future<void> _rejectInvite(ShelterRequest req) async {
    try {
      await ShelterService.rejectInvitation(req.id);
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
    final user = context.watch<AuthProvider>().user;
    final s = AppSizes.of(context);

    final pendingInvites =
        _requests.where((r) => r.type == 'invitation' && r.isPending).toList();
    final pendingRequests =
        _requests.where((r) => r.type == 'request' && r.isPending).toList();
    final pendingDispatches =
        _dispatches.where((d) => d.isPending).toList();
    final activeNeeds =
        _needs.where((n) => n.isPending || n.isInReview).toList();
    final fulfilledNeeds = _needs.where((n) => n.isFulfilled).length;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.secondary,
        onRefresh: _load,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              title:
                  AppLogo(variant: LogoVariant.onDark, size: s.logoSize - 10),
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
                  // ── Welcome ──────────────────────────────────────────
                  _WelcomeCard(user: user, s: s),
                  SizedBox(height: s.sectionGap),

                  // ── Needs Attention ──────────────────────────────────
                  if (!_loading &&
                      (pendingInvites.isNotEmpty ||
                          pendingDispatches.isNotEmpty)) ...[
                    _SectionHeader(
                      title: 'Needs Your Attention',
                      icon: Icons.notification_important_rounded,
                      iconColor: AppColors.danger,
                    ),
                    SizedBox(height: s.fieldGap),
                    ...pendingInvites.map(
                      (req) => Padding(
                        padding: EdgeInsets.only(bottom: s.itemGap),
                        child: _InvitationCard(
                          request: req,
                          s: s,
                          onAccept: () => _acceptInvite(req),
                          onReject: () => _rejectInvite(req),
                        ),
                      ),
                    ),
                    if (pendingDispatches.isNotEmpty)
                      Padding(
                        padding: EdgeInsets.only(bottom: s.itemGap),
                        child: _ActionBanner(
                          icon: Icons.volunteer_activism_rounded,
                          color: AppColors.success,
                          bgColor: AppColors.successSurface,
                          title:
                              '${pendingDispatches.length} aid dispatch${pendingDispatches.length == 1 ? '' : 'es'} awaiting confirmation',
                          subtitle: 'Tap to confirm or decline receipt',
                          onTap: () => context.go('/aid'),
                          s: s,
                        ),
                      ),
                    SizedBox(height: s.itemGap),
                  ],

                  // ── My Needs (if has shelter) ────────────────────────
                  if (user?.hasShelter == true && !_loading) ...[
                    _SectionHeader(
                      title: 'My Needs',
                      action: _SectionAction(
                        label: 'View All',
                        onTap: () => context.go('/aid'),
                      ),
                    ),
                    SizedBox(height: s.fieldGap),
                    _NeedsSummaryCard(
                      activeNeeds: activeNeeds,
                      fulfilledCount: fulfilledNeeds,
                      totalCount: _needs.length,
                      s: s,
                      onTap: () => context.go('/aid'),
                    ),
                    SizedBox(height: s.sectionGap),
                  ],

                  // ── Recent Aid (if has shelter) ──────────────────────
                  if (user?.hasShelter == true && !_loading && _dispatches.isNotEmpty) ...[
                    _SectionHeader(
                      title: 'Recent Aid',
                      action: _SectionAction(
                        label: 'View All',
                        onTap: () => context.go('/aid'),
                      ),
                    ),
                    SizedBox(height: s.fieldGap),
                    ..._dispatches.take(3).map(
                          (d) => Padding(
                            padding: EdgeInsets.only(bottom: s.itemGap),
                            child: _AidDispatchRow(dispatch: d, s: s),
                          ),
                        ),
                    SizedBox(height: s.itemGap),
                  ],

                  // ── Pending Join Requests (no shelter) ──────────────
                  if (user?.hasShelter != true &&
                      !_loading &&
                      pendingRequests.isNotEmpty) ...[
                    _SectionHeader(
                      title: 'My Requests',
                      action: _SectionAction(
                        label: 'View All',
                        onTap: () =>
                            context.push('/shelter/requests'),
                      ),
                    ),
                    SizedBox(height: s.fieldGap),
                    ...pendingRequests.map(
                      (req) => Padding(
                        padding: EdgeInsets.only(bottom: s.itemGap),
                        child: _RequestStatusRow(request: req, s: s),
                      ),
                    ),
                    SizedBox(height: s.itemGap),
                  ],

                  // ── Get Housed CTA (no shelter) ──────────────────────
                  if (user?.hasShelter != true &&
                      user?.civilianProfile?.housingStatus != 'private') ...[
                    _SectionHeader(title: 'Get Housed'),
                    SizedBox(height: s.fieldGap),
                    _ActionBanner(
                      icon: Icons.search_rounded,
                      color: AppColors.secondary,
                      bgColor: AppColors.tertiary,
                      title: 'Find a shelter near you',
                      subtitle: 'Browse available shelters and send a request',
                      onTap: () => context.go('/shelter'),
                      s: s,
                    ),
                    SizedBox(height: s.itemGap),
                    _ActionBanner(
                      icon: Icons.home_rounded,
                      color: AppColors.textMuted,
                      bgColor: AppColors.surface,
                      title: 'Staying in private housing?',
                      subtitle: 'Register your private housing arrangement',
                      onTap: () =>
                          context.push('/shelter/private-housing'),
                      s: s,
                    ),
                    SizedBox(height: s.sectionGap),
                  ],

                  // ── Loading skeleton ─────────────────────────────────
                  if (_loading) ...[
                    _LoadingSection(s: s),
                    SizedBox(height: s.sectionGap),
                  ],

                  // ── Quick Access ─────────────────────────────────────
                  _SectionHeader(title: 'Quick Access'),
                  SizedBox(height: s.fieldGap),
                  _QuickGrid(hasShelter: user?.hasShelter ?? false, s: s),
                  SizedBox(height: s.pagePadding),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Welcome card ────────────────────────────────────────────────────────────

class _WelcomeCard extends StatelessWidget {
  final dynamic user;
  final AppSizes s;
  const _WelcomeCard({required this.user, required this.s});

  @override
  Widget build(BuildContext context) {
    final firstName = (user?.name as String?)?.split(' ').first ?? 'User';
    final hasShelter = user?.hasShelter == true;
    final isPrivate =
        user?.civilianProfile?.housingStatus == 'private';

    final (IconData statusIcon, Color statusColor, String statusText) =
        hasShelter
            ? (
                Icons.check_circle_outline_rounded,
                const Color(0xFF6EE7B7),
                user?.shelter?.name != null
                    ? 'At ${user!.shelter!.name}'
                    : 'At your shelter',
              )
            : isPrivate
                ? (
                    Icons.home_outlined,
                    const Color(0xFF93C5FD),
                    'Private housing registered',
                  )
                : (
                    Icons.info_outline_rounded,
                    const Color(0xFFFCD34D),
                    'Not registered at a shelter yet',
                  );

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
            'Hello, $firstName',
            style: TextStyle(
              fontSize: s.heading2,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          SizedBox(height: s.itemGap / 2),
          Row(
            children: [
              Icon(statusIcon, size: 14, color: statusColor),
              SizedBox(width: s.itemGap / 2),
              Expanded(
                child: Text(
                  statusText,
                  style: TextStyle(
                      fontSize: s.bodySm,
                      color: const Color(0xCCFFFFFF)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Section header ──────────────────────────────────────────────────────────

class _SectionAction {
  final String label;
  final VoidCallback onTap;
  const _SectionAction({required this.label, required this.onTap});
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData? icon;
  final Color? iconColor;
  final _SectionAction? action;

  const _SectionHeader({
    required this.title,
    this.icon,
    this.iconColor,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, size: 16, color: iconColor ?? AppColors.textMuted),
          SizedBox(width: s.itemGap / 2),
        ],
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: s.bodyLg,
              fontWeight: FontWeight.w600,
              color: AppColors.text,
            ),
          ),
        ),
        if (action != null)
          GestureDetector(
            onTap: action!.onTap,
            child: Text(
              action!.label,
              style: TextStyle(
                fontSize: s.bodySm,
                fontWeight: FontWeight.w600,
                color: AppColors.secondary,
              ),
            ),
          ),
      ],
    );
  }
}

// ── Invitation card ─────────────────────────────────────────────────────────

class _InvitationCard extends StatefulWidget {
  final ShelterRequest request;
  final AppSizes s;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  const _InvitationCard({
    required this.request,
    required this.s,
    required this.onAccept,
    required this.onReject,
  });

  @override
  State<_InvitationCard> createState() => _InvitationCardState();
}

class _InvitationCardState extends State<_InvitationCard> {
  bool _accepting = false;
  bool _rejecting = false;

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.secondary.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: AppColors.secondary.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.symmetric(
                    horizontal: s.itemGap, vertical: s.itemGap / 2),
                decoration: BoxDecoration(
                  color: AppColors.tertiary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Shelter Invitation',
                  style: TextStyle(
                    fontSize: s.caption,
                    fontWeight: FontWeight.w600,
                    color: AppColors.tertiaryForeground,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: s.itemGap),
          Text(
            widget.request.shelter.name,
            style: TextStyle(
              fontSize: s.bodyMd,
              fontWeight: FontWeight.w700,
              color: AppColors.text,
            ),
          ),
          SizedBox(height: s.itemGap / 2),
          Text(
            'You have been invited to join this shelter. Accept or decline below.',
            style:
                TextStyle(fontSize: s.bodySm, color: AppColors.textSubtle),
          ),
          SizedBox(height: s.fieldGap),
          Row(
            children: [
              Expanded(
                child: _SmallButton(
                  label: 'Accept',
                  loading: _accepting,
                  color: AppColors.success,
                  bgColor: AppColors.successSurface,
                  onTap: () async {
                    setState(() => _accepting = true);
                    widget.onAccept();
                  },
                ),
              ),
              SizedBox(width: s.itemGap),
              Expanded(
                child: _SmallButton(
                  label: 'Decline',
                  loading: _rejecting,
                  color: AppColors.danger,
                  bgColor: AppColors.dangerSurface,
                  onTap: () async {
                    setState(() => _rejecting = true);
                    widget.onReject();
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SmallButton extends StatelessWidget {
  final String label;
  final bool loading;
  final Color color;
  final Color bgColor;
  final VoidCallback onTap;

  const _SmallButton({
    required this.label,
    required this.loading,
    required this.color,
    required this.bgColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    return GestureDetector(
      onTap: loading ? null : onTap,
      child: Container(
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(s.borderRadius),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: loading
            ? SizedBox(
                height: 16,
                width: 16,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: color),
              )
            : Text(
                label,
                style: TextStyle(
                  fontSize: s.bodySm,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
      ),
    );
  }
}

// ── Action banner ───────────────────────────────────────────────────────────

class _ActionBanner extends StatelessWidget {
  final IconData icon;
  final Color color;
  final Color bgColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final AppSizes s;

  const _ActionBanner({
    required this.icon,
    required this.color,
    required this.bgColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(s.cardPadding),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(s.cardRadius),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
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
                  SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                        fontSize: s.bodySm, color: AppColors.textSubtle),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded,
                color: AppColors.border2, size: 20),
          ],
        ),
      ),
    );
  }
}

// ── Needs summary card ──────────────────────────────────────────────────────

class _NeedsSummaryCard extends StatelessWidget {
  final List<CivilianNeed> activeNeeds;
  final int fulfilledCount;
  final int totalCount;
  final AppSizes s;
  final VoidCallback onTap;

  const _NeedsSummaryCard({
    required this.activeNeeds,
    required this.fulfilledCount,
    required this.totalCount,
    required this.s,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (totalCount == 0) {
      return GestureDetector(
        onTap: onTap,
        child: Container(
          padding: EdgeInsets.all(s.cardPadding),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(s.cardRadius),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              const Icon(Icons.campaign_outlined,
                  size: 20, color: AppColors.textSubtle),
              SizedBox(width: s.fieldGap),
              Expanded(
                child: Text(
                  'No needs submitted yet. Tap to submit one.',
                  style: TextStyle(
                      fontSize: s.bodySm, color: AppColors.textSubtle),
                ),
              ),
              const Icon(Icons.chevron_right_rounded,
                  color: AppColors.border2, size: 20),
            ],
          ),
        ),
      );
    }

    final pendingCount =
        activeNeeds.where((n) => n.isPending).length;
    final inReviewCount =
        activeNeeds.where((n) => n.isInReview).length;

    return GestureDetector(
      onTap: onTap,
      child: Container(
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
                  child: _StatChip(
                    label: 'Pending',
                    count: pendingCount,
                    color: AppColors.warning,
                    bg: AppColors.warningSurface,
                  ),
                ),
                SizedBox(width: s.itemGap),
                Expanded(
                  child: _StatChip(
                    label: 'In Review',
                    count: inReviewCount,
                    color: AppColors.tertiaryForeground,
                    bg: AppColors.tertiary,
                  ),
                ),
                SizedBox(width: s.itemGap),
                Expanded(
                  child: _StatChip(
                    label: 'Fulfilled',
                    count: fulfilledCount,
                    color: AppColors.success,
                    bg: AppColors.successSurface,
                  ),
                ),
              ],
            ),
            if (activeNeeds.isNotEmpty) ...[
              SizedBox(height: s.fieldGap),
              const Divider(color: AppColors.border, height: 1),
              SizedBox(height: s.fieldGap),
              ...activeNeeds.take(2).map(
                    (n) => Padding(
                      padding: EdgeInsets.only(bottom: s.itemGap / 2),
                      child: Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: n.isPending
                                  ? AppColors.warning
                                  : AppColors.secondary,
                              shape: BoxShape.circle,
                            ),
                          ),
                          SizedBox(width: s.itemGap),
                          Expanded(
                            child: Text(
                              '${n.category[0].toUpperCase()}${n.category.substring(1)} — ${n.description}',
                              style: TextStyle(
                                  fontSize: s.bodySm,
                                  color: AppColors.textMuted),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final Color bg;
  const _StatChip(
      {required this.label,
      required this.count,
      required this.color,
      required this.bg});

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    return Container(
      padding: EdgeInsets.symmetric(
          vertical: s.itemGap, horizontal: s.itemGap),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(s.borderRadius - 2),
      ),
      child: Column(
        children: [
          Text(
            '$count',
            style: TextStyle(
              fontSize: s.heading3,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
                fontSize: s.caption,
                fontWeight: FontWeight.w500,
                color: color),
          ),
        ],
      ),
    );
  }
}

// ── Recent aid dispatch row ─────────────────────────────────────────────────

class _AidDispatchRow extends StatelessWidget {
  final AidDispatch dispatch;
  final AppSizes s;
  const _AidDispatchRow({required this.dispatch, required this.s});

  @override
  Widget build(BuildContext context) {
    final (Color color, Color bg, IconData icon) = dispatch.isPending
        ? (AppColors.warning, AppColors.warningSurface,
            Icons.hourglass_empty_rounded)
        : dispatch.isAccepted
            ? (AppColors.success, AppColors.successSurface,
                Icons.check_circle_outline_rounded)
            : (AppColors.danger, AppColors.dangerSurface,
                Icons.cancel_outlined);

    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          SizedBox(width: s.fieldGap),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${dispatch.quantity} ${dispatch.category.unit} of ${dispatch.category.name}',
                  style: TextStyle(
                    fontSize: s.bodySm,
                    fontWeight: FontWeight.w600,
                    color: AppColors.text,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'From ${dispatch.dispatcherName}',
                  style: TextStyle(
                      fontSize: s.caption, color: AppColors.textSubtle),
                ),
              ],
            ),
          ),
          Container(
            padding: EdgeInsets.symmetric(
                horizontal: s.itemGap, vertical: s.itemGap / 2),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              dispatch.isPending
                  ? 'Pending'
                  : dispatch.isAccepted
                      ? 'Received'
                      : 'Declined',
              style: TextStyle(
                fontSize: s.caption,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Pending request row (no shelter view) ───────────────────────────────────

class _RequestStatusRow extends StatelessWidget {
  final ShelterRequest request;
  final AppSizes s;
  const _RequestStatusRow({required this.request, required this.s});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.home_work_outlined,
              size: 18, color: AppColors.textSubtle),
          SizedBox(width: s.fieldGap),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  request.shelter.name,
                  style: TextStyle(
                    fontSize: s.bodySm,
                    fontWeight: FontWeight.w600,
                    color: AppColors.text,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Request sent — awaiting review',
                  style: TextStyle(
                      fontSize: s.caption, color: AppColors.textSubtle),
                ),
              ],
            ),
          ),
          Container(
            padding: EdgeInsets.symmetric(
                horizontal: s.itemGap, vertical: s.itemGap / 2),
            decoration: BoxDecoration(
              color: AppColors.warningSurface,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Pending',
              style: TextStyle(
                fontSize: s.caption,
                fontWeight: FontWeight.w600,
                color: AppColors.warning,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Loading skeleton ────────────────────────────────────────────────────────

class _LoadingSection extends StatelessWidget {
  final AppSizes s;
  const _LoadingSection({required this.s});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _SkeletonBox(height: 20, width: 120, s: s),
        SizedBox(height: s.fieldGap),
        _SkeletonBox(height: 80, s: s),
        SizedBox(height: s.itemGap),
        _SkeletonBox(height: 80, s: s),
      ],
    );
  }
}

class _SkeletonBox extends StatelessWidget {
  final double height;
  final double? width;
  final AppSizes s;
  const _SkeletonBox(
      {required this.height, this.width, required this.s});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: width ?? double.infinity,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(s.cardRadius),
      ),
    );
  }
}

// ── Quick grid ──────────────────────────────────────────────────────────────

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
        icon: Icons.volunteer_activism_rounded,
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
