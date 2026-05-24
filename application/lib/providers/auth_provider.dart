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
          final user = await AuthService.me();
          if (user.accessPoint != 'civilian') {
            throw Exception('non-civilian account');
          }
          _user = user;
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
    // Ensure all relations (civilianProfile, familyMembers, privateHousing) are loaded
    await refreshUser();
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
    await refreshUser();
  }

  Future<void> refreshUser() async {
    try {
      _user = await AuthService.me();
      notifyListeners();
    } catch (_) {}
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
