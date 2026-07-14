import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../core/app_constants.dart';

/// Centralized API service for communication with the Python FastAPI backend.
///
/// The Python backend handles all CRUD operations and AI/OCR image processing.
/// It requires the `x-api-key` header for AI operations, and a JWT token for CRUD.
class ApiService {
  static String get _base => AppConstants.apiBaseUrl;
  String? _jwtToken;

  void setToken(String? token) {
    _jwtToken = token;
  }

  /// Standard headers for JSON requests.
  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
      'x-api-key': AppConstants.apiKey,
    };
    if (_jwtToken != null) {
      headers['Authorization'] = 'Bearer $_jwtToken';
    }
    return headers;
  }

  /// Headers for multipart / non-JSON.
  Map<String, String> get _authHeaders {
    final headers = <String, String>{
      'x-api-key': AppConstants.apiKey,
    };
    if (_jwtToken != null) {
      headers['Authorization'] = 'Bearer $_jwtToken';
    }
    return headers;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CRUD Operations & Authentication
  // ══════════════════════════════════════════════════════════════════════════

  // ── Authentication ──────────────────────────────────────────────────────

  /// Login as a Student
  Future<Map<String, dynamic>> login(String studentId, String password) async {
    try {
      final url = Uri.parse('$_base/users/login');
      final response = await http.post(
        url,
        headers: _headers,
        body: jsonEncode({'student_id': studentId, 'password': password}),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        try {
          final body = jsonDecode(response.body);
          throw Exception(body['detail'] ?? 'Login failed');
        } catch (e) {
          if (e is FormatException) {
            throw Exception('Server error (${response.statusCode}): ${response.body}');
          }
          rethrow;
        }
      }
    } on SocketException catch (_) {
      throw Exception('Server unreachable. Ensure the backend is running.');
    } catch (e) {
      rethrow;
    }
  }

  /// Login as a Librarian
  Future<Map<String, dynamic>> loginAdmin(String username, String password) async {
    try {
      final url = Uri.parse('$_base/admin/login');
      final response = await http.post(
        url,
        headers: _headers,
        body: jsonEncode({'username': username, 'password': password}),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        try {
          final body = jsonDecode(response.body);
          throw Exception(body['detail'] ?? 'Login failed');
        } catch (e) {
          if (e is FormatException) {
            throw Exception('Server error (${response.statusCode}): ${response.body}');
          }
          rethrow;
        }
      }
    } on SocketException catch (_) {
      throw Exception('Server unreachable. Ensure the backend is running.');
    } catch (e) {
      rethrow;
    }
  }

  /// Change Password for logged-in user
  Future<Map<String, dynamic>> changePassword(String currentPassword, String newPassword) async {
    try {
      final url = Uri.parse('$_base/users/me/password');
      final response = await http.put(
        url,
        headers: _headers,
        body: jsonEncode({
          'current_password': currentPassword,
          'new_password': newPassword,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        try {
          final body = jsonDecode(response.body);
          throw Exception(body['detail'] ?? 'Failed to update password');
        } catch (e) {
          if (e is FormatException) {
            throw Exception('Server error (${response.statusCode}): ${response.body}');
          }
          rethrow;
        }
      }
    } on SocketException catch (_) {
      throw Exception('Server unreachable. Ensure the backend is running.');
    } catch (e) {
      rethrow;
    }
  }

  /// ── Testing ──────────────────────────────────────────────────────────────

  /// Test end-to-end connectivity with MySQL database via backend
  Future<bool> testUserDatabaseConnection() async {
    try {
      final url = Uri.parse('$_base/test_users');
      final response = await http.get(url, headers: _authHeaders);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Database Connection Test SUCCESS!');
        print('Users returned: ${data['users']}');
        return true;
      } else {
        print('❌ Database Connection Test FAILED with status: ${response.statusCode}');
        print('Response body: ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Database Connection Test ERROR: $e');
      return false;
    }
  }

  // ── Dashboard ───────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getDashboardStats() async {
    final url = Uri.parse('$_base/stats');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load dashboard stats');
    }
  }

  Future<Map<String, dynamic>> getUserDashboard(int userId) async {
    final url = Uri.parse('$_base/user_dashboard');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load dashboard');
    }
  }

  Future<Map<String, dynamic>> getFeaturedBooks() async {
    final url = Uri.parse('$_base/featured_books');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load featured books: ${response.statusCode} ${response.body}');
    }
  }

  Future<Map<String, dynamic>> getTrendingBooks() async {
    final url = Uri.parse('$_base/trending_books');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load trending books: ${response.statusCode} ${response.body}');
    }
  }

  Future<Map<String, dynamic>> getCategories() async {
    final url = Uri.parse('$_base/categories');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load categories: ${response.statusCode} ${response.body}');
    }
  }

  Future<Map<String, dynamic>> getBooksByCategory(int categoryId) async {
    final url = Uri.parse('$_base/categories/$categoryId/books');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load books for category');
    }
  }



  // ── Saved Books ─────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> saveBook(int bookId) async {
    final url = Uri.parse('$_base/books/$bookId/save');
    final response = await http.post(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to save book: ${response.statusCode} ${response.body}');
    }
  }

  Future<Map<String, dynamic>> unsaveBook(int bookId) async {
    final url = Uri.parse('$_base/books/$bookId/save');
    final response = await http.delete(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to remove saved book: ${response.statusCode} ${response.body}');
    }
  }

  Future<Map<String, dynamic>> getSavedBooks() async {
    final url = Uri.parse('$_base/users/me/saved-books');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load saved books: ${response.statusCode} ${response.body}');
    }
  }

  // ── User Library (Borrow History) ───────────────────────────────────────

  Future<Map<String, dynamic>> getUserLibrary(int userId) async {
    final url = Uri.parse('$_base/borrow/history');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load library');
    }
  }

  // ── User Profile ────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getUserProfile(int userId) async {
    final url = Uri.parse('$_base/users/profile');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load profile: ${response.statusCode} ${response.body}');
    }
  }

  // ── Book Search ─────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> searchBooks(String query, {int? categoryId}) async {
    var urlString = '$_base/books/search?q=${Uri.encodeComponent(query)}';
    if (categoryId != null) {
      urlString += '&category_id=$categoryId';
    }
    final url = Uri.parse(urlString);
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to search books');
    }
  }

  // ── Book CRUD (Admin) ───────────────────────────────────────────────────

  Future<Map<String, dynamic>> getAllBooks() async {
    final url = Uri.parse('$_base/admin/books');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load books');
    }
  }

  Future<Map<String, dynamic>> addBook({
    required String title,
    String author = '',
    String isbn = '',
    String publisher = '',
    int? publicationYear,
    String coverImagePath = '',
    String coverImageUrl = '',
    int? addedBy,
    List<int>? categoryIds,
  }) async {
    final url = Uri.parse('$_base/admin/books');
    final body = <String, dynamic>{
      'title': title,
      'author': author,
      'isbn': isbn,
      'publisher': publisher,
      'cover_image_path': coverImagePath,
      'cover_image_url': coverImageUrl,
    };
    if (publicationYear != null) body['publication_year'] = publicationYear;
    if (addedBy != null) body['added_by'] = addedBy;
    if (categoryIds != null && categoryIds.isNotEmpty) body['category_ids'] = categoryIds;

    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode(body),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to add book');
    }
  }

  Future<Map<String, dynamic>> updateBook(
    int bookId,
    Map<String, dynamic> updates,
  ) async {
    final url = Uri.parse('$_base/admin/books/$bookId');
    final response = await http.put(
      url,
      headers: _headers,
      body: jsonEncode(updates),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to update book');
    }
  }

  // ── Book Details ────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getBookDetails(int bookId) async {
    final url = Uri.parse('$_base/books/$bookId');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load book details');
    }
  }

  // ── Borrow & Return ─────────────────────────────────────────────────────

  Future<Map<String, dynamic>> borrowBook(int userId, int bookId) async {
    final url = Uri.parse('$_base/borrow');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({'book_id': bookId}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      try {
        final body = jsonDecode(response.body);
        throw Exception(body['detail'] ?? 'Failed to borrow book');
      } catch (e) {
        if (e is FormatException) {
          throw Exception('Server error (${response.statusCode}): ${response.body}');
        }
        rethrow;
      }
    }
  }

  Future<Map<String, dynamic>> returnBook(int userId, int bookId) async {
    final url = Uri.parse('$_base/borrow/return');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({'book_id': bookId}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      try {
        final body = jsonDecode(response.body);
        throw Exception(body['detail'] ?? 'Failed to return book');
      } catch (e) {
        if (e is FormatException) {
          throw Exception('Server error (${response.statusCode}): ${response.body}');
        }
        rethrow;
      }
    }
  }

  // ── User Management (Admin) ─────────────────────────────────────────────

  Future<Map<String, dynamic>> getAllUsers() async {
    final url = Uri.parse('$_base/admin/users');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load users');
    }
  }

  Future<Map<String, dynamic>> toggleUserStatus(int userId) async {
    final url = Uri.parse('$_base/admin/users/$userId/toggle');
    final response = await http.put(url, headers: _headers);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to update user status');
    }
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getNotifications(int userId) async {
    final url = Uri.parse('$_base/notifications');
    final response = await http.get(url, headers: _authHeaders);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load notifications');
    }
  }

  Future<Map<String, dynamic>> markNotificationRead(int notificationId) async {
    final url = Uri.parse('$_base/notifications/read');
    final response = await http.put(url, headers: _headers, body: jsonEncode({'notification_id': notificationId}));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to mark notification as read');
    }
  }

  Future<Map<String, dynamic>> markAllNotificationsRead(int userId) async {
    final url = Uri.parse('$_base/notifications/read');
    final response = await http.put(url, headers: _headers, body: jsonEncode({}));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to mark all notifications as read');
    }
  }
  
  Future<Map<String, dynamic>> deleteNotification(int notificationId) async {
    final url = Uri.parse('$_base/notifications/$notificationId');
    final response = await http.delete(url, headers: _headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to delete notification');
    }
  }

  // ── Reading History ───────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getReadingHistory(int userId) async {
    final url = Uri.parse('$_base/borrow/reading_history');
    final response = await http.get(url, headers: _authHeaders);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load reading history');
    }
  }

  // ── User Settings ─────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getSettings(int userId) async {
    final url = Uri.parse('$_base/settings');
    final response = await http.get(url, headers: _authHeaders);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load settings');
    }
  }

  Future<Map<String, dynamic>> updateSettings(int userId, Map<String, dynamic> settings) async {
    final url = Uri.parse('$_base/settings');
    final response = await http.put(url, headers: _headers, body: jsonEncode(settings));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to update settings');
    }
  }

  // ── Support Tickets ───────────────────────────────────────────────────────

  Future<Map<String, dynamic>> createSupportTicket(int userId, String subject, String message) async {
    final url = Uri.parse('$_base/support/tickets');
    final response = await http.post(url, headers: _headers, body: jsonEncode({
      'subject': subject,
      'message': message,
    }));
    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create support ticket');
    }
  }

  Future<Map<String, dynamic>> getSupportTickets(int userId) async {
    final url = Uri.parse('$_base/support/tickets');
    final response = await http.get(url, headers: _authHeaders);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load support tickets');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AI/Vision Operations
  // ══════════════════════════════════════════════════════════════════════════

  /// OCR scan: send image to backend for text extraction + LLM parsing
  Future<Map<String, dynamic>> extractBookInfo(String imagePath) async {
    try {
      final url = Uri.parse('$_base/scan-book');

      // Determine MIME type from file extension; default to image/jpeg for camera captures
      final extension = imagePath.split('.').last.toLowerCase();
      final mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'heic': 'image/heic',
        'heif': 'image/heif',
        'bmp': 'image/bmp',
      };
      final contentType = mimeTypes[extension] ?? 'image/jpeg';

      final request = http.MultipartRequest('POST', url)
        ..headers.addAll(_authHeaders)
        ..files.add(await http.MultipartFile.fromPath(
          'file',
          imagePath,
          contentType: MediaType.parse(contentType),
        ));

      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
        onTimeout: () => throw Exception(
          'Request timeout: Backend took too long to respond.',
        ),
      );

      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 403) {
        throw Exception('Authentication failed: Invalid or missing API key.');
      } else if (response.statusCode == 400) {
        throw Exception(
          'Invalid request: Please ensure the file is a valid image.',
        );
      } else if (response.statusCode >= 500) {
        throw Exception(
          'Server error: Backend service encountered an error. Try again later.',
        );
      } else {
        throw Exception(
          'Failed to process image (Status: ${response.statusCode})',
        );
      }
    } on SocketException catch (_) {
      throw Exception(
        'Network error: Cannot connect to backend. Ensure it is running at $_base',
      );
    } catch (e) {
      if (e.toString().contains('Connection refused')) {
        throw Exception(
          'Connection refused: Backend is not running at $_base',
        );
      } else if (e.toString().contains('timeout')) {
        throw Exception(
          'Connection timeout: Backend took too long to respond at $_base',
        );
      } else if (e.toString().contains('No host found')) {
        throw Exception(
          'Network error: Cannot resolve backend address $_base',
        );
      }
      rethrow;
    }
  }

  /// Analyze cover image quality and features (no OCR)
  Future<Map<String, dynamic>> analyzeCover(String imagePath) async {
    try {
      final url = Uri.parse('$_base/analyze-cover');
      final request = http.MultipartRequest('POST', url)
        ..headers.addAll(_authHeaders)
        ..files.add(await http.MultipartFile.fromPath('file', imagePath));

      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
        onTimeout: () => throw Exception(
          'Request timeout: Backend took too long to respond.',
        ),
      );

      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 403) {
        throw Exception('Authentication failed: Invalid or missing API key.');
      } else if (response.statusCode >= 500) {
        throw Exception('Server error: Backend service is unavailable.');
      } else {
        throw Exception(
          'Failed to analyze cover (Status: ${response.statusCode})',
        );
      }
    } on SocketException catch (_) {
      throw Exception('Network error: Cannot connect to backend at $_base');
    } catch (e) {
      if (!e.toString().contains('Exception:')) {
        return {'status': 'error', 'message': e.toString()};
      }
      rethrow;
    }
  }

  /// Detect book spines in a shelf image
  Future<Map<String, dynamic>> detectSpines(String imagePath) async {
    try {
      final url = Uri.parse('$_base/detect-spines');
      final request = http.MultipartRequest('POST', url)
        ..headers.addAll(_authHeaders)
        ..files.add(await http.MultipartFile.fromPath('file', imagePath));

      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
        onTimeout: () => throw Exception(
          'Request timeout: Backend took too long to respond.',
        ),
      );

      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 403) {
        throw Exception('Authentication failed: Invalid or missing API key.');
      } else if (response.statusCode >= 500) {
        throw Exception('Server error: Backend service is unavailable.');
      } else {
        throw Exception(
          'Failed to detect spines (Status: ${response.statusCode})',
        );
      }
    } on SocketException catch (_) {
      throw Exception('Network error: Cannot connect to backend at $_base');
    } catch (e) {
      if (!e.toString().contains('Exception:')) {
        return {'status': 'error', 'message': e.toString()};
      }
      rethrow;
    }
  }

  /// Upload payment receipt slip for overdue borrow record
  Future<Map<String, dynamic>> uploadReceipt(int borrowId, String imagePath) async {
    try {
      final url = Uri.parse('$_base/borrow/upload-receipt');
      
      final extension = imagePath.split('.').last.toLowerCase();
      final mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
      };
      final contentType = mimeTypes[extension] ?? 'image/jpeg';

      final request = http.MultipartRequest('POST', url)
        ..headers.addAll(_authHeaders)
        ..fields['borrow_id'] = borrowId.toString()
        ..files.add(await http.MultipartFile.fromPath(
          'file',
          imagePath,
          contentType: MediaType.parse(contentType),
        ));

      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
        onTimeout: () => throw Exception('Upload timeout: Backend took too long to respond.'),
      );

      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        try {
          final body = jsonDecode(response.body);
          throw Exception(body['detail'] ?? 'Failed to upload receipt');
        } catch (e) {
          throw Exception('Upload failed with status: ${response.statusCode}');
        }
      }
    } on SocketException catch (_) {
      throw Exception('Network error: Cannot connect to backend at $_base');
    } catch (e) {
      rethrow;
    }
  }

  /// Get student payment slips history
  Future<Map<String, dynamic>> getPaymentHistory() async {
    try {
      final url = Uri.parse('$_base/borrow/payments');
      final response = await http.get(url, headers: _authHeaders);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to fetch payment history');
      }
    } on SocketException catch (_) {
      throw Exception('Network error: Cannot connect to backend at $_base');
    } catch (e) {
      rethrow;
    }
  }

  /// Get list of unpaid borrows with fines
  Future<Map<String, dynamic>> getUnpaidFines() async {
    try {
      final url = Uri.parse('$_base/borrow/unpaid-fines');
      final response = await http.get(url, headers: _authHeaders);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to fetch unpaid fines');
      }
    } on SocketException catch (_) {
      throw Exception('Network error: Cannot connect to backend at $_base');
    } catch (e) {
      rethrow;
    }
  }

  /// Submit book rating and review feedback
  Future<Map<String, dynamic>> submitReview({
    required int bookId,
    required int rating,
    String? reviewText,
  }) async {
    try {
      final url = Uri.parse('$_base/borrow/reviews');
      final body = jsonEncode({
        'book_id': bookId,
        'rating': rating,
        'review_text': reviewText,
      });
      final response = await http.post(url, headers: _headers, body: body);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final errorMsg = jsonDecode(response.body)['detail'] ?? 'Failed to submit review';
        throw Exception(errorMsg);
      }
    } on SocketException catch (_) {
      throw Exception('Network error: Cannot connect to backend at $_base');
    } catch (e) {
      rethrow;
    }
  }
}
