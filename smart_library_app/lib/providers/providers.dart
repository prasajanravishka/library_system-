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
    final token = prefs.getString(AppConstants.prefToken);
    final userId = prefs.getInt(AppConstants.prefUserId);
    
    if (token != null) {
      _apiService.setToken(token);
    }
    
    if (userId != null) {
      final user = UserModel(
        userId: userId,
        studentId: prefs.getString(AppConstants.prefStudentId) ?? '',
        fullName: prefs.getString(AppConstants.prefUserName) ?? '',
        email: prefs.getString(AppConstants.prefUserEmail) ?? '',
        role: prefs.getString(AppConstants.prefUserRole) ?? 'student',
        isTempPassword: prefs.getBool('is_temp_password') ?? false,
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
        final token = response['token'];
        _apiService.setToken(token);
        
        final user = UserModel.fromJson(response['user']);
        state = AuthState(user: user);

        // Persist session
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.prefToken, token);
        await prefs.setInt(AppConstants.prefUserId, user.userId);
        await prefs.setString(AppConstants.prefUserRole, user.role);
        await prefs.setString(AppConstants.prefUserName, user.fullName);
        await prefs.setString(AppConstants.prefStudentId, user.studentId);
        await prefs.setString(AppConstants.prefUserEmail, user.email);
        await prefs.setBool('is_temp_password', user.isTempPassword);

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

  /// Change user password and update state
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiService.changePassword(currentPassword, newPassword);
      if (response['status'] == 'success') {
        if (state.user != null) {
          final updatedUser = UserModel(
            userId: state.user!.userId,
            studentId: state.user!.studentId,
            fullName: state.user!.fullName,
            email: state.user!.email,
            role: state.user!.role,
            isTempPassword: false,
          );
          state = AuthState(user: updatedUser);

          // Update persisted session
          final prefs = await SharedPreferences.getInstance();
          await prefs.setBool('is_temp_password', false);
        }
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response['message'] ?? 'Password update failed',
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
    await prefs.remove(AppConstants.prefToken);
    await prefs.remove(AppConstants.prefUserId);
    await prefs.remove(AppConstants.prefUserRole);
    await prefs.remove(AppConstants.prefUserName);
    await prefs.remove(AppConstants.prefStudentId);
    await prefs.remove(AppConstants.prefUserEmail);
    await prefs.remove('is_temp_password');
    _apiService.setToken(null);
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

// ── Trending Books Provider ─────────────────────────────────────────────────

final trendingBooksProvider = FutureProvider<List<dynamic>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getTrendingBooks();
  return response['trending_books'] ?? [];
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

// ── Saved Books Provider ────────────────────────────────────────────────────

class SavedBooksNotifier extends Notifier<List<int>> {
  @override
  List<int> build() {
    _loadSavedBooks();
    return [];
  }

  Future<void> _loadSavedBooks() async {
    try {
      final response = await ref.read(apiServiceProvider).getSavedBooks();
      final List<dynamic> books = response['books'] ?? [];
      state = books.map((e) {
        final id = e['book_id'];
        if (id is String) return int.parse(id);
        return id as int;
      }).toList();
    } catch (e) {
      // Error loading saved books
    }
  }

  Future<void> toggleSaved(int bookId) async {
    final currentList = List<int>.from(state);
    final api = ref.read(apiServiceProvider);
    
    try {
      if (currentList.contains(bookId)) {
        currentList.remove(bookId);
        state = currentList; // optimistic UI update
        await api.unsaveBook(bookId);
      } else {
        currentList.add(bookId);
        state = currentList; // optimistic UI update
        await api.saveBook(bookId);
      }
      // Refresh the details provider to update the Library tab
      ref.invalidate(savedBooksDetailsProvider);
    } catch (e) {
      // Rollback on error
      ref.invalidateSelf();
    }
  }
}

final savedBooksProvider = NotifierProvider<SavedBooksNotifier, List<int>>(SavedBooksNotifier.new);

final savedBooksDetailsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiService = ref.read(apiServiceProvider);
  final response = await apiService.getSavedBooks();
  final List<dynamic> rawList = response['books'] ?? [];
  return List<Map<String, dynamic>>.from(rawList);
});
