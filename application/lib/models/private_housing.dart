class PrivateHousing {
  final int id;
  final String? propertyType;
  final String address;
  final String governorate;
  final String? district;
  final String? landlordName;
  final String? landlordPhone;
  final double? monthlyRent;
  final DateTime? leaseStartDate;
  final String? notes;

  const PrivateHousing({
    required this.id,
    this.propertyType,
    required this.address,
    required this.governorate,
    this.district,
    this.landlordName,
    this.landlordPhone,
    this.monthlyRent,
    this.leaseStartDate,
    this.notes,
  });

  factory PrivateHousing.fromJson(Map<String, dynamic> json) => PrivateHousing(
        id: json['id'] as int,
        propertyType: json['property_type'] as String?,
        address: json['address'] as String,
        governorate: json['governorate'] as String,
        district: json['district'] as String?,
        landlordName: json['landlord_name'] as String?,
        landlordPhone: json['landlord_phone'] as String?,
        monthlyRent: json['monthly_rent'] != null
            ? (json['monthly_rent'] as num).toDouble()
            : null,
        leaseStartDate: json['lease_start_date'] != null
            ? DateTime.tryParse(json['lease_start_date'].toString())
            : null,
        notes: json['notes'] as String?,
      );
}
