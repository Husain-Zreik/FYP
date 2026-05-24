class CivilianNeed {
  final int id;
  final String category;
  final String description;
  final String? urgency;
  final String status;
  final String? shelterNotes;
  final String? reviewedByName;
  final DateTime? reviewedAt;
  final DateTime createdAt;

  const CivilianNeed({
    required this.id,
    required this.category,
    required this.description,
    this.urgency,
    required this.status,
    this.shelterNotes,
    this.reviewedByName,
    this.reviewedAt,
    required this.createdAt,
  });

  bool get isPending => status == 'pending';
  bool get isInReview => status == 'in_review';
  bool get isFulfilled => status == 'fulfilled';
  bool get isRejected => status == 'rejected';

  factory CivilianNeed.fromJson(Map<String, dynamic> json) => CivilianNeed(
        id: json['id'] as int,
        category: json['category'] as String,
        description: json['description'] as String,
        urgency: json['urgency'] as String?,
        status: json['status'] as String,
        shelterNotes: json['shelter_notes'] as String?,
        reviewedByName: json['reviewed_by_name'] as String?,
        reviewedAt: json['reviewed_at'] != null
            ? DateTime.tryParse(json['reviewed_at'].toString())
            : null,
        createdAt: DateTime.parse(json['created_at'].toString()),
      );
}
