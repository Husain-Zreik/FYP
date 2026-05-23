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

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please fill in all fields.');
      return;
    }

    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      await context.read<AuthProvider>().login(email, password);
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
                  vertical: s.headerVertical,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    AppLogo(variant: LogoVariant.onDark, size: s.logoSize + 4),
                    SizedBox(height: s.itemGap),
                    Text(
                      'Shelter management for everyone',
                      style: TextStyle(
                        color: const Color(0xB3FFFFFF),
                        fontSize: s.bodySm,
                        letterSpacing: 0.2,
                      ),
                    ),
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
                      'Welcome back',
                      style: TextStyle(
                        fontSize: s.heading1,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                      ),
                    ),
                    SizedBox(height: s.itemGap / 2),
                    Text(
                      'Sign in to continue',
                      style: TextStyle(
                        fontSize: s.bodyMd,
                        color: AppColors.textMuted,
                      ),
                    ),
                    SizedBox(height: s.sectionGap),
                    AppTextField(
                      label: 'Email address',
                      hint: 'you@example.com',
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                    ),
                    SizedBox(height: s.fieldGap),
                    AppTextField(
                      label: 'Password',
                      hint: '••••••••',
                      controller: _passwordController,
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
                      label: 'Sign In',
                      onPressed: _loading ? null : _submit,
                      loading: _loading,
                    ),
                    SizedBox(height: s.fieldGap + 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Don't have an account?  ",
                          style: TextStyle(
                            fontSize: s.bodyMd,
                            color: AppColors.textMuted,
                          ),
                        ),
                        GestureDetector(
                          onTap: () => context.push('/register'),
                          child: Text(
                            'Register',
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
