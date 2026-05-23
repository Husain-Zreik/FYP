import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/constants.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';
import 'screens/shelter/shelter_screen.dart';
import 'screens/shelter/find_shelter_screen.dart';
import 'models/shelter.dart';
import 'screens/shelter/shelter_detail_screen.dart';
import 'screens/shelter/shelter_requests_screen.dart';
import 'screens/aid/aid_gate_screen.dart';
import 'screens/shelter/private_housing_screen.dart';
import 'models/private_housing.dart';
import 'screens/aid/submit_need_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/profile/complete_profile_screen.dart';
import 'widgets/main_layout.dart';
import 'screens/not_found_screen.dart';

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
      initialLocation: '/home',
      refreshListenable: _authProvider,
      errorBuilder: (_, _) => const NotFoundScreen(),
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
        StatefulShellRoute.indexedStack(
          builder: (_, _, shell) => MainLayout(navigationShell: shell),
          branches: [
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/home',
                  builder: (_, _) => const HomeScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/shelter',
                  builder: (_, _) => const ShelterScreen(),
                  routes: [
                    GoRoute(
                      path: 'find',
                      builder: (_, _) => const FindShelterScreen(),
                      routes: [
                        GoRoute(
                          path: ':id',
                          builder: (_, state) => ShelterDetailScreen(
                            shelterId: int.parse(state.pathParameters['id']!),
                            shelter: state.extra is Shelter
                                ? state.extra as Shelter
                                : null,
                          ),
                        ),
                      ],
                    ),
                    GoRoute(
                      path: 'requests',
                      builder: (_, _) => const ShelterRequestsScreen(),
                    ),
                    GoRoute(
                      path: 'private-housing',
                      builder: (_, state) => PrivateHousingScreen(
                        existing: state.extra is PrivateHousing
                            ? state.extra as PrivateHousing
                            : null,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/aid',
                  builder: (_, _) => const AidGateScreen(),
                  routes: [
                    GoRoute(
                      path: 'submit-need',
                      builder: (_, _) => const SubmitNeedScreen(),
                    ),
                  ],
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/profile',
                  builder: (_, _) => const ProfileScreen(),
                  routes: [
                    GoRoute(
                      path: 'complete',
                      builder: (_, _) => const CompleteProfileScreen(),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
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
