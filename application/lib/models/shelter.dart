class Shelter {
  final int id;
  final String name;
  final String? code;
  final String governorate;
  final String? district;
  final String? address;
  final double? latitude;
  final double? longitude;
  final int? capacity;
  final int? rooms;
  final String status;
  final String? phone;
  final String? email;
  final String? imageUrl;
  final int? civiliansCount;
  final int? staffCount;

  const Shelter({
    required this.id,
    required this.name,
    this.code,
    required this.governorate,
    this.district,
    this.address,
    this.latitude,
    this.longitude,
    this.capacity,
    this.rooms,
    this.status = 'active',
    this.phone,
    this.email,
    this.imageUrl,
    this.civiliansCount,
    this.staffCount,
  });

  bool get isJoinable =>
      status == 'active' &&
      (capacity == null || (civiliansCount ?? 0) < capacity!);

  String? get unavailableReason {
    if (status == 'inactive') return 'Closed';
    if (status == 'full') return 'Full';
    if (capacity != null && (civiliansCount ?? 0) >= capacity!) return 'Full';
    return null;
  }

  double? get occupancyFraction {
    if (capacity == null || capacity == 0) return null;
    return ((civiliansCount ?? 0) / capacity!).clamp(0.0, 1.0);
  }

  factory Shelter.fromJson(Map<String, dynamic> json) => Shelter(
        id: json['id'] as int,
        name: json['name'] as String,
        code: json['code'] as String?,
        governorate: json['governorate'] as String,
        district: json['district'] as String?,
        address: json['address'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        capacity: json['capacity'] as int?,
        rooms: json['rooms'] as int?,
        status: json['status'] as String? ?? 'active',
        phone: json['phone'] as String?,
        email: json['email'] as String?,
        imageUrl: json['image_url'] as String?,
        civiliansCount: json['civilians_count'] as int?,
        staffCount: json['staff_count'] as int?,
      );
}
