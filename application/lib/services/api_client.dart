import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';

// Mirrors the behaviour of website/src/api/client.js:
//   - Injects Authorization header from stored token
//   - Unwraps { data, message } envelope — callers receive the inner data
//   - Throws ApiException on all error responses
class ApiException implements Exception {
  final String message;
  final Map<String, dynamic>? errors;
  final int? statusCode;

  const ApiException(this.message, {this.errors, this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConstants.apiBaseUrl,
    headers: const {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
  ));

  static Future<dynamic> get(String path, {Map<String, dynamic>? params}) =>
      _request('GET', path, params: params);

  static Future<dynamic> post(String path, [dynamic data]) =>
      _request('POST', path, data: data);

  static Future<dynamic> patch(String path, [dynamic data]) =>
      _request('PATCH', path, data: data);

  static Future<dynamic> delete(String path) => _request('DELETE', path);

  static Future<dynamic> upload(String path, FormData formData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      final response = await _dio.post(
        path,
        data: formData,
        options: Options(
          headers: token != null ? {'Authorization': 'Bearer $token'} : null,
        ),
      );

      final body = response.data;
      if (body is Map && body.containsKey('data')) {
        return body['data'];
      }
      return body;
    } on DioException catch (e) {
      final responseData = e.response?.data;
      if (responseData is Map) {
        throw ApiException(
          responseData['message'] as String? ?? 'An error occurred.',
          errors: responseData['errors'] as Map<String, dynamic>?,
          statusCode: e.response?.statusCode,
        );
      }
      throw ApiException(
        e.type == DioExceptionType.connectionTimeout ||
                e.type == DioExceptionType.receiveTimeout
            ? 'Connection timed out. Check your network.'
            : 'Network error. Check your connection.',
        statusCode: e.response?.statusCode,
      );
    }
  }

  static Future<dynamic> _request(
    String method,
    String path, {
    dynamic data,
    Map<String, dynamic>? params,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      final response = await _dio.request(
        path,
        data: data,
        queryParameters: params,
        options: Options(
          method: method,
          headers: token != null ? {'Authorization': 'Bearer $token'} : null,
        ),
      );

      final body = response.data;
      if (body is Map && body.containsKey('data')) {
        return body['data'];
      }
      return body;
    } on DioException catch (e) {
      final responseData = e.response?.data;
      if (responseData is Map) {
        throw ApiException(
          responseData['message'] as String? ?? 'An error occurred.',
          errors: responseData['errors'] as Map<String, dynamic>?,
          statusCode: e.response?.statusCode,
        );
      }
      throw ApiException(
        e.type == DioExceptionType.connectionTimeout ||
                e.type == DioExceptionType.receiveTimeout
            ? 'Connection timed out. Check your network.'
            : 'Network error. Check your connection.',
        statusCode: e.response?.statusCode,
      );
    }
  }
}
