class ChatMessage {
  final String role;
  final String content;

  const ChatMessage({required this.role, required this.content});

  bool get isUser => role == 'user';

  Map<String, dynamic> toJson() => {'role': role, 'content': content};
}
