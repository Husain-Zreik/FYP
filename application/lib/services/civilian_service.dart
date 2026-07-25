import 'package:dio/dio.dart';
import 'api_client.dart';

class CivilianService {
  static Future<void> updateProfile(
    int userId,
    Map<String, dynamic> profileData,
  ) async {
    await ApiClient.patch('/users/$userId', {'profile': profileData});
  }

  static Future<String?> uploadIdDocument(
    int userId,
    String filePath,
  ) async {
    final fileName = filePath.split('/').last;
    final formData = FormData.fromMap({
      'document': await MultipartFile.fromFile(filePath, filename: fileName),
    });
    final result = await ApiClient.upload('/users/$userId/upload-id', formData);
    return result is Map ? result['url'] as String? : null;
  }

  static Future<void> leaveShelter(int userId) async {
    await ApiClient.post('/users/$userId/leave-shelter', {});
  }

  static Future<void> setPrivateHousing(
    int userId,
    Map<String, dynamic> housingData,
  ) async {
    await ApiClient.patch('/users/$userId', {
      'profile': {'housing_status': 'private'},
      'private_housing': housingData,
    });
  }

  static Future<void> removePrivateHousing(int userId) async {
    await ApiClient.patch('/users/$userId', {
      'profile': {'housing_status': 'seeking'},
      'private_housing': null,
    });
  }
}
