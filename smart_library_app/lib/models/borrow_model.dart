/// Represents a borrowed book record with due date tracking.
class BorrowModel {
  final int? borrowId;
  final int bookId;
  final String title;
  final String author;
  final String? coverImagePath;
  final String borrowDate;
  final String dueDate;
  final String? returnDate;
  final String status; // 'borrowed', 'returned', 'overdue'
  final int daysLeft;

  const BorrowModel({
    this.borrowId,
    required this.bookId,
    required this.title,
    required this.author,
    this.coverImagePath,
    required this.borrowDate,
    required this.dueDate,
    this.returnDate,
    required this.status,
    required this.daysLeft,
  });

  bool get isOverdue => daysLeft < 0 || status == 'overdue';
  bool get isReturned => status == 'returned';
  bool get isBorrowed => status == 'borrowed' && !isOverdue;

  factory BorrowModel.fromJson(Map<String, dynamic> json) {
    return BorrowModel(
      borrowId: json['borrow_id'] as int?,
      bookId: json['book_id'] as int,
      title: json['title'] as String? ?? '',
      author: json['author'] as String? ?? '',
      coverImagePath: json['cover_image_path'] as String?,
      borrowDate: json['borrow_date']?.toString() ?? '',
      dueDate: json['due_date']?.toString() ?? '',
      returnDate: json['return_date']?.toString(),
      status: json['status'] as String? ?? 'borrowed',
      daysLeft: json['days_left'] as int? ?? 0,
    );
  }
}
