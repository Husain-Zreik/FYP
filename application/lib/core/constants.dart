abstract final class AppConstants {
  static const appName = 'Nuzuh';

  // Android emulator → host machine localhost.
  // Override at build time: --dart-define=API_BASE_URL=http://192.168.x.x:8000/api
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api',
  );
}
