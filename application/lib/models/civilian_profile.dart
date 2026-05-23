class CivilianProfile {
  final DateTime? dateOfBirth;
  final String? gender;
  final String? currentLocation;
  final String? notes;
  final String? idType;
  final String? idNumber;
  final String? idDocumentUrl;
  final String housingStatus;

  const CivilianProfile({
    this.dateOfBirth,
    this.gender,
    this.currentLocation,
    this.notes,
    this.idType,
    this.idNumber,
    this.idDocumentUrl,
    this.housingStatus = 'seeking',
  });

  bool get isComplete =>
      dateOfBirth != null &&
      gender != null &&
      idType != null &&
      idNumber != null &&
      idDocumentUrl != null &&
      currentLocation != null;

  factory CivilianProfile.fromJson(Map<String, dynamic> json) =>
      CivilianProfile(
        dateOfBirth: json['date_of_birth'] != null
            ? DateTime.tryParse(json['date_of_birth'].toString())
            : null,
        gender: json['gender'] as String?,
        currentLocation: json['current_location'] as String?,
        notes: json['notes'] as String?,
        idType: json['id_type'] as String?,
        idNumber: json['id_number'] as String?,
        idDocumentUrl: json['id_document_url'] as String?,
        housingStatus: json['housing_status'] as String? ?? 'seeking',
      );
}
