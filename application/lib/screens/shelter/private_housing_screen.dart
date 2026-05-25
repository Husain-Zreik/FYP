import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/private_housing.dart';
import '../../providers/auth_provider.dart';
import '../../services/civilian_service.dart';
import '../../widgets/app_button.dart';

class PrivateHousingScreen extends StatefulWidget {
  final PrivateHousing? existing;
  const PrivateHousingScreen({super.key, this.existing});

  @override
  State<PrivateHousingScreen> createState() => _PrivateHousingScreenState();
}

class _PrivateHousingScreenState extends State<PrivateHousingScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _saving = false;
  String? _error;

  late final TextEditingController _address;
  late final TextEditingController _governorate;
  late final TextEditingController _district;
  late final TextEditingController _landlordName;
  late final TextEditingController _landlordPhone;
  late final TextEditingController _monthlyRent;
  late final TextEditingController _notes;
  String? _propertyType;
  DateTime? _leaseStartDate;

  static const _propertyTypes = [
    ('apartment', 'Apartment'),
    ('house', 'House'),
    ('room', 'Room'),
    ('other', 'Other'),
  ];

  @override
  void initState() {
    super.initState();
    final h = widget.existing;
    _address = TextEditingController(text: h?.address ?? '');
    _governorate = TextEditingController(text: h?.governorate ?? '');
    _district = TextEditingController(text: h?.district ?? '');
    _landlordName = TextEditingController(text: h?.landlordName ?? '');
    _landlordPhone = TextEditingController(text: h?.landlordPhone ?? '');
    _monthlyRent = TextEditingController(
        text: h?.monthlyRent != null ? h!.monthlyRent!.toStringAsFixed(0) : '');
    _notes = TextEditingController(text: h?.notes ?? '');
    _propertyType = h?.propertyType;
    _leaseStartDate = h?.leaseStartDate;
  }

  @override
  void dispose() {
    _address.dispose();
    _governorate.dispose();
    _district.dispose();
    _landlordName.dispose();
    _landlordPhone.dispose();
    _monthlyRent.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthProvider>();
      final userId = auth.user!.id;
      await CivilianService.setPrivateHousing(userId, {
        'property_type': _propertyType,
        'address': _address.text.trim(),
        'governorate': _governorate.text.trim(),
        if (_district.text.trim().isNotEmpty) 'district': _district.text.trim(),
        if (_landlordName.text.trim().isNotEmpty)
          'landlord_name': _landlordName.text.trim(),
        if (_landlordPhone.text.trim().isNotEmpty)
          'landlord_phone': _landlordPhone.text.trim(),
        if (_monthlyRent.text.trim().isNotEmpty)
          'monthly_rent': double.tryParse(_monthlyRent.text.trim()),
        if (_leaseStartDate != null)
          'lease_start_date':
              '${_leaseStartDate!.year.toString().padLeft(4, '0')}-'
              '${_leaseStartDate!.month.toString().padLeft(2, '0')}-'
              '${_leaseStartDate!.day.toString().padLeft(2, '0')}',
        if (_notes.text.trim().isNotEmpty) 'notes': _notes.text.trim(),
      });
      await auth.refreshUser();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(widget.existing != null
              ? 'Housing details updated.'
              : 'Private housing registered successfully.'),
          backgroundColor: AppColors.success,
        ));
        context.go('/home');
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _leaseStartDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) setState(() => _leaseStartDate = picked);
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);
    final isEditing = widget.existing != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Housing' : 'Register Private Housing'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(s.pagePadding),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) ...[
                Container(
                  padding: EdgeInsets.all(s.cardPadding),
                  decoration: BoxDecoration(
                    color: AppColors.dangerSurface,
                    borderRadius: BorderRadius.circular(s.cardRadius),
                  ),
                  child: Text(
                    _error!,
                    style: TextStyle(
                      color: AppColors.danger,
                      fontSize: s.bodySm,
                    ),
                  ),
                ),
                SizedBox(height: s.fieldGap),
              ],
              _SectionLabel(label: 'Property Details', s: s),
              SizedBox(height: s.itemGap),
              _buildPropertyTypeRow(s),
              SizedBox(height: s.fieldGap),
              _buildField(
                controller: _address,
                label: 'Address',
                hint: 'Street address',
                required: true,
                s: s,
              ),
              SizedBox(height: s.fieldGap),
              Row(
                children: [
                  Expanded(
                    child: _buildField(
                      controller: _governorate,
                      label: 'Governorate',
                      hint: 'e.g. Beirut',
                      required: true,
                      s: s,
                    ),
                  ),
                  SizedBox(width: s.fieldGap),
                  Expanded(
                    child: _buildField(
                      controller: _district,
                      label: 'District',
                      hint: 'Optional',
                      s: s,
                    ),
                  ),
                ],
              ),
              SizedBox(height: s.sectionGap),
              _SectionLabel(label: 'Landlord Info', s: s),
              SizedBox(height: s.itemGap),
              _buildField(
                controller: _landlordName,
                label: 'Landlord Name',
                hint: 'Optional',
                s: s,
              ),
              SizedBox(height: s.fieldGap),
              _buildField(
                controller: _landlordPhone,
                label: 'Landlord Phone',
                hint: 'Optional',
                keyboardType: TextInputType.phone,
                s: s,
              ),
              SizedBox(height: s.sectionGap),
              _SectionLabel(label: 'Lease Details', s: s),
              SizedBox(height: s.itemGap),
              _buildField(
                controller: _monthlyRent,
                label: 'Monthly Rent (USD)',
                hint: 'Optional',
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                s: s,
              ),
              SizedBox(height: s.fieldGap),
              GestureDetector(
                onTap: _pickDate,
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: s.cardPadding,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(s.borderRadius),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined,
                          size: 16, color: AppColors.textSubtle),
                      SizedBox(width: s.itemGap),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Lease Start Date',
                              style: TextStyle(
                                fontSize: s.caption,
                                color: AppColors.textSubtle,
                              ),
                            ),
                            Text(
                              _leaseStartDate != null
                                  ? '${_leaseStartDate!.day.toString().padLeft(2, '0')}/'
                                      '${_leaseStartDate!.month.toString().padLeft(2, '0')}/'
                                      '${_leaseStartDate!.year}'
                                  : 'Select date (optional)',
                              style: TextStyle(
                                fontSize: s.bodyMd,
                                color: _leaseStartDate != null
                                    ? AppColors.text
                                    : AppColors.textSubtle,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (_leaseStartDate != null)
                        GestureDetector(
                          onTap: () =>
                              setState(() => _leaseStartDate = null),
                          child: const Icon(Icons.close,
                              size: 16, color: AppColors.textSubtle),
                        ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: s.fieldGap),
              _buildField(
                controller: _notes,
                label: 'Notes',
                hint: 'Optional',
                maxLines: 3,
                s: s,
              ),
              SizedBox(height: s.sectionGap),
              AppButton(
                label: isEditing ? 'Save Changes' : 'Register Housing',
                icon: Icons.save_rounded,
                onPressed: _saving ? null : _save,
                loading: _saving,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPropertyTypeRow(AppSizes s) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Property Type',
          style: TextStyle(
            fontSize: s.bodySm,
            fontWeight: FontWeight.w500,
            color: AppColors.textSubtle,
          ),
        ),
        SizedBox(height: s.itemGap / 2),
        Wrap(
          spacing: s.itemGap,
          children: _propertyTypes.map((t) {
            final selected = _propertyType == t.$1;
            return GestureDetector(
              onTap: () => setState(() => _propertyType = t.$1),
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: s.cardPadding,
                  vertical: s.itemGap / 2,
                ),
                decoration: BoxDecoration(
                  color: selected ? AppColors.tertiary : AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: selected
                        ? AppColors.secondary
                        : AppColors.border,
                  ),
                ),
                child: Text(
                  t.$2,
                  style: TextStyle(
                    fontSize: s.bodySm,
                    fontWeight: selected
                        ? FontWeight.w600
                        : FontWeight.w400,
                    color: selected
                        ? AppColors.secondary
                        : AppColors.textMuted,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required AppSizes s,
    String? hint,
    bool required = false,
    TextInputType? keyboardType,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: TextStyle(fontSize: s.bodyMd, color: AppColors.text),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        hintStyle:
            TextStyle(fontSize: s.bodySm, color: AppColors.textSubtle),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(s.borderRadius),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(s.borderRadius),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(s.borderRadius),
          borderSide:
              const BorderSide(color: AppColors.secondary, width: 1.5),
        ),
        contentPadding: EdgeInsets.symmetric(
          horizontal: s.cardPadding,
          vertical: 14,
        ),
      ),
      validator: required
          ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
          : null,
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  final AppSizes s;
  const _SectionLabel({required this.label, required this.s});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: TextStyle(
        fontSize: s.bodySm,
        fontWeight: FontWeight.w700,
        color: AppColors.textSubtle,
        letterSpacing: 0.5,
      ),
    );
  }
}
