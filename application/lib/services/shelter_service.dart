import '../models/shelter.dart';
import '../models/shelter_request.dart';
import 'api_client.dart';

class ShelterService {
  static Future<List<Shelter>> getAvailable() async {
    final data = await ApiClient.get('/shelters');
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(Shelter.fromJson)
          .toList();
    }
    return [];
  }

  static Future<void> requestToJoin(int shelterId) async {
    await ApiClient.post('/shelter-requests', {
      'shelter_id': shelterId,
      'type': 'request',
    });
  }

  static Future<List<ShelterRequest>> getMyRequests(int userId) async {
    final data = await ApiClient.get('/civilians/$userId/requests');
    if (data is List) {
      return data
          .whereType<Map<String, dynamic>>()
          .map(ShelterRequest.fromJson)
          .toList();
    }
    return [];
  }

  static Future<void> cancelRequest(int requestId) async {
    await ApiClient.patch('/shelter-requests/$requestId/cancel');
  }

  static Future<void> acceptInvitation(int requestId) async {
    await ApiClient.patch('/shelter-requests/$requestId/accept');
  }

  static Future<void> rejectInvitation(int requestId) async {
    await ApiClient.patch('/shelter-requests/$requestId/reject');
  }

  static Future<Shelter> getShelter(int id) async {
    final data = await ApiClient.get('/shelters/$id');
    return Shelter.fromJson(data as Map<String, dynamic>);
  }
}
