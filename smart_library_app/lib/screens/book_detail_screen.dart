import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';

class BookDetailScreen extends ConsumerWidget {
  final int bookId;

  const BookDetailScreen({super.key, required this.bookId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookAsync = ref.watch(bookDetailProvider(bookId));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        title: const Text('Book Detail', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: bookAsync.when(
        data: (bookData) {
          // Mock data for fields not provided by backend
          final String title = bookData['title'] ?? 'Unknown Title';
          final String coverImage = bookData['cover_image_path'] ?? '';
          final String writer = bookData['author'] ?? 'Unknown Author';
          final String publisher = bookData['publisher'] ?? 'Unknown Publisher';
          final String year = bookData['publication_year']?.toString() ?? 'N/A';
          final String isbn = bookData['isbn'] ?? 'N/A';
          final String category = 'Natural Science'; // Mocked category tag
          final String stock = bookData['availability_status'] == 'available' ? 'Available' : 'Out of Stock';
          final String borrowedBy = 'None'; // Mocked
          final String bookPosition = 'Shelf A2 - Row 3'; // Mocked
          final String language = 'Indonesian'; // Mocked
          final String synopsis = bookData['synopsis'] ?? 'A fascinating and comprehensive overview of the subject, providing in-depth analysis and practical examples for readers of all levels. This book dives deep into the core concepts and explores advanced techniques.'; // Mocked synopsis

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Header Cover
                      Container(
                        padding: const EdgeInsets.all(16.0),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: coverImage.isNotEmpty
                              ? Image.network(
                                  coverImage,
                                  height: 200,
                                  width: 140,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Icon(Icons.book, size: 80, color: Colors.grey),
                                )
                              : const Icon(Icons.book, size: 80, color: Colors.grey),
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      // Category Tag
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.science_outlined, size: 18, color: Colors.black54),
                            const SizedBox(width: 8),
                            Text(
                              category,
                              style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Title
                      Text(
                        title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Synopsis
                      Text(
                        synopsis,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      // Summary Metadata
                      _buildMetadataRow('Stock', stock),
                      const SizedBox(height: 12),
                      _buildMetadataRow('Borrowed by', borrowedBy),
                      const SizedBox(height: 12),
                      _buildMetadataRow('Book position', bookPosition),
                      const SizedBox(height: 12),
                      _buildMetadataRow('Publisher', publisher),
                      const SizedBox(height: 12),
                      _buildMetadataRow('Writer', writer),
                      const SizedBox(height: 12),
                      _buildMetadataRow('Language', language),
                    ],
                  ),
                ),
              ),
              
              // Action Button
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: OutlinedButton(
                    onPressed: () => _showDetailedBottomSheet(
                      context, 
                      title: title, 
                      writer: writer, 
                      isbn: isbn, 
                      publisher: publisher, 
                      year: year, 
                      stock: stock, 
                      borrowedBy: borrowedBy, 
                      location: bookPosition,
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: const Color(0xFF1A73E8), width: 1.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                    ),
                    child: const Text(
                      'View more detail',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1A73E8),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF1A73E8))),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.red))),
      ),
    );
  }

  Widget _buildMetadataRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: const TextStyle(color: Colors.grey, fontSize: 14, fontWeight: FontWeight.w500),
          ),
        ),
        Expanded(
          flex: 3,
          child: Text(
            value,
            style: const TextStyle(color: Colors.black87, fontSize: 14, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  void _showDetailedBottomSheet(BuildContext context, {
    required String title,
    required String writer,
    required String isbn,
    required String publisher,
    required String year,
    required String stock,
    required String borrowedBy,
    required String location,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.sizeOf(context).height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 24),
                  width: 40,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Library Image
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.network(
                          'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                          height: 180,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            height: 180,
                            color: Colors.grey[200],
                            child: const Center(child: Icon(Icons.library_books, size: 50, color: Colors.grey)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Location Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Location', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 4),
                                  Text(location, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                ],
                              ),
                            ),
                            ElevatedButton(
                              onPressed: () {},
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1A73E8),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                              ),
                              child: const Text('View direction'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      // Section 1: Book Information
                      const Text(
                        'Book Information',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            _buildMetadataRow('Stock', stock),
                            const SizedBox(height: 12),
                            _buildMetadataRow('Borrowed by', borrowedBy),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      // Section 2: Book Identity
                      const Text(
                        'Book Identity',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            _buildMetadataRow('Title', title),
                            const SizedBox(height: 12),
                            _buildMetadataRow('Writer', writer),
                            const SizedBox(height: 12),
                            _buildMetadataRow('ISBN', isbn),
                            const SizedBox(height: 12),
                            _buildMetadataRow('Publisher', publisher),
                            const SizedBox(height: 12),
                            _buildMetadataRow('Year published', year),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32), // bottom padding
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
