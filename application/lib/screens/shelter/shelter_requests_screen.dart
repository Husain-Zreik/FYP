import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/shelter_request.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../services/shelter_service.dart';

class ShelterRequestsScreen extends StatefulWidget {
  const ShelterRequestsScreen({super.key});

  @override
  State<ShelterRequestsScreen> createState() => _ShelterRequestsScreenState();
}

class _ShelterRequestsScreenState extends State<ShelterRequestsScreen> {
  List<ShelterRequest> _requests = [];
  bool _loading = true;
  String? _error;
  // Maps request id → which action is in progress: 'cancel' | 'accept' | 'reject'
  final Map<int, String> _busy = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = context.read<AuthProvider>().user?.id;
    if (userId == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final requests = await ShelterService.getMyRequests(userId);
      if (mounted) setState(() => _requests = requests);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _cancel(ShelterRequest req) async {
    setState(() => _busy[req.id] = 'cancel');
    try {
      await ShelterService.cancelRequest(req.id);
      if (mounted) {
        setState(() => _requests.removeWhere((r) => r.id == req.id));
        _showSnack('Request cancelled.');
      }
    } on ApiException catch (e) {
      if (mounted) _showSnack(e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy.remove(req.id));
    }
  }

  Future<void> _accept(ShelterRequest req) async {
    setState(() => _busy[req.id] = 'accept');
    try {
      await ShelterService.acceptInvitation(req.id);
      if (mounted) {
        // Refresh user so shelter assignment is reflected app-wide
        await context.read<AuthProvider>().refreshUser();
        // Reload the full list — the backend cancelled all other pending
        // requests/invitations for this civilian on acceptance
        if (mounted) await _load();
        if (mounted) _showSnack('Invitation accepted! You are now a member.');
      }
    } on ApiException catch (e) {
      if (mounted) _showSnack(e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy.remove(req.id));
    }
  }

  Future<void> _reject(ShelterRequest req) async {
    setState(() => _busy[req.id] = 'reject');
    try {
      await ShelterService.rejectInvitation(req.id);
      if (mounted) {
        setState(() => _requests = _requests
            .map((r) => r.id == req.id ? _withStatus(r, 'rejected') : r)
            .toList());
        _showSnack('Invitation declined.');
      }
    } on ApiException catch (e) {
      if (mounted) _showSnack(e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy.remove(req.id));
    }
  }

  ShelterRequest _withStatus(ShelterRequest r, String status) =>
      ShelterRequest(
        id: r.id,
        type: r.type,
        status: status,
        createdAt: r.createdAt,
        shelter: r.shelter,
      );

  void _showSnack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? AppColors.danger : AppColors.success,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Invitations & Requests'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (!_loading)
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              onPressed: _load,
              tooltip: 'Refresh',
            ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.secondary))
          : _error != null
              ? _ErrorState(error: _error!, onRetry: _load, s: s)
              : _requests.isEmpty
                  ? _EmptyState(s: s)
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: AppColors.secondary,
                      child: _SectionedList(
                        requests: _requests,
                        busy: _busy,
                        onAccept: _accept,
                        onReject: _reject,
                        onCancel: _cancel,
                        s: s,
                      ),
                    ),
    );
  }
}

// ── Sectioned list ────────────────────────────────────────────────────────────

class _SectionedList extends StatelessWidget {
  final List<ShelterRequest> requests;
  final Map<int, String> busy;
  final void Function(ShelterRequest) onAccept;
  final void Function(ShelterRequest) onReject;
  final void Function(ShelterRequest) onCancel;
  final AppSizes s;

  const _SectionedList({
    required this.requests,
    required this.busy,
    required this.onAccept,
    required this.onReject,
    required this.onCancel,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    final invites = requests.where((r) => r.type == 'invitation').toList();
    final joinReqs = requests.where((r) => r.type == 'request').toList();

    return ListView(
      padding: EdgeInsets.all(s.pagePadding),
      children: [
        if (invites.isNotEmpty) ...[
          _SectionHeader(
            icon: Icons.mark_email_unread_rounded,
            label: 'Invitations',
            count: invites.where((r) => r.isPending).length,
            s: s,
          ),
          SizedBox(height: s.itemGap),
          ...invites.map(
            (req) => Padding(
              padding: EdgeInsets.only(bottom: s.fieldGap),
              child: _InviteCard(
                request: req,
                busyAction: busy[req.id],
                onAccept: () => onAccept(req),
                onReject: () => onReject(req),
                s: s,
              ),
            ),
          ),
        ],
        if (joinReqs.isNotEmpty) ...[
          if (invites.isNotEmpty) SizedBox(height: s.itemGap),
          _SectionHeader(
            icon: Icons.send_rounded,
            label: 'Join Requests',
            s: s,
          ),
          SizedBox(height: s.itemGap),
          ...joinReqs.map(
            (req) => Padding(
              padding: EdgeInsets.only(bottom: s.fieldGap),
              child: _RequestCard(
                request: req,
                busyAction: busy[req.id],
                onCancel: () => onCancel(req),
                s: s,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count; // pending badge — 0 means no badge
  final AppSizes s;

  const _SectionHeader({
    required this.icon,
    required this.label,
    this.count = 0,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 15, color: AppColors.secondary),
        SizedBox(width: s.itemGap),
        Text(
          label,
          style: TextStyle(
            fontSize: s.bodySm,
            fontWeight: FontWeight.w700,
            color: AppColors.text,
            letterSpacing: 0.3,
          ),
        ),
        if (count > 0) ...[
          SizedBox(width: s.itemGap),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.danger,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$count',
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ],
        const Spacer(),
        Divider(
          indent: s.itemGap,
          color: AppColors.border,
        ),
      ],
    );
  }
}

// ── Invitation card ───────────────────────────────────────────────────────────

class _InviteCard extends StatelessWidget {
  final ShelterRequest request;
  final String? busyAction;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  final AppSizes s;

  const _InviteCard({
    required this.request,
    required this.busyAction,
    required this.onAccept,
    required this.onReject,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    final isPending = request.isPending;
    final busy = busyAction != null;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(
          color: isPending ? AppColors.secondary : AppColors.border,
          width: isPending ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ──────────────────────────────────────────────────
          Container(
            padding: EdgeInsets.symmetric(
                horizontal: s.cardPadding, vertical: s.itemGap),
            decoration: BoxDecoration(
              color: isPending ? AppColors.tertiary : AppColors.surface2,
              borderRadius: BorderRadius.vertical(
                  top: Radius.circular(s.cardRadius - 1)),
            ),
            child: Row(
              children: [
                Icon(
                  isPending
                      ? Icons.mark_email_unread_rounded
                      : Icons.mark_email_read_outlined,
                  size: 16,
                  color: isPending ? AppColors.secondary : AppColors.textSubtle,
                ),
                SizedBox(width: s.itemGap),
                Text(
                  'Shelter Invitation',
                  style: TextStyle(
                    fontSize: s.bodySm,
                    fontWeight: FontWeight.w700,
                    color: isPending ? AppColors.secondary : AppColors.textSubtle,
                  ),
                ),
                const Spacer(),
                _StatusPill(status: request.status, s: s),
              ],
            ),
          ),

          // ── Body ────────────────────────────────────────────────────
          Padding(
            padding: EdgeInsets.all(s.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.tertiary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.home_work_rounded,
                          color: AppColors.secondary, size: 20),
                    ),
                    SizedBox(width: s.fieldGap),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            request.shelter.name,
                            style: TextStyle(
                              fontSize: s.bodyMd,
                              fontWeight: FontWeight.w700,
                              color: AppColors.text,
                            ),
                          ),
                          Text(
                            _formatDate(request.createdAt),
                            style: TextStyle(
                                fontSize: s.caption,
                                color: AppColors.textSubtle),
                          ),
                        ],
                      ),
                    ),
                    // View button
                    _ViewButton(
                      shelterId: request.shelter.id,
                      s: s,
                    ),
                  ],
                ),
                if (isPending) ...[
                  SizedBox(height: s.cardPadding),
                  const Divider(height: 1, color: AppColors.border),
                  SizedBox(height: s.cardPadding),
                  Row(
                    children: [
                      Expanded(
                        child: _ActionButton(
                          label: 'Accept',
                          icon: Icons.check_rounded,
                          color: AppColors.success,
                          bgColor: AppColors.successSurface,
                          loading: busyAction == 'accept',
                          enabled: !busy,
                          onTap: onAccept,
                          s: s,
                        ),
                      ),
                      SizedBox(width: s.itemGap),
                      Expanded(
                        child: _ActionButton(
                          label: 'Decline',
                          icon: Icons.close_rounded,
                          color: AppColors.danger,
                          bgColor: AppColors.dangerSurface,
                          loading: busyAction == 'reject',
                          enabled: !busy,
                          onTap: onReject,
                          s: s,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Join-request card ─────────────────────────────────────────────────────────

class _RequestCard extends StatelessWidget {
  final ShelterRequest request;
  final String? busyAction;
  final VoidCallback onCancel;
  final AppSizes s;

  const _RequestCard({
    required this.request,
    required this.busyAction,
    required this.onCancel,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    final isPending = request.isPending;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          // ── Header ──────────────────────────────────────────────────
          Container(
            padding: EdgeInsets.symmetric(
                horizontal: s.cardPadding, vertical: s.itemGap),
            decoration: BoxDecoration(
              color: AppColors.surface2,
              borderRadius: BorderRadius.vertical(
                  top: Radius.circular(s.cardRadius - 1)),
            ),
            child: Row(
              children: [
                Icon(Icons.send_rounded,
                    size: 14, color: AppColors.textSubtle),
                SizedBox(width: s.itemGap),
                Text(
                  'Join Request',
                  style: TextStyle(
                    fontSize: s.bodySm,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSubtle,
                  ),
                ),
                const Spacer(),
                _StatusPill(status: request.status, s: s),
              ],
            ),
          ),

          // ── Body ────────────────────────────────────────────────────
          Padding(
            padding: EdgeInsets.all(s.cardPadding),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.surface2,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.home_work_outlined,
                      color: AppColors.textSubtle, size: 20),
                ),
                SizedBox(width: s.fieldGap),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        request.shelter.name,
                        style: TextStyle(
                          fontSize: s.bodyMd,
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                      ),
                      Text(
                        _formatDate(request.createdAt),
                        style: TextStyle(
                            fontSize: s.caption, color: AppColors.textSubtle),
                      ),
                    ],
                  ),
                ),
                SizedBox(width: s.itemGap),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    _ViewButton(shelterId: request.shelter.id, s: s),
                    if (isPending) ...[
                      SizedBox(height: s.itemGap),
                      busyAction == 'cancel'
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.danger,
                              ),
                            )
                          : GestureDetector(
                              onTap: onCancel,
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: s.fieldGap, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.dangerSurface,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                      color: const Color(0x4DEF4444)),
                                ),
                                child: Text(
                                  'Cancel',
                                  style: TextStyle(
                                    fontSize: s.caption,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.danger,
                                  ),
                                ),
                              ),
                            ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared sub-widgets ────────────────────────────────────────────────────────

class _ViewButton extends StatelessWidget {
  final int shelterId;
  final AppSizes s;

  const _ViewButton({required this.shelterId, required this.s});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/shelter/find/$shelterId'),
      child: Container(
        padding:
            EdgeInsets.symmetric(horizontal: s.fieldGap, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.tertiary,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.open_in_new_rounded,
                size: 12, color: AppColors.secondary),
            SizedBox(width: 4),
            Text(
              'View',
              style: TextStyle(
                fontSize: s.caption,
                fontWeight: FontWeight.w600,
                color: AppColors.secondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;
  final bool loading;
  final bool enabled;
  final VoidCallback onTap;
  final AppSizes s;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.bgColor,
    required this.loading,
    required this.enabled,
    required this.onTap,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 150),
        opacity: enabled ? 1.0 : 0.5,
        child: Container(
          height: 40,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(s.borderRadius),
            border: Border.all(color: color.withAlpha(60)),
          ),
          alignment: Alignment.center,
          child: loading
              ? SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: color),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, size: 16, color: color),
                    SizedBox(width: 6),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: s.bodySm,
                        fontWeight: FontWeight.w600,
                        color: color,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String status;
  final AppSizes s;

  const _StatusPill({required this.status, required this.s});

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color fg, String label) = switch (status) {
      'pending' => (AppColors.warningSurface, AppColors.warning, 'Pending'),
      'accepted' => (AppColors.successSurface, AppColors.success, 'Accepted'),
      'rejected' => (AppColors.dangerSurface, AppColors.danger, 'Declined'),
      _ => (AppColors.surface2, AppColors.textSubtle, status),
    };

    return Container(
      padding: EdgeInsets.symmetric(horizontal: s.itemGap, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: s.caption, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

String _formatDate(DateTime d) =>
    '${d.day.toString().padLeft(2, '0')}/'
    '${d.month.toString().padLeft(2, '0')}/'
    '${d.year}';

// ── Empty / Error states ──────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final AppSizes s;
  const _EmptyState({required this.s});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.inbox_outlined, size: 56, color: AppColors.border2),
          SizedBox(height: s.fieldGap),
          Text(
            'No requests or invites',
            style: TextStyle(
                fontSize: s.bodyMd,
                fontWeight: FontWeight.w600,
                color: AppColors.textMuted),
          ),
          SizedBox(height: s.itemGap / 2),
          Text(
            'Your join requests and shelter invitations will appear here',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: s.bodySm, color: AppColors.textSubtle),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  final AppSizes s;

  const _ErrorState(
      {required this.error, required this.onRetry, required this.s});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(s.pagePadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded,
                size: 48, color: AppColors.danger),
            SizedBox(height: s.fieldGap),
            Text(error,
                textAlign: TextAlign.center,
                style:
                    TextStyle(fontSize: s.bodySm, color: AppColors.textMuted)),
            SizedBox(height: s.fieldGap),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Retry'),
              style:
                  TextButton.styleFrom(foregroundColor: AppColors.secondary),
            ),
          ],
        ),
      ),
    );
  }
}
