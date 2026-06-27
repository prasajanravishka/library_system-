import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/app_constants.dart';
import '../models/user_model.dart';
import '../models/category_model.dart';
import '../services/api_service.dart';

// ── API Service Provider ────────────────────────────────────────────────────

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

// ── Auth State ──────────────────────────────────────────────────────────────

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null;
  bool get isLibrarian => user?.isLibrarian ?? false;
  int get userId => user?.userId ?? 0;
  String get userName => user?.fullName ?? '';
  String get role => user?.role ?? 'student';

  AuthState copyWith({UserModel? user, bool? isLoading, String? error, bool clearUser = false}) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    return const AuthState();
  }

  ApiService get _apiService => ref.read(apiServiceProvider);

  /// Try to restore session from shared preferences
  Future<void> tryRestoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getInt(AppConstants.prefUserId);
    if (userId != null) {
      final user = UserModel(
        userId: userId,
        studentId: prefs.getString(AppConstants.prefStudentId) ?? '',
        fullName: prefs.getString(AppConstants.prefUserName) ?? '',
        email: prefs.getString(AppConstants.prefUserEmail) ?? '',
        role: prefs.getString(AppConstants.prefUserRole) ?? 'student',
      );
      state = AuthState(user: user);
    }
  }

  /// Login with student ID and password
  Future<bool> login(String studentId, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiService.login(studentId, password);
      if (response['status'] == 'success') {
        final user = UserModel.fromJson(response['user']);
        state = AuthState(user: user);

        // Persist session
        final prefs = await SharedPreferences.getInstance();
        await prefs.setInt(AppConstants.prefUserId, user.userId);
        await prefs.setString(AppConstants.prefUserRole, user.role);
        await prefs.setString(AppConstants.prefUserName, user.fullName);
        await prefs.setString(AppConstants.prefStudentId, user.studentId);
        await prefs.setString(AppConstants.prefUserEmail, user.email);

        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response['message'] ?? 'Login failed',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  /// Logout and clear session
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.prefUserId);
    await prefs.remove(AppConstants.prefUserRole);
    await prefs.remove(AppConstants.prefUserName);
    await prefs.remove(AppConstants.prefStudentId);
    await prefs.remove(AppConstants.prefUserEmail);
    state = const AuthState();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

// ── Onboarding Seen Provider ────────────────────────────────────────────────

final onboardingSeenProvider = FutureProvider<bool>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(AppConstants.prefOnboardingSeen) ?? false;
});

/// Mark onboarding as seen
Future<void> markOnboardingSeen() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(AppConstants.prefOnboardingSeen, true);
}

// ── Dashboard Stats Provider ────────────────────────────────────────────────

final dashboardStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getDashboardStats();
  return response['stats'] ?? {};
});

// ── User Dashboard Provider ─────────────────────────────────────────────────

final userDashboardProvider = FutureProvider.family<Map<String, dynamic>, int>((ref, userId) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getUserDashboard(userId);
  return response['dashboard'] ?? {};
});

// ── User Library Provider ───────────────────────────────────────────────────

final userLibraryProvider = FutureProvider.family<List<dynamic>, int>((ref, userId) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getUserLibrary(userId);
  return response['library'] ?? [];
});

// ── All Books Provider (Librarian Inventory) ────────────────────────────────

final allBooksProvider = FutureProvider<List<dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getAllBooks();
  return response['books'] ?? [];
});

// ── Book Details Provider ───────────────────────────────────────────────────

final bookDetailProvider = FutureProvider.family<Map<String, dynamic>, int>((ref, bookId) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getBookDetails(bookId);
  return response['book'] ?? response; // Some APIs return nested 'book', some return flat. Checking PHP, it just returns flat if it used json_encode($book). Let's see the PHP file.
});

// ── User Profile Provider ───────────────────────────────────────────────────

final userProfileProvider = FutureProvider.family<Map<String, dynamic>, int>((ref, userId) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getUserProfile(userId);
  return response['profile'] ?? {};
});

// ── Book Search Provider ────────────────────────────────────────────────────

final bookSearchProvider = FutureProvider.family<List<dynamic>, String>((ref, query) async {
  if (query.isEmpty) return [];
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.searchBooks(query);
  return response['books'] ?? [];
});

// ── Featured Books Provider ─────────────────────────────────────────────────

final featuredBooksProvider = FutureProvider<List<dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getFeaturedBooks();
  return response['featured_books'] ?? [];
});

// ── Categories Provider ─────────────────────────────────────────────────────

final categoriesProvider = FutureProvider<List<CategoryModel>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getCategories();
  final List<dynamic> rawList = response['categories'] ?? [];
  return rawList.map((c) => CategoryModel.fromJson(c)).toList();
});

// ── Books By Category Provider ──────────────────────────────────────────────

final booksByCategoryProvider = FutureProvider.family<List<dynamic>, int>((ref, categoryId) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getBooksByCategory(categoryId);
  return response['books'] ?? [];
});

// ── Notifications Provider ──────────────────────────────────────────────────

final notificationsProvider = FutureProvider.family<List<dynamic>, int>((ref, userId) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getNotifications(userId);
  return response['notifications'] ?? [];
});

// ── Reading History Provider ────────────────────────────────────────────────

final readingHistoryProvider = FutureProvider.family<List<dynamic>, int>((ref, userId) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getReadingHistory(userId);
  return response['history'] ?? [];
});

// ── User Settings Provider ──────────────────────────────────────────────────

final userSettingsProvider = FutureProvider.family<Map<String, dynamic>, int>((ref, userId) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getSettings(userId);
  return response['settings'] ?? {};
});

// ── Support Tickets Provider ────────────────────────────────────────────────

final supportTicketsProvider = FutureProvider.family<List<dynamic>, int>((ref, userId) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getSupportTickets(userId);
  return response['tickets'] ?? [];
});
