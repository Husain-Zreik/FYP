import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../services/aid_service.dart';
import '../../widgets/app_button.dart';

class SubmitNeedScreen extends StatefulWidget {
  const SubmitNeedScreen({super.key});

  @override
  State<SubmitNeedScreen> createState() => _SubmitNeedScreenState();
}

class _SubmitNeedScreenState extends State<SubmitNeedScreen> {
  final _descriptionController = TextEditingController();
  String _category = 'food';
  String _urgency = 'medium';
  bool _loading = false;

  static const _categories = [
    ('food', 'Food & Water'),
    ('medical', 'Medical'),
    ('clothing', 'Clothing'),
    ('bedding', 'Bedding'),
    ('hygiene', 'Hygiene'),
    ('baby_supplies', 'Baby Supplies'),
    ('other', 'Other'),
  ];

  static const _urgencies = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('critical', 'Critical'),
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final description = _descriptionController.text.trim();
    if (description.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a description.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await AidService.submitNeed(
        category: _category,
        description: description,
        urgency: _urgency,
      );
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Submit a Need'),
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
            _Label('Category', s),
            SizedBox(height: s.itemGap),
            Wrap(
              spacing: s.itemGap,
              runSpacing: s.itemGap,
              children: _categories.map((entry) {
                final (value, label) = entry;
                final selected = _category == value;
                return GestureDetector(
                  onTap: () => setState(() => _category = value),
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: s.fieldGap,
                      vertical: s.itemGap,
                    ),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.secondary : AppColors.surface,
                      borderRadius: BorderRadius.circular(s.borderRadius - 2),
                      border: Border.all(
                        color: selected
                            ? AppColors.secondary
                            : AppColors.border,
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
            SizedBox(height: s.sectionGap),
            _Label('Urgency', s),
            SizedBox(height: s.itemGap),
            Row(
              children: _urgencies.map((entry) {
                final (value, label) = entry;
                final selected = _urgency == value;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      right: value != 'high' ? s.itemGap : 0,
                    ),
                    child: GestureDetector(
                      onTap: () => setState(() => _urgency = value),
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: s.itemGap),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.secondary
                              : AppColors.surface,
                          borderRadius:
                              BorderRadius.circular(s.borderRadius - 2),
                          border: Border.all(
                            color: selected
                                ? AppColors.secondary
                                : AppColors.border,
                          ),
                        ),
                        child: Text(
                          label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: s.bodySm,
                            fontWeight: FontWeight.w500,
                            color:
                                selected ? Colors.white : AppColors.text,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: s.sectionGap),
            _Label('Description', s),
            SizedBox(height: s.itemGap),
            TextField(
              controller: _descriptionController,
              maxLines: 4,
              style: TextStyle(fontSize: s.bodyMd, color: AppColors.text),
              decoration: InputDecoration(
                hintText: 'Describe what you need…',
                alignLabelWithHint: true,
              ),
            ),
            SizedBox(height: s.sectionGap),
            AppButton(
              label: 'Submit Need',
              icon: Icons.send_rounded,
              loading: _loading,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  final AppSizes s;
  const _Label(this.text, this.s);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: s.bodySm,
        fontWeight: FontWeight.w600,
        color: AppColors.textMuted,
      ),
    );
  }
}
