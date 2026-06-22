import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/app_constants.dart';

/// Centralized API service for dual-backend communication.
///
/// PHP backend (port 8000): All CRUD operations
/// Python backend (port 8001): AI/OCR image processing
///
/// Both backends require `x-api-key` header authentication.
class ApiService {
  static const String _phpBase = AppConstants.phpBaseUrl;
  static const String _pyBase = AppConstants.pyBaseUrl;

  /// Standard headers with API key for JSON requests.
  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'x-api-key': AppConstants.apiKey,
  };

  /// Headers with API key only (for multipart / non-JSON).
  static Map<String, String> get _authHeaders => {
    'x-api-key': AppConstants.apiKey,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PHP BACKEND — CRUD Operations (Port 8000)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Authentication ──────────────────────────────────────────────────────

  /// Login as a Student via user.php?action=login
  Future<Map<String, dynamic>> login(String studentId, String password) async {
    final url = Uri.parse('$_phpBase/api/user.php?action=login');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({
        'student_id': studentId,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Login failed');
    }
  }

  /// Login as a Librarian via admin.php?action=login
  Future<Map<String, dynamic>> loginAdmin(String username, String password) async {
    final url = Uri.parse('$_phpBase/api/admin.php?action=login');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({
        'username': username,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Login failed');
    }
  }

  // ── Dashboard ───────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getDashboardStats() async {
    final url = Uri.parse('$_phpBase/api/get_dashboard.php?action=stats');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load dashboard stats');
    }
  }

  Future<Map<String, dynamic>> getUserDashboard(int userId) async {
    final url = Uri.parse('$_phpBase/api/get_dashboard.php?action=user_dashboard&user_id=$userId');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load dashboard');
    }
  }

  // ── User Library (Borrow History) ───────────────────────────────────────

  Future<Map<String, dynamic>> getUserLibrary(int userId) async {
    final url = Uri.parse('$_phpBase/api/borrow.php?action=history&user_id=$userId');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load library');
    }
  }

  // ── User Profile ────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getUserProfile(int userId) async {
    final url = Uri.parse('$_phpBase/api/user.php?action=profile&user_id=$userId');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load profile');
    }
  }

  // ── Book Search ─────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> searchBooks(String query) async {
    final url = Uri.parse('$_phpBase/api/user.php?action=search&q=${Uri.encodeComponent(query)}');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to search books');
    }
  }

  // ── Book CRUD (Admin) ───────────────────────────────────────────────────

  Future<Map<String, dynamic>> getAllBooks() async {
    final url = Uri.parse('$_phpBase/api/admin.php?action=all_books');
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
    int? addedBy,
  }) async {
    final url = Uri.parse('$_phpBase/api/admin.php?action=add_book');
    final body = <String, dynamic>{
      'title': title,
      'author': author,
      'isbn': isbn,
      'publisher': publisher,
      'cover_image_path': coverImagePath,
    };
    if (publicationYear != null) body['publication_year'] = publicationYear;
    if (addedBy != null) body['added_by'] = addedBy;

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

  Future<Map<String, dynamic>> updateBook(int bookId, Map<String, dynamic> updates) async {
    final url = Uri.parse('$_phpBase/api/admin.php?action=update_book&book_id=$bookId');
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
    final url = Uri.parse('$_phpBase/api/book_details.php?book_id=$bookId');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load book details');
    }
  }

  // ── Borrow & Return ─────────────────────────────────────────────────────

  Future<Map<String, dynamic>> borrowBook(int userId, int bookId) async {
    final url = Uri.parse('$_phpBase/api/borrow.php?action=borrow');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({
        'user_id': userId,
        'book_id': bookId,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Failed to borrow book');
    }
  }

  Future<Map<String, dynamic>> returnBook(int userId, int bookId) async {
    final url = Uri.parse('$_phpBase/api/borrow.php?action=return');
    final response = await http.post(
      url,
      headers: _headers,
      body: jsonEncode({
        'user_id': userId,
        'book_id': bookId,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Failed to return book');
    }
  }

  // ── User Management (Admin) ─────────────────────────────────────────────

  Future<Map<String, dynamic>> getAllUsers() async {
    final url = Uri.parse('$_phpBase/api/admin.php?action=all_users');
    final response = await http.get(url, headers: _authHeaders);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load users');
    }
  }

  Future<Map<String, dynamic>> toggleUserStatus(int userId) async {
    final url = Uri.parse('$_phpBase/api/admin.php?action=toggle_user&user_id=$userId');
    final response = await http.put(url, headers: _headers);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to update user status');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PYTHON BACKEND — AI/Vision (Port 8001)
  // ══════════════════════════════════════════════════════════════════════════

  /// OCR scan: send image to Python backend for text extraction + LLM parsing
  Future<Map<String, dynamic>> extractBookInfo(String imagePath) async {
    final url = Uri.parse('$_pyBase/api/scan-book');
    final request = http.MultipartRequest('POST', url)
      ..headers.addAll(_authHeaders)
      ..files.add(await http.MultipartFile.fromPath('file', imagePath));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to process image');
    }
  }

  /// Analyze cover image quality and features (no OCR)
  Future<Map<String, dynamic>> analyzeCover(String imagePath) async {
    final url = Uri.parse('$_pyBase/api/analyze-cover');
    final request = http.MultipartRequest('POST', url)
      ..headers.addAll(_authHeaders)
      ..files.add(await http.MultipartFile.fromPath('file', imagePath));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to analyze cover');
    }
  }

  /// Detect book spines in a shelf image
  Future<Map<String, dynamic>> detectSpines(String imagePath) async {
    final url = Uri.parse('$_pyBase/api/detect-spines');
    final request = http.MultipartRequest('POST', url)
      ..headers.addAll(_authHeaders)
      ..files.add(await http.MultipartFile.fromPath('file', imagePath));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to detect spines');
    }
  }
}
