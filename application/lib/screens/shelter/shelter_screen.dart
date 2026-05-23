import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/civilian_service.dart';
import '../../services/shelter_service.dart';
import '../../widgets/app_button.dart';

class ShelterScreen extends StatelessWidget {
  const ShelterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    if (user?.hasShelter == true) return _MyShelterView(user: user!);
    if (user?.civilianProfile?.housingStatus == 'private') {
      return _PrivateHousingView(user: user!);
    }
    return const _FindShelterPrompt();
  }
}

// ── No shelter assigned ────────────────────────────────────────────────────

class _FindShelterPrompt extends StatefulWidget {
  const _FindShelterPrompt();

  @override
  State<_FindShelterPrompt> createState() => _FindShelterPromptState();
}

class _FindShelterPromptState extends State<_FindShelterPrompt> {
  int _pendingInvites = 0;

  @override
  void initState() {
    super.initState();
    _loadInviteCount();
  }

  Future<void> _loadInviteCount() async {
    final userId = context.read<AuthProvider>().user?.id;
    if (userId == null) return;
    try {
      final requests = await ShelterService.getMyRequests(userId);
      if (mounted) {
        setState(() {
          _pendingInvites = requests
              .where((r) => r.type == 'invitation' && r.isPending)
              .length;
        });
      }
    } catch (_) {}
  }

  Future<void> _openRequests(BuildContext context) async {
    await context.push('/shelter/requests');
    if (mounted) _loadInviteCount();
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Shelter'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(s.pagePadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(height: s.sectionGap),
            Center(
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.tertiary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.home_work_outlined,
                  size: 40,
                  color: AppColors.secondary,
                ),
              ),
            ),
            SizedBox(height: s.sectionGap),
            Text(
              'Find Your Shelter',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: s.heading1,
                fontWeight: FontWeight.w700,
                color: AppColors.text,
              ),
            ),
            SizedBox(height: s.itemGap),
            Text(
              'Browse available shelters near you and send a join request. A shelter admin will review and accept your request.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: s.bodyMd,
                color: AppColors.textMuted,
                height: 1.5,
              ),
            ),
            SizedBox(height: s.sectionGap),
            AppButton(
              label: 'Browse Shelters',
              icon: Icons.search_rounded,
              onPressed: () => context.push('/shelter/find'),
            ),
            SizedBox(height: s.fieldGap),
            Stack(
              clipBehavior: Clip.none,
              children: [
                AppButton(
                  label: 'Invitations & Requests',
                  icon: Icons.inbox_rounded,
                  variant: ButtonVariant.ghost,
                  onPressed: () => _openRequests(context),
                ),
                if (_pendingInvites > 0)
                  Positioned(
                    top: -6,
                    right: -6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.danger,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppColors.background, width: 2),
                      ),
                      child: Text(
                        '$_pendingInvites',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            SizedBox(height: s.fieldGap),
            AppButton(
              label: 'Register Private Housing',
              icon: Icons.apartment_rounded,
              variant: ButtonVariant.secondary,
              onPressed: () => context.push('/shelter/private-housing'),
            ),
            SizedBox(height: s.sectionGap),
            _InfoCard(s: s),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final AppSizes s;
  const _InfoCard({required this.s});

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
              const Icon(Icons.info_outline, size: 16, color: AppColors.secondary),
              SizedBox(width: s.itemGap),
              Text(
                'How it works',
                style: TextStyle(
                  fontSize: s.bodySm,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text,
                ),
              ),
            ],
          ),
          SizedBox(height: s.itemGap),
          ...[
            '1. Browse available shelters',
            '2. View shelter details and capacity',
            '3. Send a join request',
            '4. Wait for admin approval',
          ].map(
            (step) => Padding(
              padding: EdgeInsets.only(bottom: s.itemGap / 2),
              child: Text(
                step,
                style: TextStyle(
                  fontSize: s.bodySm,
                  color: AppColors.textMuted,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Has shelter ────────────────────────────────────────────────────────────

class _MyShelterView extends StatefulWidget {
  final dynamic user;
  const _MyShelterView({required this.user});

  @override
  State<_MyShelterView> createState() => _MyShelterViewState();
}

class _MyShelterViewState extends State<_MyShelterView> {
  bool _leaving = false;

  Future<void> _confirmLeave() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave Shelter'),
        content: const Text(
          'Are you sure you want to leave your shelter? You will need to request to join again.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _leaving = true);
    try {
      final auth = context.read<AuthProvider>();
      await CivilianService.leaveShelter(widget.user.id as int);
      await auth.refreshUser();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _leaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    final shelter = widget.user.shelter;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Shelter'),
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
            // Shelter card
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
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: const Color(0x337C3AED),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.home_work_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  SizedBox(width: s.fieldGap),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          shelter?.name ?? 'Your Shelter',
                          style: TextStyle(
                            fontSize: s.bodyLg,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        if (shelter?.governorate != null)
                          Text(
                            shelter!.governorate,
                            style: TextStyle(
                              fontSize: s.bodySm,
                              color: const Color(0xCCFFFFFF),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: s.sectionGap),
            // Details
            if (shelter != null) ...[
              _DetailRow(
                icon: Icons.location_on_outlined,
                label: 'Address',
                value: [shelter.address, shelter.district, shelter.governorate]
                    .where((v) => v != null && v.isNotEmpty)
                    .join(', '),
                s: s,
              ),
              if (shelter.capacity != null)
                _DetailRow(
                  icon: Icons.people_outline,
                  label: 'Capacity',
                  value: '${shelter.capacity} people',
                  s: s,
                ),
              if (shelter.phone != null)
                _DetailRow(
                  icon: Icons.phone_outlined,
                  label: 'Phone',
                  value: shelter.phone!,
                  s: s,
                ),
            ],
            SizedBox(height: s.sectionGap),
            AppButton(
              label: 'Leave Shelter',
              icon: Icons.exit_to_app_rounded,
              variant: ButtonVariant.danger,
              onPressed: _leaving ? null : _confirmLeave,
              loading: _leaving,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Private housing ────────────────────────────────────────────────────────

class _PrivateHousingView extends StatefulWidget {
  final dynamic user;
  const _PrivateHousingView({required this.user});

  @override
  State<_PrivateHousingView> createState() => _PrivateHousingViewState();
}

class _PrivateHousingViewState extends State<_PrivateHousingView> {
  bool _leaving = false;

  Future<void> _confirmLeave() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave Private Housing'),
        content: const Text(
          'Are you sure? Your housing registration will be removed and you will be able to request to join a shelter.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _leaving = true);
    try {
      final auth = context.read<AuthProvider>();
      await CivilianService.removePrivateHousing(widget.user.id as int);
      await auth.refreshUser();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _leaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    final h = widget.user.privateHousing;

    final typeLabel = {
          'apartment': 'Apartment',
          'house': 'House',
          'room': 'Room',
          'other': 'Other',
        }[h?.propertyType] ??
        'Private Housing';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Housing'),
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
            // Housing card
            Container(
              padding: EdgeInsets.all(s.cardPadding + 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF059669), Color(0xFF047857)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(s.cardRadius + 2),
              ),
              child: Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: const Color(0x33FFFFFF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.apartment_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  SizedBox(width: s.fieldGap),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          typeLabel,
                          style: TextStyle(
                            fontSize: s.bodyLg,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        if (h?.governorate != null)
                          Text(
                            h!.governorate as String,
                            style: TextStyle(
                              fontSize: s.bodySm,
                              color: const Color(0xCCFFFFFF),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: s.sectionGap),
            if (h != null) ...[
              _DetailRow(
                icon: Icons.location_on_outlined,
                label: 'Address',
                value: [h.address, h.district, h.governorate]
                    .where((v) => v != null && (v as String).isNotEmpty)
                    .join(', '),
                s: s,
              ),
              if (h.landlordName != null)
                _DetailRow(
                  icon: Icons.person_outline,
                  label: 'Landlord',
                  value: h.landlordName as String,
                  s: s,
                ),
              if (h.landlordPhone != null)
                _DetailRow(
                  icon: Icons.phone_outlined,
                  label: 'Landlord Phone',
                  value: h.landlordPhone as String,
                  s: s,
                ),
              if (h.monthlyRent != null)
                _DetailRow(
                  icon: Icons.payments_outlined,
                  label: 'Monthly Rent',
                  value: '\$${(h.monthlyRent as double).toStringAsFixed(0)}',
                  s: s,
                ),
              if (h.leaseStartDate != null)
                _DetailRow(
                  icon: Icons.calendar_today_outlined,
                  label: 'Lease Start',
                  value: () {
                    final d = h.leaseStartDate as DateTime;
                    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
                  }(),
                  s: s,
                ),
              if (h.notes != null)
                _DetailRow(
                  icon: Icons.notes_outlined,
                  label: 'Notes',
                  value: h.notes as String,
                  s: s,
                ),
            ],
            SizedBox(height: s.sectionGap),
            AppButton(
              label: 'Edit Housing',
              icon: Icons.edit_rounded,
              variant: ButtonVariant.secondary,
              onPressed: () => context.push(
                '/shelter/private-housing',
                extra: widget.user.privateHousing,
              ),
            ),
            SizedBox(height: s.fieldGap),
            AppButton(
              label: 'Leave Private Housing',
              icon: Icons.exit_to_app_rounded,
              variant: ButtonVariant.danger,
              onPressed: _leaving ? null : _confirmLeave,
              loading: _leaving,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Shared detail row ──────────────────────────────────────────────────────

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final AppSizes s;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: s.fieldGap),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.secondary),
          SizedBox(width: s.itemGap),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: s.caption,
                    color: AppColors.textSubtle,
                  ),
                ),
                Text(
                  value.isNotEmpty ? value : '—',
                  style: TextStyle(
                    fontSize: s.bodyMd,
                    color: AppColors.text,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
