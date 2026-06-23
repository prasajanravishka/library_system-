import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// ─── App Constants ──────────────────────────────────────────────────────────
class AppConstants {
  AppConstants._();

  /// ── Host resolution ─────────────────────────────────────────────────────
  /// Web (Chrome):   localhost (browser runs on same machine as server)
  /// Android Emulator: 10.0.2.2 → host loopback
  /// iOS Simulator:  127.0.0.1
  /// Physical device: your machine's LAN IP
  static String get _host {
    // Web app runs in browser on the same machine as the server
    if (kIsWeb) return 'localhost';
    try {
      if (Platform.isAndroid) return '10.0.2.2';
      if (Platform.isIOS) return '127.0.0.1';
    } catch (_) {}
    // ── Physical Device / Custom Network ──
    // Replace with your machine's local IP (run `ipconfig` to find it)
    return '192.168.1.100';
  }

  /// PHP Backend (CRUD & Auth) — Port 8000
  static String get phpBaseUrl => 'http://$_host:8000';

  /// Python FastAPI Backend (AI/Vision) — Port 8001
  static String get pyBaseUrl => 'http://$_host:8001';

  /// API key — must match both backends exactly
  static const String apiKey = 'LIBRARY_SECRET_API_KEY_2026';

  /// Shared preferences keys
  static const String prefOnboardingSeen = 'onboarding_seen';
  static const String prefUserId = 'user_id';
  static const String prefUserRole = 'user_role';
  static const String prefUserName = 'user_name';
  static const String prefStudentId = 'student_id';
  static const String prefUserEmail = 'user_email';

  /// UI constants
  static const double cardBorderRadius = 16.0;
  static const double buttonBorderRadius = 14.0;
  static const double screenPadding = 20.0;

  /// Borrow duration in days
  static const int borrowDurationDays = 14;
}
