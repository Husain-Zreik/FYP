class ShelterRequest {
  final int id;
  final String type; // 'request' | 'invitation'
  final String status; // 'pending' | 'accepted' | 'rejected'
  final DateTime createdAt;
  final ShelterRef shelter;

  const ShelterRequest({
    required this.id,
    required this.type,
    required this.status,
    required this.createdAt,
    required this.shelter,
  });

  bool get isPending => status == 'pending';

  factory ShelterRequest.fromJson(Map<String, dynamic> json) => ShelterRequest(
        id: json['id'] as int,
        type: json['type'] as String,
        status: json['status'] as String,
        createdAt: DateTime.parse(json['created_at'].toString()),
        shelter: ShelterRef.fromJson(json['shelter'] as Map<String, dynamic>),
      );
}

class ShelterRef {
  final int id;
  final String name;

  const ShelterRef({required this.id, required this.name});

  factory ShelterRef.fromJson(Map<String, dynamic> json) => ShelterRef(
        id: json['id'] as int,
        name: json['name'] as String,
      );
}
