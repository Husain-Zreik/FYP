class User {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final String accessPoint;
  final bool isActive;
  final int? shelterId;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    required this.accessPoint,
    required this.isActive,
    this.shelterId,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as int,
        name: json['name'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String?,
        role: json['role'] as String,
        accessPoint: json['access_point'] as String,
        isActive: json['is_active'] as bool? ?? true,
        shelterId: json['shelter_id'] as int?,
      );
}
