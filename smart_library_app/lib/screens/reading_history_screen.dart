import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../providers/providers.dart';
import '../models/borrow_model.dart';
import 'book_detail_screen.dart';

class ReadingHistoryScreen extends ConsumerWidget {
  const ReadingHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId = ref.watch(authProvider).userId;
    final historyAsync = ref.watch(readingHistoryProvider(userId));

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: FadeInDown(child: Text('Reading History', style: AppTextStyles.heading2.copyWith(color: Theme.of(context).colorScheme.onSurface))),
        centerTitle: true,
        iconTheme: IconThemeData(color: Theme.of(context).colorScheme.onSurface),
      ),
      body: historyAsync.when(
        loading: () => Center(child: CircularProgressIndicator(color: AppColors.cyan)),
        error: (error, _) => Center(child: Text('Error: $error', style: TextStyle(color: AppColors.red))),
        data: (historyList) {
          final history = historyList.map((h) => BorrowModel.fromJson(h)).toList();
          if (history.isEmpty) {
            return Center(child: Text('No reading history', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color)));
          }
          
          return Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: 800),
              child: ListView.builder(
                padding: EdgeInsets.all(20),
                itemCount: history.length,
                itemBuilder: (context, index) {
                  final item = history[index];
                  final isOverdue = item.isOverdue;
                  final isReturned = item.isReturned;

                  return FadeInUp(
                    delay: Duration(milliseconds: 50 * index),
                    child: Padding(
                      padding: EdgeInsets.only(bottom: 16),
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BookDetailScreen(bookId: item.bookId),
                            ),
                          );
                        },
                        child: Container(
                          padding: EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  width: 60,
                                  height: 80,
                                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1),
                                  child: item.coverImageUrl != null && item.coverImageUrl!.isNotEmpty
                                      ? Image.network(item.coverImageUrl!, fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => _buildPlaceholderCover(context))
                                      : (item.coverImagePath != null && item.coverImagePath!.isNotEmpty
                                          ? Image.network(item.coverImagePath!, fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) => _buildPlaceholderCover(context))
                                          : _buildPlaceholderCover(context)),
                                ),
                              ),
                              SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.title, style: AppTextStyles.heading3.copyWith(color: Theme.of(context).colorScheme.onSurface)),
                                    SizedBox(height: 4),
                                    Text('Read', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontSize: 12)),
                                    SizedBox(height: 8),
                                    Text('Borrowed: ${item.borrowDate}', style: TextStyle(color: (Theme.of(context).textTheme.bodyMedium?.color ?? Colors.grey).withValues(alpha: 0.8), fontSize: 12)),
                                    const SizedBox(height: 8),
                                    TextButton.icon(
                                      onPressed: () => _showReviewDialog(context, ref, item.bookId, item.title),
                                      icon: const Icon(Icons.rate_review_outlined, size: 14, color: AppColors.cyan),
                                      label: const Text('Review', style: TextStyle(color: AppColors.cyan, fontSize: 11, fontWeight: FontWeight.bold)),
                                      style: TextButton.styleFrom(
                                        padding: EdgeInsets.zero,
                                        minimumSize: Size.zero,
                                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isOverdue ? AppColors.red.withValues(alpha: 0.1) : (isReturned ? Colors.green.withValues(alpha: 0.1) : AppColors.cyan.withValues(alpha: 0.1)),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: isOverdue ? AppColors.red : (isReturned ? Colors.green : AppColors.cyan)),
                                ),
                                child: Text(
                                  item.status.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: isOverdue ? AppColors.red : (isReturned ? Colors.green : AppColors.cyan),
                                  ),
                                ),
                              )
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPlaceholderCover(BuildContext context) {
    return Icon(Icons.book, color: Theme.of(context).textTheme.bodyMedium?.color, size: 30);
  }

  void _showReviewDialog(BuildContext context, WidgetRef ref, int bookId, String bookTitle) {
    int rating = 5;
    final textController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: Theme.of(context).cardColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text('Review "$bookTitle"', style: TextStyle(color: Theme.of(context).colorScheme.onSurface)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('How would you rate this book?', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        final starValue = index + 1;
                        return IconButton(
                          onPressed: () {
                            setState(() {
                              rating = starValue;
                            });
                          },
                          icon: Icon(
                            rating >= starValue ? Icons.star : Icons.star_border,
                            color: Colors.amber,
                            size: 32,
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: textController,
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                      decoration: InputDecoration(
                        labelText: 'Write your feedback (optional)',
                        labelStyle: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color),
                        border: const OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.cyan,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () async {
                    final reviewText = textController.text.trim();
                    Navigator.pop(context);
                    
                    try {
                      final response = await ref.read(apiServiceProvider).submitReview(
                        bookId: bookId,
                        rating: rating,
                        reviewText: reviewText.isNotEmpty ? reviewText : null,
                      );
                      
                      if (response['status'] == 'success') {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Review submitted successfully! Thank you for your feedback.')),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Failed to submit review')),
                        );
                      }
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}')),
                      );
                    }
                  },
                  child: const Text('Submit'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
