import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/constants.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  late final AuthProvider _authProvider;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authProvider = AuthProvider();

    _router = GoRouter(
      initialLocation: '/login',
      refreshListenable: _authProvider,
      // Only runs after initialized — the builder overlay handles the loading state.
      redirect: (context, state) {
        if (!_authProvider.initialized) return null;
        final isAuth = _authProvider.isAuthenticated;
        final loc = state.matchedLocation;
        final isPublic = loc == '/login' || loc == '/register';
        if (!isAuth && !isPublic) return '/login';
        if (isAuth && isPublic) return '/home';
        return null;
      },
      routes: [
        GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
        GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
        GoRoute(path: '/home', builder: (_, _) => const HomeScreen()),
      ],
    );

    _authProvider.initialize();
  }

  @override
  void dispose() {
    _authProvider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _authProvider,
      child: MaterialApp.router(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        routerConfig: _router,
        // Splash overlay while the token/me check is in flight.
        // Avoids any route redirect edge cases during initialization.
        builder: (context, child) => ListenableBuilder(
          listenable: _authProvider,
          builder: (_, _) {
            if (!_authProvider.initialized) {
              return const Scaffold(
                body: Center(
                  child: CircularProgressIndicator(
                    color: AppColors.secondary,
                  ),
                ),
              );
            }
            return child!;
          },
        ),
      ),
    );
  }
}
