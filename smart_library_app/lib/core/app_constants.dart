import 'package:flutter_dotenv/flutter_dotenv.dart';

/// ─── App Constants ──────────────────────────────────────────────────────────
class AppConstants {
  AppConstants._();

  /// API Base URL loaded from .env (FastAPI Backend)
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8001/api';

  /// API key — must match both backends exactly
  static const String apiKey = 'LIBRARY_SECRET_API_KEY_2026';

  /// Shared preferences keys
  static const String prefOnboardingSeen = 'onboarding_seen';
  static const String prefToken = 'jwt_token';
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
