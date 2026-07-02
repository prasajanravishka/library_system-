/// ─── App Constants ──────────────────────────────────────────────────────────
class AppConstants {
  AppConstants._();

  /// API Base URL (FastAPI Backend)
  // TODO: Replace 10.0.2.2 with your computer's actual local IPv4 address if testing on a physical device.
  // Find your IPv4 address by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) in your terminal.
  static String get apiBaseUrl => 'http://127.0.0.1:8001/api';

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
