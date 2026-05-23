import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../shelter/shelter_requests_screen.dart';
import 'aid_screen.dart';

class AidGateScreen extends StatelessWidget {
  const AidGateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    if (user?.isHoused == true) return const AidScreen();
    return const ShelterRequestsScreen();
  }
}
