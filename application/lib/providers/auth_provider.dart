import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_client.dart';

// Mirrors authStore.js: user, token, isAuthenticated, initialized + initialize/login/logout
class AuthProvider extends ChangeNotifier {
  User? _user;
  String? _token;
  bool _initialized = false;

  User? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null && _user != null;
  bool get initialized => _initialized;

  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final stored = prefs.getString('auth_token');
      if (stored != null) {
        try {
          _token = stored;
          _user = await AuthService.me();
        } catch (_) {
          _token = null;
          _user = null;
          await prefs.remove('auth_token');
        }
      }
    } catch (_) {
      _token = null;
      _user = null;
    }
    _initialized = true;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final result = await AuthService.login(email, password);
    if (result.user.accessPoint != 'civilian') {
      throw const ApiException(
        'This app is for civilians only. Use the web portal instead.',
      );
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', result.token);
    _token = result.token;
    _user = result.user;
    notifyListeners();
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirmation,
    String? phone,
  }) async {
    final result = await AuthService.register(
      name: name,
      email: email,
      password: password,
      passwordConfirmation: passwordConfirmation,
      phone: phone,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', result.token);
    _token = result.token;
    _user = result.user;
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await AuthService.logout();
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    _token = null;
    _user = null;
    notifyListeners();
  }
}
