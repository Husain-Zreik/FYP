import 'aid_category.dart';

class AidDispatch {
  final int id;
  final String level;
  final AidCategory category;
  final int quantity;
  final String? notes;
  final String status;
  final DateTime? dispatchedAt;
  final DateTime? respondedAt;
  final String? receivedAt;
  final String? rejectionReason;
  final String dispatcherName;
  final String? responderName;
  final DateTime createdAt;

  const AidDispatch({
    required this.id,
    required this.level,
    required this.category,
    required this.quantity,
    this.notes,
    required this.status,
    this.dispatchedAt,
    this.respondedAt,
    this.receivedAt,
    this.rejectionReason,
    required this.dispatcherName,
    this.responderName,
    required this.createdAt,
  });

  bool get isPending => status == 'pending';
  bool get isAccepted => status == 'accepted';
  bool get isRejected => status == 'rejected';

  factory AidDispatch.fromJson(Map<String, dynamic> json) => AidDispatch(
        id: json['id'] as int,
        level: json['level'] as String,
        category: AidCategory.fromJson(json['category'] as Map<String, dynamic>),
        quantity: json['quantity'] as int,
        notes: json['notes'] as String?,
        status: json['status'] as String,
        dispatchedAt: json['dispatched_at'] != null
            ? DateTime.tryParse(json['dispatched_at'].toString())
            : null,
        respondedAt: json['responded_at'] != null
            ? DateTime.tryParse(json['responded_at'].toString())
            : null,
        receivedAt: json['received_at'] as String?,
        rejectionReason: json['rejection_reason'] as String?,
        dispatcherName: json['dispatcher_name'] as String? ?? 'Shelter',
        responderName: json['responder_name'] as String?,
        createdAt: DateTime.parse(json['created_at'].toString()),
      );
}
