import '../models/chat_message.dart';
import 'api_client.dart';

class AssistantService {
  static Future<String> sendMessage(List<ChatMessage> history, {String? screen}) async {
    final data = await ApiClient.post('/ai-assistant/chat', {
      'messages': history.map((m) => m.toJson()).toList(),
      if (screen != null) 'context': {'screen': screen},
    });
    return data['reply'] as String;
  }
}
