/// ─── App Constants ──────────────────────────────────────────────────────────
class AppConstants {
  AppConstants._();

  /// PHP Backend (CRUD) — Port 8000
  /// Android emulator: 10.0.2.2, iOS simulator / desktop: localhost
  static const String phpBaseUrl = 'http://10.0.2.2:8000';

  /// Python Backend (AI/Vision) — Port 8001
  static const String pyBaseUrl = 'http://10.0.2.2:8001';

  /// API key — must match both backends
  static const String apiKey = 'smartlib-secure-key-2026';

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
