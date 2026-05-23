import 'api_client.dart';
import '../models/user.dart';

typedef AuthResult = ({User user, String token});

// Mirrors website/src/api/auth.js
class AuthService {
  static Future<AuthResult> login(String email, String password) async {
    final data = await ApiClient.post('/auth/login', {
          'email': email,
          'password': password,
        }) as Map<String, dynamic>;

    return (
      user: User.fromJson(data['user'] as Map<String, dynamic>),
      token: data['token'] as String,
    );
  }

  static Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirmation,
    String? phone,
  }) async {
    final data = await ApiClient.post('/auth/register', {
          'name': name,
          'email': email,
          'password': password,
          'password_confirmation': passwordConfirmation,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
        }) as Map<String, dynamic>;

    return (
      user: User.fromJson(data['user'] as Map<String, dynamic>),
      token: data['token'] as String,
    );
  }

  static Future<void> logout() async {
    await ApiClient.post('/auth/logout');
  }

  static Future<User> me() async {
    final data = await ApiClient.get('/auth/me') as Map<String, dynamic>;
    return User.fromJson(data);
  }
}
