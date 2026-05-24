import '../models/aid_dispatch.dart';
import '../models/civilian_need.dart';
import 'api_client.dart';

class AidService {
  static Future<List<AidDispatch>> getDispatches() async {
    final data = await ApiClient.get('/aid-dispatches');
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(AidDispatch.fromJson)
          .toList();
    }
    return [];
  }

  static Future<void> acceptDispatch(int id, String receivedAt) async {
    await ApiClient.patch('/aid-dispatches/$id/accept', {
      'received_at': receivedAt,
    });
  }

  static Future<void> rejectDispatch(int id, {String? reason}) async {
    await ApiClient.patch('/aid-dispatches/$id/reject', {
      if (reason != null && reason.trim().isNotEmpty)
        'rejection_reason': reason.trim(),
    });
  }

  static Future<List<CivilianNeed>> getNeeds() async {
    final data = await ApiClient.get('/civilian-needs');
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(CivilianNeed.fromJson)
          .toList();
    }
    return [];
  }

  static Future<void> submitNeed({
    required String category,
    required String description,
    required String urgency,
  }) async {
    await ApiClient.post('/civilian-needs', {
      'category': category,
      'description': description,
      'urgency': urgency,
    });
  }
}
