class AidCategory {
  final int id;
  final String name;
  final String unit;

  const AidCategory({
    required this.id,
    required this.name,
    required this.unit,
  });

  factory AidCategory.fromJson(Map<String, dynamic> json) => AidCategory(
        id: json['id'] as int,
        name: json['name'] as String,
        unit: json['unit'] as String,
      );
}
