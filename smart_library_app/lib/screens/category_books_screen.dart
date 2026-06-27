import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../models/category_model.dart';
import '../widgets/book_card.dart';
import 'book_detail_screen.dart';

class CategoryBooksScreen extends ConsumerWidget {
  final CategoryModel category;

  const CategoryBooksScreen({super.key, required this.category});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booksAsync = ref.watch(booksByCategoryProvider(category.id));

    return Scaffold(
      
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Row(
          children: [
            Icon(category.iconData, color: AppColors.cyan, size: 24),
            const SizedBox(width: 8),
            Text(category.name, style: AppTextStyles.heading2),
          ],
        ),
        centerTitle: false,
      ),
      body: booksAsync.when(
        data: (books) {
          if (books.isEmpty) {
            return Center(
              child: FadeIn(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      category.iconData,
                      size: 64,
                      color: AppColors.textSecondary.withValues(alpha: 0.3),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No books in this category',
                      style: AppTextStyles.heading3.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
            itemCount: books.length,
            itemBuilder: (context, index) {
              final book = Map<String, dynamic>.from(books[index]);

              return FadeInUp(
                delay: Duration(milliseconds: 60 * index),
                child: BookCard(
                  title: book['title'] ?? 'Unknown',
                  author: book['author'] ?? 'Unknown',
                  status: book['availability_status'] ?? 'available',
                  coverImageUrl: book['cover_image_url'] ?? book['cover_image_path'],
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => BookDetailScreen(
                          bookId: book['book_id'] is String
                              ? int.parse(book['book_id'])
                              : book['book_id'] as int,
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.cyan),
        ),
        error: (e, _) => Center(
          child: Text(
            'Error: $e',
            style: const TextStyle(color: AppColors.red),
          ),
        ),
      ),
    );
  }
}
