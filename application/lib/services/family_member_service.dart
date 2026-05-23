import 'api_client.dart';
import '../models/family_member.dart';

class FamilyMemberService {
  static Future<FamilyMember> create(Map<String, dynamic> data) async {
    final result = await ApiClient.post('/family-members', data);
    return FamilyMember.fromJson(result as Map<String, dynamic>);
  }

  static Future<FamilyMember> update(int id, Map<String, dynamic> data) async {
    final result = await ApiClient.patch('/family-members/$id', data);
    return FamilyMember.fromJson(result as Map<String, dynamic>);
  }

  static Future<void> delete(int id) async {
    await ApiClient.delete('/family-members/$id');
  }
}
