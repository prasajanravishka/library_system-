/// Represents a user in the system with RBAC role.
class UserModel {
  final int userId;
  final String studentId;
  final String fullName;
  final String email;
  final String role; // 'student' or 'librarian'

  const UserModel({
    required this.userId,
    required this.studentId,
    required this.fullName,
    required this.email,
    required this.role,
  });

  bool get isLibrarian => role == 'librarian';
  bool get isStudent => role == 'student';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userId: json['user_id'] as int,
      studentId: json['student_id'] as String,
      fullName: json['full_name'] as String,
      email: json['email'] as String,
      role: json['role'] as String? ?? 'student',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'student_id': studentId,
      'full_name': fullName,
      'email': email,
      'role': role,
    };
  }
}
