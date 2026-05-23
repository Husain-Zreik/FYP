import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_sizes.dart';
import '../../core/theme/app_colors.dart';
import '../../models/shelter.dart';
import '../../services/shelter_service.dart';

const _lebanon = LatLng(33.8547, 35.8623);
const _pageSize = 15;

class FindShelterScreen extends StatefulWidget {
  const FindShelterScreen({super.key});

  @override
  State<FindShelterScreen> createState() => _FindShelterScreenState();
}

class _FindShelterScreenState extends State<FindShelterScreen> {
  final _searchController = TextEditingController();
  final _mapController = MapController();
  bool _mapView = false;

  List<Shelter> _shelters = [];
  Position? _userPosition;
  bool _loadingShelters = true;
  bool _locationDenied = false;
  bool _locationDeniedForever = false;
  String? _shelterError;
  int _visibleCount = _pageSize;
  bool _availableOnly = false;

  @override
  void initState() {
    super.initState();
    _loadLocation();
    _loadShelters();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _loadLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) setState(() => _locationDenied = true);
        return;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          setState(() {
            _locationDenied = true;
            _locationDeniedForever = true;
          });
        }
        return;
      }
      if (permission == LocationPermission.denied) {
        if (mounted) setState(() => _locationDenied = true);
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );
      if (mounted) {
        setState(() => _userPosition = pos);
        if (_mapView) {
          _mapController.move(LatLng(pos.latitude, pos.longitude), 12);
        }
      }
    } catch (_) {
      if (mounted) setState(() => _locationDenied = true);
    }
  }

  Future<void> _loadShelters() async {
    setState(() {
      _loadingShelters = true;
      _shelterError = null;
    });
    try {
      final shelters = await ShelterService.getAvailable();
      if (mounted) setState(() => _shelters = shelters);
    } catch (e) {
      if (mounted) setState(() => _shelterError = e.toString());
    } finally {
      if (mounted) setState(() => _loadingShelters = false);
    }
  }

  double? _distanceTo(Shelter shelter) {
    if (_userPosition == null ||
        shelter.latitude == null ||
        shelter.longitude == null) {
      return null;
    }
    return Geolocator.distanceBetween(
          _userPosition!.latitude,
          _userPosition!.longitude,
          shelter.latitude!,
          shelter.longitude!,
        ) /
        1000;
  }

  List<Shelter> get _filteredAndSorted {
    final query = _searchController.text.toLowerCase();
    var list = query.isEmpty
        ? List<Shelter>.from(_shelters)
        : _shelters
            .where((s) =>
                s.name.toLowerCase().contains(query) ||
                s.governorate.toLowerCase().contains(query))
            .toList();

    if (_availableOnly) {
      list = list.where((s) => s.isJoinable).toList();
    }

    if (_userPosition != null) {
      list.sort((a, b) {
        final da = _distanceTo(a);
        final db = _distanceTo(b);
        if (da == null && db == null) return 0;
        if (da == null) return 1;
        if (db == null) return -1;
        return da.compareTo(db);
      });
    }
    return list;
  }

  Future<void> _openDirections(Shelter shelter) async {
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1'
      '&destination=${shelter.latitude},${shelter.longitude}',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  void _showShelterSheet(Shelter shelter) {
    final s = AppSizes.of(context);
    final dist = _distanceTo(shelter);
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.background,
      shape: RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(s.cardRadius + 4)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.fromLTRB(
          s.pagePadding,
          s.pagePadding,
          s.pagePadding,
          s.pagePadding + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ShelterThumb(imageUrl: shelter.imageUrl),
                SizedBox(width: s.fieldGap),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        shelter.name,
                        style: TextStyle(
                          fontSize: s.bodyLg,
                          fontWeight: FontWeight.w700,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        shelter.district != null
                            ? '${shelter.district}, ${shelter.governorate}'
                            : shelter.governorate,
                        style: TextStyle(
                            fontSize: s.bodySm, color: AppColors.textSubtle),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 10,
                        children: [
                          if (dist != null)
                            _InfoChip(
                              icon: Icons.near_me_rounded,
                              label: dist < 1
                                  ? '${(dist * 1000).round()} m'
                                  : '${dist.toStringAsFixed(1)} km',
                              color: AppColors.secondary,
                            ),
                          if (shelter.capacity != null)
                            _InfoChip(
                              icon: Icons.people_outline_rounded,
                              label: shelter.civiliansCount != null
                                  ? '${shelter.civiliansCount} / ${shelter.capacity}'
                                  : '${shelter.capacity} capacity',
                              color: (shelter.occupancyFraction ?? 0) >= 1.0
                                  ? AppColors.danger
                                  : AppColors.textMuted,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: s.sectionGap),
            Row(
              children: [
                Expanded(
                  child: _SheetButton(
                    label: 'View Details',
                    icon: Icons.info_outline,
                    onTap: () {
                      Navigator.pop(context);
                      context.push(
                          '/shelter/find/${shelter.id}', extra: shelter);
                    },
                    s: s,
                  ),
                ),
                if (shelter.latitude != null) ...[
                  SizedBox(width: s.fieldGap),
                  Expanded(
                    child: _SheetButton(
                      label: 'Directions',
                      icon: Icons.directions_rounded,
                      onTap: () {
                        Navigator.pop(context);
                        _openDirections(shelter);
                      },
                      s: s,
                      filled: true,
                    ),
                  ),
                ],
              ],
            ),
            SizedBox(height: s.itemGap),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = AppSizes.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Find a Shelter'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              _mapView ? Icons.list_rounded : Icons.map_outlined,
              color: Colors.white,
            ),
            tooltip: _mapView ? 'List view' : 'Map view',
            onPressed: () => setState(() => _mapView = !_mapView),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Search bar + filter chips ───────────────────────────────
          Container(
            color: AppColors.primary,
            padding: EdgeInsets.fromLTRB(
                s.pagePadding, 0, s.pagePadding, s.fieldGap),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _searchController,
                  style: TextStyle(fontSize: s.bodyMd, color: AppColors.text),
                  decoration: InputDecoration(
                    hintText: 'Search by name or governorate…',
                    prefixIcon: const Icon(Icons.search_rounded,
                        color: AppColors.textSubtle, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _visibleCount = _pageSize);
                            },
                          )
                        : null,
                  ),
                  onChanged: (_) => setState(() => _visibleCount = _pageSize),
                ),
                SizedBox(height: s.itemGap),
                GestureDetector(
                  onTap: () => setState(() {
                    _availableOnly = !_availableOnly;
                    _visibleCount = _pageSize;
                  }),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _availableOnly
                          ? Colors.white
                          : Colors.white.withAlpha(30),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: _availableOnly
                            ? Colors.white
                            : Colors.white.withAlpha(80),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _availableOnly
                              ? Icons.check_circle_rounded
                              : Icons.radio_button_unchecked_rounded,
                          size: 14,
                          color: _availableOnly
                              ? AppColors.secondary
                              : Colors.white,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Available only',
                          style: TextStyle(
                            fontSize: s.bodySm,
                            fontWeight: FontWeight.w600,
                            color: _availableOnly
                                ? AppColors.secondary
                                : Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          // ── Location denied banner ──────────────────────────────────
          if (_locationDenied)
            Container(
              padding: EdgeInsets.symmetric(
                  horizontal: s.pagePadding, vertical: s.itemGap),
              color: AppColors.warningSurface,
              child: Row(
                children: [
                  const Icon(Icons.location_off_outlined,
                      size: 16, color: AppColors.warning),
                  SizedBox(width: s.itemGap),
                  Expanded(
                    child: Text(
                      'Enable location to sort by distance',
                      style: TextStyle(
                          fontSize: s.bodySm, color: AppColors.warning),
                    ),
                  ),
                  GestureDetector(
                    onTap: () async {
                      if (_locationDeniedForever) {
                        await Geolocator.openAppSettings();
                      } else {
                        setState(() {
                          _locationDenied = false;
                          _locationDeniedForever = false;
                        });
                        await _loadLocation();
                      }
                    },
                    child: Text(
                      _locationDeniedForever ? 'Settings' : 'Allow',
                      style: TextStyle(
                        fontSize: s.bodySm,
                        fontWeight: FontWeight.w600,
                        color: AppColors.warning,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          // ── Content ─────────────────────────────────────────────────
          Expanded(
            child: _loadingShelters
                ? const Center(
                    child: CircularProgressIndicator(
                        color: AppColors.secondary))
                : _shelterError != null
                    ? _ErrorState(
                        error: _shelterError!,
                        onRetry: _loadShelters,
                        s: s,
                      )
                    : _mapView
                        ? _buildMap(s)
                        : _buildList(s),
          ),
        ],
      ),
    );
  }

  Widget _buildMap(AppSizes s) {
    final center = _userPosition != null
        ? LatLng(_userPosition!.latitude, _userPosition!.longitude)
        : _lebanon;

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: center,
            initialZoom: _userPosition != null ? 12.0 : 8.5,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.nuzuh.application',
            ),
            MarkerLayer(
              markers: [
                ..._shelters
                    .where((sh) =>
                        sh.latitude != null && sh.longitude != null)
                    .map(
                      (shelter) => Marker(
                        point:
                            LatLng(shelter.latitude!, shelter.longitude!),
                        width: 40,
                        height: 40,
                        child: GestureDetector(
                          onTap: shelter.isJoinable
                              ? () => _showShelterSheet(shelter)
                              : null,
                          child: Icon(
                            Icons.location_on_rounded,
                            color: shelter.isJoinable
                                ? AppColors.secondary
                                : Colors.grey.shade400,
                            size: 40,
                          ),
                        ),
                      ),
                    ),
                if (_userPosition != null)
                  Marker(
                    point: LatLng(
                        _userPosition!.latitude, _userPosition!.longitude),
                    width: 22,
                    height: 22,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.blue,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: const [
                          BoxShadow(color: Colors.black26, blurRadius: 4)
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            const RichAttributionWidget(
              attributions: [
                TextSourceAttribution('OpenStreetMap contributors')
              ],
            ),
          ],
        ),
        if (_userPosition != null)
          Positioned(
            bottom: 24,
            right: 16,
            child: FloatingActionButton.small(
              heroTag: 'center',
              onPressed: () => _mapController.move(
                LatLng(
                    _userPosition!.latitude, _userPosition!.longitude),
                14,
              ),
              backgroundColor: Colors.white,
              elevation: 3,
              child: const Icon(Icons.my_location_rounded,
                  color: AppColors.secondary),
            ),
          ),
      ],
    );
  }

  Widget _buildList(AppSizes s) {
    final sorted = _filteredAndSorted;

    if (sorted.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.home_work_outlined,
                size: 48, color: AppColors.border2),
            SizedBox(height: s.fieldGap),
            Text(
              'No shelters found',
              style: TextStyle(
                  fontSize: s.bodyMd,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMuted),
            ),
            SizedBox(height: s.itemGap / 2),
            Text(
              _searchController.text.isNotEmpty
                  ? 'Try a different search term'
                  : 'No shelters are currently available',
              style: TextStyle(
                  fontSize: s.bodySm, color: AppColors.textSubtle),
            ),
          ],
        ),
      );
    }

    final paged = sorted.take(_visibleCount).toList();
    final hasMore = sorted.length > _visibleCount;

    return ListView.separated(
      padding: EdgeInsets.all(s.pagePadding),
      itemCount: paged.length + (hasMore ? 1 : 0),
      separatorBuilder: (_, _) => SizedBox(height: s.itemGap),
      itemBuilder: (_, index) {
        if (index == paged.length) {
          final remaining = sorted.length - _visibleCount;
          return _LoadMoreButton(
            count: remaining.clamp(0, _pageSize),
            onPressed: () => setState(() => _visibleCount += _pageSize),
            s: s,
          );
        }
        final shelter = paged[index];
        final dist = _distanceTo(shelter);
        final isNearest = index == 0 && dist != null && shelter.isJoinable;
        return _ShelterCard(
          shelter: shelter,
          distance: dist,
          isNearest: isNearest,
          onTap: shelter.isJoinable
              ? () => context.push(
                    '/shelter/find/${shelter.id}',
                    extra: shelter,
                  )
              : null,
          s: s,
        );
      },
    );
  }
}

// ── Compact shelter card ────────────────────────────────────────────────────

class _ShelterCard extends StatelessWidget {
  final Shelter shelter;
  final double? distance;
  final bool isNearest;
  final VoidCallback? onTap;
  final AppSizes s;

  const _ShelterCard({
    required this.shelter,
    required this.distance,
    required this.isNearest,
    required this.onTap,
    required this.s,
  });

  bool get _joinable => onTap != null;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: _joinable ? 1.0 : 0.5,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(s.cardRadius),
            border: Border.all(
              color: isNearest ? AppColors.secondary : AppColors.border,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _ShelterThumb(imageUrl: shelter.imageUrl),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Name + badge
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            shelter.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: s.bodyMd,
                              fontWeight: FontWeight.w600,
                              color: AppColors.text,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        if (isNearest)
                          _Badge(
                            label: 'Nearest',
                            bg: AppColors.successSurface,
                            fg: AppColors.success,
                          )
                        else if (!_joinable &&
                            shelter.unavailableReason != null)
                          _Badge(
                            label: shelter.unavailableReason!,
                            bg: shelter.unavailableReason == 'Closed'
                                ? AppColors.surface2
                                : AppColors.dangerSurface,
                            fg: shelter.unavailableReason == 'Closed'
                                ? AppColors.textSubtle
                                : AppColors.danger,
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    // Location (full row width — distance moved to right column)
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 11, color: AppColors.textSubtle),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            shelter.district != null
                                ? '${shelter.district}, ${shelter.governorate}'
                                : shelter.governorate,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                fontSize: s.caption,
                                color: AppColors.textSubtle),
                          ),
                        ),
                      ],
                    ),
                    // Capacity bar
                    if (shelter.capacity != null) ...[
                      const SizedBox(height: 6),
                      _CapacityBar(shelter: shelter, s: s),
                    ],
                  ],
                ),
              ),
              // Right column: distance + chevron
              const SizedBox(width: 8),
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (distance != null) ...[
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.near_me_rounded,
                            size: 11, color: AppColors.secondary),
                        const SizedBox(width: 2),
                        Text(
                          distance! < 1
                              ? '${(distance! * 1000).round()} m'
                              : '${distance!.toStringAsFixed(1)} km',
                          style: TextStyle(
                            fontSize: s.caption,
                            fontWeight: FontWeight.w600,
                            color: AppColors.secondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                  ],
                  if (_joinable)
                    const Icon(Icons.chevron_right_rounded,
                        color: AppColors.border2, size: 20),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Shelter image thumbnail (52×52) ─────────────────────────────────────────

class _ShelterThumb extends StatelessWidget {
  final String? imageUrl;
  static const double _size = 52;

  const _ShelterThumb({this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: imageUrl != null
          ? Image.network(
              imageUrl!,
              width: _size,
              height: _size,
              fit: BoxFit.cover,
              loadingBuilder: (_, child, progress) =>
                  progress == null ? child : _placeholder(),
              errorBuilder: (_, _, _) => _placeholder(),
            )
          : _placeholder(),
    );
  }

  Widget _placeholder() => Container(
        width: _size,
        height: _size,
        color: AppColors.tertiary,
        child: const Icon(Icons.home_work_rounded,
            color: AppColors.secondary, size: 24),
      );
}

// ── Capacity progress bar ────────────────────────────────────────────────────

class _CapacityBar extends StatelessWidget {
  final Shelter shelter;
  final AppSizes s;

  const _CapacityBar({required this.shelter, required this.s});

  @override
  Widget build(BuildContext context) {
    final count = shelter.civiliansCount ?? 0;
    final cap = shelter.capacity!;
    final pct = (count / cap).clamp(0.0, 1.0);
    final Color barColor;
    if (pct >= 1.0) {
      barColor = AppColors.danger;
    } else if (pct >= 0.85) {
      barColor = AppColors.warning;
    } else {
      barColor = AppColors.success;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: LinearProgressIndicator(
            value: shelter.civiliansCount != null ? pct : 0,
            minHeight: 4,
            backgroundColor: AppColors.surface2,
            color: barColor,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          shelter.civiliansCount != null
              ? '$count / $cap people'
              : '$cap capacity',
          style: TextStyle(
            fontSize: s.caption - 1,
            color: barColor,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

// ── Small badge chip ─────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  final String label;
  final Color bg;
  final Color fg;

  const _Badge({required this.label, required this.bg, required this.fg});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label,
          style: TextStyle(
              fontSize: 10, fontWeight: FontWeight.w600, color: fg)),
    );
  }
}

// ── Info chip (map bottom sheet) ─────────────────────────────────────────────

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _InfoChip(
      {required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 3),
        Text(label,
            style: TextStyle(
                fontSize: 12, color: color, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

// ── Load more button ─────────────────────────────────────────────────────────

class _LoadMoreButton extends StatelessWidget {
  final int count;
  final VoidCallback onPressed;
  final AppSizes s;

  const _LoadMoreButton(
      {required this.count, required this.onPressed, required this.s});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: s.itemGap),
      child: Center(
        child: GestureDetector(
          onTap: onPressed,
          child: Container(
            padding: EdgeInsets.symmetric(
                horizontal: s.sectionGap, vertical: s.itemGap - 2),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(s.borderRadius),
              border: Border.all(color: AppColors.border),
            ),
            child: Text(
              'Show $count more',
              style: TextStyle(
                fontSize: s.bodyMd,
                fontWeight: FontWeight.w600,
                color: AppColors.secondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Map bottom sheet action button ───────────────────────────────────────────

class _SheetButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final AppSizes s;
  final bool filled;

  const _SheetButton({
    required this.label,
    required this.icon,
    required this.onTap,
    required this.s,
    this.filled = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: s.itemGap + 2),
        decoration: BoxDecoration(
          color: filled ? AppColors.secondary : AppColors.surface,
          borderRadius: BorderRadius.circular(s.borderRadius),
          border:
              Border.all(color: filled ? AppColors.secondary : AppColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                size: 16, color: filled ? Colors.white : AppColors.secondary),
            SizedBox(width: s.itemGap),
            Text(
              label,
              style: TextStyle(
                fontSize: s.bodySm,
                fontWeight: FontWeight.w600,
                color: filled ? Colors.white : AppColors.text,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Error state ──────────────────────────────────────────────────────────────

class _ErrorState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  final AppSizes s;

  const _ErrorState(
      {required this.error, required this.onRetry, required this.s});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(s.pagePadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded,
                size: 48, color: AppColors.border2),
            SizedBox(height: s.fieldGap),
            Text(
              'Could not load shelters',
              style: TextStyle(
                  fontSize: s.bodyMd,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMuted),
            ),
            SizedBox(height: s.itemGap / 2),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: s.bodySm, color: AppColors.textSubtle),
            ),
            SizedBox(height: s.sectionGap),
            GestureDetector(
              onTap: onRetry,
              child: Container(
                padding: EdgeInsets.symmetric(
                    horizontal: s.sectionGap, vertical: s.itemGap),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: BorderRadius.circular(s.borderRadius),
                ),
                child: Text(
                  'Retry',
                  style: TextStyle(
                      fontSize: s.bodyMd,
                      fontWeight: FontWeight.w600,
                      color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
