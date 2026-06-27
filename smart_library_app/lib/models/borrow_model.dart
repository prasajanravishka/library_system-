/// Represents a borrowed book record with due date tracking.
class BorrowModel {
  final int? borrowId;
  final int bookId;
  final String title;
  final String author;
  final String? coverImagePath;
  final String? coverImageUrl;
  final String borrowDate;
  final String dueDate;
  final String? returnDate;
  final String status; // 'borrowed', 'returned', 'overdue'
  final int daysLeft;
  final double fineAmount;

  const BorrowModel({
    this.borrowId,
    required this.bookId,
    required this.title,
    required this.author,
    this.coverImagePath,
    this.coverImageUrl,
    required this.borrowDate,
    required this.dueDate,
    this.returnDate,
    required this.status,
    required this.daysLeft,
    this.fineAmount = 0.0,
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
      coverImageUrl: json['cover_image_url'] as String?,
      borrowDate: json['borrow_date']?.toString() ?? '',
      dueDate: json['due_date']?.toString() ?? '',
      returnDate: json['return_date']?.toString(),
      status: json['status'] as String? ?? 'borrowed',
      daysLeft: json['days_left'] as int? ?? 0,
      fineAmount: (json['fine_amount'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
