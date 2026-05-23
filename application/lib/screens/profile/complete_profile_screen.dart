import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/civilian_service.dart';
import '../../services/api_client.dart';
import '../../widgets/app_button.dart';
import '../../widgets/error_banner.dart';

class CompleteProfileScreen extends StatefulWidget {
  const CompleteProfileScreen({super.key});

  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
  final _idNumberController = TextEditingController();
  final _locationController = TextEditingController();

  DateTime? _dateOfBirth;
  String? _gender;
  String? _idType;
  XFile? _pickedDocument;
  bool _loading = false;
  String? _error;
  bool _isEditing = false; // true when profile already complete (editing mode)

  static const _genders = [('male', 'Male'), ('female', 'Female')];
  static const _idTypes = [
    ('national_id', 'National ID'),
    ('passport', 'Passport'),
  ];

  @override
  void initState() {
    super.initState();
    final profile = context.read<AuthProvider>().user?.civilianProfile;
    if (profile != null) {
      _isEditing = profile.isComplete;
      _dateOfBirth = profile.dateOfBirth;
      _gender = profile.gender;
      _idType = profile.idType;
      _idNumberController.text = profile.idNumber ?? '';
      _locationController.text = profile.currentLocation ?? '';
    }
  }

  @override
  void dispose() {
    _idNumberController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dateOfBirth ?? DateTime(now.year - 25),
      firstDate: DateTime(1930),
      lastDate: DateTime(now.year - 10),
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

  Future<void> _pickDocument() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (file != null) setState(() => _pickedDocument = file);
  }

  Future<void> _save() async {
    if (_dateOfBirth == null ||
        _gender == null ||
        _idType == null ||
        _idNumberController.text.trim().isEmpty ||
        _locationController.text.trim().isEmpty) {
      setState(() => _error = 'Please fill in all required fields.');
      return;
    }

    final auth = context.read<AuthProvider>();
    final userId = auth.user!.id;
    final hasExistingDoc =
        auth.user?.civilianProfile?.idDocumentUrl != null;

    if (!hasExistingDoc && _pickedDocument == null) {
      setState(() => _error = 'Please upload a photo of your ID document.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final dob =
          '${_dateOfBirth!.year.toString().padLeft(4, '0')}-'
          '${_dateOfBirth!.month.toString().padLeft(2, '0')}-'
          '${_dateOfBirth!.day.toString().padLeft(2, '0')}';

      await CivilianService.updateProfile(userId, {
        'date_of_birth': dob,
        'gender': _gender,
        'id_type': _idType,
        'id_number': _idNumberController.text.trim(),
        'current_location': _locationController.text.trim(),
      });

      if (_pickedDocument != null) {
        await CivilianService.uploadIdDocument(userId, _pickedDocument!.path);
      }

      await auth.refreshUser();

      if (mounted) {
        context.canPop() ? context.pop() : context.go('/home');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    final existingDocUrl =
        context.watch<AuthProvider>().user?.civilianProfile?.idDocumentUrl;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Profile' : 'Complete Your Profile'),
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
            // Info banner — only shown when first completing the profile
            if (!_isEditing)
              Container(
                padding: EdgeInsets.all(s.cardPadding),
                decoration: BoxDecoration(
                  color: AppColors.warningSurface,
                  borderRadius: BorderRadius.circular(s.cardRadius),
                  border: Border.all(color: const Color(0x4DF59E0B)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.info_outline,
                      size: 18,
                      color: AppColors.warning,
                    ),
                    SizedBox(width: s.itemGap),
                    Expanded(
                      child: Text(
                        'Your profile must be complete before you can request to join a shelter.',
                        style: TextStyle(
                          fontSize: s.bodySm,
                          color: AppColors.warning,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            if (_error != null) ...[
              SizedBox(height: s.fieldGap),
              ErrorBanner(message: _error!),
            ],
            SizedBox(height: s.sectionGap),

            // ── Personal Information ──────────────────────────────────
            _SectionLabel('Personal Information', s),
            SizedBox(height: s.itemGap),

            // Date of birth
            _FieldLabel('Date of Birth *', s),
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
                    const Icon(
                      Icons.calendar_today_outlined,
                      size: 18,
                      color: AppColors.textSubtle,
                    ),
                    SizedBox(width: s.itemGap),
                    Text(
                      _dateOfBirth != null
                          ? '${_dateOfBirth!.day.toString().padLeft(2, '0')}/'
                              '${_dateOfBirth!.month.toString().padLeft(2, '0')}/'
                              '${_dateOfBirth!.year}'
                          : 'Select date of birth',
                      style: TextStyle(
                        fontSize: s.bodyMd,
                        color: _dateOfBirth != null
                            ? AppColors.text
                            : AppColors.textSubtle,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: s.fieldGap),

            // Gender
            _FieldLabel('Gender *', s),
            SizedBox(height: s.itemGap),
            Row(
              children: _genders.map((entry) {
                final (value, label) = entry;
                final selected = _gender == value;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      right: value != 'female' ? s.itemGap : 0,
                    ),
                    child: _ChipOption(
                      label: label,
                      selected: selected,
                      onTap: () => setState(() => _gender = value),
                      s: s,
                    ),
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: s.sectionGap),

            // ── Identification ────────────────────────────────────────
            _SectionLabel('Identification', s),
            SizedBox(height: s.itemGap),

            // ID Type
            _FieldLabel('ID Type *', s),
            SizedBox(height: s.itemGap),
            Row(
              children: _idTypes.map((entry) {
                final (value, label) = entry;
                final selected = _idType == value;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      right: value != 'passport' ? s.itemGap : 0,
                    ),
                    child: _ChipOption(
                      label: label,
                      selected: selected,
                      onTap: () => setState(() => _idType = value),
                      s: s,
                    ),
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: s.fieldGap),

            // ID Number
            _FieldLabel('ID Number *', s),
            SizedBox(height: s.itemGap),
            TextField(
              controller: _idNumberController,
              keyboardType: TextInputType.text,
              style: TextStyle(fontSize: s.bodyMd, color: AppColors.text),
              decoration: const InputDecoration(
                hintText: 'Enter your ID or passport number',
              ),
            ),
            SizedBox(height: s.sectionGap),

            // ── Location ──────────────────────────────────────────────
            _SectionLabel('Location', s),
            SizedBox(height: s.itemGap),
            _FieldLabel('Current Address *', s),
            SizedBox(height: s.itemGap),
            TextField(
              controller: _locationController,
              keyboardType: TextInputType.streetAddress,
              style: TextStyle(fontSize: s.bodyMd, color: AppColors.text),
              decoration: const InputDecoration(
                hintText: 'e.g. Hamra, Beirut',
              ),
            ),
            SizedBox(height: s.sectionGap),

            // ── ID Document ───────────────────────────────────────────
            _SectionLabel('ID Document *', s),
            SizedBox(height: s.itemGap),
            Text(
              'Upload a clear photo of your ID or passport (JPG, PNG, max 5 MB)',
              style: TextStyle(
                fontSize: s.bodySm,
                color: AppColors.textSubtle,
              ),
            ),
            SizedBox(height: s.fieldGap),
            GestureDetector(
              onTap: _pickDocument,
              child: Container(
                width: double.infinity,
                padding: EdgeInsets.all(s.cardPadding + 4),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(s.cardRadius),
                  border: Border.all(
                    color: _pickedDocument != null
                        ? AppColors.secondary
                        : AppColors.border,
                    style: BorderStyle.solid,
                  ),
                ),
                child: _pickedDocument != null
                    ? Row(
                        children: [
                          const Icon(
                            Icons.check_circle_rounded,
                            color: AppColors.success,
                            size: 20,
                          ),
                          SizedBox(width: s.itemGap),
                          Expanded(
                            child: Text(
                              _pickedDocument!.name,
                              style: TextStyle(
                                fontSize: s.bodySm,
                                color: AppColors.text,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          TextButton(
                            onPressed: _pickDocument,
                            child: Text(
                              'Change',
                              style: TextStyle(
                                fontSize: s.bodySm,
                                color: AppColors.secondary,
                              ),
                            ),
                          ),
                        ],
                      )
                    : existingDocUrl != null
                        ? Row(
                            children: [
                              const Icon(
                                Icons.check_circle_rounded,
                                color: AppColors.success,
                                size: 20,
                              ),
                              SizedBox(width: s.itemGap),
                              Expanded(
                                child: Text(
                                  'Document already uploaded. Tap to replace.',
                                  style: TextStyle(
                                    fontSize: s.bodySm,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                              ),
                            ],
                          )
                        : Column(
                            children: [
                              const Icon(
                                Icons.upload_file_rounded,
                                size: 32,
                                color: AppColors.border2,
                              ),
                              SizedBox(height: s.itemGap),
                              Text(
                                'Tap to choose from gallery',
                                style: TextStyle(
                                  fontSize: s.bodySm,
                                  color: AppColors.textSubtle,
                                ),
                              ),
                            ],
                          ),
              ),
            ),
            SizedBox(height: s.sectionGap),

            // Save
            AppButton(
              label: _isEditing ? 'Save Changes' : 'Save Profile',
              icon: Icons.save_rounded,
              loading: _loading,
              onPressed: _save,
            ),
            SizedBox(height: s.pagePadding),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  final AppSizes s;
  const _SectionLabel(this.text, this.s);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: s.bodyMd,
        fontWeight: FontWeight.w600,
        color: AppColors.text,
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  final AppSizes s;
  const _FieldLabel(this.text, this.s);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: s.bodySm,
        color: AppColors.textMuted,
      ),
    );
  }
}

class _ChipOption extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final AppSizes s;

  const _ChipOption({
    required this.label,
    required this.selected,
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
    );
  }
}
