import 'shelter.dart';
import 'civilian_profile.dart';
import 'family_member.dart';
import 'private_housing.dart';

class User {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final String accessPoint;
  final bool isActive;
  final int? shelterId;
  final Shelter? shelter;
  final CivilianProfile? civilianProfile;
  final List<FamilyMember> familyMembers;
  final PrivateHousing? privateHousing;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    required this.accessPoint,
    required this.isActive,
    this.shelterId,
    this.shelter,
    this.civilianProfile,
    this.familyMembers = const [],
    this.privateHousing,
  });

  bool get hasShelter => shelterId != null;
  bool get isProfileComplete => civilianProfile?.isComplete == true;
  bool get isHoused =>
      hasShelter || civilianProfile?.housingStatus == 'private';

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as int,
        name: json['name'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String?,
        role: json['role'] as String,
        accessPoint: json['access_point'] as String,
        isActive: json['is_active'] as bool? ?? true,
        shelterId: json['shelter_id'] as int?,
        shelter: json['shelter'] is Map
            ? Shelter.fromJson(json['shelter'] as Map<String, dynamic>)
            : null,
        civilianProfile: json['civilian_profile'] is Map
            ? CivilianProfile.fromJson(
                json['civilian_profile'] as Map<String, dynamic>)
            : null,
        familyMembers: json['family_members'] is List
            ? (json['family_members'] as List)
                .map((m) => FamilyMember.fromJson(m as Map<String, dynamic>))
                .toList()
            : const [],
        privateHousing: json['private_housing'] is Map
            ? PrivateHousing.fromJson(
                json['private_housing'] as Map<String, dynamic>)
            : null,
      );
}
