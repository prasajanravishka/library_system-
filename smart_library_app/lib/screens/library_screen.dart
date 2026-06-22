import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../widgets/book_card.dart';


/// Library screen — shows borrowed books for students, full inventory for librarians.
class LibraryScreen extends ConsumerWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isLibrarian = authState.isLibrarian;

    return Scaffold(
      backgroundColor: AppColors.primaryBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: FadeInDown(
          child: Text(
            isLibrarian ? 'Book Inventory' : 'My Library',
            style: AppTextStyles.heading2,
          ),
        ),
        centerTitle: true,
      ),
      body: isLibrarian
          ? _LibrarianInventory()
          : _StudentLibrary(userId: authState.userId),
    );
  }
}

/// ── Student: borrowed books list ──────────────────────────────────────────
class _StudentLibrary extends ConsumerWidget {
  final int userId;
  const _StudentLibrary({required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final libraryAsync = ref.watch(userLibraryProvider(userId));

    return libraryAsync.when(
      data: (books) {
        if (books.isEmpty) {
          return _EmptyState(
            icon: Icons.library_books_outlined,
            title: 'No Books Yet',
            subtitle: 'Scan a book cover to borrow your first book!',
          );
        }

        return RefreshIndicator(
          color: AppColors.cyan,
          backgroundColor: AppColors.surface,
          onRefresh: () async {
            ref.invalidate(userLibraryProvider(userId));
          },
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
            itemCount: books.length,
            itemBuilder: (context, index) {
              final book = Map<String, dynamic>.from(books[index]);
              final daysLeft = book['days_left'] as int? ?? 0;

              return FadeInUp(
                delay: Duration(milliseconds: 80 * index),
                child: BookCard(
                  title: book['title'] ?? 'Unknown Title',
                  author: book['author'] ?? 'Unknown Author',
                  status: daysLeft < 0 ? 'overdue' : (book['status'] ?? 'borrowed'),
                  borrowDate: book['borrow_date'],
                  dueDate: book['due_date'],
                  daysLeft: daysLeft,
                  onTap: () {
                    // Could navigate to book details
                  },
                ),
              );
            },
          ),
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.cyan),
      ),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded,
                color: AppColors.red, size: 48),
            const SizedBox(height: 12),
            Text('Failed to load library',
                style: AppTextStyles.heading3),
            const SizedBox(height: 8),
            Text('$e', style: AppTextStyles.bodySmall),
          ],
        ),
      ),
    );
  }
}

/// ── Librarian: full inventory ─────────────────────────────────────────────
class _LibrarianInventory extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booksAsync = ref.watch(allBooksProvider);

    return booksAsync.when(
      data: (books) {
        if (books.isEmpty) {
          return _EmptyState(
            icon: Icons.inventory_2_outlined,
            title: 'Empty Inventory',
            subtitle: 'Use the scanner to add books to the catalog.',
          );
        }

        return RefreshIndicator(
          color: AppColors.cyan,
          backgroundColor: AppColors.surface,
          onRefresh: () async {
            ref.invalidate(allBooksProvider);
          },
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
            itemCount: books.length,
            itemBuilder: (context, index) {
              final book = Map<String, dynamic>.from(books[index]);

              return FadeInUp(
                delay: Duration(milliseconds: 80 * index),
                child: BookCard(
                  title: book['title'] ?? 'Unknown Title',
                  author: book['author'] ?? 'Unknown Author',
                  status: book['availability_status'] ?? 'available',
                  onTap: () {
                    // Could navigate to book details / edit
                  },
                ),
              );
            },
          ),
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.cyan),
      ),
      error: (e, _) => Center(
        child: Text('Error: $e', style: const TextStyle(color: AppColors.red)),
      ),
    );
  }
}

/// ── Empty state widget ────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: FadeInUp(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.cyan.withValues(alpha: 0.08),
                ),
                child: Icon(
                  icon,
                  size: 56,
                  color: AppColors.textSecondary.withValues(alpha: 0.4),
                ),
              ),
              const SizedBox(height: 24),
              Text(title, style: AppTextStyles.heading2),
              const SizedBox(height: 8),
              Text(
                subtitle,
                style: AppTextStyles.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
