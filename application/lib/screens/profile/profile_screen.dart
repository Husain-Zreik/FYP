import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/family_member.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../services/family_member_service.dart';
import '../../widgets/app_button.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  List<FamilyMember>? _members;

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  Future<void> _loadMembers() async {
    final auth = context.read<AuthProvider>();
    if (auth.user == null) return;

    // Seed from the user object first (already loaded via /auth/me)
    final fromUser = auth.user!.familyMembers;
    if (mounted) setState(() => _members = List.of(fromUser));
  }

  void _openMemberSheet({FamilyMember? member}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _MemberSheet(
        member: member,
        onSaved: (updated) {
          setState(() {
            if (member == null) {
              _members = [...?_members, updated];
            } else {
              _members = _members
                  ?.map((m) => m.id == updated.id ? updated : m)
                  .toList();
            }
          });
        },
      ),
    );
  }

  Future<void> _deleteMember(FamilyMember member) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove member?'),
        content: Text('Remove ${member.name} from your family members?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await FamilyMemberService.delete(member.id);
      if (mounted) {
        setState(() => _members = _members?.where((m) => m.id != member.id).toList());
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: AppColors.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final auth = context.read<AuthProvider>();
    final s = AppSizes.of(context);
    final profile = user?.civilianProfile;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Profile'),
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
            // ── Profile completion banner ──────────────────────────────
            if (user?.isProfileComplete == false) ...[
              GestureDetector(
                onTap: () => context.push('/profile/complete'),
                child: Container(
                  padding: EdgeInsets.all(s.cardPadding),
                  decoration: BoxDecoration(
                    color: AppColors.warningSurface,
                    borderRadius: BorderRadius.circular(s.cardRadius),
                    border: Border.all(color: const Color(0x4DF59E0B)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, size: 20, color: AppColors.warning),
                      SizedBox(width: s.itemGap),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Profile incomplete',
                              style: TextStyle(
                                fontSize: s.bodySm,
                                fontWeight: FontWeight.w600,
                                color: AppColors.warning,
                              ),
                            ),
                            Text(
                              'Complete your profile to request shelter access →',
                              style: TextStyle(fontSize: s.bodySm, color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: s.sectionGap),
            ],

            // ── Avatar + name ──────────────────────────────────────────
            Center(
              child: Column(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: const BoxDecoration(
                      color: AppColors.tertiary,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        _initials(user?.name ?? '?'),
                        style: TextStyle(
                          fontSize: s.heading2,
                          fontWeight: FontWeight.w700,
                          color: AppColors.secondary,
                        ),
                      ),
                    ),
                  ),
                  SizedBox(height: s.fieldGap),
                  Text(
                    user?.name ?? '—',
                    style: TextStyle(
                      fontSize: s.bodyLg,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                    ),
                  ),
                  SizedBox(height: s.itemGap / 2),
                  Text(
                    user?.email ?? '—',
                    style: TextStyle(fontSize: s.bodySm, color: AppColors.textSubtle),
                  ),
                ],
              ),
            ),
            SizedBox(height: s.sectionGap),

            // ── Personal Details ───────────────────────────────────────
            _SectionHeader(
              title: 'Personal Details',
              action: TextButton.icon(
                onPressed: () => context.push('/profile/complete'),
                icon: const Icon(Icons.edit_rounded, size: 14),
                label: Text(
                  profile?.isComplete == true ? 'Edit' : 'Complete',
                  style: TextStyle(fontSize: s.bodySm),
                ),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.secondary,
                  padding: EdgeInsets.symmetric(horizontal: s.itemGap, vertical: 4),
                ),
              ),
              s: s,
            ),
            SizedBox(height: s.itemGap),
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(s.cardRadius),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _InfoRow(
                    icon: Icons.cake_outlined,
                    label: 'Date of Birth',
                    value: profile?.dateOfBirth != null
                        ? '${profile!.dateOfBirth!.day.toString().padLeft(2, '0')}/'
                            '${profile.dateOfBirth!.month.toString().padLeft(2, '0')}/'
                            '${profile.dateOfBirth!.year}'
                        : '—',
                    s: s,
                  ),
                  _InfoRow(
                    icon: Icons.person_outline,
                    label: 'Gender',
                    value: _capitalize(profile?.gender) ?? '—',
                    s: s,
                  ),
                  _InfoRow(
                    icon: Icons.badge_outlined,
                    label: 'ID Type',
                    value: profile?.idType == 'national_id'
                        ? 'National ID'
                        : profile?.idType == 'passport'
                            ? 'Passport'
                            : '—',
                    s: s,
                  ),
                  _InfoRow(
                    icon: Icons.numbers_rounded,
                    label: 'ID Number',
                    value: profile?.idNumber ?? '—',
                    s: s,
                  ),
                  _InfoRow(
                    icon: Icons.location_on_outlined,
                    label: 'Current Address',
                    value: profile?.currentLocation ?? '—',
                    s: s,
                    last: true,
                  ),
                ],
              ),
            ),
            SizedBox(height: s.sectionGap),

            // ── Family Members ─────────────────────────────────────────
            _SectionHeader(
              title: 'Family Members',
              action: TextButton.icon(
                onPressed: () => _openMemberSheet(),
                icon: const Icon(Icons.add_rounded, size: 14),
                label: Text('Add', style: TextStyle(fontSize: s.bodySm)),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.secondary,
                  padding: EdgeInsets.symmetric(horizontal: s.itemGap, vertical: 4),
                ),
              ),
              s: s,
            ),
            SizedBox(height: s.itemGap),
            if (_members == null || _members!.isEmpty)
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(s.cardPadding + 4),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(s.cardRadius),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  'No family members added yet.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: s.bodySm, color: AppColors.textSubtle),
                ),
              )
            else
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(s.cardRadius),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: _members!.asMap().entries.map((entry) {
                    final isLast = entry.key == _members!.length - 1;
                    final m = entry.value;
                    return _MemberRow(
                      member: m,
                      isLast: isLast,
                      s: s,
                      onEdit: () => _openMemberSheet(member: m),
                      onDelete: () => _deleteMember(m),
                    );
                  }).toList(),
                ),
              ),
            SizedBox(height: s.sectionGap),

            // ── Account ────────────────────────────────────────────────
            _SectionHeader(title: 'Account', s: s),
            SizedBox(height: s.itemGap),
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(s.cardRadius),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _InfoRow(icon: Icons.person_outline, label: 'Name', value: user?.name ?? '—', s: s),
                  _InfoRow(icon: Icons.email_outlined, label: 'Email', value: user?.email ?? '—', s: s),
                  if (user?.phone != null)
                    _InfoRow(icon: Icons.phone_outlined, label: 'Phone', value: user!.phone!, s: s, last: true)
                  else
                    _InfoRow(icon: Icons.phone_outlined, label: 'Phone', value: '—', s: s, last: true),
                ],
              ),
            ),
            SizedBox(height: s.sectionGap),

            // ── Shelter ────────────────────────────────────────────────
            _SectionHeader(title: 'Shelter', s: s),
            SizedBox(height: s.itemGap),
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(s.cardRadius),
                border: Border.all(color: AppColors.border),
              ),
              child: _InfoRow(
                icon: Icons.home_work_outlined,
                label: 'Status',
                value: user?.hasShelter == true
                    ? user?.shelter?.name ?? 'Assigned'
                    : 'Not assigned to a shelter',
                s: s,
                last: true,
              ),
            ),
            SizedBox(height: s.sectionGap),

            // ── Logout ─────────────────────────────────────────────────
            AppButton(
              label: 'Log Out',
              icon: Icons.logout_rounded,
              variant: ButtonVariant.ghost,
              onPressed: () async {
                await auth.logout();
                if (context.mounted) context.go('/login');
              },
            ),
            SizedBox(height: s.pagePadding),
          ],
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  String? _capitalize(String? s) {
    if (s == null || s.isEmpty) return null;
    return s[0].toUpperCase() + s.substring(1);
  }
}

// ── Member row in the list ────────────────────────────────────────────────────

class _MemberRow extends StatelessWidget {
  final FamilyMember member;
  final bool isLast;
  final AppSizes s;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _MemberRow({
    required this.member,
    required this.isLast,
    required this.s,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: s.cardPadding, vertical: s.cardPadding - 2),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.tertiary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.person_rounded, size: 18, color: AppColors.secondary),
              ),
              SizedBox(width: s.fieldGap),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      member.name,
                      style: TextStyle(
                        fontSize: s.bodyMd,
                        fontWeight: FontWeight.w600,
                        color: AppColors.text,
                      ),
                    ),
                    Text(
                      member.relationshipLabel,
                      style: TextStyle(fontSize: s.bodySm, color: AppColors.textSubtle),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.edit_outlined, size: 18),
                color: AppColors.secondary,
                onPressed: onEdit,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, size: 18),
                color: AppColors.danger,
                onPressed: onDelete,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              ),
            ],
          ),
        ),
        if (!isLast) Divider(height: 1, color: AppColors.border),
      ],
    );
  }
}

// ── Section header ────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  final Widget? action;
  final AppSizes s;

  const _SectionHeader({required this.title, this.action, required this.s});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: s.bodySm,
            fontWeight: FontWeight.w600,
            color: AppColors.textSubtle,
            letterSpacing: 0.5,
          ),
        ),
        const Spacer(),
        if (action != null) action!,
      ],
    );
  }
}

// ── Info row ──────────────────────────────────────────────────────────────────

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final AppSizes s;
  final bool last;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.s,
    this.last = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.all(s.cardPadding),
          child: Row(
            children: [
              Icon(icon, size: 18, color: AppColors.secondary),
              SizedBox(width: s.fieldGap),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: TextStyle(fontSize: s.caption, color: AppColors.textSubtle),
                    ),
                    Text(
                      value,
                      style: TextStyle(fontSize: s.bodyMd, color: AppColors.text),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (!last) Divider(height: 1, color: AppColors.border),
      ],
    );
  }
}

// ── Add / Edit member bottom sheet ────────────────────────────────────────────

class _MemberSheet extends StatefulWidget {
  final FamilyMember? member;
  final void Function(FamilyMember) onSaved;

  const _MemberSheet({this.member, required this.onSaved});

  @override
  State<_MemberSheet> createState() => _MemberSheetState();
}

class _MemberSheetState extends State<_MemberSheet> {
  final _nameController = TextEditingController();
  final _idNumberController = TextEditingController();
  final _notesController = TextEditingController();

  String? _relationship;
  DateTime? _dateOfBirth;
  String? _gender;
  String? _idType;
  bool _loading = false;
  String? _error;

  static const _genders = [('male', 'Male'), ('female', 'Female')];
  static const _idTypes = [('national_id', 'National ID'), ('passport', 'Passport')];

  @override
  void initState() {
    super.initState();
    final m = widget.member;
    if (m != null) {
      _nameController.text = m.name;
      _relationship = m.relationship;
      _dateOfBirth = m.dateOfBirth;
      _gender = m.gender;
      _idType = m.idType;
      _idNumberController.text = m.idNumber ?? '';
      _notesController.text = m.notes ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _idNumberController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dateOfBirth ?? DateTime(now.year - 10),
      firstDate: DateTime(1930),
      lastDate: now,
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.secondary,
            onPrimary: Colors.white,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _dateOfBirth = picked);
  }

  Future<void> _save() async {
    if (_nameController.text.trim().isEmpty || _relationship == null) {
      setState(() => _error = 'Name and relationship are required.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final data = <String, dynamic>{
      'name': _nameController.text.trim(),
      'relationship': _relationship,
      if (_dateOfBirth != null)
        'date_of_birth':
            '${_dateOfBirth!.year.toString().padLeft(4, '0')}-'
            '${_dateOfBirth!.month.toString().padLeft(2, '0')}-'
            '${_dateOfBirth!.day.toString().padLeft(2, '0')}',
      if (_gender != null) 'gender': _gender,
      if (_idType != null) 'id_type': _idType,
      if (_idNumberController.text.trim().isNotEmpty)
        'id_number': _idNumberController.text.trim(),
      if (_notesController.text.trim().isNotEmpty)
        'notes': _notesController.text.trim(),
    };

    try {
      final saved = widget.member == null
          ? await FamilyMemberService.create(data)
          : await FamilyMemberService.update(widget.member!.id, data);

      widget.onSaved(saved);
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        left: s.pagePadding,
        right: s.pagePadding,
        top: s.pagePadding,
        bottom: MediaQuery.of(context).viewInsets.bottom + s.pagePadding,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border2,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            SizedBox(height: s.fieldGap),
            Text(
              widget.member == null ? 'Add Family Member' : 'Edit Family Member',
              style: TextStyle(
                fontSize: s.bodyLg,
                fontWeight: FontWeight.w700,
                color: AppColors.text,
              ),
            ),
            SizedBox(height: s.sectionGap),

            if (_error != null) ...[
              Container(
                padding: EdgeInsets.all(s.cardPadding),
                decoration: BoxDecoration(
                  color: AppColors.dangerSurface,
                  borderRadius: BorderRadius.circular(s.borderRadius),
                ),
                child: Text(_error!, style: TextStyle(fontSize: s.bodySm, color: AppColors.danger)),
              ),
              SizedBox(height: s.fieldGap),
            ],

            // Name
            _SheetLabel('Full Name *', s),
            SizedBox(height: s.itemGap),
            TextField(
              controller: _nameController,
              style: TextStyle(fontSize: s.bodyMd, color: AppColors.text),
              decoration: const InputDecoration(hintText: 'Enter full name'),
            ),
            SizedBox(height: s.fieldGap),

            // Relationship
            _SheetLabel('Relationship *', s),
            SizedBox(height: s.itemGap),
            Wrap(
              spacing: s.itemGap,
              runSpacing: s.itemGap,
              children: FamilyMember.relationships.map((entry) {
                final (value, label) = entry;
                final selected = _relationship == value;
                return GestureDetector(
                  onTap: () => setState(() => _relationship = value),
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: s.fieldGap, vertical: s.itemGap - 2),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.secondary : AppColors.surface,
                      borderRadius: BorderRadius.circular(s.borderRadius - 2),
                      border: Border.all(
                        color: selected ? AppColors.secondary : AppColors.border,
                      ),
                    ),
                    child: Text(
                      label,
                      style: TextStyle(
                        fontSize: s.bodySm,
                        fontWeight: FontWeight.w500,
                        color: selected ? Colors.white : AppColors.text,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: s.fieldGap),

            // Date of birth
            _SheetLabel('Date of Birth', s),
            SizedBox(height: s.itemGap),
            GestureDetector(
              onTap: _pickDate,
              child: Container(
                height: s.inputHeight,
                padding: EdgeInsets.symmetric(horizontal: s.fieldGap),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(s.borderRadius),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, size: 18, color: AppColors.textSubtle),
                    SizedBox(width: s.itemGap),
                    Text(
                      _dateOfBirth != null
                          ? '${_dateOfBirth!.day.toString().padLeft(2, '0')}/'
                              '${_dateOfBirth!.month.toString().padLeft(2, '0')}/'
                              '${_dateOfBirth!.year}'
                          : 'Optional',
                      style: TextStyle(
                        fontSize: s.bodyMd,
                        color: _dateOfBirth != null ? AppColors.text : AppColors.textSubtle,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: s.fieldGap),

            // Gender
            _SheetLabel('Gender', s),
            SizedBox(height: s.itemGap),
            Row(
              children: _genders.map((entry) {
                final (value, label) = entry;
                final selected = _gender == value;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: value != 'female' ? s.itemGap : 0),
                    child: GestureDetector(
                      onTap: () => setState(() => _gender = _gender == value ? null : value),
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: s.itemGap),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.secondary : AppColors.surface,
                          borderRadius: BorderRadius.circular(s.borderRadius - 2),
                          border: Border.all(
                            color: selected ? AppColors.secondary : AppColors.border,
                          ),
                        ),
                        child: Text(
                          label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: s.bodySm,
                            fontWeight: FontWeight.w500,
                            color: selected ? Colors.white : AppColors.text,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: s.fieldGap),

            // ID Type
            _SheetLabel('ID Type', s),
            SizedBox(height: s.itemGap),
            Row(
              children: _idTypes.map((entry) {
                final (value, label) = entry;
                final selected = _idType == value;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: value != 'passport' ? s.itemGap : 0),
                    child: GestureDetector(
                      onTap: () => setState(() => _idType = _idType == value ? null : value),
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: s.itemGap),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.secondary : AppColors.surface,
                          borderRadius: BorderRadius.circular(s.borderRadius - 2),
                          border: Border.all(
                            color: selected ? AppColors.secondary : AppColors.border,
                          ),
                        ),
                        child: Text(
                          label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: s.bodySm,
                            fontWeight: FontWeight.w500,
                            color: selected ? Colors.white : AppColors.text,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: s.fieldGap),

            // ID Number
            _SheetLabel('ID Number', s),
            SizedBox(height: s.itemGap),
            TextField(
              controller: _idNumberController,
              style: TextStyle(fontSize: s.bodyMd, color: AppColors.text),
              decoration: const InputDecoration(hintText: 'Optional'),
            ),
            SizedBox(height: s.fieldGap),

            // Notes
            _SheetLabel('Notes', s),
            SizedBox(height: s.itemGap),
            TextField(
              controller: _notesController,
              maxLines: 2,
              style: TextStyle(fontSize: s.bodyMd, color: AppColors.text),
              decoration: const InputDecoration(hintText: 'Optional'),
            ),
            SizedBox(height: s.sectionGap),

            AppButton(
              label: widget.member == null ? 'Add Member' : 'Save Changes',
              icon: Icons.check_rounded,
              loading: _loading,
              onPressed: _save,
            ),
          ],
        ),
      ),
    );
  }
}

class _SheetLabel extends StatelessWidget {
  final String text;
  final AppSizes s;
  const _SheetLabel(this.text, this.s);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(fontSize: s.bodySm, color: AppColors.textMuted),
    );
  }
}
