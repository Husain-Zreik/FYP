import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/shelter.dart';
import '../../models/shelter_request.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../services/shelter_service.dart';
import '../../widgets/app_button.dart';

class ShelterDetailScreen extends StatefulWidget {
  final int shelterId;
  final Shelter? shelter;

  const ShelterDetailScreen({
    super.key,
    required this.shelterId,
    this.shelter,
  });

  @override
  State<ShelterDetailScreen> createState() => _ShelterDetailScreenState();
}

class _ShelterDetailScreenState extends State<ShelterDetailScreen> {
  bool _requesting = false;
  bool _cancelling = false;
  bool _acceptingInvite = false;
  bool _rejectingInvite = false;
  ShelterRequest? _pendingRequest;    // civilian sent a join request
  ShelterRequest? _pendingInvitation; // shelter sent an invitation
  bool _checkingRequest = true;
  Shelter? _fetchedShelter;
  bool _fetchingSheler = false;
  String? _fetchError;

  @override
  void initState() {
    super.initState();
    if (widget.shelter == null) {
      _fetchShelter();
    }
    _checkExistingRequest();
  }

  Future<void> _fetchShelter() async {
    setState(() {
      _fetchingSheler = true;
      _fetchError = null;
    });
    try {
      final s = await ShelterService.getShelter(widget.shelterId);
      if (mounted) setState(() => _fetchedShelter = s);
    } on ApiException catch (e) {
      if (mounted) setState(() => _fetchError = e.message);
    } finally {
      if (mounted) setState(() => _fetchingSheler = false);
    }
  }

  Future<void> _checkExistingRequest() async {
    final userId = context.read<AuthProvider>().user?.id;
    if (userId == null) {
      if (mounted) setState(() => _checkingRequest = false);
      return;
    }
    try {
      final requests = await ShelterService.getMyRequests(userId);
      if (mounted) {
        final forThis = requests
            .where((r) => r.shelter.id == widget.shelterId && r.isPending);
        setState(() {
          _pendingInvitation =
              forThis.where((r) => r.type == 'invitation').firstOrNull;
          _pendingRequest =
              forThis.where((r) => r.type == 'request').firstOrNull;
          _checkingRequest = false;
        });
      }
    } on ApiException catch (_) {
      if (mounted) setState(() => _checkingRequest = false);
    }
  }

  Future<void> _acceptInvitation() async {
    if (_pendingInvitation == null) return;
    setState(() => _acceptingInvite = true);
    try {
      await ShelterService.acceptInvitation(_pendingInvitation!.id);
      if (mounted) await context.read<AuthProvider>().refreshUser();
      if (mounted) {
        // Clear both fields — the backend cancelled all other pending
        // requests/invitations for this civilian on acceptance
        setState(() {
          _pendingInvitation = null;
          _pendingRequest = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invitation accepted! You are now a member.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _acceptingInvite = false);
    }
  }

  Future<void> _rejectInvitation() async {
    if (_pendingInvitation == null) return;
    setState(() => _rejectingInvite = true);
    try {
      await ShelterService.rejectInvitation(_pendingInvitation!.id);
      if (mounted) {
        setState(() => _pendingInvitation = null);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invitation declined.')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _rejectingInvite = false);
    }
  }

  Future<void> _cancelRequest() async {
    if (_pendingRequest == null) return;
    setState(() => _cancelling = true);
    try {
      await ShelterService.cancelRequest(_pendingRequest!.id);
      if (mounted) {
        setState(() => _pendingRequest = null);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Request cancelled.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  Future<void> _requestToJoin() async {
    setState(() => _requesting = true);
    try {
      await ShelterService.requestToJoin(widget.shelterId);
      if (mounted) {
        // Re-check so we get the real request ID (needed to cancel later)
        await _checkExistingRequest();
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Join request sent successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  Future<void> _openDirections(Shelter shelter) async {
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1'
      '&destination=${shelter.latitude},${shelter.longitude}',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    final shelter = widget.shelter ?? _fetchedShelter;
    final user = context.watch<AuthProvider>().user;
    final profileComplete = user?.isProfileComplete == true;
    final alreadyMember = user?.hasShelter == true;
    final isThisShelter = user?.shelterId == widget.shelterId;

    if (shelter == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Shelter Details'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
        ),
        body: _fetchError != null
            ? Center(
                child: Padding(
                  padding: EdgeInsets.all(s.pagePadding),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded,
                          size: 48, color: AppColors.danger),
                      SizedBox(height: s.fieldGap),
                      Text(_fetchError!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              fontSize: s.bodySm, color: AppColors.textMuted)),
                      SizedBox(height: s.fieldGap),
                      TextButton.icon(
                        onPressed: _fetchShelter,
                        icon: const Icon(Icons.refresh_rounded, size: 16),
                        label: const Text('Retry'),
                        style: TextButton.styleFrom(
                            foregroundColor: AppColors.secondary),
                      ),
                    ],
                  ),
                ),
              )
            : const Center(
                child: CircularProgressIndicator(color: AppColors.secondary),
              ),
      );
    }

    final hasCoords = shelter.latitude != null && shelter.longitude != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(shelter.name, overflow: TextOverflow.ellipsis),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (hasCoords)
            IconButton(
              icon: const Icon(Icons.directions_rounded),
              tooltip: 'Directions',
              onPressed: () => _openDirections(shelter),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Header: image → mini-map → placeholder ────────────────
            _ShelterHeader(shelter: shelter),

            // ── Info section ──────────────────────────────────────────
            Padding(
              padding: EdgeInsets.all(s.pagePadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name + status badge
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.tertiary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.home_work_rounded,
                            color: AppColors.secondary, size: 26),
                      ),
                      SizedBox(width: s.fieldGap),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              shelter.name,
                              style: TextStyle(
                                fontSize: s.heading3,
                                fontWeight: FontWeight.w700,
                                color: AppColors.text,
                              ),
                            ),
                            const SizedBox(height: 4),
                            _StatusBadge(status: shelter.status, s: s),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: s.sectionGap),

                  // Details card
                  Container(
                    padding: EdgeInsets.all(s.cardPadding),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(s.cardRadius),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        _InfoRow(
                          icon: Icons.location_on_outlined,
                          label: 'Location',
                          value: shelter.district != null
                              ? '${shelter.district}, ${shelter.governorate}'
                              : shelter.governorate,
                          s: s,
                        ),
                        if (shelter.address != null) ...[
                          const _RowDivider(),
                          _InfoRow(
                            icon: Icons.place_outlined,
                            label: 'Address',
                            value: shelter.address!,
                            s: s,
                          ),
                        ],
                        if (shelter.phone != null) ...[
                          const _RowDivider(),
                          _InfoRow(
                            icon: Icons.phone_outlined,
                            label: 'Phone',
                            value: shelter.phone!,
                            s: s,
                          ),
                        ],
                        if (shelter.rooms != null) ...[
                          const _RowDivider(),
                          _InfoRow(
                            icon: Icons.meeting_room_outlined,
                            label: 'Rooms',
                            value: '${shelter.rooms}',
                            s: s,
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Occupancy card (shown when capacity is known)
                  if (shelter.capacity != null) ...[
                    SizedBox(height: s.itemGap),
                    _OccupancyCard(shelter: shelter, s: s),
                  ],

                  // Admin contact card (shown when admin info is available)
                  if (shelter.admin != null) ...[
                    SizedBox(height: s.itemGap),
                    _AdminContactCard(admin: shelter.admin!, s: s),
                  ],

                  SizedBox(height: s.sectionGap),

                  // ── Join action ───────────────────────────────────
                  if (_checkingRequest)
                    const Center(
                      child: SizedBox(
                        height: 36,
                        width: 36,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.secondary,
                        ),
                      ),
                    )
                  else if (isThisShelter)
                    _MemberState(s: s)
                  else if (_pendingInvitation != null)
                    _InvitationActionState(
                      onAccept: _acceptInvitation,
                      onReject: _rejectInvitation,
                      accepting: _acceptingInvite,
                      rejecting: _rejectingInvite,
                      s: s,
                    )
                  else if (_pendingRequest != null)
                    _RequestSentState(
                      onCancel: _cancelRequest,
                      cancelling: _cancelling,
                      s: s,
                    )
                  else if (alreadyMember)
                    _AlreadyInShelterState(s: s)
                  else if (!shelter.isJoinable)
                    _UnavailableState(reason: shelter.unavailableReason, s: s)
                  else if (!profileComplete)
                    _ProfileGateState(s: s)
                  else
                    AppButton(
                      label: 'Request to Join',
                      icon: Icons.send_rounded,
                      loading: _requesting,
                      onPressed: _requesting ? null : _requestToJoin,
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

// ── Header: image → mini-map → placeholder ──────────────────────────────────

class _ShelterHeader extends StatelessWidget {
  final Shelter shelter;

  const _ShelterHeader({required this.shelter});

  @override
  Widget build(BuildContext context) {
    if (shelter.imageUrl != null) {
      return SizedBox(
        height: 220,
        width: double.infinity,
        child: Image.network(
          shelter.imageUrl!,
          fit: BoxFit.cover,
          loadingBuilder: (_, child, progress) =>
              progress == null ? child : _placeholder(),
          errorBuilder: (_, _, _) => _placeholder(),
        ),
      );
    }

    final hasCoords =
        shelter.latitude != null && shelter.longitude != null;

    if (hasCoords) {
      return SizedBox(
        height: 200,
        child: FlutterMap(
          options: MapOptions(
            initialCenter: LatLng(shelter.latitude!, shelter.longitude!),
            initialZoom: 14,
            interactionOptions:
                const InteractionOptions(flags: InteractiveFlag.none),
          ),
          children: [
            TileLayer(
              urlTemplate:
                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.nuzuh.application',
            ),
            MarkerLayer(
              markers: [
                Marker(
                  point: LatLng(shelter.latitude!, shelter.longitude!),
                  width: 44,
                  height: 44,
                  child: const Icon(Icons.location_on_rounded,
                      color: AppColors.secondary, size: 44),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return _placeholder();
  }

  Widget _placeholder() => Container(
        height: 120,
        color: AppColors.surface2,
        child: const Center(
          child: Icon(Icons.home_work_outlined,
              size: 48, color: AppColors.border2),
        ),
      );
}

// ── Occupancy card ───────────────────────────────────────────────────────────

class _OccupancyCard extends StatelessWidget {
  final Shelter shelter;
  final AppSizes s;

  const _OccupancyCard({required this.shelter, required this.s});

  @override
  Widget build(BuildContext context) {
    final cap = shelter.capacity!;
    final count = shelter.civiliansCount ?? 0;
    final pct = shelter.occupancyFraction ?? 0.0;

    final Color barColor;
    if (pct >= 1.0) {
      barColor = AppColors.danger;
    } else if (pct >= 0.85) {
      barColor = AppColors.warning;
    } else {
      barColor = AppColors.success;
    }

    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.people_outline_rounded,
                  size: 16, color: AppColors.secondary),
              SizedBox(width: s.itemGap),
              Text(
                'Occupancy',
                style: TextStyle(
                    fontSize: s.bodySm, color: AppColors.textSubtle),
              ),
              const Spacer(),
              Text(
                shelter.civiliansCount != null
                    ? '$count / $cap people'
                    : '$cap total capacity',
                style: TextStyle(
                  fontSize: s.bodySm,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text,
                ),
              ),
              SizedBox(width: s.itemGap),
              if (shelter.civiliansCount != null)
                Text(
                  '${(pct * 100).round()}%',
                  style: TextStyle(
                    fontSize: s.caption,
                    fontWeight: FontWeight.w700,
                    color: barColor,
                  ),
                ),
            ],
          ),
          if (shelter.civiliansCount != null) ...[
            SizedBox(height: s.itemGap - 2),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: pct,
                minHeight: 8,
                backgroundColor: AppColors.surface2,
                color: barColor,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Admin contact card ───────────────────────────────────────────────────────

class _AdminContactCard extends StatelessWidget {
  final ShelterAdmin admin;
  final AppSizes s;

  const _AdminContactCard({required this.admin, required this.s});

  Future<void> _launch(String scheme, String target) async {
    final uri = Uri.parse('$scheme:$target');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.manage_accounts_outlined,
                  size: 16, color: AppColors.secondary),
              SizedBox(width: s.itemGap),
              Text(
                'Shelter Admin',
                style: TextStyle(
                  fontSize: s.bodySm,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSubtle,
                ),
              ),
            ],
          ),
          SizedBox(height: s.itemGap),
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.tertiary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.person_rounded,
                    color: AppColors.secondary, size: 22),
              ),
              SizedBox(width: s.itemGap),
              Expanded(
                child: Text(
                  admin.name,
                  style: TextStyle(
                    fontSize: s.bodyMd,
                    fontWeight: FontWeight.w600,
                    color: AppColors.text,
                  ),
                ),
              ),
            ],
          ),
          if (admin.phone != null || admin.email != null) ...[
            SizedBox(height: s.itemGap),
            Row(
              children: [
                if (admin.phone != null)
                  Expanded(
                    child: _ContactButton(
                      icon: Icons.phone_rounded,
                      label: admin.phone!,
                      color: AppColors.success,
                      bgColor: AppColors.successSurface,
                      onTap: () => _launch('tel', admin.phone!),
                      s: s,
                    ),
                  ),
                if (admin.phone != null && admin.email != null)
                  SizedBox(width: s.itemGap),
                if (admin.email != null)
                  Expanded(
                    child: _ContactButton(
                      icon: Icons.email_outlined,
                      label: 'Email',
                      color: AppColors.secondary,
                      bgColor: AppColors.tertiary,
                      onTap: () => _launch('mailto', admin.email!),
                      s: s,
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

class _ContactButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color bgColor;
  final VoidCallback onTap;
  final AppSizes s;

  const _ContactButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.bgColor,
    required this.onTap,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: s.itemGap),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(s.borderRadius),
          border: Border.all(color: color.withAlpha(60)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 15, color: color),
            SizedBox(width: 5),
            Flexible(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: s.caption,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final String status;
  final AppSizes s;

  const _StatusBadge({required this.status, required this.s});

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color fg, String label) = switch (status) {
      'active' => (AppColors.successSurface, AppColors.success, 'Active'),
      'inactive' => (AppColors.surface2, AppColors.textSubtle, 'Closed'),
      'full' => (AppColors.dangerSurface, AppColors.danger, 'Full'),
      _ => (AppColors.surface2, AppColors.textSubtle, status),
    };
    return Container(
      padding: EdgeInsets.symmetric(horizontal: s.itemGap, vertical: 3),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label,
          style: TextStyle(
              fontSize: s.caption,
              fontWeight: FontWeight.w600,
              color: fg)),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final AppSizes s;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: s.itemGap / 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.secondary),
          SizedBox(width: s.itemGap),
          SizedBox(
            width: 70,
            child: Text(label,
                style: TextStyle(
                    fontSize: s.bodySm, color: AppColors.textSubtle)),
          ),
          Expanded(
            child: Text(value,
                style: TextStyle(
                    fontSize: s.bodySm,
                    fontWeight: FontWeight.w500,
                    color: AppColors.text)),
          ),
        ],
      ),
    );
  }
}

class _RowDivider extends StatelessWidget {
  const _RowDivider();

  @override
  Widget build(BuildContext context) =>
      const Divider(height: 1, color: AppColors.border);
}

class _RequestSentState extends StatelessWidget {
  final VoidCallback onCancel;
  final bool cancelling;
  final AppSizes s;

  const _RequestSentState({
    required this.onCancel,
    required this.cancelling,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.successSurface,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: const Color(0x4D10B981)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle_rounded,
                  color: AppColors.success, size: 20),
              SizedBox(width: s.itemGap),
              Expanded(
                child: Text(
                  'Join request sent. Waiting for shelter admin review.',
                  style: TextStyle(
                      fontSize: s.bodySm,
                      color: AppColors.textMuted,
                      height: 1.5),
                ),
              ),
            ],
          ),
          SizedBox(height: s.fieldGap),
          cancelling
              ? const Center(
                  child: SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.danger,
                    ),
                  ),
                )
              : AppButton(
                  label: 'Cancel Request',
                  icon: Icons.cancel_outlined,
                  variant: ButtonVariant.ghost,
                  onPressed: onCancel,
                ),
        ],
      ),
    );
  }
}

class _InvitationActionState extends StatelessWidget {
  final VoidCallback onAccept;
  final VoidCallback onReject;
  final bool accepting;
  final bool rejecting;
  final AppSizes s;

  const _InvitationActionState({
    required this.onAccept,
    required this.onReject,
    required this.accepting,
    required this.rejecting,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    final busy = accepting || rejecting;
    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.tertiary,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.secondary, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.mark_email_unread_rounded,
                  color: AppColors.secondary, size: 20),
              SizedBox(width: s.itemGap),
              Text(
                'You have been invited to join',
                style: TextStyle(
                  fontSize: s.bodySm,
                  fontWeight: FontWeight.w600,
                  color: AppColors.secondary,
                ),
              ),
            ],
          ),
          SizedBox(height: s.fieldGap),
          Text(
            'This shelter has sent you an invitation. Accept to become a member or decline to dismiss.',
            style: TextStyle(
                fontSize: s.bodySm,
                color: AppColors.textMuted,
                height: 1.5),
          ),
          SizedBox(height: s.cardPadding),
          Row(
            children: [
              Expanded(
                child: _InviteButton(
                  label: 'Accept',
                  icon: Icons.check_rounded,
                  color: AppColors.success,
                  bgColor: AppColors.successSurface,
                  loading: accepting,
                  enabled: !busy,
                  onTap: onAccept,
                  s: s,
                ),
              ),
              SizedBox(width: s.itemGap),
              Expanded(
                child: _InviteButton(
                  label: 'Decline',
                  icon: Icons.close_rounded,
                  color: AppColors.danger,
                  bgColor: AppColors.dangerSurface,
                  loading: rejecting,
                  enabled: !busy,
                  onTap: onReject,
                  s: s,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InviteButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;
  final bool loading;
  final bool enabled;
  final VoidCallback onTap;
  final AppSizes s;

  const _InviteButton({
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
          height: 44,
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

class _MemberState extends StatelessWidget {
  final AppSizes s;

  const _MemberState({required this.s});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.tertiary,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.home_work_rounded,
              color: AppColors.secondary, size: 20),
          SizedBox(width: s.itemGap),
          Text(
            'You are a member of this shelter.',
            style: TextStyle(
              fontSize: s.bodySm,
              fontWeight: FontWeight.w600,
              color: AppColors.secondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _AlreadyInShelterState extends StatelessWidget {
  final AppSizes s;

  const _AlreadyInShelterState({required this.s});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.warningSurface,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: const Color(0x4DF59E0B)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded,
              color: AppColors.warning, size: 20),
          SizedBox(width: s.itemGap),
          Expanded(
            child: Text(
              'You are already assigned to a shelter.',
              style: TextStyle(
                  fontSize: s.bodySm,
                  color: AppColors.textMuted,
                  height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}

class _UnavailableState extends StatelessWidget {
  final String? reason;
  final AppSizes s;

  const _UnavailableState({required this.reason, required this.s});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.dangerSurface,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: const Color(0x4DEF4444)),
      ),
      child: Row(
        children: [
          const Icon(Icons.block_rounded, color: AppColors.danger, size: 20),
          SizedBox(width: s.itemGap),
          Expanded(
            child: Text(
              reason == 'Closed'
                  ? 'This shelter is currently closed and not accepting new members.'
                  : 'This shelter has reached full capacity.',
              style: TextStyle(
                  fontSize: s.bodySm,
                  color: AppColors.textMuted,
                  height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileGateState extends StatelessWidget {
  final AppSizes s;

  const _ProfileGateState({required this.s});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(s.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.warningSurface,
        borderRadius: BorderRadius.circular(s.cardRadius),
        border: Border.all(color: const Color(0x4DF59E0B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded,
                  size: 18, color: AppColors.warning),
              SizedBox(width: s.itemGap),
              Text(
                'Profile incomplete',
                style: TextStyle(
                  fontSize: s.bodyMd,
                  fontWeight: FontWeight.w600,
                  color: AppColors.warning,
                ),
              ),
            ],
          ),
          SizedBox(height: s.itemGap),
          Text(
            'Complete your profile — including ID number, ID document photo, and current address — before requesting to join.',
            style: TextStyle(
                fontSize: s.bodySm,
                color: AppColors.textMuted,
                height: 1.5),
          ),
          SizedBox(height: s.fieldGap),
          AppButton(
            label: 'Complete Your Profile',
            icon: Icons.edit_rounded,
            onPressed: () => context.push('/profile/complete'),
          ),
        ],
      ),
    );
  }
}
