class FamilyMember {
  final int id;
  final String name;
  final String relationship;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? idType;
  final String? idNumber;
  final String? notes;

  const FamilyMember({
    required this.id,
    required this.name,
    required this.relationship,
    this.dateOfBirth,
    this.gender,
    this.idType,
    this.idNumber,
    this.notes,
  });

  factory FamilyMember.fromJson(Map<String, dynamic> json) => FamilyMember(
        id: json['id'] as int,
        name: json['name'] as String,
        relationship: json['relationship'] as String,
        dateOfBirth: json['date_of_birth'] != null
            ? DateTime.tryParse(json['date_of_birth'].toString())
            : null,
        gender: json['gender'] as String?,
        idType: json['id_type'] as String?,
        idNumber: json['id_number'] as String?,
        notes: json['notes'] as String?,
      );

  static const relationships = [
    ('spouse', 'Spouse'),
    ('child', 'Child'),
    ('parent', 'Parent'),
    ('sibling', 'Sibling'),
    ('other', 'Other'),
  ];

  String get relationshipLabel {
    for (final (value, label) in relationships) {
      if (value == relationship) return label;
    }
    return relationship;
  }
}
