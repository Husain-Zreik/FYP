import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/app_sizes.dart';
import '../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';
import '../services/api_client.dart';
import '../widgets/app_button.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/app_text_field.dart';
import '../widgets/app_logo.dart';
import '../widgets/error_banner.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please fill in all required fields.');
      return;
    }
    if (password != confirm) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters.');
      return;
    }

    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await context.read<AuthProvider>().register(
            name: name,
            email: email,
            password: password,
            passwordConfirmation: confirm,
            phone: phone.isEmpty ? null : phone,
          );
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);

    return AppScaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Brand header ────────────────────────────────────────────
              Container(
                color: AppColors.primary,
                padding: EdgeInsets.symmetric(
                  horizontal: s.pagePadding,
                  vertical: s.headerVertical - 8,
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned(
                      left: 0,
                      child: GestureDetector(
                        onTap: () => context.canPop()
                            ? context.pop()
                            : context.go('/login'),
                        child: const Icon(Icons.arrow_back, color: Colors.white),
                      ),
                    ),
                    AppLogo(variant: LogoVariant.onDark, size: s.logoSize),
                  ],
                ),
              ),
              // ── Form ────────────────────────────────────────────────────
              Padding(
                padding: EdgeInsets.fromLTRB(
                  s.pagePadding,
                  s.sectionGap,
                  s.pagePadding,
                  s.pagePadding,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Create account',
                      style: TextStyle(
                        fontSize: s.heading1,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                      ),
                    ),
                    SizedBox(height: s.itemGap / 2),
                    Text(
                      'Join the Nuzuh platform',
                      style: TextStyle(
                        fontSize: s.bodyMd,
                        color: AppColors.textMuted,
                      ),
                    ),
                    SizedBox(height: s.sectionGap),
                    AppTextField(
                      label: 'Full name',
                      hint: 'Ahmad Hassan',
                      controller: _nameController,
                      keyboardType: TextInputType.name,
                      textInputAction: TextInputAction.next,
                    ),
                    SizedBox(height: s.fieldGap),
                    AppTextField(
                      label: 'Email address',
                      hint: 'you@example.com',
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                    ),
                    SizedBox(height: s.fieldGap),
                    AppTextField(
                      label: 'Phone number (optional)',
                      hint: '+961 70 000 000',
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      textInputAction: TextInputAction.next,
                    ),
                    SizedBox(height: s.fieldGap),
                    AppTextField(
                      label: 'Password',
                      hint: 'Minimum 8 characters',
                      controller: _passwordController,
                      isPassword: true,
                      textInputAction: TextInputAction.next,
                    ),
                    SizedBox(height: s.fieldGap),
                    AppTextField(
                      label: 'Confirm password',
                      hint: '••••••••',
                      controller: _confirmController,
                      isPassword: true,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _submit(),
                    ),
                    if (_error != null) ...[
                      SizedBox(height: s.fieldGap - 2),
                      ErrorBanner(message: _error!),
                    ],
                    SizedBox(height: s.sectionGap),
                    AppButton(
                      label: 'Create Account',
                      onPressed: _loading ? null : _submit,
                      loading: _loading,
                    ),
                    SizedBox(height: s.fieldGap + 4),
                    Wrap(
                      alignment: WrapAlignment.center,
                      children: [
                        Text(
                          'Already have an account?  ',
                          style: TextStyle(
                            fontSize: s.bodyMd,
                            color: AppColors.textMuted,
                          ),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: Text(
                            'Sign In',
                            style: TextStyle(
                              fontSize: s.bodyMd,
                              fontWeight: FontWeight.w600,
                              color: AppColors.secondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: s.pagePadding),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
