import 'package:flutter/foundation.dart' show kIsWeb;

abstract final class AppConstants {
  static const appName = 'Nuzuh';

  static String get apiBaseUrl {
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) return override;
    // Web (Chrome) hits localhost directly; Android emulator needs 10.0.2.2
    return kIsWeb
        ? 'http://localhost:8000/api'
        : 'http://10.0.2.2:8000/api';
  }
}
