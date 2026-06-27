import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:animate_do/animate_do.dart';
import '../core/app_theme.dart';
import '../widgets/glass_card.dart';
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
        title: FadeInDown(child: Text('Reading History', style: AppTextStyles.heading2.copyWith(color: AppColors.lightTextPrimary))),
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.lightTextPrimary),
      ),
      body: historyAsync.when(
        loading: () => Center(child: CircularProgressIndicator(color: AppColors.cyan)),
        error: (error, _) => Center(child: Text('Error: $error', style: TextStyle(color: AppColors.red))),
        data: (historyList) {
          final history = historyList.map((h) => BorrowModel.fromJson(h)).toList();
          if (history.isEmpty) {
            return Center(child: Text('No reading history', style: TextStyle(color: AppColors.lightTextSecondary)));
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
                            border: Border.all(color: AppColors.lightBorderSubtle),
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  width: 60,
                                  height: 80,
                                  color: AppColors.lightBorderSubtle,
                                  child: item.coverImageUrl != null && item.coverImageUrl!.isNotEmpty
                                      ? Image.network(item.coverImageUrl!, fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => _buildPlaceholderCover())
                                      : (item.coverImagePath != null && item.coverImagePath!.isNotEmpty
                                          ? Image.network(item.coverImagePath!, fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) => _buildPlaceholderCover())
                                          : _buildPlaceholderCover()),
                                ),
                              ),
                              SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.title, style: AppTextStyles.heading3.copyWith(color: AppColors.lightTextPrimary)),
                                    SizedBox(height: 4),
                                    Text('Read', style: TextStyle(color: AppColors.lightTextSecondary, fontSize: 12)),
                                    SizedBox(height: 8),
                                    Text('Borrowed: ${item.borrowDate}', style: TextStyle(color: AppColors.lightTextSecondary.withValues(alpha: 0.8), fontSize: 12)),
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

  Widget _buildPlaceholderCover() {
    return Icon(Icons.book, color: AppColors.lightTextSecondary, size: 30);
  }
}
