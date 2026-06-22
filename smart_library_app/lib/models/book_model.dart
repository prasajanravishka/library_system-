/// Represents a book in the library inventory.
class BookModel {
  final int bookId;
  final String title;
  final String author;
  final String? isbn;
  final String? publisher;
  final int? publicationYear;
  final String? coverImagePath;
  final String availabilityStatus; // 'available', 'borrowed', 'lost'

  const BookModel({
    required this.bookId,
    required this.title,
    required this.author,
    this.isbn,
    this.publisher,
    this.publicationYear,
    this.coverImagePath,
    this.availabilityStatus = 'available',
  });

  bool get isAvailable => availabilityStatus == 'available';
  bool get isBorrowed => availabilityStatus == 'borrowed';
  bool get isLost => availabilityStatus == 'lost';

  factory BookModel.fromJson(Map<String, dynamic> json) {
    return BookModel(
      bookId: json['book_id'] as int,
      title: json['title'] as String? ?? '',
      author: json['author'] as String? ?? '',
      isbn: json['isbn'] as String?,
      publisher: json['publisher'] as String?,
      publicationYear: json['publication_year'] as int?,
      coverImagePath: json['cover_image_path'] as String?,
      availabilityStatus: json['availability_status'] as String? ?? 'available',
    );
  }
}
